import Link from "next/link";
import { EventCard } from "@/components/afisha";
import { Crack, Lift } from "@/components/bits";
import { Forge } from "@/components/forge";
import { LiveReviews } from "@/components/live-reviews";
import { WeekHours } from "@/components/open-now";
import { VipPics } from "@/components/photo-wall";
import { afisha, place, telegramLink } from "@/lib/data";

const facts = [
  { t: "Кухня", d: "Европейская: бургеры, салаты, паста, стейк, супы" },
  { t: "Кальяны", d: "Фирменные, в зале мощная вытяжка" },
  { t: "Экран и PS5", d: "Спортивные трансляции и приставка для гостей" },
  { t: "С собой и домой", d: "Есть доставка и еда навынос" },
  { t: "С собакой", d: "Можно, если она не выше 35 см" },
  { t: "С ноутбуком", d: "Wi-Fi есть, работать за столом можно" },
  { t: "Оплата", d: "Карта, наличные, скидочная программа" },
  { t: "Доступность", d: "Второй этаж, на коляске не заехать. Есть кнопка вызова персонала и места на парковке" },
];

export default function Home() {
  return (
    <>
      <Forge />

      <section className="wrap section" aria-labelledby="about-title">
        <div className="about">
          <div>
            <Lift id="about-title" lines={["Что у нас есть"]} />
            <dl className="facts" data-rv="up">
              {facts.map((f) => (
                <div key={f.t}>
                  <dt>{f.t}</dt>
                  <dd>{f.d}</dd>
                </div>
              ))}
            </dl>
            <div className="about-cta" data-rv="up">
              <Link href="/booking" className="btn btn-plate">
                Забронировать
              </Link>
              <Link href="/foto" className="btn btn-line">
                Фото заведения
              </Link>
            </div>
          </div>
          <div className="hours" data-rv="right">
            <h3>Часы работы</h3>
            <WeekHours />
            <p className="where">
              {place.address}
              <br />
              <span className="soft">{place.addressNote}</span>
              <br />
              <a className="link num" href={place.phoneHref}>
                {place.phone}
              </a>
            </p>
            <a className="btn btn-line" href={place.routeUrl} target="_blank" rel="noopener noreferrer">
              Построить маршрут
            </a>
          </div>
        </div>
      </section>

      <Crack />

      <section className="wrap section" aria-labelledby="vip-title">
        <div className="vip">
          <VipPics />
          <div>
            <Lift id="vip-title" lines={["VIP-комната"]} />
            <ul data-rv="right">
              <li>До 14 человек за общим столом из слэба</li>
              <li>Свет и музыку настраиваете сами</li>
              <li>Большой экран для фильмов, трансляций и клипов, приставка</li>
              <li>
                Депозит после 18:00: <b className="num">5 000 ₽</b> с воскресенья по четверг, <b className="num">10 000 ₽</b> в пятницу и субботу
              </li>
            </ul>
            <Link href="/booking?spot=vip" className="btn btn-plate" data-rv="up">
              Забронировать VIP
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap" aria-labelledby="new-title">
        <div className="row-head">
          <Lift id="new-title" lines={["Что нового"]} />
          <Link href="/novoe" className="link">
            Вся афиша и видео
          </Link>
        </div>
        <ul className="cards">
          {afisha.slice(0, 2).map((e, i) => (
            <EventCard key={e.id} e={e} d={i * 80} />
          ))}
        </ul>
      </section>

      <div style={{ marginTop: "var(--section)" }}>
        <Crack flip />
      </div>

      <section className="wrap section" aria-labelledby="reviews-title">
        <LiveReviews />
      </section>

      <section className="wrap" aria-labelledby="contacts-title">
        <div className="contacts">
          <div className="contacts-text">
            <Lift id="contacts-title" lines={["Как нас найти"]} />
            <ul data-rv="up">
              <li>
                {place.address}
                <br />
                <span className="soft">{place.addressNote}</span>
              </li>
              <li>
                <a className="link num" href={place.phoneHref}>
                  {place.phone}
                </a>
              </li>
              <li>
                <a className="link" href={telegramLink()} target="_blank" rel="noopener noreferrer">
                  Чат в Telegram
                </a>
              </li>
              <li className="soft">Остановка «Восточные Салмачи» в 186 метрах, рядом парковка</li>
            </ul>
          </div>
          <iframe src={place.mapEmbed} title="Main Place на Яндекс Картах" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>
    </>
  );
}
