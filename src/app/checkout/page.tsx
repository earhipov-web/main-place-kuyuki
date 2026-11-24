"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type HTMLAttributes } from "react";
import { Lift } from "@/components/bits";
import { Totals, useCart } from "@/components/cart";
import { cleanText, formatPhone, phoneDigits } from "@/lib/form";
import { rub, telegramLink } from "@/lib/data";

type Method = "card" | "sbp";
type Way = "hall" | "takeaway" | "delivery";

const digits = (s: string) => s.replace(/\D/g, "");
const groupCard = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const groupExp = (s: string) => {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Узор, похожий на QR-код: показывает, как будет выглядеть оплата по СБП. */
function FakeQr() {
  const n = 25;
  const cells: [number, number][] = [];
  let h = 2166136261;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      h = Math.imul(h ^ (x * 31 + y * 17), 16777619) >>> 0;
      const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7;
      if (finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)) continue;
      if (h % 100 < 46) cells.push([x, y]);
    }
  const corner = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#180d05" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#f4e8d8" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#180d05" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label="Пример QR-кода для оплаты через СБП">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#180d05" />
      ))}
      {corner(0, 0)}
      {corner(n - 7, 0)}
      {corner(0, n - 7)}
    </svg>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  full,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  full?: boolean;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        {...rest}
      />
      {error && (
        <span className="err" id={`${id}-e`}>
          {error}
        </span>
      )}
    </label>
  );
}

const ways: { id: Way; label: string }[] = [
  { id: "hall", label: "За стол" },
  { id: "takeaway", label: "Навынос" },
  { id: "delivery", label: "Доставка" },
];

export default function CheckoutPage() {
  const { lines, pay, off, clear, ready } = useCart();
  const [way, setWay] = useState<Way>("hall");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [where, setWhere] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState<{ pay: number; off: number; code: string; text: string } | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const n = cleanText(name, 40);
    const p = phoneDigits(phone);
    const w = cleanText(where, 120);
    const next: Record<string, string> = {};
    if (n.length < 2) next.name = "Напишите имя, хотя бы две буквы.";
    if (way !== "hall" && !p) next.phone = "Нужен номер из 10 цифр после +7.";
    if (way === "hall" && !w) next.where = "Укажите номер стола или код брони.";
    if (way === "delivery" && w.length < 6) next.where = "Укажите улицу, дом и квартиру.";
    if (pay > 0 && method === "card") {
      if (digits(card).length !== 16) next.card = "В номере карты 16 цифр.";
      const [mm, yy] = exp.split("/");
      if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12 || yy.length !== 2) next.exp = "Формат ММ/ГГ.";
      if (digits(cvc).length !== 3) next.cvc = "Три цифры.";
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      form.current?.querySelector<HTMLInputElement>(`#${first}`)?.focus();
      return;
    }
    setBusy(true);
    const text =
      way === "hall" ? `Принесём к вам: ${w}.` : way === "takeaway" ? `Соберём навынос. Позвоним на ${formatPhone(p!)}, когда будет готово.` : `Привезём по адресу: ${w}. Стоимость доставки администратор назовёт по телефону ${formatPhone(p!)}.`;
    window.setTimeout(() => {
      setPaid({ pay, off, code: `MP-${1000 + Math.floor(Math.random() * 9000)}`, text: `${n}, спасибо. ${text}` });
      clear();
      setCard("");
      setExp("");
      setCvc("");
      setBusy(false);
      top.current?.scrollIntoView({ block: "start" });
    }, 1500);
  };

  return (
    <div className="wrap" style={{ minHeight: "60svh" }} ref={top}>
      <div className="page-head">
        <Lift as="h1" key={paid ? "done" : "pay"} lines={[paid ? "Заказ принят" : "Оформление"]} />
      </div>
      {paid ? (
        <div className="done" role="status">
          <p className="code">{paid.code}</p>
          <p>{paid.text}</p>
          <p className="soft">
            Сумма {rub(paid.pay)}
            {paid.off > 0 ? `, скидка ${rub(paid.off)}` : ""}. Это пробная оплата, деньги не списаны.
          </p>
          <div className="acts">
            <a className="btn btn-plate" href={telegramLink(`Здравствуйте! Вопрос по заказу ${paid.code}.`)} target="_blank" rel="noopener noreferrer">
              Написать о заказе
            </a>
            <Link href="/menu" className="btn btn-line">
              Вернуться в меню
            </Link>
          </div>
        </div>
      ) : !ready ? null : lines.length === 0 ? (
        <div className="empty">
          <p>Оформлять пока нечего, корзина пуста.</p>
          <Link href="/menu" className="btn btn-plate">
            Открыть меню
          </Link>
        </div>
      ) : (
        <>
          <p className="note" style={{ marginBottom: 14 }}>
            Пробная страница оплаты: деньги не списываются, данные никуда не уходят. Настоящую карту вводить не нужно, подойдёт 4242 4242 4242 4242, любой срок и любые три цифры.
          </p>
          <form ref={form} className="two" onSubmit={submit} noValidate>
            <div>
              <fieldset className="panel">
                <h2>Куда подать</h2>
                <div className="pick row">
                  {ways.map((w) => (
                    <label key={w.id}>
                      <input type="radio" name="way" checked={way === w.id} onChange={() => setWay(w.id)} />
                      <span>{w.label}</span>
                    </label>
                  ))}
                </div>
                <div className="fields">
                  <Field id="name" label="Имя" value={name} onChange={setName} error={errors.name} autoComplete="given-name" maxLength={40} />
                  {way === "hall" ? (
                    <Field id="where" label="Стол или код брони" value={where} onChange={setWhere} error={errors.where} placeholder="Стол 4" maxLength={40} />
                  ) : (
                    <Field id="phone" label="Телефон" value={phone} onChange={(v) => setPhone(v.slice(0, 20))} error={errors.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 123-45-67" />
                  )}
                  {way === "delivery" && <Field full id="where" label="Адрес" value={where} onChange={setWhere} error={errors.where} autoComplete="street-address" maxLength={120} placeholder="Улица, дом, квартира" />}
                </div>
                {way === "delivery" && (
                  <p className="small soft" style={{ marginTop: 10 }}>
                    Доставка не входит в сумму, её стоимость зависит от адреса.
                  </p>
                )}
              </fieldset>
              <fieldset className="panel">
                <h2>Оплата</h2>
                <div className="pick row">
                  <label>
                    <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
                    <span>Карта</span>
                  </label>
                  <label>
                    <input type="radio" name="method" checked={method === "sbp"} onChange={() => setMethod("sbp")} />
                    <span>СБП</span>
                  </label>
                </div>
                {method === "card" ? (
                  <div className="fields">
                    {/* проба: автозаполнение выключено, чтобы сюда не попала настоящая карта */}
                    <Field full id="card" label="Номер карты" value={card} onChange={(v) => setCard(groupCard(v))} error={errors.card} inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" />
                    <Field id="exp" label="Срок" value={exp} onChange={(v) => setExp(groupExp(v))} error={errors.exp} inputMode="numeric" autoComplete="off" placeholder="ММ/ГГ" />
                    <Field id="cvc" label="CVC" value={cvc} onChange={(v) => setCvc(digits(v).slice(0, 3))} error={errors.cvc} inputMode="numeric" autoComplete="off" type="password" placeholder="123" />
                  </div>
                ) : (
                  <div className="sbp">
                    <FakeQr />
                    <p>На готовом сайте здесь будет код вашего банка. Отсканируйте его камерой, подтвердите платёж и нажмите кнопку.</p>
                  </div>
                )}
              </fieldset>
            </div>
            <aside className="panel sticky" aria-labelledby="order-t">
              <div className="book-head">
                <h2 id="order-t">Заказ</h2>
                <Link href="/cart" className="link small">
                  Изменить
                </Link>
              </div>
              <dl className="totals">
                {lines.map((l) => (
                  <div key={l.item.id} style={{ display: "contents" }}>
                    <dt>
                      {l.item.name}
                      {l.qty > 1 ? `, ${l.qty} шт.` : ""}
                    </dt>
                    <dd>{rub(l.item.price * l.qty)}</dd>
                  </div>
                ))}
              </dl>
              <div style={{ borderTop: "1px solid var(--seam)", marginTop: 14 }} />
              <Totals />
              <button type="submit" className="btn btn-plate btn-wide" disabled={busy}>
                {busy ? "Проводим платёж…" : pay === 0 ? "Оформить без оплаты" : method === "card" ? `Оплатить ${rub(pay)}` : "Оплата прошла"}
              </button>
              <p className="sr" aria-live="polite">
                {busy ? "Проводим платёж" : ""}
              </p>
            </aside>
          </form>
        </>
      )}
    </div>
  );
}
