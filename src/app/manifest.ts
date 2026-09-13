import type { MetadataRoute } from "next";

/**
 * Manifiesto para instalar la plataforma en la pantalla de inicio.
 *
 * Importa más de lo que parece: quien la agrega al teléfono vuelve solo,
 * sin depender de acordarse de la dirección ni de buscar el enlace en el
 * grupo. Es la diferencia entre una página que se visita una vez y una que
 * se abre a diario.
 */
/** El sitio se exporta como HTML, así que el manifiesto se genera al compilar. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Compra Venta Mara · San Rafael del Moján",
    short_name: "Compra Venta Mara",
    description:
      "Mercado, negocios, mototaxis, rifas y compra y venta de dólares de San Rafael del Moján.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1f42",
    theme_color: "#194a99",
    lang: "es-VE",
    categories: ["shopping", "business", "social"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
