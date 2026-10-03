import { ImageResponse } from "next/og";
import { site } from "@/config/site";

/**
 * Uygulama simgesi: vurgu renginde zemin üzerinde adın baş harfi.
 * Kendi simgenizi kullanmak için public/ altına PNG koyup app/manifest.ts'teki
 * yolları değiştirmeniz yeterli.
 */
export function renderAppIcon(size: number, { maskable = false }: { maskable?: boolean } = {}) {
  const letter = site.name.charAt(0).toLocaleUpperCase("tr");
  // Maskable simgelerde içerik ortadaki %80'lik güvenli alanda kalmalı.
  const fontSize = Math.round(size * (maskable ? 0.42 : 0.56));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#a84b63",
          color: "#fbf8f4",
          fontSize,
          fontFamily: "serif",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        {letter}
      </div>
    ),
    { width: size, height: size },
  );
}
