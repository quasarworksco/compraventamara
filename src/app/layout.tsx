import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { Bienvenida } from "@/components/bienvenida";
import { AvisoCuenta } from "@/components/aviso-cuenta";
import { NavInferior } from "@/components/nav-inferior";
import { ProveedorSesion } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const DESCRIPCION =
  "Mercado, negocios, mototaxis, rifas y compra y venta de dólares de San Rafael del Moján. Contacto directo por WhatsApp.";

/**
 * El sitio se comparte sobre todo pegando el enlace en WhatsApp, y ahí un
 * enlace sin imagen ni descripción se ve como una caja gris que nadie toca.
 * Estos metadatos son los que hacen que aparezca la portada del pueblo.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://maracomercio.dgp-link.com"),
  title: {
    default: "Compra Venta Mara — San Rafael del Moján",
    template: "%s · Compra Venta Mara",
  },
  description: DESCRIPCION,
  applicationName: "Compra Venta Mara",
  appleWebApp: { capable: true, title: "Compra Venta Mara", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: "Compra Venta Mara",
    title: "Compra Venta Mara — San Rafael del Moján",
    description: DESCRIPCION,
    images: [
      {
        url: "/portada-social.jpg",
        width: 1200,
        height: 630,
        alt: "Compra Venta Mara · San Rafael del Moján, municipio Mara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compra Venta Mara — San Rafael del Moján",
    description: DESCRIPCION,
    images: ["/portada-social.jpg"],
  },
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
        <Bienvenida />
        <ProveedorSesion>
          {/* El hueco inferior deja libre la navegación fija. */}
          <div className="mx-auto min-h-dvh max-w-lg pb-24">
            {/* Va antes que nada: si la administración pausó la cuenta, es lo
                primero que la persona tiene que ver, entre donde entre. */}
            <AvisoCuenta />
            {children}
          </div>
          <NavInferior />
        </ProveedorSesion>
      </body>
    </html>
  );
}
