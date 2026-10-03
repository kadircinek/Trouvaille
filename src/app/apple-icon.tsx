import { renderAppIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS köşeleri kendisi yuvarlar; tam kare (maskable) çizim kullanılır.
export default function AppleIcon() {
  return renderAppIcon(180, { maskable: true });
}
