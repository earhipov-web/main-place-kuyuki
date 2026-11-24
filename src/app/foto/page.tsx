import type { Metadata } from "next";
import { Lift } from "@/components/bits";
import { PhotoGroups } from "@/components/photo-wall";

export const metadata: Metadata = {
  title: "Фото",
  description: "Фото Main Place в Куюках: зал и бар, VIP-комната, кальяны, вход и зеркала.",
};

export default function PhotoPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <Lift as="h1" lines={["Фото"]} />
        <p className="soft" data-rv="up">
          Нажмите на снимок, чтобы открыть его целиком.
        </p>
      </div>
      <PhotoGroups />
    </div>
  );
}
