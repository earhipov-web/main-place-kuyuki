import Image from "next/image";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { CRACK } from "@/lib/crack-path";

export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Заголовок, строки которого поднимаются из щели. */
export function Lift({ as: Tag = "h2", lines, id, d = 0 }: { as?: ElementType; lines: string[]; id?: string; d?: number }) {
  return (
    <Tag id={id} data-rv="lift" style={delay(d)}>
      {lines.map((l, i) => (
        <span className="lift" key={l}>
          <span style={{ "--n": i } as CSSProperties}>{i < lines.length - 1 ? `${l} ` : l}</span>
        </span>
      ))}
    </Tag>
  );
}

export type SlabShape = "a" | "b" | "c" | "d" | "e" | "f";

/** Плита с колотым краем. Внутри фото, за краем свет. */
export function Slab({
  as: Tag = "span",
  s = "d",
  quiet,
  still,
  d = 0,
  cap,
  src,
  alt,
  sizes,
  position,
  priority,
  children,
  className = "",
  style,
  ...rest
}: {
  as?: ElementType;
  s?: SlabShape;
  quiet?: boolean;
  still?: boolean;
  d?: number;
  cap?: string;
  src: string;
  alt: string;
  sizes: string;
  position?: string;
  priority?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [k: string]: unknown;
}) {
  return (
    <Tag className={`slab ${quiet ? "slab-quiet" : ""} ${className}`} data-s={s} data-rv={still ? undefined : "slab"} style={{ ...delay(d), ...style }} {...rest}>
      <span className="slab-face" data-cap={cap}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover", objectPosition: position }} />
        {children}
      </span>
    </Tag>
  );
}

/** Светящаяся трещина между разделами: широкий мягкий свет, тёплая кромка и тонкая сердцевина. */
export function Crack({ flip }: { flip?: boolean }) {
  return (
    <div className="crack" data-rv="crack" aria-hidden="true">
      <svg viewBox="0 0 1600 130" preserveAspectRatio="xMidYMid slice" style={flip ? { scale: "-1 1" } : undefined}>
        <path className="crack-far" d={CRACK} />
        <path className="crack-near" d={CRACK} />
        <path className="crack-core" d={CRACK} />
      </svg>
    </div>
  );
}

// ---------- иконки (круглые концы линий и мягкие углы) ----------

const I = ({ children, ...p }: { children: ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="20" height="20" {...p}>
    {children}
  </svg>
);
export const IconHome = () => (
  <I>
    <path d="M4 11.2c0-.8.4-1.500 1-2l5.400-4.500a2.500 2.500 0 0 1 3.200 0L19 9.200c.6.500 1 1.200 1 2V17a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5.800Z" />
    <path d="M9.800 20v-3.800a2.200 2.200 0 0 1 4.400 0V20" />
  </I>
);
export const IconNew = () => (
  <I>
    <path d="M6 5h12a2.500 2.500 0 0 1 2.500 2.500v2a2.500 2.500 0 0 0 0 5v2A2.500 2.500 0 0 1 18 19H6a2.500 2.500 0 0 1-2.500-2.500v-2a2.500 2.500 0 0 0 0-5v-2A2.500 2.500 0 0 1 6 5Z" />
    <path d="M9.500 9.500h5M9.500 14.500h3" />
  </I>
);
export const IconMenu = () => (
  <I>
    <path d="M7.500 3.500v17M4.500 3.500v4a3 3 0 0 0 6 0v-4" />
    <path d="M17 20.500v-17c-2.300 1-3.500 3.600-3.500 6.500 0 2 1.300 3.200 3.500 3.200" />
  </I>
);
export const IconBook = () => (
  <I>
    <rect x="3.500" y="5" width="17" height="15.500" rx="4" />
    <path d="M8 3v3.500M16 3v3.500M3.800 10h16.400" />
    <path d="m9.300 15 1.900 1.900 3.600-3.600" />
  </I>
);
export const IconPhoto = () => (
  <I>
    <rect x="3.500" y="4.500" width="17" height="15" rx="4" />
    <circle cx="9" cy="10" r="1.700" />
    <path d="m4.500 17 3.800-3.200a2 2 0 0 1 2.600.1l1.600 1.500 2.300-2.300a2 2 0 0 1 2.800 0l2.700 2.700" />
  </I>
);
export const IconCart = () => (
  <I>
    <path d="M5.200 8.500h13.600a1 1 0 0 1 1 1.100l-.9 8.200a3 3 0 0 1-3 2.700H8.100a3 3 0 0 1-3-2.700l-.9-8.200a1 1 0 0 1 1-1.100Z" />
    <path d="M8.500 8.500V7a3.500 3.500 0 0 1 7 0v1.500" />
  </I>
);
export const IconPlus = () => (
  <I>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconMinus = () => (
  <I>
    <path d="M5 12h14" />
  </I>
);
export const IconLeft = () => (
  <I>
    <path d="m15 5-7 7 7 7" />
  </I>
);
export const IconRight = () => (
  <I>
    <path d="m9 5 7 7-7 7" />
  </I>
);
export const IconClose = () => (
  <I>
    <path d="M5 5l14 14M19 5 5 19" />
  </I>
);
export const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3.5v17L21 12 6 3.5Z" fill="currentColor" />
  </svg>
);
export const IconTelegram = () => (
  <I>
    <path d="M19.600 4.700 3.900 10.800c-.9.3-.9 1.600 0 1.900l3.900 1.300 1.500 4.600c.3.8 1.300 1 1.900.4l2.100-2.100 3.900 2.900c.6.500 1.600.1 1.800-.7l2.600-12.900c.2-1-.9-1.900-2-1.500Z" />
    <path d="m8 14 7.500-5-5.300 6.200" />
  </I>
);
export const IconGithub = () => (
  <I>
    <path d="M9.500 20.500v-2.700c-3.200.7-3.900-1.400-3.900-1.400M14.500 20.500v-3.300c0-.9-.3-1.500-.7-1.900 2.600-.3 5-1.400 5-5.400 0-1.100-.4-2.100-1.100-2.900.2-.8.2-1.700-.1-2.500 0 0-1.100-.1-2.900 1.300a9.800 9.800 0 0 0-5.400 0C7.500 4.400 6.400 4.500 6.400 4.500c-.3.800-.3 1.700-.1 2.500-.7.800-1.100 1.800-1.100 2.900 0 4 2.400 5.100 5 5.400-.4.4-.7 1-.7 1.900" />
  </I>
);
export const IconStar = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" className={off ? "off" : undefined} aria-hidden="true">
    <path fill="currentColor" d="m12 1.800 3 6.900 7.400.6-5.600 4.900 1.700 7.300L12 17.600l-6.500 3.900 1.700-7.300L1.600 9.300 9 8.700l3-6.900Z" />
  </svg>
);
