"use client";

import { photoGroups } from "@/lib/data";
import { Lift, Slab, type SlabShape } from "./bits";
import { useLightbox, type Media } from "./lightbox";

const shapes: SlabShape[] = ["d", "e", "f"];

export function PhotoGroups() {
  const open = useLightbox();
  return (
    <>
      {photoGroups.map((g) => {
        const media: Media[] = g.items.map((p) => ({ kind: "img", src: p.src, alt: p.alt, title: p.caption }));
        return (
          <section key={g.id} className="photo-group" aria-labelledby={`g-${g.id}`}>
            <Lift id={`g-${g.id}`} lines={[g.title]} />
            <ul className="photos">
              {g.items.map((p, i) => (
                <li key={p.src}>
                  <figure>
                    <Slab
                      as="button"
                      type="button"
                      s={shapes[i % 3]}
                      quiet
                      d={(i % 4) * 130}
                      src={p.src}
                      alt={p.alt}
                      sizes="(max-width: 819px) 33vw, 320px"
                      onClick={() => open(media, i)}
                    />
                    <figcaption>{p.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export function VipPics() {
  const open = useLightbox();
  const list: Media[] = photoGroups.find((g) => g.id === "vip")!.items.map((p) => ({ kind: "img", src: p.src, alt: p.alt, title: "VIP-комната" }));
  return (
    <div className="vip-pics">
      <Slab as="button" type="button" s="b" src={list[0].src} alt={list[0].alt} position="50% 40%" sizes="(max-width: 819px) 58vw, 30vw" onClick={() => open(list, 0)} />
      <Slab as="button" type="button" s="c" d={260} src={list[1].src} alt={list[1].alt} sizes="(max-width: 819px) 38vw, 20vw" onClick={() => open(list, 1)} />
    </div>
  );
}
