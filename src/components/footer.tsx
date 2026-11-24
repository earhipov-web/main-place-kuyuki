import Image from "next/image";
import { place, telegramLink } from "@/lib/data";
import { IconGithub, IconTelegram } from "./bits";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <Image src="/logo.webp" alt="Main Place" width={640} height={580} sizes="120px" />
        <ul className="small">
          <li>
            <a className="link" href={place.phoneHref}>
              {place.phone}
            </a>
          </li>
          <li>
            <a className="link" href={telegramLink()} target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
          </li>
          <li>
            <a className="link" href={place.yandexUrl} target="_blank" rel="noopener noreferrer">
              Яндекс Карты
            </a>
          </li>
        </ul>
        <p className="small soft">
          {place.address}. Кальяны и алкоголь с 18 лет.
          <br />
          ООО «Мейн Плейс», ИНН 1684019168
        </p>
      </div>
      <p className="wrap made small">
        <span>Сайт сделал</span>
        <a className="made-link" href="https://t.me/bbluora" target="_blank" rel="noopener noreferrer">
          <IconTelegram /> Telegram: @bbluora
        </a>
        <a className="made-link" href="https://github.com/earhipov-web" target="_blank" rel="noopener noreferrer">
          <IconGithub /> GitHub: earhipov-web
        </a>
      </p>
    </footer>
  );
}
