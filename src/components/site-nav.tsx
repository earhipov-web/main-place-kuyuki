"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, rub, telegramLink } from "@/lib/data";
import { IconBook, IconCart, IconHome, IconMenu, IconNew, IconPhoto, IconTelegram } from "./bits";
import { useCart } from "./cart";
import { OpenNow } from "./open-now";

const icons = [IconHome, IconNew, IconMenu, IconBook, IconPhoto];

export function SiteNav() {
  const path = usePathname();
  const { count, total } = useCart();
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Link href="/" className="brand">
            <Image src="/mark.webp" alt="" width={240} height={197} priority />
            <b>Main Place</b>
          </Link>
          <nav aria-label="Разделы">
            <ul>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={on(l.href) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <OpenNow />
          <Link href="/cart" className="cart-link" aria-label={count ? `Корзина, ${count} шт., ${rub(total)}` : "Корзина, пусто"}>
            <IconCart />
            {count > 0 && <span>{count}</span>}
          </Link>
        </div>
      </header>
      <nav className="tabs" aria-label="Разделы сайта">
        {navLinks.map((l, i) => {
          const Icon = icons[i];
          return (
            <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}>
              <Icon />
              {l.short}
            </Link>
          );
        })}
        <a href={telegramLink()} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram">
          <IconTelegram />
          Telegram
        </a>
      </nav>
      <a className="tg" href={telegramLink()} target="_blank" rel="noopener noreferrer">
        <IconTelegram />
        <span>Написать в Telegram</span>
      </a>
    </>
  );
}
