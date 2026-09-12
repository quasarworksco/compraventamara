import type { NextConfig } from "next";

/**
 * Configuración para publicar en GitHub Pages.
 *
 * Pages sirve archivos estáticos, sin servidor detrás, así que el sitio se
 * exporta como HTML. Eso tiene tres consecuencias de las que depende el resto
 * del código:
 *
 *  - No hay rutas de API. Las tasas del dólar se consultan desde el navegador
 *    (ver src/lib/tasas.ts), con el respaldo manual de Firestore si falla.
 *  - No hay optimización de imágenes bajo demanda: se sirven tal cual.
 *  - Las rutas terminan en barra para que Pages encuentre el index.html de
 *    cada carpeta; sin esto, entrar directo a /mercado daría 404.
 *
 * Toda la aplicación funciona igual porque los datos vienen de Firestore
 * directamente en el navegador, no del servidor.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
