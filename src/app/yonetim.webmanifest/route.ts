import { site } from "@/config/site";

export const dynamic = "force-static";

// Yönetim panelini telefonda ana ekrana eklemek için ayrı manifest
// (açılışta doğrudan /admin gelsin diye).
export function GET() {
  return Response.json(
    {
      id: "/admin",
      name: `${site.name} Yönetim`,
      short_name: "Yönetim",
      lang: "tr",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#faf7f2",
      theme_color: "#faf7f2",
      icons: [
        { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
