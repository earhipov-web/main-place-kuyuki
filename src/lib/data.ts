// Всё содержимое сайта в одном месте: контакты, часы, меню, афиша, фото.
// Источник: карточка Main Place на Яндекс Картах, снята 24 ноября 2026.

export const place = {
  name: "Main Place",
  phone: "+7 967 360‑50‑50",
  phoneHref: "tel:+79673605050",
  address: "Куюки, Олимпийская улица, 9",
  addressNote: "Вход с левого торца здания, второй этаж",
  /** адрес из карточки Яндекса; сюда ведут все кнопки «Написать в Telegram» */
  telegram: "mainplace_kuyuki",
  instagram: "https://www.instagram.com/main.place_kuyuki",
  bonusUrl: "https://cabinet.statix-pro.ru/forms/mp1000",
  yandexUrl: "https://yandex.ru/maps/org/main_place/229718419334/",
  routeUrl: "https://yandex.ru/maps/?rtext=~55.722778,49.328193&rtt=auto",
  mapEmbed: "https://yandex.ru/map-widget/v1/?ll=49.328193%2C55.722778&z=16&pt=49.328193%2C55.722778%2Cpm2orgl",
};

/** Ссылка на чат в Telegram; text попадает в поле ввода, гостю остаётся отправить. */
export const telegramLink = (text?: string) =>
  `https://t.me/${place.telegram}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Часы работы: вс–чт 14:00–00:00, пт и сб 14:00–01:00. 25 = час ночи следующего дня. */
export function openHours(d: Date) {
  const day = d.getDay();
  return { from: 14, to: day === 5 || day === 6 ? 25 : 24 };
}
export const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

export const navLinks = [
  { href: "/", label: "Главная", short: "Главная" },
  { href: "/novoe", label: "Что нового", short: "Новое" },
  { href: "/menu", label: "Меню / Заказать", short: "Меню" },
  { href: "/booking", label: "Бронь", short: "Бронь" },
  { href: "/foto", label: "Фото", short: "Фото" },
];

// ---------- меню ----------

export type MenuItem = { id: string; name: string; price: number; img: string; note?: string };
export type MenuGroup = { id: string; title: string; items: MenuItem[] };

const it = (n: number, id: string, name: string, price: number, note?: string): MenuItem => ({
  id,
  name,
  price,
  img: `/menu/m${String(n).padStart(2, "0")}.webp`,
  note,
});

export const menu: MenuGroup[] = [
  {
    id: "burgers",
    title: "Бургеры",
    items: [
      it(1, "burger-main", "Фирменный бургер", 790),
      it(2, "burger-classic", "Классический бургер с соусом бигтейсти", 790),
      it(3, "burger-chicken", "Чикен бургер", 590),
    ],
  },
  {
    id: "snacks",
    title: "Закуски",
    items: [
      // брускетта, крылышки и карбонара: цены с постеров от 24 ноября, они новее карточки меню
      it(4, "bruschetta", "Брускетта с креветками", 450, "2 шт."),
      it(5, "popcorn", "Попкорн из креветок", 630),
      it(6, "wings", "Крылышки баффало", 390),
      it(7, "cheese-sticks", "Сырные палочки", 330),
      it(8, "shrimps", "Креветки магаданские", 790),
      it(9, "toasts", "Гренки", 180),
      it(10, "olives", "Оливки фри", 170),
      it(11, "cucumbers", "Битые огурцы", 130),
      it(12, "sweet-potato", "Батат фри", 250),
      it(13, "fries", "Картофель фри", 150),
      it(14, "wedges", "Картофель по-деревенски", 150),
      it(15, "beer-set", "Пивной сет", 1400),
    ],
  },
  {
    id: "salads",
    title: "Салаты",
    items: [
      it(16, "salad-shrimp", "Салат с креветками и авокадо", 690),
      it(17, "salad-veal", "Салат с телятиной", 590),
      it(18, "salad-asian", "Салат с курицей в азиатском стиле", 590),
      it(19, "salad-aubergine", "Салат с баклажанами", 390),
      it(20, "salad-beet", "Салат со свёклой и сыром фета", 390),
      it(21, "caesar-chicken", "Цезарь с курицей", 450),
      it(22, "caesar-shrimp", "Цезарь с креветками", 540),
      it(30, "salad-green", "Зелёный салат", 490),
    ],
  },
  {
    id: "hot",
    title: "Горячее",
    items: [
      it(23, "steak", "Стейк стриплойн", 1090),
      it(24, "pasta", "Паста с креветками и кальмарами", 680),
      it(25, "carbonara", "Татарская карбонара", 540),
      it(26, "chicken", "Куриная грудка с брокколи", 490),
      it(27, "cheeks", "Томлёные щёчки с картофельным пюре", 590),
    ],
  },
  {
    id: "soups",
    title: "Супы",
    items: [it(28, "borsch", "Борщ", 510), it(29, "ukha", "Уха", 740)],
  },
];

const byId = new Map(menu.flatMap((g) => g.items).map((i) => [i.id, i]));
export const itemById = (id: string) => byId.get(id);
export const rub = (n: number) => `${n.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;

// ---------- скидки ----------

export type DiscountId = "none" | "birthday" | "bonus";
export const BIRTHDAY_PERCENT = 15;
export const BONUS_RUB = 1000;

/** Сколько рублей скидка снимает с суммы заказа. */
export function discountOf(id: DiscountId, total: number) {
  if (id === "birthday") return Math.round((total * BIRTHDAY_PERCENT) / 100);
  if (id === "bonus") return Math.min(BONUS_RUB, total);
  return 0;
}

// ---------- афиша ----------

export type Poster = { img: string; w: number; h: number; alt: string };
export type AfishaEvent = {
  id: string;
  title: string;
  /** дата публикации на Яндексе */
  date?: string;
  text: string;
  /** первый постер показываем в списке, остальные открываются по нажатию */
  posters: Poster[];
  /** какую часть постера держать в кадре 3:4 */
  focus?: string;
  cta: { label: string; href: string; external?: boolean };
};

const p = (id: string, w: number, h: number, alt: string): Poster => ({ img: `/afisha/${id}.webp`, w, h, alt });

export const afisha: AfishaEvent[] = [
  {
    id: "gta",
    title: "GTA 6 в Main Place",
    date: "2026-11-24",
    text: "Играем в зале на большом экране. Диван напротив, кальян и еда на столе.",
    posters: [p("gta", 1000, 1333, "Постер Grand Theft Main Place: пара с кальяном играет в GTA 6 на диване")],
    cta: { label: "Занять зону PS5", href: "/booking?spot=ps5" },
  },
  {
    id: "birthday",
    title: "Минус 15% в день рождения",
    date: "2026-07-13",
    text: "Скидка действует за три дня до праздника и три дня после.",
    posters: [
      p("birthday", 938, 1442, "Постер: скидка 15% за три дня до и после дня рождения"),
      p("birthday-day", 1000, 1000, "Постер: минус 15% в день рождения, друзья с бенгальскими огнями"),
    ],
    focus: "50% 100%",
    cta: { label: "Забронировать стол", href: "/booking" },
  },
  {
    id: "ps5",
    title: "PlayStation 5",
    date: "2026-09-10",
    text: "Приставка стоит в зале, играть можно вдвоём и компанией.",
    posters: [p("ps5", 941, 1672, "Постер PS5: двое на диване играют в футбол на большом экране")],
    focus: "50% 30%",
    cta: { label: "Занять зону PS5", href: "/booking?spot=ps5" },
  },
  {
    id: "bonus",
    title: "1000 бонусов новым гостям",
    text: "Зарегистрируйтесь в программе лояльности и получите 1000 бонусных рублей. Один бонус равен рублю.",
    posters: [p("bonus", 800, 450, "Баннер: 1000 бонусов новым гостям")],
    cta: { label: "Получить бонусы", href: place.bonusUrl, external: true },
  },
  {
    id: "vip",
    title: "VIP-комната",
    date: "2026-07-13",
    text: "До 14 человек, свой свет и музыка, большой экран и приставка. Депозит после 18:00 от 5 000 ₽.",
    posters: [
      p("vip", 1000, 1333, "Постер VIP-комнаты: три подсвеченные панели над столом из слэба"),
      p("vip-terms", 1000, 1778, "Постер: условия и депозит VIP-комнаты"),
      p("vip-party", 1000, 1784, "Постер: VIP-комната для мини-корпоратива до 14–16 человек"),
    ],
    cta: { label: "Забронировать VIP", href: "/booking?spot=vip" },
  },
  {
    id: "opening",
    title: "Новое заведение в Куюках",
    text: "Постер с открытия. Посмотрите, как выглядит зал.",
    posters: [p("new-place", 1000, 1000, "Постер «Новое заведение в Куюках»")],
    cta: { label: "Фото зала", href: "/foto" },
  },
];

/** Постеры блюд: каждый ведёт прямо в корзину. */
export const dishPosters: { item: string; poster: Poster; focus?: string }[] = [
  { item: "wings", poster: p("wings", 1000, 1333, "Постер: крылышки баффало, 390 рублей") },
  { item: "carbonara", poster: p("carbonara", 1000, 1333, "Постер: татарская карбонара, 540 рублей") },
  { item: "bruschetta", poster: p("bruschetta", 1000, 1333, "Постер: брускетта с креветками, 450 рублей") },
  { item: "burger-chicken", poster: p("chicken-burger", 1000, 1000, "Постер: чикен бургер 590 рублей, картофель фри 150 рублей") },
];

export type Clip = { id: string; title: string };
export const clips: Clip[] = [
  { id: "v01", title: "День рождения в зале" },
  { id: "v03", title: "От входа до стола" },
  { id: "v04", title: "Вечер за приставкой" },
  { id: "v13", title: "Футбол на экране" },
  { id: "v06", title: "Стол у сланцевой стены" },
  { id: "v09", title: "«Когда у нас нет денег»" },
  { id: "v08", title: "Напитки, еда, атмосфера" },
  { id: "v14", title: "Экскурсия к открытию, июль" },
  { id: "v02", title: "Бармен собирает коктейль" },
  { id: "v07", title: "Коктейль с грейпфрутом" },
  { id: "v10", title: "Чай с лаймом и мятой" },
  { id: "v12", title: "Заваривают чай" },
  { id: "v05", title: "Салат с телятиной" },
  { id: "v11", title: "Салаты крупным планом" },
];

// ---------- фото зала ----------

export type Photo = { src: string; alt: string; caption: string; w: number; h: number };
const ph = (id: string, caption: string, alt: string, w: number, h: number): Photo => ({ src: `/photos/${id}.webp`, caption, alt, w, h });

export const photoGroups: { id: string; title: string; items: Photo[] }[] = [
  {
    id: "zal",
    title: "Зал и бар",
    items: [
      ph("bar", "Бар", "Барная стойка с подсветкой снизу, за ней полки с бутылками", 1000, 1264),
      ph("slate-sofas", "Сланцевая стена", "Круглый стол и диваны у стены из сланца со светящимися трещинами", 958, 1280),
      ph("slate-table", "Стол на компанию", "Длинный стол и диван у светящейся сланцевой стены", 958, 1280),
      ph("hall-dark", "Зал вечером", "Тёмный зал, вдали светится бар", 960, 1280),
      ph("hall-day", "Зал днём", "Кожаные кресла у стола, за ними бар", 720, 1280),
      ph("slate-day", "Сланец днём", "Светлые кресла у сланцевой стены при дневном свете", 960, 1280),
    ],
  },
  {
    id: "vip",
    title: "VIP-комната",
    items: [
      ph("vip", "Панели и слэб", "Три подсвеченные панели на стене VIP-комнаты и стол из слэба", 960, 1280),
      ph("vip-table", "Днём у окна", "Кальян и блюда на столе из слэба у окна", 960, 1280),
    ],
  },
  {
    id: "table",
    title: "Кальяны и стол",
    items: [
      ph("hookah-red", "Кальян", "Кальян на столе, позади красная подсветка стены", 960, 1280),
      ph("table-bar", "Ужин", "Стол с салатами и лимонадами, вдали барная стойка", 960, 1280),
      ph("tea", "Чай", "Чайник с ягодным чаем и чёрные чашки", 720, 1280),
      ph("table-food", "Горячее", "Блюда в чёрной посуде под лампой, вдали бар", 960, 1280),
    ],
  },
  {
    id: "enter",
    title: "Вход и зеркала",
    items: [
      ph("entrance", "Вход", "Вход с улицы, вывеска Main Place из ржавой стали", 960, 1280),
      ph("stairs", "Лестница с улицы", "Лестница в зал, подсвеченные панели и ваза с ветками", 958, 1280),
      ph("mirrors", "Зеркала", "Два овальных зеркала с подсветкой на кирпичной стене", 960, 1280),
      ph("slate-mirror", "Вход в зал", "Глыба сланца и зеркало в рамке с жёлтой подсветкой", 960, 1280),
      ph("mirror-vase", "Ваза с ветками", "Керамическая ваза с сухими ветками отражается в зеркале", 958, 1280),
      ph("washroom", "Зеркальная комната", "Девушка фотографируется у раковины между латунных решёток", 960, 1280),
    ],
  },
];
