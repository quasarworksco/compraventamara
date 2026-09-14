/**
 * Saneado de las URL que escriben los miembros.
 *
 * Una ficha de negocio puede llevar un enlace a Instagram o a un catálogo, y
 * ese enlace se pinta como un `href`. Sin comprobarlo, quien registra su
 * negocio puede escribir `javascript:` ahí y ejecutar código en el navegador de
 * cualquier vecino que toque "Ver más". React bloquea ese esquema en concreto,
 * pero apoyarse en eso es apoyarse en el detalle de una versión: aquí se
 * decide a mano y solo pasan http y https.
 *
 * Lo mismo con las fotos. Todas las imágenes de la plataforma se suben a la
 * cuenta de Cloudinary del proyecto, así que una URL de imagen que apunte a
 * otro sitio no puede venir de la aplicación: viene de alguien escribiendo
 * directo en la base. Y eso importa más de lo que parece, porque una imagen
 * alojada fuera la controla otro: se aprueba una foto de perfil y al día
 * siguiente esa misma dirección sirve otra cosa.
 */

/** El único sitio del que salen las imágenes de la plataforma. */
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

const PREFIJO_IMAGEN = CLOUD ? `https://res.cloudinary.com/${CLOUD}/` : "";

/**
 * Devuelve el enlace si se puede abrir sin riesgo, o null si no.
 *
 * Null y no una cadena vacía a propósito: obliga a decidir qué se pinta
 * cuando no hay enlace, en vez de dejar un `<a href="">` que recarga la página.
 */
export function enlaceSeguro(url: string | undefined | null): string | null {
  if (!url) return null;
  const limpio = url.trim();
  if (limpio.length === 0 || limpio.length > 500) return null;

  try {
    const analizado = new URL(limpio);
    if (analizado.protocol !== "http:" && analizado.protocol !== "https:") return null;
    return analizado.toString();
  } catch {
    // Sin esquema no es una URL. No se le añade "https://" por si acaso:
    // adivinar lo que alguien quiso escribir es otra manera de equivocarse.
    return null;
  }
}

/** Verdadero solo si la imagen vive en la cuenta de Cloudinary del proyecto. */
export function imagenPropia(url: string | undefined | null): boolean {
  if (!url || !PREFIJO_IMAGEN) return false;
  return url.startsWith(PREFIJO_IMAGEN) && url.length <= 500;
}

/** Deja solo las imágenes que de verdad salieron de aquí. */
export function imagenesPropias(urls: string[] | undefined): string[] {
  return (urls ?? []).filter(imagenPropia);
}
