import type { ReactNode } from "react";

// Ürün detayı akıştan açıldığında @modal katmanında gösterilir; böylece geri
// dönüldüğünde akış, filtreler ve kaydırma konumu olduğu gibi kalır.
export default function VitrinLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
