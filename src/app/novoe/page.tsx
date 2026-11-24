import type { Metadata } from "next";
import { News } from "@/components/afisha";
import { Lift } from "@/components/bits";

export const metadata: Metadata = {
  title: "Что нового",
  description: "Афиша Main Place: GTA 6 и PlayStation 5, скидка в день рождения, VIP-комната, видео из зала.",
};

export default function NewsPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <Lift as="h1" lines={["Что нового"]} />
      </div>
      <News />
    </div>
  );
}
