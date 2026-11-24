"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { menu, rub, telegramLink, type MenuItem } from "@/lib/data";
import { Lift, Slab, type SlabShape } from "./bits";
import { Qty, useCart } from "./cart";

const shapes: SlabShape[] = ["e", "d", "f"];

function Dish({ item, i }: { item: MenuItem; i: number }) {
  const { qtyOf, add } = useCart();
  const q = qtyOf(item.id);
  return (
    <li className="dish">
      <Slab className="dish-pic" data-speed="1.5" s={shapes[i % 3]} quiet d={(i % 4) * 60} src={item.img} alt={item.name} sizes="(max-width: 819px) 46vw, 240px" />
      <h3>{item.name}</h3>
      <div className="dish-buy">
        <span className="price">
          {rub(item.price)}
          {item.note && <small>{item.note}</small>}
        </span>
        {q > 0 ? (
          <Qty id={item.id} name={item.name} />
        ) : (
          <button type="button" className="add" onClick={() => add(item.id)} aria-label={`Добавить в корзину: ${item.name}`}>
            В корзину
          </button>
        )}
      </div>
    </li>
  );
}

function OrderPanel() {
  const { lines, total, count } = useCart();
  return (
    <aside className="order" aria-label="Ваш заказ">
      <h2 style={{ fontSize: "1.6rem" }}>Ваш заказ</h2>
      {count === 0 ? (
        <p className="soft" style={{ marginTop: 8 }}>
          Пока пусто. Добавьте блюдо, и оно появится здесь.
        </p>
      ) : (
        <>
          <ul>
            {lines.map((l) => (
              <li key={l.item.id}>
                <span>{l.item.name}</span>
                <span className="num">{rub(l.item.price * l.qty)}</span>
                <Qty id={l.item.id} name={l.item.name} />
              </li>
            ))}
          </ul>
          <dl className="totals">
            <dt className="big">Итого</dt>
            <dd className="big">{rub(total)}</dd>
          </dl>
          <Link href="/cart" className="btn btn-plate">
            В корзину
          </Link>
        </>
      )}
    </aside>
  );
}

export function MenuBrowser() {
  const { count, total } = useCart();
  const [cur, setCur] = useState(menu[0].id);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const heads = menu.map((g) => document.getElementById(g.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setCur(e.target.id);
      },
      { rootMargin: "-24% 0px -66% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  // выбранная категория всегда видна в ленте на телефоне
  useEffect(() => {
    const el = bar.current;
    const a = el?.querySelector<HTMLElement>(`[href="#${cur}"]`);
    if (el && a) el.scrollTo({ left: a.offsetLeft - el.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
  }, [cur]);

  // плавающие кнопки поднимаются над полосой заказа
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 1099px)");
    const set = () => root.style.setProperty("--buybar", count > 0 && mq.matches ? "58px" : "0px");
    set();
    mq.addEventListener("change", set);
    return () => {
      mq.removeEventListener("change", set);
      root.style.removeProperty("--buybar");
    };
  }, [count]);

  return (
    <div className="wrap">
      <nav className="cats" aria-label="Категории меню" ref={bar}>
        {menu.map((g) => (
          <a key={g.id} href={`#${g.id}`} aria-current={cur === g.id ? "true" : undefined}>
            {g.title}
          </a>
        ))}
        <a href="#hall">Кальяны и бар</a>
      </nav>
      <div className="menu-layout">
        <div>
          {menu.map((g) => (
            <section key={g.id} id={g.id} className="menu-group" aria-labelledby={`${g.id}-t`}>
              <Lift id={`${g.id}-t`} lines={[g.title]} />
              <ul className="dishes">
                {g.items.map((it, i) => (
                  <Dish key={it.id} item={it} i={i} />
                ))}
              </ul>
            </section>
          ))}
          <section id="hall" className="hall-only menu-group" aria-labelledby="hall-t">
            <div className="pics">
              <Slab s="d" quiet src="/photos/hookah.webp" alt="Кальян крупным планом" sizes="(max-width: 819px) 32vw, 16vw" />
              <Slab s="e" quiet d={90} src="/video/v07.webp" alt="Коктейль с долькой грейпфрута на барной стойке" sizes="(max-width: 819px) 32vw, 16vw" />
              <Slab s="f" quiet d={180} src="/photos/tea.webp" alt="Чайник с ягодным чаем" sizes="(max-width: 819px) 32vw, 16vw" />
            </div>
            <div data-rv="right">
              <h2 id="hall-t">Кальяны, чай и бар</h2>
              <p>Кальяны и алкоголь по закону нельзя продавать через сайт, поэтому их заказывают за столом. Цены и что есть сегодня подскажет администратор.</p>
              <a className="btn btn-line" href={telegramLink("Здравствуйте! Подскажите цены на кальяны и бар.")} target="_blank" rel="noopener noreferrer">
                Спросить цены в Telegram
              </a>
            </div>
          </section>
        </div>
        <OrderPanel />
      </div>
      <Link href="/cart" className="buybar" data-on={count > 0 ? "" : undefined} tabIndex={count > 0 ? undefined : -1} aria-hidden={count === 0}>
        <span>
          {count} шт. на {rub(total)}
        </span>
        <span>Перейти в корзину</span>
      </Link>
    </div>
  );
}
