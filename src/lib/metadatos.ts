import type { Metadata } from "next";

/**
 * Metadatos de una sección.
 *
 * Sin esto, todas las páginas heredan el título y la imagen de la portada, y
 * compartir el tablón de divisas en un chat se ve exactamente igual que
 * compartir la página principal. Quien lo recibe no sabe qué le mandaron.
 *
 * `indexable: false` es para las pantallas que no tienen sentido en un
 * buscador: el panel de administración, el perfil de cada quien, los
 * formularios. No las esconde de nadie —siguen siendo públicas si se conoce
 * la dirección—, solo pide a los buscadores que no las listen.
 */
export function metadatosDeSeccion({
  titulo,
  descripcion,
  imagen,
  indexable = true,
}: {
  titulo: string;
  descripcion: string;
  /** Nombre del archivo en /social, sin extensión. */
  imagen?: string;
  indexable?: boolean;
}): Metadata {
  const ruta = imagen ? `/social/${imagen}.jpg` : "/portada-social.jpg";
  const completo = `${titulo} · Compra Venta Mara`;

  return {
    title: titulo,
    description: descripcion,
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: completo,
      description: descripcion,
      images: [{ url: ruta, width: 1200, height: 630, alt: completo }],
    },
    twitter: {
      card: "summary_large_image",
      title: completo,
      description: descripcion,
      images: [ruta],
    },
  };
}
