"use client";

import { useEffect } from "react";
import { loadWall, shatter } from "@/lib/shatter";

const MAX_AREA = 420_000; // сколько пикселей разламываем одновременно
const PATIENCE = 1500; // дольше этого фото не ждёт своей очереди на разлом, а просто проявляется

/**
 * Один наблюдатель на весь сайт. Элемент с data-rv получает data-in, когда до него долистали,
 * и data-done, когда анимация закончилась. Плиты с фото идут через очередь разломов.
 */
export function RevealRoot() {
  useEffect(() => {
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let busy = 0;
    let dead = false;
    const queue: { el: HTMLElement; since: number }[] = [];

    const pump = () => {
      if (dead) return;
      while (queue.length) {
        const box = queue[0].el.getBoundingClientRect();
        const area = box.width * box.height;
        if (busy > 0 && busy + area > MAX_AREA) break;
        const { el, since } = queue.shift()!;
        if (!el.isConnected) continue;
        if (performance.now() - since > PATIENCE) {
          el.dataset.in = "";
          later(() => (el.dataset.done = ""), 700);
          continue;
        }
        busy += area;
        shatter(
          el,
          () => {
            el.dataset.in = "";
            busy -= area;
            later(() => (el.dataset.done = ""), 900);
            pump();
          },
          el.dataset.speed ? Number(el.dataset.speed) : 1,
        );
      }
      // застоявшиеся в очереди не держим закрытыми
      for (let i = queue.length - 1; i >= 0; i--)
        if (performance.now() - queue[i].since > PATIENCE) {
          const [{ el }] = queue.splice(i, 1);
          el.dataset.in = "";
          later(() => (el.dataset.done = ""), 700);
        }
      if (queue.length) later(pump, 250);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          const d = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
          if (el.dataset.rv === "slab" && !calm) {
            later(() => {
              // фото должно быть готово к моменту, когда камень выломается
              const img = el.querySelector("img");
              Promise.race([Promise.all([loadWall(), img?.decode().catch(() => {})]), new Promise((ok) => setTimeout(ok, 1200))]).then(() => {
                queue.push({ el, since: performance.now() });
                pump();
              });
            }, d);
          } else {
            el.dataset.in = "";
            later(() => (el.dataset.done = ""), 1700 + d);
          }
        }
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.04 },
    );
    const scan = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-rv]:not([data-in])").forEach((el) => io.observe(el));
    loadWall();
    scan(document);
    const mo = new MutationObserver((list) => {
      for (const m of list)
        for (const n of m.addedNodes)
          if (n instanceof HTMLElement && n.tagName !== "CANVAS") {
            if (n.matches("[data-rv]:not([data-in])")) io.observe(n);
            scan(n);
          }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      dead = true;
      io.disconnect();
      mo.disconnect();
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);
  return null;
}
