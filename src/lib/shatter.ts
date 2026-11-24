// Разлом стены перед фотографией. Поверх плиты кладём canvas с той же стеной, что и фон страницы:
// по ней бежит трещина с ветвями, сквозь неё разгорается свет, потом куски камня выламываются и падают,
// а под ними остаётся фото. После анимации canvas удаляется.

type P = [number, number];

const PAD = 26;
const LIGHT: [number, number, string][] = [
  // ширина, непрозрачность, цвет: от широкого мягкого света к тонкой раскалённой сердцевине
  [78, 0.03, "255,110,20"],
  [46, 0.045, "255,120,28"],
  [26, 0.055, "255,135,40"],
  [15, 0.09, "255,150,55"],
  [8, 0.15, "255,172,84"],
  [4, 0.32, "255,200,128"],
];

let wall: HTMLImageElement | null = null;
let wallReady: Promise<void> | null = null;
export function loadWall() {
  wallReady ??= new Promise((res) => {
    const i = new Image();
    i.onload = () => {
      wall = i;
      res();
    };
    i.onerror = () => res();
    i.src = "/wall.webp";
  });
  return wallReady;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Ломаная с дроблением пополам: крупные изломы, внутри них мелкие. */
function fractal(a: P, b: P, rough: number, depth: number): P[] {
  let pts: P[] = [a, b];
  for (let d = 0; d < depth; d++) {
    const out: P[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const o = gauss() * rough * len;
      out.push([(x1 + x2) / 2 - ((y2 - y1) / len) * o, (y1 + y2) / 2 + ((x2 - x1) / len) * o], [x2, y2]);
    }
    pts = out;
  }
  return pts;
}

type Branch = { at: number; side: -1 | 1; pts: P[] };
type Piece = { poly: P[]; rim: P[]; cx: number; cy: number; vx: number; vy: number; rot: number; delay: number; side: -1 | 1 };

function build(W: number, H: number) {
  const depth = H > 330 ? 6 : H > 190 ? 5 : 4;
  const top = W * rnd(0.36, 0.64);
  const main = fractal([top, -PAD], [W - top + W * rnd(-0.12, 0.12), H + PAD], 0.15, depth);
  const n = main.length - 1;
  const perSide = H > 330 ? 4 : H > 190 ? 3 : 2;
  const branches: Branch[] = [];
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < perSide; i++) {
      const at = Math.round(n * ((i + 0.5) / perSide + rnd(-0.28, 0.28) / perSide + (side > 0 ? 0.06 : -0.04)));
      const k = Math.min(n - 2, Math.max(2, at));
      const [x, y] = main[k];
      const ex = side < 0 ? -PAD : W + PAD;
      branches.push({ at: k, side, pts: fractal([x, y], [ex, y + rnd(-0.22, 0.3) * H], 0.14, depth - 1) });
    }
  }
  const pieces: Piece[] = [];
  for (const side of [-1, 1] as const) {
    const bs = branches.filter((b) => b.side === side).sort((a, b) => a.at - b.at);
    const ex = side < 0 ? -PAD : W + PAD;
    for (let i = 0; i <= bs.length; i++) {
      const up = bs[i - 1];
      const dn = bs[i];
      const from = up ? up.at : 0;
      const to = dn ? dn.at : n;
      const poly: P[] = main.slice(from, to + 1);
      poly.push(...(dn ? dn.pts.slice(1) : ([[ex, H + PAD]] as P[])));
      poly.push(...(up ? [...up.pts].reverse() : ([[ex, -PAD]] as P[])));
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
      const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const mid = Math.abs(cy / H - 0.5) * 2;
      const rim = [...(up ? [...up.pts].reverse() : []), ...main.slice(from, to + 1), ...(dn ? dn.pts : [])];
      pieces.push({ poly, rim, cx, cy, side, vx: side * W * rnd(0.3, 0.55), vy: H * rnd(0.04, 0.2), rot: side * rnd(0.05, 0.24), delay: mid * 0.16 + rnd(0, 0.1) });
    }
  }
  // короткие волосяные трещины без обломков
  const hairs = Array.from({ length: perSide * 2 }, () => {
    const k = Math.round(rnd(0.1, 0.9) * n);
    const [x, y] = main[k];
    const a = rnd(-0.9, 0.9) + (Math.random() < 0.5 ? 0 : Math.PI);
    const L = W * rnd(0.1, 0.26);
    return { at: k, pts: fractal([x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L], 0.18, 3) };
  });
  return { main, branches, pieces, hairs };
}

function trace(c: CanvasRenderingContext2D, pts: P[], upto = 1) {
  const m = (pts.length - 1) * upto;
  const k = Math.floor(m);
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= k; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (k < pts.length - 1) {
    const f = m - k;
    c.lineTo(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f);
  }
}
function shape(c: CanvasRenderingContext2D, poly: P[]) {
  c.beginPath();
  poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

/** Свет вдоль линии: слои складываются, поэтому край мягкий, без резкой границы. */
function glow(c: CanvasRenderingContext2D, pts: P[], upto: number, power: number, s: number) {
  c.globalCompositeOperation = "lighter";
  c.lineJoin = c.lineCap = "round";
  for (const [w, a, rgb] of LIGHT) {
    trace(c, pts, upto);
    c.lineWidth = w * s;
    c.strokeStyle = `rgba(${rgb},${a * power})`;
    c.stroke();
  }
  c.globalCompositeOperation = "source-over";
}

/** Сердцевина разной толщины: к концу трещина сходит на нет. */
function core(c: CanvasRenderingContext2D, pts: P[], upto: number, w: number, power: number) {
  const n = Math.max(1, Math.floor((pts.length - 1) * upto));
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  c.strokeStyle = `rgba(255,238,212,${0.85 * power})`;
  for (let i = 1; i <= n; i++) {
    const t = i / (pts.length - 1);
    c.lineWidth = Math.max(0.35, w * (0.55 + 0.45 * Math.sin(i * 1.7)) * (1 - Math.max(0, t / upto - 0.7) * 2.6));
    c.beginPath();
    c.moveTo(pts[i - 1][0], pts[i - 1][1]);
    c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
  }
  c.globalCompositeOperation = "source-over";
}

export function shatter(slab: HTMLElement, done: () => void, speed = 1) {
  const face = slab.querySelector<HTMLElement>(".slab-face");
  const rect = face?.getBoundingClientRect();
  if (!face || !rect || !wall || rect.width < 40) return done();
  const W = rect.width;
  const H = rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, W * H > 160_000 ? 1 : 1.5);
  const cv = document.createElement("canvas");
  cv.className = "slab-break";
  cv.width = Math.round((W + PAD * 2) * dpr);
  cv.height = Math.round((H + PAD * 2) * dpr);
  cv.style.cssText = `left:${-PAD}px;top:${-PAD}px;width:${W + PAD * 2}px;height:${H + PAD * 2}px`;
  const ctx = cv.getContext("2d");
  if (!ctx) return done();

  const s = Math.min(1.15, Math.max(0.42, W / 300));
  const { main, branches, pieces, hairs } = build(W, H);
  const layer = () => {
    const l = document.createElement("canvas");
    l.width = cv.width;
    l.height = cv.height;
    const c = l.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
    return [l, c] as const;
  };

  // стена совпадает с фоном страницы плитка в плитку: до первой трещины её не видно
  const docX = rect.left + window.scrollX;
  const docY = rect.top + window.scrollY;
  const ox = (document.documentElement.clientWidth - 800) / 2 - docX;
  const oy = -docY;
  const tile = (c: CanvasRenderingContext2D) => {
    const x0 = (((ox + PAD) % 800) + 800) % 800 - 800 - PAD;
    const y0 = (((oy + PAD) % 800) + 800) % 800 - 800 - PAD;
    for (let x = x0; x < W + PAD; x += 800) for (let y = y0; y < H + PAD; y += 800) c.drawImage(wall!, x, y, 800, 800);
  };
  const [stone, st] = layer();
  st.save();
  st.beginPath();
  st.rect(0, 0, W, H);
  st.clip();
  tile(st);
  st.restore();

  // мягкий край: свет за пределами фото сходит на нет, соседние подписи не закрываются
  const [feather, ft] = layer();
  const soft = (c: CanvasRenderingContext2D, from: number, to: number) => {
    const cut = (x0: number, y0: number, x1: number, y1: number, x: number, y: number, w: number, h: number) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
    };
    c.save();
    c.globalCompositeOperation = "destination-out";
    const X = W + PAD;
    const Y = H + PAD;
    const all = (v: number) => v + PAD;
    cut(-to, 0, -from, 0, -PAD, -PAD, all(-from), all(Y));
    cut(W + to, 0, W + from, 0, W + from, -PAD, X - W - from, all(Y));
    cut(0, -to, 0, -from, -PAD, -PAD, all(X), all(-from));
    cut(0, H + to, 0, H + from, -PAD, H + from, all(X), Y - H - from);
    c.restore();
  };
  ft.fillStyle = "#000";
  ft.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
  soft(ft, 2, PAD);

  // та же стена, освещённая изнутри трещины
  const [lit, lt] = layer();
  tile(lt);
  lt.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    lt.setTransform(1, 0, 0, 1, 0, 0);
    lt.drawImage(lit, 0, 0);
  }
  lt.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
  lt.globalCompositeOperation = "multiply";
  lt.fillStyle = "#ffbe82";
  lt.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
  const [mask, mk] = layer();
  mk.lineJoin = mk.lineCap = "round";
  for (const [w, a] of [[0.9, 0.1], [0.6, 0.14], [0.38, 0.18], [0.22, 0.24], [0.1, 0.34]]) {
    mk.strokeStyle = `rgba(0,0,0,${a})`;
    mk.lineWidth = w * Math.min(W, 420);
    trace(mk, main);
    mk.stroke();
    mk.lineWidth *= 0.4;
    for (const b of branches) {
      trace(mk, b.pts);
      mk.stroke();
    }
  }
  lt.globalCompositeOperation = "destination-in";
  lt.setTransform(1, 0, 0, 1, 0, 0);
  lt.drawImage(mask, 0, 0);
  lt.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
  soft(lt, -18 * s, 0);

  // вся трещина со светом рисуется один раз; дальше каждый кадр только открывает её маской
  const [full, fl] = layer();
  glow(fl, main, 1, 1, s);
  for (const b of branches) glow(fl, b.pts, 1, 0.62, s * 0.62);
  for (const h of hairs) core(fl, h.pts, 1, 0.9 * s, 0.4);
  for (const b of branches) core(fl, b.pts, 1, 1.7 * s, 0.8);
  core(fl, main, 1, 3 * s, 1);
  const [shown, sh] = layer();

  const chips = Array.from({ length: Math.round(8 + 10 * s) }, () => {
    const [x, y] = main[Math.floor(Math.random() * main.length)];
    return { x, y, vx: rnd(-0.5, 0.5) * W, vy: rnd(-0.35, 0.1) * H, r: rnd(0.8, 3.2) * s, hot: Math.random() < 0.45, d: rnd(0, 0.25) };
  });

  slab.dataset.breaking = "";
  slab.appendChild(cv);
  const img = face.querySelector<HTMLElement>("img");

  const T1 = 720 / speed; // трещина бежит
  const T2 = 1000 / speed; // камень выламывается
  let t0 = 0;
  let opened = false;
  let frames = 0;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    cv.remove();
    delete slab.dataset.breaking;
    slab.dataset.in = "";
    done();
  };
  const fail = window.setTimeout(end, 5200 / speed);

  const drawCover = (c: CanvasRenderingContext2D, power: number, a = 1) => {
    c.drawImage(stone, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
    c.globalAlpha = power * a;
    c.drawImage(lit, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
    c.globalAlpha = 1;
  };
  const drawCracks = (c: CanvasRenderingContext2D, power: number) => {
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = power;
    c.drawImage(full, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  };
  const growCracks = (c: CanvasRenderingContext2D, g: number, power: number) => {
    const n = main.length - 1;
    sh.globalCompositeOperation = "source-over";
    sh.clearRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
    sh.lineJoin = sh.lineCap = "round";
    // мягкий конец: широкая бледная кисть и узкая плотная
    for (const [w, al] of [[92, 0.45], [54, 0.6], [26, 1]]) {
      sh.strokeStyle = `rgba(0,0,0,${al})`;
      sh.lineWidth = w * s;
      trace(sh, main, g);
      sh.stroke();
      sh.lineWidth = w * 0.6 * s;
      for (const b of branches) {
        const p = clamp((g - b.at / n) / 0.42);
        if (p > 0) {
          trace(sh, b.pts, easeOut(p));
          sh.stroke();
        }
      }
      for (const h of hairs) {
        const p = clamp((g - h.at / n) / 0.3);
        if (p > 0 && w === 26) {
          trace(sh, h.pts, easeOut(p));
          sh.stroke();
        }
      }
    }
    sh.globalCompositeOperation = "source-in";
    sh.drawImage(full, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = power;
    c.drawImage(shown, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  };

  const frame = (now: number) => {
    if (ended) return;
    if (!slab.isConnected) {
      clearTimeout(fail);
      return end();
    }
    t0 ||= now;
    const t = now - t0;
    // слабое устройство не успевает рисовать: не мучаем, просто проявляем фото
    if (++frames < 5 && t > 900) {
      clearTimeout(fail);
      return end();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);

    if (t < T1) {
      const k = t / T1;
      // трещина идёт рывками: толчок, пауза, толчок
      const g = clamp(0.34 * easeOut(clamp(k / 0.3)) + 0.3 * easeOut(clamp((k - 0.34) / 0.22)) + 0.36 * easeOut(clamp((k - 0.6) / 0.3)));
      const power = 0.35 + 0.65 * k * k;
      drawCover(ctx, 0.12 + 0.78 * k * k);
      growCracks(ctx, g, power);
    } else {
      const k = (t - T1) / T2;
      if (k >= 1) {
        clearTimeout(fail);
        return end();
      }
      if (!opened) {
        opened = true;
        slab.dataset.in = "";
        img?.animate(
          [
            { filter: "brightness(2.6) sepia(0.7) saturate(1.5)", transform: "scale(1.1)" },
            { filter: "brightness(1.35) sepia(0.25) saturate(1.15)", transform: "scale(1.035)", offset: 0.55 },
            { filter: "none", transform: "none" },
          ],
          { duration: T2 * 1.25, easing: "cubic-bezier(0.23,1,0.32,1)" },
        );
      }
      // свет, который хлынул в разлом
      const flood = (1 - clamp(k / 0.85)) ** 1.6;
      ctx.globalCompositeOperation = "lighter";
      const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.72);
      gr.addColorStop(0, `rgba(255,196,120,${0.5 * flood})`);
      gr.addColorStop(0.45, `rgba(255,140,50,${0.24 * flood})`);
      gr.addColorStop(1, "rgba(255,110,20,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      const cover = 0.9;
      for (const p of pieces) {
        const q = clamp((k - p.delay * 0.5) / (1 - p.delay * 0.5));
        // сначала куски чуть расходятся под напором, потом срываются
        const strain = easeOut(clamp(q / 0.22)) * 0.07;
        const fly = clamp((q - 0.16) / 0.84);
        const f = fly * fly * (1.7 - 0.7 * fly);
        const a = 1 - clamp((fly - 0.38) / 0.5);
        if (a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.cx + p.vx * (strain + f), p.cy + p.vy * strain + (p.vy + H * 0.55 * fly) * f);
        ctx.rotate(p.rot * f);
        const sc = 1 - 0.2 * f;
        ctx.scale(sc, sc);
        ctx.translate(-p.cx, -p.cy);
        // толщина камня: нижний слой виден у внутреннего края
        const th = (2 + 7 * clamp(q / 0.5)) * s;
        ctx.beginPath();
        ctx.rect(-th, -th, W + th * 2, H + th * 2);
        ctx.clip();
        ctx.save();
        ctx.translate(-p.side * th * 0.75, th * 0.5);
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        shape(ctx, p.poly);
        const eg = ctx.createLinearGradient(p.side < 0 ? p.cx : p.cx, 0, W / 2, 0);
        eg.addColorStop(0, "#150c06");
        eg.addColorStop(1, `rgb(${Math.round(190 - 120 * fly)},${Math.round(104 - 66 * fly)},${Math.round(44 - 28 * fly)})`);
        ctx.fillStyle = eg;
        ctx.fill();
        ctx.restore();
        ctx.save();
        shape(ctx, p.poly);
        ctx.clip();
        drawCover(ctx, 0.9, a);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * (1 - fly) * (1 - 0.75 * fly) * 0.8;
        ctx.drawImage(full, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
        ctx.restore();
        ctx.globalAlpha = a * (0.75 - 0.6 * fly) * cover;
        trace(ctx, p.rim);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,186,110,0.55)";
        ctx.stroke();
        ctx.restore();
      }

      // раскалённая щель не гаснет рывком, а остывает, пока куски расходятся
      const cool = (1 - clamp(k / 0.34)) ** 1.5;
      if (cool > 0.01) drawCracks(ctx, cool);

      // крошка и искры
      for (const c of chips) {
        const q = clamp((k - c.d) / 0.7);
        if (q <= 0 || q >= 1) continue;
        const x = c.x + c.vx * q;
        const y = c.y + c.vy * q + H * 0.75 * q * q;
        ctx.globalAlpha = 1 - q;
        ctx.globalCompositeOperation = c.hot ? "lighter" : "source-over";
        ctx.fillStyle = c.hot ? `rgb(255,${Math.round(200 - 110 * q)},${Math.round(120 - 110 * q)})` : "#3a2a1d";
        ctx.beginPath();
        ctx.moveTo(x - c.r, y);
        ctx.lineTo(x, y - c.r * 0.8);
        ctx.lineTo(x + c.r, y + c.r * 0.2);
        ctx.lineTo(x - c.r * 0.2, y + c.r);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(feather, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
