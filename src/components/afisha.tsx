"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { afisha, clips, dishPosters, itemById, place, rub, type AfishaEvent } from "@/lib/data";
import { IconPlay, Slab, delay, type SlabShape } from "./bits";
import { Qty, useCart } from "./cart";
import { useLightbox, type Media } from "./lightbox";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });

/** Карточка события: постер слева в одном и том же кадре, справа дата, название, суть и действие. */
export function EventCard({ e, d = 0 }: { e: AfishaEvent; d?: number }) {
  const open = useLightbox();
  const list: Media[] = e.posters.map((p) => ({ kind: "img", src: p.img, alt: p.alt, title: e.title }));
  const p = e.posters[0];
  const wide = p.w > p.h;
  const more = e.posters.length - 1;
  return (
    <li className="card" id={e.id} data-rv="up" style={delay(d)}>
      <button type="button" className="card-pic" onClick={() => open(list, 0)} aria-label={`Открыть постер: ${e.title}`}>
        {wide && <Image className="card-fill" src={p.img} alt="" fill sizes="220px" />}
        <Image className={wide ? "card-whole" : undefined} src={p.img} alt={p.alt} fill sizes="(max-width: 819px) 38vw, 240px" style={{ objectPosition: e.focus }} />
      </button>
      <div className="card-text">
        <h2>{e.title}</h2>
        {e.date && <time dateTime={e.date}>{dateFmt.format(new Date(e.date))}</time>}
        <p>{e.text}</p>
        <div className="card-foot">
          {e.cta.external ? (
            <a className="btn btn-line btn-sm" href={e.cta.href} target="_blank" rel="noopener noreferrer">
              {e.cta.label}
            </a>
          ) : (
            <Link className="btn btn-line btn-sm" href={e.cta.href}>
              {e.cta.label}
            </Link>
          )}
          {more > 0 && (
            <button type="button" className="link card-more" onClick={() => open(list, 1)}>
              Ещё {more} {more === 1 ? "постер" : "постера"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function DishPosters() {
  const open = useLightbox();
  const { qtyOf, add } = useCart();
  const media: Media[] = dishPosters.map((x) => ({ kind: "img", src: x.poster.img, alt: x.poster.alt, title: itemById(x.item)?.name }));
  return (
    <ul className="dish-posters">
      {dishPosters.map((x, i) => {
        const item = itemById(x.item);
        if (!item) return null;
        return (
          <li key={x.item} className="card" data-rv="up" style={delay(i * 70)}>
            <button type="button" className="card-pic" onClick={() => open(media, i)} aria-label={`Открыть постер: ${item.name}`}>
              <Image src={x.poster.img} alt={x.poster.alt} fill sizes="(max-width: 819px) 48vw, 320px" />
            </button>
            <h3>{item.name}</h3>
            <div className="dish-buy">
              <span className="price">{rub(item.price)}</span>
              {qtyOf(item.id) > 0 ? (
                <Qty id={item.id} name={item.name} />
              ) : (
                <button type="button" className="add" onClick={() => add(item.id)} aria-label={`Добавить в корзину: ${item.name}`}>
                  В корзину
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- видео ----------

const clipMedia: Media[] = clips.map((c) => ({ kind: "video", src: `/video/${c.id}.mp4`, poster: `/video/${c.id}.webp`, alt: c.title, title: c.title }));
const shapes: SlabShape[] = ["d", "e", "f"];

function Clip({ i }: { i: number }) {
  const open = useLightbox();
  const v = useRef<HTMLVideoElement>(null);
  const host = useRef<HTMLButtonElement>(null);
  const c = clips[i];

  // мышь над роликом: он тихо играет прямо в плитке
  const play = () => {
    const el = v.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!el.src) el.src = `/video/${c.id}.mp4`;
    el.play().then(
      () => host.current?.setAttribute("data-play", ""),
      () => {},
    );
  };
  const stop = () => {
    v.current?.pause();
    host.current?.removeAttribute("data-play");
  };

  return (
    <button
      ref={host}
      type="button"
      className="clip"
      onPointerEnter={play}
      onPointerLeave={stop}
      onClick={() => {
        stop();
        open(clipMedia, i);
      }}
      aria-label={`Видео: ${c.title}`}
    >
      <Slab s={shapes[i % 3]} quiet d={(i % 7) * 110} src={`/video/${c.id}.webp`} alt="" sizes="(max-width: 819px) 33vw, 14vw">
        <video ref={v} muted loop playsInline preload="none" tabIndex={-1} aria-hidden="true" />
        <IconPlay />
      </Slab>
      <span className="cap">{c.title}</span>
    </button>
  );
}

function Clips() {
  return (
    <ul className="clips" style={{ marginTop: 0 }}>
      {clips.map((c, i) => (
        <li key={c.id}>
          <Clip i={i} />
        </li>
      ))}
      <li className="clip-end">
        <a href={`${place.yandexUrl}gallery/`} target="_blank" rel="noopener noreferrer">
          Галерея на Яндекс Картах
        </a>
      </li>
    </ul>
  );
}

// ---------- переключатель ----------

const tabs = [
  { id: "events", label: "Афиша" },
  { id: "dishes", label: "Блюда" },
  { id: "video", label: "Видео" },
] as const;
type TabId = (typeof tabs)[number]["id"];

export function News() {
  const [tab, setTab] = useState<TabId>("events");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const h = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- вкладка из адреса известна только в браузере
    if (tabs.some((t) => t.id === h)) setTab(h as TabId);
  }, []);

  const pick = (id: TabId) => {
    setTab(id);
    window.history.replaceState(null, "", id === "events" ? window.location.pathname : `#${id}`);
  };
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab);
    const next = e.key === "ArrowRight" ? tabs[(i + 1) % 3] : e.key === "ArrowLeft" ? tabs[(i + 2) % 3] : null;
    if (!next) return;
    e.preventDefault();
    pick(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <>
      <div className="seg" role="tablist" aria-label="Что показать" onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`t-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="news-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="seg-body" role="tabpanel" id="news-panel" aria-labelledby={`t-${tab}`} key={tab}>
        {tab === "events" && (
          <ul className="cards">
            {afisha.map((e, i) => (
              <EventCard key={e.id} e={e} d={(i % 2) * 80} />
            ))}
          </ul>
        )}
        {tab === "dishes" && <DishPosters />}
        {tab === "video" && <Clips />}
      </div>
    </>
  );
}
