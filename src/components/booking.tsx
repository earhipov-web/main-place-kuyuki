"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { hh, openHours, place, rub, telegramLink } from "@/lib/data";
import { cleanText, formatPhone, hash, phoneDigits } from "@/lib/form";
import { IconLeft, IconMinus, IconPlus, IconRight } from "./bits";
import { FloorPlan, spots, type Spot } from "./floor-plan";
import { kazanNow } from "./open-now";

// ---------- даты ----------

const DAYS_AHEAD = 30;
const MAX_GUESTS = 14;
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) => keyOf(a) === keyOf(b);
const monthFmt = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const shortDayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });

function monthGrid(year: number, month: number, from: Date) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  // недели, которые целиком прошли, не показываем: на телефоне календарь короче
  const firstLive = cells.findIndex((d) => d && d >= from);
  return cells.slice(Math.max(0, Math.floor(firstLive / 7) * 7));
}

/** Час начала: от открытия до последнего часа перед закрытием. */
const startHours = (d: Date) => {
  const { from, to } = openHours(d);
  return Array.from({ length: to - from }, (_, i) => from + i);
};

// ---------- занятость (имитация, пока нет системы брони заведения) ----------

type Saved = { spot: string; date: string; hour: number; duration: number };
const STORE = "mainplace:bookings";

function readSaved(): Saved[] {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(STORE) ?? "[]");
    if (!Array.isArray(list)) return [];
    return list.filter(
      (b): b is Saved =>
        typeof b === "object" && b !== null && typeof b.spot === "string" && typeof b.date === "string" && Number.isInteger(b.hour) && Number.isInteger(b.duration),
    );
  } catch {
    return [];
  }
}
function writeSaved(list: Saved[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(list.slice(-20)));
  } catch {
    /* хранилище закрыто: бронь всё равно показываем */
  }
}
function isBusy(spot: string, date: Date, hour: number, duration: number, saved: Saved[]) {
  const key = keyOf(date);
  for (let i = 0; i < duration; i++) {
    const h = hour + i;
    const weekend = date.getDay() === 5 || date.getDay() === 6;
    const load = 12 + (h >= 19 ? 16 : 0) + (weekend ? 14 : 0);
    if (hash(`${spot}|${key}|${h}`) % 100 < load) return true;
    if (saved.some((b) => b.spot === spot && b.date === key && h >= b.hour && h < b.hour + b.duration)) return true;
  }
  return false;
}

/** Депозит VIP-комнаты: если бронь захватывает время после 18:00. */
function vipDeposit(date: Date, hour: number, duration: number) {
  if (hour + duration <= 18) return 0;
  return date.getDay() === 5 || date.getDay() === 6 ? 10000 : 5000;
}

const guestsWord = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? "гость" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "гостя" : "гостей";
const hoursWord = (n: number) => (n === 1 ? "час" : n < 5 ? "часа" : "часов");

function Step({ label, value, unit, min, max, onChange }: { label: string; value: number; unit: string; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="step" role="group" aria-label={label}>
      <span className="soft small">{label}</span>
      <div>
        <button type="button" className="ico" aria-label="Меньше" disabled={value <= min} onClick={() => onChange(value - 1)}>
          <IconMinus />
        </button>
        <output aria-live="polite">
          {value} <span className="sr">{unit}</span>
        </output>
        <button type="button" className="ico" aria-label="Больше" disabled={value >= max} onClick={() => onChange(value + 1)}>
          <IconPlus />
        </button>
      </div>
    </div>
  );
}

type Done = Saved & { name: string; phone: string; code: string; guests: number; deposit: number };

export function Booking() {
  const [now, setNow] = useState<Date | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(2);
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [done, setDone] = useState<Done | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // «сегодня» и оставшиеся часы считаем по времени Казани, поэтому виджет строится в браузере
  useEffect(() => {
    const n = kazanNow();
    const t = startOfDay(n);
    const first = startHours(t).find((h) => h > n.getHours()) ?? null;
    const want = new URLSearchParams(window.location.search).get("spot");
    /* eslint-disable react-hooks/set-state-in-effect */
    setNow(n);
    setSaved(readSaved());
    if (want && spots.some((s) => s.id === want)) setPicked(want);
    // поздно вечером сегодня уже не забронировать: сразу показываем завтра
    const d = first === null ? addDays(t, 1) : t;
    setDate(d);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setHour(first ?? 19);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const today = now ? startOfDay(now) : null;
  const hourOff = (h: number, d: Date) => !!(today && now && sameDay(d, today) && h <= now.getHours());
  const close = date ? openHours(date).to : 24;
  const maxDur = hour !== null ? Math.max(1, Math.min(6, close - hour)) : 6;
  const dur = Math.min(duration, maxDur);

  const busy = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!date || hour === null) return map;
    for (const s of spots) map.set(s.id, isBusy(s.id, date, hour, dur, saved));
    return map;
  }, [date, hour, dur, saved]);

  if (!now || !today || !view || !date) {
    return (
      <p className="panel" style={{ minHeight: 640 }}>
        Бронь по телефону{" "}
        <a className="link" href={place.phoneHref}>
          {place.phone}
        </a>
      </p>
    );
  }

  const fits = (s: Spot) => s.seats >= guests;
  const spot = picked ? (spots.find((s) => s.id === picked && !busy.get(s.id) && fits(s)) ?? null) : null;
  const wanted = picked && !spot ? spots.find((s) => s.id === picked) : null;
  const lastDay = addDays(today, DAYS_AHEAD);
  const canPrev = view.y > today.getFullYear() || view.m > today.getMonth();
  const canNext = new Date(view.y, view.m + 1, 1) <= lastDay;
  const free = spots.filter((s) => !busy.get(s.id) && fits(s)).length;
  const timeLabel = hour !== null ? `${hh(hour)}–${hh(hour + dur)}` : "";
  const deposit = spot?.id === "vip" && hour !== null ? vipDeposit(date, hour, dur) : 0;

  const pickDate = (d: Date) => {
    setDate(d);
    const hours = startHours(d);
    if (hour === null || !hours.includes(hour) || hourOff(hour, d)) setHour(hours.find((h) => !hourOff(h, d)) ?? null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = cleanText(name, 40);
    const p = phoneDigits(phone);
    const next: typeof errors = {};
    if (n.length < 2) next.name = "Напишите имя, хотя бы две буквы.";
    if (!p) next.phone = "Нужен номер из 10 цифр после +7, например +7 900 123-45-67.";
    setErrors(next);
    if (next.name || !p || !spot || hour === null) return;
    const b: Saved = { spot: spot.id, date: keyOf(date), hour, duration: dur };
    const list = [...readSaved(), b];
    writeSaved(list);
    setSaved(list);
    const code = `MP-${(hash(`${b.date}${hour}${spot.id}${p}${Date.now()}`) % 9000) + 1000}`;
    setDone({ ...b, name: n, phone: formatPhone(p), code, guests, deposit });
    setName("");
    setPhone("");
    window.setTimeout(() => doneRef.current?.scrollIntoView({ block: "center" }), 60);
  };

  if (done) {
    const d = new Date(`${done.date}T00:00:00`);
    const s = spots.find((x) => x.id === done.spot)!;
    const when = `${dayFmt.format(d)}, ${hh(done.hour)}–${hh(done.hour + done.duration)}`;
    return (
      <div className="panel done" role="status" ref={doneRef}>
        <h2>{s.name} за вами</h2>
        <p>
          {when}, {done.guests} {guestsWord(done.guests)}.
        </p>
        <p className="code">{done.code}</p>
        <p>
          {done.name}, назовите этот код администратору.
          {done.deposit > 0 ? ` Депозит за VIP-комнату ${rub(done.deposit)}.` : ""} Стол держим 15 минут. Задерживаетесь или хотите отменить, позвоните {place.phone}.
        </p>
        <p className="soft small">Это демонстрация: бронь сохранена только в вашем браузере.</p>
        <div className="acts">
          <a
            className="btn btn-plate"
            href={telegramLink(`Здравствуйте! Бронь ${done.code}: ${s.name}, ${when}, ${done.guests} ${guestsWord(done.guests)}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Отправить бронь в Telegram
          </a>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              setDone(null);
              setPicked(null);
            }}
          >
            Забронировать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book">
      <div data-rv="left">
        <div className="panel">
          <div className="book-head">
            <h2>{monthFmt.format(new Date(view.y, view.m, 1)).replace(" г.", "")}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="ico" aria-label="Предыдущий месяц" disabled={!canPrev} onClick={() => setView(view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 })}>
                <IconLeft />
              </button>
              <button type="button" className="ico" aria-label="Следующий месяц" disabled={!canNext} onClick={() => setView(view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 })}>
                <IconRight />
              </button>
            </div>
          </div>
          <div className="cal">
            {WEEKDAYS.map((w) => (
              <span key={w} className="wd" aria-hidden="true">
                {w}
              </span>
            ))}
            {monthGrid(view.y, view.m, today).map((d, i) =>
              d ? (
                <button
                  key={keyOf(d)}
                  type="button"
                  className="cell"
                  disabled={d < today || d > lastDay}
                  aria-pressed={sameDay(d, date)}
                  aria-label={dayFmt.format(d)}
                  data-today={sameDay(d, today) ? "" : undefined}
                  onClick={() => pickDate(d)}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={`e${i}`} />
              ),
            )}
          </div>
        </div>
        <div className="panel">
          <div className="book-head">
            <h2>Начало</h2>
            <span className="soft small num">
              открыто {hh(openHours(date).from)}–{hh(openHours(date).to)}
            </span>
          </div>
          <div className="hours-grid">
            {startHours(date).map((h) => (
              <button key={h} type="button" className="cell" disabled={hourOff(h, date)} aria-pressed={hour === h} onClick={() => setHour(h)}>
                {hh(h)}
              </button>
            ))}
          </div>
          {startHours(date).every((h) => hourOff(h, date)) && <p className="err">На сегодня бронь закрыта, выберите другой день.</p>}
          <div className="steps">
            <Step label="Сколько часов" unit={hoursWord(dur)} value={dur} min={1} max={maxDur} onChange={setDuration} />
            <Step label="Сколько гостей" unit={guestsWord(guests)} value={guests} min={1} max={MAX_GUESTS} onChange={setGuests} />
          </div>
        </div>
      </div>

      <div data-rv="right">
        <div className="panel">
          <div className="book-head" style={{ flexWrap: "wrap" }}>
            <h2>Схема зала</h2>
            <span className="soft small" aria-live="polite">
              {hour === null ? "Сначала выберите время" : `${shortDayFmt.format(date)}, ${timeLabel}: свободно ${free} из ${spots.length}`}
            </span>
          </div>
          <FloorPlan
            stateOf={(s) => {
              const taken = hour === null || !!busy.get(s.id);
              const small = !fits(s);
              return { on: spot?.id === s.id, off: taken || small, why: taken ? "занято" : small ? "мало мест" : undefined };
            }}
            onPick={setPicked}
          />
          <ul className="legend" aria-label="Обозначения">
            <li>
              <i /> свободно
            </li>
            <li>
              <i className="t" /> занято или мало мест
            </li>
            <li>
              <i className="s" /> ваш выбор
            </li>
          </ul>
        </div>
        <form className="panel" onSubmit={submit} noValidate>
          <p className={`choice ${spot ? "" : "wait"}`} aria-live="polite">
            {spot && hour !== null
              ? `${spot.name}, ${shortDayFmt.format(date)}, ${timeLabel}, ${guests} ${guestsWord(guests)}`
              : wanted
                ? `${wanted.name}: на это время ${busy.get(wanted.id) ? "занято, поменяйте час или день" : "не хватит мест"}`
                : "Нажмите на свободный стол на схеме"}
          </p>
          {deposit > 0 && <p className="small" style={{ marginTop: 6 }}>Депозит за VIP-комнату после 18:00: {rub(deposit)}.</p>}
          <div className="fields">
            <label className="field">
              <span>Имя</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "bn" : undefined} />
              {errors.name && (
                <span id="bn" className="err">
                  {errors.name}
                </span>
              )}
            </label>
            <label className="field">
              <span>Телефон</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 900 123-45-67"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "bp" : undefined}
              />
              {errors.phone && (
                <span id="bp" className="err">
                  {errors.phone}
                </span>
              )}
            </label>
          </div>
          <button type="submit" className="btn btn-plate btn-wide" disabled={!spot || hour === null}>
            {spot ? `Забронировать: ${spot.kind === "round" || spot.kind === "slate" ? `стол ${spot.short}` : spot.kind === "bar" ? spot.name.toLowerCase() : spot.name}` : "Забронировать"}
          </button>
        </form>
      </div>
    </div>
  );
}
