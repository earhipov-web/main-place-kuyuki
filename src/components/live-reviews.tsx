"use client";

import { useEffect, useState } from "react";
import saved from "@/lib/saved-reviews.json";
import { REVIEWS_URL, type Review, type ReviewsPayload } from "@/lib/reviews";
import { IconStar, Lift } from "./bits";

const POLL = 5 * 60_000;
const STEP = 6;

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" });
const timeFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
const ratingFmt = (n: number) => n.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} из 5`}>
      {Array.from({ length: 5 }, (_, k) => (
        <IconStar key={k} off={k >= n} />
      ))}
    </span>
  );
}

function Card({ r }: { r: Review }) {
  const [open, setOpen] = useState(false);
  const long = r.text.length > 170 || r.text.split("\n").length > 4;
  return (
    <article className="review" data-rv="up">
      <header>
        {r.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- аватар с Яндекса, без реферера
          <img src={r.avatar} alt="" width={38} height={38} referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <span className="ava" aria-hidden="true">
            {r.name[0]}
          </span>
        )}
        <div>
          <b>{r.name}</b>
          <time className="small soft" dateTime={r.date}>
            {dateFmt.format(new Date(r.date)).replace(/\s?г\.$/, "")}
          </time>
        </div>
        <Stars n={r.rating} />
      </header>
      <blockquote data-cut={long && !open ? "" : undefined}>{r.text}</blockquote>
      {long && (
        <button type="button" className="link small" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Свернуть" : "Читать целиком"}
        </button>
      )}
    </article>
  );
}

/** Сразу показывает сохранённую копию, затем меняет её на живые отзывы и перепроверяет каждые пять минут. */
export function LiveReviews() {
  const [data, setData] = useState<ReviewsPayload>(saved as ReviewsPayload);
  const [shown, setShown] = useState(STEP);
  const live = data.source !== "saved";

  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as ReviewsPayload;
        if (!stop && Array.isArray(next.reviews) && next.reviews.length) setData(next);
      } catch {
        /* оставляем то, что уже показано */
      }
    };
    load();
    const t = setInterval(load, POLL);
    document.addEventListener("visibilitychange", load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  const rest = data.reviews.length - shown;
  return (
    <div className="reviews">
      <div className="reviews-side">
        <Lift lines={["Отзывы гостей"]} id="reviews-title" />
        <div data-rv="left">
          <p className="score">
            <b>{ratingFmt(data.rating)}</b>
            <span>
              <Stars n={Math.round(data.rating)} />
              <br />
              <span className="small soft">
                {data.ratings} {plural(data.ratings, "оценка", "оценки", "оценок")}, {data.reviewsCount} {plural(data.reviewsCount, "отзыв", "отзыва", "отзывов")}
              </span>
            </span>
          </p>
          <p className="live small soft" data-on={live ? "" : undefined} aria-live="polite">
            <i aria-hidden="true" />
            {live ? `Прямо с Яндекс Карт, обновлено в ${timeFmt.format(new Date(data.fetchedAt))}` : "С Яндекс Карт, проверяем новые"}
          </p>
          <p className="reviews-more">
            <a className="link" href={REVIEWS_URL} target="_blank" rel="noopener noreferrer">
              Оставить отзыв на Яндексе
            </a>
          </p>
        </div>
      </div>
      <div>
        <div className="review-list">
          {data.reviews.slice(0, shown).map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </div>
        {rest > 0 && (
          <button type="button" className="btn btn-line btn-sm" onClick={() => setShown((n) => n + STEP * 2)}>
            Показать ещё {Math.min(rest, STEP * 2)}
          </button>
        )}
      </div>
    </div>
  );
}
