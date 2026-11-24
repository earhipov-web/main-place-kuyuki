import type { Metadata, Viewport } from "next";
import { Lora, Nunito } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Footer } from "@/components/footer";
import { LightboxProvider } from "@/components/lightbox";
import { RevealRoot } from "@/components/reveal";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

// Заголовки и цены: мягкая антиква с плавными штрихами, без игольчатых засечек
const serif = Lora({ variable: "--font-serif", subsets: ["latin", "cyrillic"], weight: ["400", "500"], display: "swap" });
// Текст и кнопки: гротеск со скруглёнными концами букв, спокойно читается на тёмном
const sans = Nunito({ variable: "--font-sans", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Main Place, лаунж-бар и кальянная в Куюках", template: "%s | Main Place" },
  description:
    "Кальяны, кухня и бар в Куюках, Олимпийская, 9. Меню с заказом онлайн, бронь стола на схеме зала, VIP-комната и PlayStation 5.",
  icons: { icon: "/mark.webp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070403",
  colorScheme: "dark",
};

// Ставит отметку до первой отрисовки: без скриптов контент виден сразу, без анимаций появления.
const markJs = "document.documentElement.dataset.js='1'";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: markJs }} />
      </head>
      <body>
        <a className="skip" href="#main">
          К содержанию
        </a>
        <CartProvider>
          <LightboxProvider>
            <SiteNav />
            <main id="main">{children}</main>
            <Footer />
          </LightboxProvider>
        </CartProvider>
        <RevealRoot />
      </body>
    </html>
  );
}
