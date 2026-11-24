"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BIRTHDAY_PERCENT, BONUS_RUB, discountOf, itemById, place, rub, type DiscountId, type MenuItem } from "@/lib/data";
import { IconMinus, IconPlus } from "./bits";

type Line = { id: string; qty: number };
export type CartLine = { item: MenuItem; qty: number };

type Cart = {
  lines: CartLine[];
  count: number;
  total: number;
  discount: DiscountId;
  off: number;
  pay: number;
  ready: boolean;
  qtyOf: (id: string) => number;
  add: (id: string) => void;
  remove: (id: string) => void;
  drop: (id: string) => void;
  clear: () => void;
  setDiscount: (d: DiscountId) => void;
};

const Ctx = createContext<Cart | null>(null);
const STORE = "mainplace:cart";
const isDiscount = (v: unknown): v is DiscountId => v === "none" || v === "birthday" || v === "bonus";

function read(): { lines: Line[]; discount: DiscountId } {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORE) ?? "{}");
    const o = typeof raw === "object" && raw !== null ? (raw as { lines?: unknown; discount?: unknown }) : {};
    const lines = Array.isArray(o.lines)
      ? o.lines.filter(
          (l): l is Line =>
            typeof l === "object" && l !== null && typeof l.id === "string" && Number.isInteger(l.qty) && l.qty > 0 && l.qty < 100 && !!itemById(l.id),
        )
      : [];
    return { lines, discount: isDiscount(o.discount) ? o.discount : "none" };
  } catch {
    return { lines: [], discount: "none" };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Line[]>([]);
  const [discount, setDiscount] = useState<DiscountId>("none");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сохранённая корзина есть только в браузере
    setRaw(s.lines);
    setDiscount(s.discount);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORE, JSON.stringify({ lines: raw, discount }));
    } catch {
      /* хранилище закрыто: корзина живёт до закрытия вкладки */
    }
  }, [raw, discount, ready]);

  const add = useCallback((id: string) => {
    setRaw((list) =>
      list.some((l) => l.id === id) ? list.map((l) => (l.id === id ? { ...l, qty: Math.min(99, l.qty + 1) } : l)) : [...list, { id, qty: 1 }],
    );
  }, []);
  const remove = useCallback(
    (id: string) => setRaw((list) => list.flatMap((l) => (l.id !== id ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []))),
    [],
  );
  const drop = useCallback((id: string) => setRaw((list) => list.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => {
    setRaw([]);
    setDiscount("none");
  }, []);

  const value = useMemo<Cart>(() => {
    const lines = raw.flatMap((l) => {
      const item = itemById(l.id);
      return item ? [{ item, qty: l.qty }] : [];
    });
    const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0);
    const off = discountOf(discount, total);
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total,
      discount,
      off,
      pay: total - off,
      ready,
      qtyOf: (id) => raw.find((l) => l.id === id)?.qty ?? 0,
      add,
      remove,
      drop,
      clear,
      setDiscount,
    };
  }, [raw, discount, ready, add, remove, drop, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart вне CartProvider");
  return c;
}

export function Qty({ id, name }: { id: string; name: string }) {
  const { qtyOf, add, remove } = useCart();
  return (
    <div className="qty" role="group" aria-label={`Количество: ${name}`}>
      <button type="button" aria-label="Убрать одну порцию" onClick={() => remove(id)}>
        <IconMinus />
      </button>
      <output aria-live="polite">{qtyOf(id)}</output>
      <button type="button" aria-label="Добавить порцию" onClick={() => add(id)}>
        <IconPlus />
      </button>
    </div>
  );
}

/** Выбор скидки: суммы видны сразу, до выбора. */
export function DiscountPicker() {
  const { total, discount, setDiscount } = useCart();
  const options: { id: DiscountId; label: string; note?: ReactNode }[] = [
    { id: "none", label: "Без скидки" },
    { id: "birthday", label: `День рождения, −${BIRTHDAY_PERCENT}%`, note: "За три дня до праздника и три дня после. Возьмите с собой документ с датой." },
    {
      id: "bonus",
      label: `${BONUS_RUB} бонусов новому гостю`,
      note: (
        <>
          Начисляют после{" "}
          <a className="link" href={place.bonusUrl} target="_blank" rel="noopener noreferrer">
            регистрации в программе
          </a>
          , 1 бонус = 1 ₽.
        </>
      ),
    },
  ];
  return (
    <fieldset>
      <legend className="sr">Скидка</legend>
      <div className="pick">
        {options.map((o) => (
          <label key={o.id}>
            <input type="radio" name="discount" checked={discount === o.id} onChange={() => setDiscount(o.id)} />
            <span>{o.label}</span>
            <span className="num">{rub(total - discountOf(o.id, total))}</span>
            {o.note && <small>{o.note}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Totals() {
  const { total, off, pay } = useCart();
  return (
    <dl className="totals">
      <dt>Без скидки</dt>
      <dd>{off > 0 ? <s>{rub(total)}</s> : rub(total)}</dd>
      <dt>Скидка</dt>
      <dd>{off > 0 ? `−${rub(off)}` : rub(0)}</dd>
      <dt className="big">{off > 0 ? "Со скидкой" : "К оплате"}</dt>
      <dd className="big">{rub(pay)}</dd>
    </dl>
  );
}
