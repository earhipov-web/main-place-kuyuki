import type { Metadata } from "next";
import { Lift } from "@/components/bits";
import { MenuBrowser } from "@/components/menu-browser";

export const metadata: Metadata = {
  title: "Меню и заказ",
  description: "Бургеры, закуски, салаты, горячее и супы Main Place с ценами. Соберите заказ в зал, навынос или с доставкой.",
};

export default function MenuPage() {
  return (
    <>
      <div className="wrap page-head">
        <Lift as="h1" lines={["Меню"]} />
        <p className="soft" data-rv="up">
          Соберите заказ за стол, навынос или с доставкой.
        </p>
      </div>
      <MenuBrowser />
    </>
  );
}
