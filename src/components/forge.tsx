"use client";

import { useCallback, useEffect, useRef } from "react";

// Первый экран: лазер прорезает контур треугольника, удар печати, искры, остывающий металл.
// Координаты треугольника в единицах mark-xl.webp (600 × 525), сняты с логотипа заведения.
const A: [number, number] = [300, 16];
const B: [number, number] = [591, 515];
const C: [number, number] = [10, 515];
const EDGES = [
  [A, B],
  [B, C],
  [C, A],
] as const;
const LEN = EDGES.map(([p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]));
const TOTAL = LEN.reduce((a, b) => a + b, 0);

const DRAW = 1350; // контур
const HIT = 1780; // момент удара
const WORD = HIT + 520; // название

/** Точка на контуре, t от 0 до 1, и наружная нормаль. */
function along(t: number) {
  let d = t * TOTAL;
  for (let i = 0; i < 3; i++) {
    if (d <= LEN[i] || i === 2) {
      const [p, q] = EDGES[i];
      const k = d / LEN[i];
      const ux = (q[0] - p[0]) / LEN[i];
      const uy = (q[1] - p[1]) / LEN[i];
      return { x: p[0] + (q[0] - p[0]) * k, y: p[1] + (q[1] - p[1]) * k, nx: uy, ny: -ux };
    }
    d -= LEN[i];
  }
  return { x: A[0], y: A[1], nx: 0, ny: -1 };
}
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2; // ровный ход лазера
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// лазерный рез: широкое слабое свечение, к центру всё уже и ярче, сердцевина белая (ширина в px, цвет)
const BEAM: [number, string][] = [
  [26, "rgba(255,96,12,0.035)"],
  [18, "rgba(255,110,20,0.05)"],
  [11, "rgba(255,130,30,0.09)"],
  [6, "rgba(255,150,50,0.17)"],
  [2.8, "rgba(255,178,84,0.4)"],
  [1.5, "rgba(255,220,150,0.8)"],
  [0.8, "rgba(255,253,247,1)"],
];

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; w: number; ember?: boolean };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };

export function Forge() {
  const root = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const stop = useRef<() => void>(() => {});

  const run = useCallback(() => {
    stop.current();
    const host = root.current;
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const $ = (s: string) => host.querySelector<HTMLElement>(s)!;
    const anims: Animation[] = [];
    const play = (sel: string, frames: Keyframe[], opt: KeyframeAnimationOptions) => anims.push($(sel).animate(frames, { fill: "both", ...opt }));

    // ---------- слои ----------
    // печать: замах и резкий удар
    play(
      ".forge-mark",
      [
        { opacity: 0, transform: "scale(3.1) translateY(-7%)", filter: "blur(7px)", easing: "cubic-bezier(0.7,0,0.95,0.4)" },
        { opacity: 0.9, transform: "scale(1.55) translateY(-2%)", filter: "blur(3px)", offset: 0.62, easing: "cubic-bezier(0.6,0,1,0.6)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ],
      { delay: HIT - 230, duration: 230, fill: "backwards" },
    );
    play(".forge-shade", [{ opacity: 0, transform: "scale(0.35)" }, { opacity: 0.85, transform: "scale(1.15)", offset: 0.9 }, { opacity: 0, transform: "scale(1.2)" }], { delay: HIT - 260, duration: 300 });
    // раскалённый оттиск остывает: белый, жёлтый, красный, бронза
    play(
      ".forge-hot",
      [
        { opacity: 0, filter: "brightness(1.6)" },
        { opacity: 1, filter: "brightness(1.6)", offset: 0.003 },
        { opacity: 0.95, filter: "brightness(1.1)", offset: 0.16 },
        { opacity: 0.6, filter: "brightness(0.85) saturate(1.3)", offset: 0.5 },
        { opacity: 0, filter: "brightness(0.55) saturate(1.4)" },
      ],
      { delay: HIT - 10, duration: 3600, easing: "cubic-bezier(0.2,0.6,0.35,1)", fill: "backwards" },
    );
    play(".forge-halo", [{ opacity: 0 }, { opacity: 1, offset: 0.04 }, { opacity: 0.35, offset: 0.4 }, { opacity: 0.14 }], { delay: HIT, duration: 4200, easing: "ease-out" });
    play(".forge-scorch", [{ opacity: 0, transform: "scale(0.9)" }, { opacity: 1, transform: "none" }], { delay: HIT, duration: 900, easing: "cubic-bezier(0.23,1,0.32,1)" });
    play(".forge-flash", [{ opacity: 0 }, { opacity: 0.55, offset: 0.12 }, { opacity: 0 }], { delay: HIT - 20, duration: 420, easing: "ease-out" });
    play(
      ".forge-shake",
      [
        { transform: "none" },
        { transform: "translate(-5px,9px) rotate(-0.3deg) scale(0.994)", offset: 0.1 },
        { transform: "translate(4px,-5px) rotate(0.22deg)", offset: 0.28 },
        { transform: "translate(-3px,3px)", offset: 0.48 },
        { transform: "translate(1px,-1px)", offset: 0.72 },
        { transform: "none" },
      ],
      { delay: HIT, duration: 430 },
    );
    // название прожигается слева направо
    play(".forge-word", [{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0% -20% 0)" }], { delay: WORD, duration: 760, easing: "cubic-bezier(0.45,0,0.3,1)", fill: "backwards" });
    play(".forge-word-hot", [{ opacity: 1 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { delay: WORD, duration: 2700, easing: "ease-out", fill: "backwards" });

    // ---------- canvas ----------
    const box = canvas.getBoundingClientRect();
    const small = box.width < 700;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 2 : 1.5); // тонкой линии на телефоне нужна чёткость
    const stage = $(".forge-tri").getBoundingClientRect();
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = stage.width / 600;
    const ox = stage.left - box.left;
    const oy = stage.top - box.top;
    const sparks: Spark[] = [];
    const puffs: Puff[] = [];

    const smoke = document.createElement("canvas");
    smoke.width = smoke.height = 128;
    const sx = smoke.getContext("2d")!;
    const sg = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sg.addColorStop(0, "rgba(190,165,140,0.5)");
    sg.addColorStop(0.5, "rgba(150,125,105,0.18)");
    sg.addColorStop(1, "rgba(120,100,85,0)");
    sx.fillStyle = sg;
    sx.fillRect(0, 0, 128, 128);

    const emit = (x: number, y: number, dir: number, spread: number, v0: number, v1: number, l0: number, l1: number, w: number) => {
      const a = dir + rnd(-spread, spread);
      const v = rnd(v0, v1);
      const life = rnd(l0, l1);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, w: rnd(0.5, 1) * w });
    };
    // линия реза от t0 до t1 вдоль контура
    const cut = (from: number, to: number, power: number) => {
      ctx.beginPath();
      const a = along(from);
      ctx.moveTo(ox + a.x * k, oy + a.y * k);
      let d = 0;
      for (let i = 0; i < 3; i++) {
        d += LEN[i] / TOTAL;
        if (d > from && d < to - 1e-4) ctx.lineTo(ox + EDGES[i][1][0] * k, oy + EDGES[i][1][1] * k);
      }
      if (from === 0 && to >= 1) ctx.closePath();
      else {
        const b = along(to);
        ctx.lineTo(ox + b.x * k, oy + b.y * k);
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "miter";
      ctx.globalAlpha = power;
      for (const [w, color] of BEAM) {
        ctx.lineWidth = w;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    // вытянутый блик на точке реза
    const streak = (x: number, y: number, len: number, w: number, alpha: number, vertical: boolean) => {
      const g = vertical ? ctx.createLinearGradient(x, y - len, x, y + len) : ctx.createLinearGradient(x - len, y, x + len, y);
      g.addColorStop(0, "rgba(255,170,80,0)");
      g.addColorStop(0.5, `rgba(255,246,226,${alpha})`);
      g.addColorStop(1, "rgba(255,170,80,0)");
      ctx.fillStyle = g;
      if (vertical) ctx.fillRect(x - w / 2, y - len, w, len * 2);
      else ctx.fillRect(x - len, y - w / 2, len * 2, w);
    };
    const burst = () => {
      const n = small ? 280 : 520;
      for (let i = 0; i < n; i++) {
        const p = along(Math.random());
        const dir = Math.atan2(p.ny, p.nx);
        // большая часть летит от контура наружу, часть скользит вдоль металла
        const fast = Math.random() < 0.3;
        emit(ox + p.x * k, oy + p.y * k, dir, fast ? 0.32 : 0.85, fast ? 420 : 110, (fast ? 1050 : 520) * (small ? 0.72 : 1), 0.35, fast ? 1.05 : 1.5, fast ? 3 : 2.1);
      }
      for (let i = 0; i < 16; i++) {
        const p = along(Math.random());
        const life = rnd(1.6, 3.2);
        puffs.push({ x: ox + p.x * k, y: oy + p.y * k, vx: p.nx * rnd(10, 34), vy: rnd(-46, -14), r: rnd(22, 52) * (small ? 0.7 : 1), life, max: life });
      }
    };

    let last = 0;
    let t0 = 0;
    let hit = false;
    let raf = 0;
    let acc = 0;
    let alive = true;
    const frame = (now: number) => {
      if (!alive) return;
      t0 ||= now;
      const t = now - t0;
      const dt = Math.min(0.034, (now - (last || now)) / 1000);
      last = now;
      ctx.clearRect(0, 0, box.width, box.height);

      // лазер: линия держится до удара и гаснет под падающей печатью
      const done = easeSine(Math.min(1, t / DRAW));
      const power = Math.min(1, (HIT + 20 - t) / 150);
      if (power > 0) {
        cut(0, done, power);
        if (t < DRAW) {
          // свежий участок за точкой реза ещё раскалён
          cut(Math.max(0, done - 0.035), done, 0.5);
          cut(Math.max(0, done - 0.012), done, 0.6);
        } else cut(0, 1, power * 0.8 * Math.max(0, 1 - (t - DRAW) / 320)); // контур замкнулся: вспышка
      }
      if (t < DRAW) {
        const p = along(done);
        const x = ox + p.x * k;
        const y = oy + p.y * k;
        // искры бьют назад, против хода лазера
        const back = Math.atan2(-p.nx, p.ny);
        acc += dt * (small ? 110 : 170);
        while (acc > 1) {
          acc--;
          const wild = Math.random() < 0.25;
          emit(x, y, back, wild ? 1.5 : 0.42, 60, wild ? 220 : 430, 0.14, 0.5, 0.95);
        }
        const flick = rnd(0.86, 1);
        const r = (small ? 22 : 34) * flick;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,250,1)");
        g.addColorStop(0.08, "rgba(255,244,214,0.95)");
        g.addColorStop(0.2, "rgba(255,180,84,0.34)");
        g.addColorStop(1, "rgba(255,110,20,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        streak(x, y, r * 2.3, 1.2, 0.9 * flick, false);
        streak(x, y, r * 1.1, 1, 0.6 * flick, true);
      }
      if (!hit && t >= HIT) {
        hit = true;
        burst();
      }
      // искры по фронту названия и последние угольки
      const w = t - WORD;
      if (w > 0 && w < 720) {
        const wr = $(".forge-word").getBoundingClientRect();
        acc += dt * 90;
        while (acc > 1) {
          acc--;
          emit(wr.left - box.left + wr.width * easeInOut(Math.min(1, w / 740)), wr.top - box.top + wr.height * rnd(0.05, 0.5), -1.2, 1.1, 40, 240, 0.25, 0.7, 1.2);
        }
      }
      if (t > HIT + 300 && t < HIT + 4200 && Math.random() < dt * 16) {
        const p = along(Math.random());
        const life = rnd(1.4, 2.8);
        sparks.push({ x: ox + p.x * k, y: oy + p.y * k, vx: rnd(-16, 16), vy: rnd(-46, -18), life, max: life, w: rnd(0.7, 1.4), ember: true });
      }

      ctx.globalCompositeOperation = "source-over";
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.life -= dt;
        if (p.life <= 0) {
          puffs.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = p.life / p.max;
        const r = p.r * (2.2 - a);
        ctx.globalAlpha = 0.34 * Math.sin(Math.PI * Math.min(1, (1 - a) * 1.05)) * a;
        ctx.drawImage(smoke, p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        if (s.ember) s.vx += rnd(-40, 40) * dt;
        else {
          s.vy += 820 * dt;
          const drag = Math.exp(-1.5 * dt);
          s.vx *= drag;
          s.vy *= drag;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = s.life / s.max;
        const tail = s.ember ? 0.02 : 0.036;
        const g = Math.round(90 + 160 * a);
        const b = Math.round(10 + 190 * Math.max(0, a - 0.45) * 1.8);
        ctx.strokeStyle = `rgba(255,${g},${b},${s.ember ? 0.75 * a : Math.min(1, a * 1.4)})`;
        ctx.lineWidth = s.w * (0.5 + 0.5 * a);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      if (t < HIT + 4300 || sparks.length || puffs.length) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, box.width, box.height);
    };
    raf = requestAnimationFrame(frame);
    host.dataset.on = "";
    stop.current = () => {
      alive = false;
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      ctx.clearRect(0, 0, box.width, box.height);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let gone = false;
    // ждём картинку логотипа, чтобы удар пришёлся на готовый оттиск
    const imgs = [...(root.current?.querySelectorAll("img") ?? [])];
    Promise.race([Promise.all(imgs.map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (!gone) run();
    });
    return () => {
      gone = true;
      stop.current();
    };
  }, [run]);

  return (
    <section ref={root} className="forge" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr">
        Main Place, новый лаунж-бар и кальянная в Куюках
      </h1>
      <div className="forge-shake">
        <div className="forge-metal" />
        <div className="forge-halo" />
        <button type="button" className="forge-stage" onClick={run} aria-label="Main Place. Показать анимацию ещё раз">
          <span className="forge-tri">
            <span className="forge-scorch" />
            <span className="forge-shade" />
            <span className="forge-mark">
              {/* eslint-disable-next-line @next/next/no-img-element -- нужен ровно этот файл, он же служит маской */}
              <img src="/mark-xl.webp" alt="" width={600} height={525} fetchPriority="high" />
            </span>
            <span className="forge-hot" />
          </span>
          <span className="forge-word">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/word.webp" alt="" width={910} height={246} fetchPriority="high" />
            <span className="forge-word-hot" />
          </span>
        </button>
      </div>
      <canvas ref={cv} className="forge-sparks" aria-hidden="true" />
      <div className="forge-flash" />
    </section>
  );
}
