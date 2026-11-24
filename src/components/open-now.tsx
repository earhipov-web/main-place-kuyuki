"use client";

import { useEffect, useState } from "react";
import { hh, openHours } from "@/lib/data";

/** Текущее время в Казани (UTC+3) как «местная» дата. */
export function kazanNow() {
  const n = new Date();
  return new Date(n.getTime() + (n.getTimezoneOffset() + 180) * 60_000);
}

function status(n: Date) {
  const h = n.getHours() + n.getMinutes() / 60;
  const yesterday = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
  // ночь на субботу или воскресенье: ещё идёт вчерашняя смена
  if (h + 24 < openHours(yesterday).to) return `Открыто до ${hh(openHours(yesterday).to)}`;
  const { from, to } = openHours(n);
  return h >= from ? `Открыто до ${hh(to)}` : `Откроемся в ${hh(from)}`;
}

export function OpenNow({ plain }: { plain?: boolean }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const tick = () => setText(status(kazanNow()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return <span className={plain ? undefined : "open-now"}>{text || " "}</span>;
}

const week = [
  { days: [1, 2, 3, 4], label: "Понедельник–четверг", hours: "14:00–00:00" },
  { days: [5, 6], label: "Пятница и суббота", hours: "14:00–01:00" },
  { days: [0], label: "Воскресенье", hours: "14:00–00:00" },
];

export function WeekHours() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- день известен только в браузере
    setDay(kazanNow().getDay());
  }, []);
  return (
    <table>
      <caption className="sr">Часы работы</caption>
      <tbody>
        {week.map((w) => (
          <tr key={w.label} data-today={day !== null && w.days.includes(day) ? "" : undefined}>
            <td>{w.label}</td>
            <td>{w.hours}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
