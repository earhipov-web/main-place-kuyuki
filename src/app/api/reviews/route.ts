import { fetchLiveReviews, type ReviewsPayload } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// Ответ живёт пять минут на CDN и в памяти процесса: сколько бы гостей ни открыло страницу,
// Яндекс спрашиваем не чаще раза в пять минут. Ошибку помним минуту.
const TTL = 5 * 60_000;
const FAIL_TTL = 60_000;
const CDN = "public, s-maxage=300, stale-while-revalidate=86400";

let cached: { at: number; data: ReviewsPayload } | null = null;
let failedAt = 0;
let pending: Promise<ReviewsPayload | null> | null = null;

async function load() {
  if (cached && Date.now() - cached.at < TTL) return cached.data;
  if (Date.now() - failedAt < FAIL_TTL) return cached?.data ?? null;
  pending ??= fetchLiveReviews().finally(() => {
    pending = null;
  });
  const data = await pending;
  if (data) cached = { at: Date.now(), data };
  else failedAt = Date.now();
  return data ?? cached?.data ?? null;
}

export async function GET() {
  const live = await load();
  if (!live) {
    return Response.json({ error: "Яндекс Карты не ответили" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(live, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": CDN,
      "Netlify-CDN-Cache-Control": CDN,
    },
  });
}
