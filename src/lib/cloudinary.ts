/**
 * Subida de imágenes a Cloudinary desde el navegador.
 *
 * Se usa un "upload preset" sin firma, así que no hace falta un servidor
 * intermedio ni exponer el API secret: el navegador sube directo.
 */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Tamaño máximo por foto. Por encima, se comprime antes de subir. */
const MAX_LADO = 1600;
const CALIDAD = 0.82;

/**
 * Reduce la foto en el propio teléfono antes de subirla.
 * En datos móviles la diferencia entre 4 MB y 300 KB se nota muchísimo.
 */
async function comprimir(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") {
    return archivo;
  }

  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));

  // Ya es pequeña y liviana: no vale la pena recodificarla.
  if (escala === 1 && archivo.size < 700_000) {
    bitmap.close();
    return archivo;
  }

  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const ctx = lienzo.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return archivo;
  }
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    lienzo.toBlob(resolve, "image/jpeg", CALIDAD),
  );
  return blob ?? archivo;
}

/** Sube una imagen y devuelve su URL pública (`secure_url`). */
export async function subirImagen(archivo: File, carpeta = "publicaciones"): Promise<string> {
  if (!CLOUD || !PRESET) {
    throw new Error(
      "Cloudinary no está configurado. Define NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const cuerpo = new FormData();
  cuerpo.append("file", await comprimir(archivo));
  cuerpo.append("upload_preset", PRESET);
  cuerpo.append("folder", `mara-comercio/${carpeta}`);

  const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: cuerpo,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Cloudinary rechazó la imagen (${respuesta.status}): ${detalle}`);
  }

  const datos: { secure_url?: string } = await respuesta.json();
  if (!datos.secure_url) throw new Error("Cloudinary no devolvió la URL de la imagen.");
  return datos.secure_url;
}

/**
 * Reescribe una URL de Cloudinary para que sirva la imagen ya redimensionada,
 * en el formato más liviano que soporte el navegador.
 */
export function miniatura(url: string, ancho = 480): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${ancho},c_limit/`);
}
