"use client";

import type { KeyboardEvent, ReactNode } from "react";

// Схема зала придумана по фотографиям: сланцевая стена слева, окна сверху, VIP в углу, бар у нижней стены.
// Координаты в единицах viewBox 800 × 760. Поправить стол = поправить строку здесь.

export type Spot = {
  id: string;
  name: string;
  short: string;
  seats: number;
  kind: "round" | "slate" | "bar" | "ps5" | "vip";
  x: number;
  y: number;
};

export const spots: Spot[] = [
  { id: "w1", name: "Стол 1 у окна", short: "1", seats: 2, kind: "round", x: 96, y: 96 },
  { id: "w2", name: "Стол 2 у окна", short: "2", seats: 4, kind: "round", x: 244, y: 96 },
  { id: "w3", name: "Стол 3 у окна", short: "3", seats: 4, kind: "round", x: 400, y: 96 },
  { id: "s4", name: "Стол 4 у сланцевой стены", short: "4", seats: 4, kind: "slate", x: 122, y: 246 },
  { id: "s5", name: "Стол 5 у сланцевой стены", short: "5", seats: 6, kind: "slate", x: 122, y: 372 },
  { id: "s6", name: "Стол 6 у сланцевой стены", short: "6", seats: 4, kind: "slate", x: 122, y: 498 },
  { id: "c7", name: "Стол 7 в центре", short: "7", seats: 4, kind: "round", x: 306, y: 272 },
  { id: "c8", name: "Стол 8 в центре", short: "8", seats: 4, kind: "round", x: 466, y: 272 },
  { id: "c9", name: "Стол 9 в центре", short: "9", seats: 6, kind: "round", x: 306, y: 436 },
  { id: "c10", name: "Стол 10 в центре", short: "10", seats: 4, kind: "round", x: 466, y: 436 },
  { id: "b1", name: "Бар, места 1–2", short: "Б1", seats: 2, kind: "bar", x: 286, y: 596 },
  { id: "b2", name: "Бар, места 3–4", short: "Б2", seats: 2, kind: "bar", x: 396, y: 596 },
  { id: "b3", name: "Бар, места 5–6", short: "Б3", seats: 2, kind: "bar", x: 506, y: 596 },
  { id: "ps5", name: "Зона PlayStation 5", short: "PS5", seats: 6, kind: "ps5", x: 690, y: 612 },
  { id: "vip", name: "VIP-комната", short: "VIP", seats: 14, kind: "vip", x: 662, y: 154 },
];

function seatsAround(n: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (n === 4 ? Math.PI / 4 : 0);
    return [Math.round(Math.cos(a) * (r + 12) * 10) / 10, Math.round(Math.sin(a) * (r + 12) * 10) / 10];
  });
}

function Furniture({ s }: { s: Spot }): ReactNode {
  const lbl = (dy = 5, sub = true) => (
    <>
      <text className="lbl" y={sub ? dy - 1 : dy + 5}>
        {s.short}
      </text>
      {sub && (
        <text className="sub" y={dy + 18}>
          до {s.seats}
        </text>
      )}
    </>
  );
  switch (s.kind) {
    case "round": {
      const r = s.seats > 4 ? 48 : s.seats > 2 ? 43 : 37;
      return (
        <>
          {seatsAround(s.seats, r).map(([x, y]) => (
            <rect key={`${x}${y}`} className="seat" x={x - 13} y={y - 13} width="26" height="26" transform={`rotate(${Math.round((Math.atan2(y, x) * 180) / Math.PI)} ${x} ${y})`} />
          ))}
          <circle className="fur" r={r} />
          {lbl()}
        </>
      );
    }
    case "slate":
      return (
        <>
          <path className="seat" d="M-84 -54h30v108h-30z" />
          <rect className="seat" x="38" y="-34" width="26" height="26" />
          <rect className="seat" x="38" y="8" width="26" height="26" />
          <rect className="fur" x="-46" y="-42" width="86" height="84" />
          {lbl()}
        </>
      );
    case "bar":
      return (
        <>
          <circle className="seat" cx="-24" cy="-22" r="15" />
          <circle className="seat" cx="24" cy="-22" r="15" />
          <rect className="fur" x="-46" y="-20" width="92" height="40" />
          <text className="lbl" y="11">
            {s.short}
          </text>
        </>
      );
    case "ps5":
      return (
        <>
          <path className="seat" d="M-84 -104h44v208h-44z" />
          <path className="seat" d="M-36 74h92v30h-92z" />
          <circle className="fur" cx="0" cy="-8" r="48" />
          {lbl(-3)}
        </>
      );
    case "vip":
      return (
        <>
          <path className="seat" d="M-92 -92h184v30h-184zM92 -62h26v124h-26zM-70 62h150v28h-150z" />
          <rect className="fur" x="-82" y="-50" width="160" height="100" />
          <path d="M-82 38c34-12 46 8 78-1s50-16 82-8" fill="none" stroke="#7d93a0" strokeWidth="7" opacity="0.55" pointerEvents="none" />
          {lbl(-6)}
        </>
      );
  }
}

const hit: Record<Spot["kind"], [number, number, number, number]> = {
  round: [-66, -66, 132, 132],
  slate: [-84, -60, 152, 120],
  bar: [-53, -34, 106, 68],
  ps5: [-84, -104, 168, 212],
  vip: [-96, -96, 220, 192],
};

export function FloorPlan({
  stateOf,
  onPick,
}: {
  stateOf: (s: Spot) => { on: boolean; off: boolean; why?: string };
  onPick: (id: string) => void;
}) {
  return (
    <svg className="plan" viewBox="0 0 800 760" role="group" aria-label="Схема зала. Столы у окон и у сланцевой стены, бар, зона PlayStation 5 и VIP-комната">
      <defs>
        <pattern id="taken" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" fill="#120c08" />
          <rect width="2.5" height="9" fill="#2b1e14" />
        </pattern>
        <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#8a5a2c" />
          <stop offset="0.35" stopColor="#eccb9b" />
          <stop offset="0.6" stopColor="#a87340" />
          <stop offset="1" stopColor="#d8a566" />
        </linearGradient>
        <pattern id="brick" width="30" height="16" patternUnits="userSpaceOnUse">
          <rect width="30" height="16" fill="#1c0f08" />
          <path d="M0 8h30M0 16h30M8 0v8M23 8v8" stroke="#4a2614" strokeWidth="1.5" />
        </pattern>
      </defs>

      <g aria-hidden="true">
        <path d="M12 12h776v736H12z" fill="none" stroke="#5a4028" strokeWidth="6" />
        {/* окна */}
        <path d="M44 12h100M190 12h108M346 12h108" stroke="#9fb2bd" strokeWidth="6" opacity="0.7" />
        <text x="152" y="42">
          окна
        </text>
        {/* сланцевая стена с трещинами */}
        <path d="M15 176h22l-5 60 7 52-8 64 6 58-7 62 6 58-6 40h-15z" fill="#2a211b" />
        <path d="M26 180l3 40-5 34 6 46-7 40 6 52-4 48 5 44-5 40 4 44" fill="none" stroke="#ffcf95" strokeWidth="2.2" style={{ filter: "drop-shadow(0 0 5px #ff9d3c)" }} />
        {/* VIP */}
        <path d="M536 12v64M536 152v136M536 288h252" stroke="#5a4028" strokeWidth="5" fill="none" />
        <path d="M536 76a76 76 0 0 1 70 34" stroke="#5a4028" strokeWidth="1.5" fill="none" strokeDasharray="4 5" />
        <path d="M596 18l6 24 18 2 4-26zM650 18l-2 32 22 4 6-36zM708 18l2 40 24 2 4-42z" fill="#6b3f18" style={{ filter: "drop-shadow(0 0 7px #ff9d3c)" }} />
        <text x="550" y="278">
          VIP-комната
        </text>
        {/* зеркала */}
        <path d="M640 320h148M640 320v120M640 440h148" stroke="#5a4028" strokeWidth="4" fill="none" />
        <rect x="664" y="342" width="26" height="62" rx="13" fill="none" stroke="#ffc692" strokeWidth="2" style={{ filter: "drop-shadow(0 0 5px #ff9d3c)" }} />
        <rect x="704" y="342" width="26" height="62" rx="13" fill="none" stroke="#ffc692" strokeWidth="2" style={{ filter: "drop-shadow(0 0 5px #ff9d3c)" }} />
        <text x="652" y="432">
          зеркала
        </text>
        {/* экран PS5 */}
        <path d="M782 520v150" stroke="#ffc692" strokeWidth="5" style={{ filter: "drop-shadow(-6px 0 9px #ff9d3c)" }} />
        {/* бар */}
        <rect x="232" y="636" width="330" height="34" fill="url(#brick)" stroke="#6a3c1d" />
        <path d="M232 670h330" stroke="#ff9d3c" strokeWidth="3" style={{ filter: "drop-shadow(0 4px 8px #ff9d3c)" }} />
        <path d="M232 744v-18h330v18" fill="#2a1a0e" stroke="#6a3c1d" />
        <text x="378" y="708">
          бар
        </text>
        {/* лестница */}
        <path d="M44 640h130v105M44 640v105M44 661h130M44 682h130M44 703h130M44 724h130" stroke="#5a4028" strokeWidth="2.5" fill="none" />
        <text x="46" y="628">
          лестница
        </text>
      </g>

      {spots.map((s) => {
        const { on, off, why } = stateOf(s);
        const [x, y, w, h] = hit[s.kind];
        const pick = () => !off && onPick(s.id);
        return (
          <g
            key={s.id}
            className="spot"
            transform={`translate(${s.x} ${s.y})`}
            role="button"
            tabIndex={off ? -1 : 0}
            aria-pressed={on}
            aria-disabled={off}
            aria-label={`${s.name}, до ${s.seats} гостей${why ? `, ${why}` : ""}`}
            onClick={pick}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick();
              }
            }}
          >
            <rect className="hit" x={x} y={y} width={w} height={h} />
            <Furniture s={s} />
          </g>
        );
      })}
    </svg>
  );
}
