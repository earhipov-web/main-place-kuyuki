// Живые отзывы с Яндекс Карт.
//
// Страница отзывов организации отдаёт отзывы в HTML как JSON ("reviewResults") вместе с рейтингом
// ("ratingData"). Читаем её на сервере и сортируем по дате. Если страница не читается (капча, смена
// вёрстки), второй источник: официальный виджет отзывов. Последний: копия в saved-reviews.json.

export type Review = { id: string; name: string; avatar?: string; date: string; rating: number; text: string };

export type ReviewsPayload = {
  source: "yandex" | "yandex-widget" | "saved";
  fetchedAt: string;
  rating: number;
  ratings: number;
  reviewsCount: number;
  reviews: Review[];
};

export const ORG_ID = "229718419334";
export const REVIEWS_URL = `https://yandex.ru/maps/org/main_place/${ORG_ID}/reviews/`;
const WIDGET_URL = `https://yandex.ru/maps-reviews-widget/${ORG_ID}?comments`;
const SHOW = 50;
const MAX_TEXT = 2500;
const MAX_NAME = 60;
const MAX_HTML = 4_000_000;

/** Только аватары Яндекса по https, остальное отбрасываем. */
const safeAvatar = (url?: string) => (url && /^https:\/\/avatars\.mds\.yandex\.net\/[\w./-]+$/.test(url) ? url : undefined);
const clean = (s: string, max: number) => s.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept-Language": "ru-RU,ru;q=0.9",
  Accept: "text/html,application/xhtml+xml",
};

async function get(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal, cache: "no-store", redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const host = new URL(res.url || url).hostname;
    if (!/(^|\.)yandex\.(ru|com)$/.test(host)) throw new Error("unexpected host");
    const text = await res.text();
    if (text.length > MAX_HTML) throw new Error("page too large");
    return text;
  } finally {
    clearTimeout(t);
  }
}

/** Читает JSON-значение, которое стоит в HTML сразу после key. */
function jsonAfter(html: string, key: string): unknown {
  const i = html.indexOf(key);
  if (i < 0) return null;
  const start = i + key.length;
  const open = html[start];
  if (open !== "{" && open !== "[") return null;
  let depth = 0;
  let inStr = false;
  for (let k = start; k < html.length; k++) {
    const c = html[k];
    if (inStr) {
      if (c === "\\") k++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, k + 1));
    }
  }
  return null;
}

type RawReview = { reviewId?: string; author?: { name?: string; avatarUrl?: string }; text?: string; rating?: number; updatedTime?: string };

async function fromReviewsPage(): Promise<ReviewsPayload> {
  const html = await get(`${REVIEWS_URL}?ranking=by_time`);
  const results = jsonAfter(html, '"reviewResults":') as { reviews?: RawReview[] } | null;
  const list = results?.reviews ?? [];
  if (!list.length) throw new Error("no reviews in page");
  const rd = jsonAfter(html, '"ratingData":') as { ratingCount?: number; ratingValue?: number; reviewCount?: number } | null;
  const reviews = list
    .filter((r) => r.text && r.updatedTime && r.author?.name && !Number.isNaN(Date.parse(r.updatedTime)))
    .map<Review>((r) => ({
      id: clean(r.reviewId ?? `${r.author!.name}-${r.updatedTime}`, 80),
      name: clean(r.author!.name!, MAX_NAME),
      avatar: safeAvatar(r.author?.avatarUrl?.replace("{size}", "islands-68")),
      date: r.updatedTime!,
      rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 5))),
      text: clean(r.text!, MAX_TEXT),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, SHOW);
  return {
    source: "yandex",
    fetchedAt: new Date().toISOString(),
    rating: Math.round((rd?.ratingValue ?? 5) * 10) / 10,
    ratings: rd?.ratingCount ?? 0,
    reviewsCount: rd?.reviewCount ?? reviews.length,
    reviews,
  };
}

const MONTHS: Record<string, number> = {
  января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5, июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
};
const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function ruDate(s: string) {
  const m = s.trim().match(/^(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?/i);
  if (!m || MONTHS[m[2]] === undefined) return new Date().toISOString();
  const now = new Date();
  let y = m[3] ? Number(m[3]) : now.getFullYear();
  let d = new Date(Date.UTC(y, MONTHS[m[2]], Number(m[1]), 12));
  if (!m[3] && d > now) d = new Date(Date.UTC(--y, MONTHS[m[2]], Number(m[1]), 12));
  return d.toISOString();
}

async function fromWidget(): Promise<ReviewsPayload> {
  const html = await get(WIDGET_URL);
  const reviews = html
    .split('<div class="comment">')
    .slice(1)
    .map<Review | null>((b, i) => {
      const name = b.match(/class="comment__name">([^<]+)</)?.[1];
      const date = b.match(/class="comment__date">([^<]+)</)?.[1];
      const text = b.match(/class="comment__text">([\s\S]*?)<\/p>/)?.[1];
      if (!name || !date || !text) return null;
      const stars = (b.split("comment__stars")[1]?.split("</ul>")[0].match(/stars-list__star"/g) ?? []).length;
      return {
        id: `w${i}`,
        name: clean(decode(name), MAX_NAME),
        avatar: safeAvatar(b.match(/class="comment__header"><img src="([^"]+)"/)?.[1]),
        date: ruDate(date),
        rating: Math.min(5, Math.max(1, stars || 5)),
        text: clean(decode(text), MAX_TEXT),
      };
    })
    .filter((r): r is Review => !!r)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!reviews.length) throw new Error("no reviews in widget");
  const value = Number(html.match(/mini-badge__stars-count">([\d,]+)</)?.[1].replace(",", ".") ?? 5);
  const counts = html.match(/(\d+)\s+отзыв[а-я]*\s*•\s*(\d+)\s+оцен/);
  return {
    source: "yandex-widget",
    fetchedAt: new Date().toISOString(),
    rating: value,
    ratings: counts ? Number(counts[2]) : 0,
    reviewsCount: counts ? Number(counts[1]) : reviews.length,
    reviews: reviews.slice(0, SHOW),
  };
}

export async function fetchLiveReviews(): Promise<ReviewsPayload | null> {
  for (const source of [fromReviewsPage, fromWidget]) {
    try {
      return await source();
    } catch (e) {
      console.warn(`[reviews] ${source.name}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }
  return null;
}
