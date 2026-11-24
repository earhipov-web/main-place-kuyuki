import type { Metadata } from "next";
import { Booking } from "@/components/booking";
import { Lift } from "@/components/bits";
import { place } from "@/lib/data";

export const metadata: Metadata = {
  title: "Бронь стола",
  description: "Бронь стола в Main Place на схеме зала: столы у окон и у сланцевой стены, бар, PlayStation 5 и VIP-комната.",
};

const notes = [
  { t: "Держим 15 минут", d: "Если опаздываете больше, предупредите, иначе стол отдадут." },
  { t: "VIP-комната", d: "До 14 человек. Депозит после 18:00: 5 000 ₽ с воскресенья по четверг, 10 000 ₽ в пятницу и субботу." },
  { t: "Отменить", d: `Позвоните ${place.phone} или напишите в Telegram.` },
];

export default function BookingPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <Lift as="h1" lines={["Бронь стола"]} />
        <p className="soft" data-rv="up">
          День, время, стол на схеме. Бронь открыта на 30 дней вперёд.
        </p>
      </div>
      <Booking />
      <div className="book-notes">
        {notes.map((n) => (
          <div key={n.t} data-rv="up">
            <h3>{n.t}</h3>
            <p className="soft">{n.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
