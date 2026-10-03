import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorker } from "@/components/service-worker";
import { site } from "@/config/site";
import "./globals.css";

// latin-ext: ğ, ş, ı, İ gibi Türkçe karakterler için şart.
const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Vitrin`,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: site.name,
    description: site.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
        {/* Çerezsiz sayfa görüntüleme ölçümü; yalnızca Vercel'de çalışır. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
