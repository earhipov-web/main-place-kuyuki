"use client";

import Link from "next/link";
import { Lift, Slab } from "@/components/bits";
import { DiscountPicker, Qty, Totals, useCart } from "@/components/cart";
import { rub } from "@/lib/data";

export default function CartPage() {
  const { lines, ready, drop } = useCart();
  return (
    <div className="wrap" style={{ minHeight: "60svh" }}>
      <div className="page-head">
        <Lift as="h1" lines={["Корзина"]} />
      </div>
      {!ready ? null : lines.length === 0 ? (
        <div className="empty">
          <p>В корзине пусто.</p>
          <Link href="/menu" className="btn btn-plate">
            Открыть меню
          </Link>
        </div>
      ) : (
        <div className="two">
          <ul className="lines">
            {lines.map(({ item, qty }) => (
              <li key={item.id}>
                <Slab quiet still s="d" src={item.img} alt="" sizes="104px" />
                <div>
                  <span>{item.name}</span>
                  <div className="ctl">
                    <Qty id={item.id} name={item.name} />
                    <button type="button" className="drop" onClick={() => drop(item.id)} aria-label={`Убрать из корзины: ${item.name}`}>
                      Убрать
                    </button>
                  </div>
                </div>
                <span className="sum">{rub(item.price * qty)}</span>
              </li>
            ))}
          </ul>
          <aside className="panel sticky" aria-labelledby="sum-t">
            <h2 id="sum-t">Скидка и итог</h2>
            <DiscountPicker />
            <Totals />
            <Link href="/checkout" className="btn btn-plate btn-wide">
              Оформить заказ
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
