export const cleanText = (s: string, max: number) => s.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

/** 11 цифр, начиная с 7, или null */
export const phoneDigits = (s: string) => {
  const d = s.replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) return "7" + d.slice(1);
  if (d.length === 10 && d[0] === "9") return "7" + d;
  return null;
};

export const formatPhone = (d: string) => `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
