import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { NavInferior } from "@/components/nav-inferior";
import { ProveedorSesion } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Mara Comercio — San Rafael del Moján",
    template: "%s · Mara Comercio",
  },
  description:
    "Comercio de San Rafael del Moján: artículos, negocios, mototaxis, rifas y compra y venta de dólares, con contacto directo por WhatsApp.",
  applicationName: "Mara Comercio",
  appleWebApp: { capable: true, title: "Mara Comercio", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin `maximum-scale`: bloquear el zoom deja fuera a quien no ve bien de cerca.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101e24" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-VE" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ProveedorSesion>
          {/* El hueco inferior deja libre la navegación fija. */}
          <div className="mx-auto min-h-dvh max-w-lg pb-24">{children}</div>
          <NavInferior />
        </ProveedorSesion>
      </body>
    </html>
  );
}
