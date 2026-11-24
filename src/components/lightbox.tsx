"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { IconClose, IconLeft, IconRight } from "./bits";

export type Media = { kind: "img" | "video"; src: string; alt: string; title?: string; poster?: string };

const Ctx = createContext<(items: Media[], index: number) => void>(() => {});
export const useLightbox = () => useContext(Ctx);

export function LightboxProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Media[]>([]);
  const [i, setI] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);

  const open = useCallback((list: Media[], index: number) => {
    setItems(list);
    setI(index);
    ref.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  }, []);

  const go = useCallback((d: number) => setI((v) => Math.min(items.length - 1, Math.max(0, v + d))), [items.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    el.addEventListener("keydown", key);
    return () => el.removeEventListener("keydown", key);
  }, [go]);

  const onClose = () => {
    document.documentElement.style.overflow = "";
    setItems([]);
  };
  const close = () => ref.current?.close();
  const m = items[i];

  return (
    <Ctx.Provider value={open}>
      {children}
      <dialog ref={ref} className="lb" onClose={onClose} aria-label="Просмотр">
        {m && (
          <>
            <div className="lb-bar">
              <span>
                {m.title ?? m.alt}
                {items.length > 1 && (
                  <span className="soft num">
                    {" "}
                    {i + 1} из {items.length}
                  </span>
                )}
              </span>
              <button type="button" className="ico" onClick={close} aria-label="Закрыть" autoFocus>
                <IconClose />
              </button>
            </div>
            <div
              className="lb-stage"
              onClick={(e) => e.target === e.currentTarget && close()}
              onPointerDown={(e) => {
                start.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                const s = start.current;
                start.current = null;
                if (!s || (e.target as HTMLElement).tagName === "VIDEO") return;
                const dx = e.clientX - s.x;
                if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
              }}
            >
              {m.kind === "video" ? (
                <video key={m.src} src={m.src} poster={m.poster} controls autoPlay playsInline aria-label={m.alt} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- в просмотре показываем исходник целиком
                <img key={m.src} src={m.src} alt={m.alt} draggable={false} />
              )}
            </div>
            <div className="lb-nav">
              {items.length > 1 && (
                <>
                  <button type="button" className="ico" onClick={() => go(-1)} disabled={i === 0} aria-label="Назад">
                    <IconLeft />
                  </button>
                  <button type="button" className="ico" onClick={() => go(1)} disabled={i === items.length - 1} aria-label="Вперёд">
                    <IconRight />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </dialog>
    </Ctx.Provider>
  );
}
