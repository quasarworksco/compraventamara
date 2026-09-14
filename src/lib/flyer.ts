"use client";

/**
 * El cartel de una rifa, dibujado en el navegador.
 *
 * Una rifa no se vende desde una página: se vende reenviándola por WhatsApp, y
 * lo que se reenvía por WhatsApp es una imagen. Hasta ahora quien organizaba
 * una rifa aquí tenía que armarse el cartel por su cuenta en otra aplicación,
 * y eso es exactamente el paso en el que la gente abandona.
 *
 * Se dibuja en un lienzo del propio teléfono porque el sitio es estático: no
 * hay servidor que componga imágenes, y tampoco hace falta.
 *
 * Formato cuadrado y 1080 píxeles de lado: es lo que WhatsApp e Instagram
 * muestran sin recortar, y lo que se ve bien tanto en un chat como en un
 * estado.
 */

import { formatearFecha, formatearPrecio, formatearTelefono } from "./formato";
import type { PublicacionRifa } from "./types";

const LADO = 1080;

/** Los colores de la marca, en crudo: el lienzo no entiende de variables CSS. */
const AZUL_OSCURO = "#102e63";
const AZUL = "#194a99";
const VERDE = "#35a26e";
const BLANCO = "#ffffff";

/**
 * Carga una imagen para poder dibujarla.
 *
 * `crossOrigin` es obligatorio: sin él, el lienzo queda "manchado" al dibujar
 * una imagen de otro dominio y el navegador prohíbe exportarlo. Cloudinary
 * responde con los permisos necesarios, así que funciona; si algún día no lo
 * hiciera, el cartel sale sin foto en vez de fallar del todo.
 */
function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolver) => {
    const imagen = new Image();
    imagen.crossOrigin = "anonymous";
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => resolver(null);
    imagen.src = url;
  });
}

/**
 * Dibuja la imagen llenando el cuadro, sin deformarla y sin salirse.
 *
 * El recorte es imprescindible y no es un detalle: `drawImage` pinta la imagen
 * entera con el tamaño que se le dé, no la corta al rectángulo de destino. Sin
 * recortar, una foto apaisada escalada para cubrir el ancho se derramaba por
 * debajo de su franja y el título del premio caía encima de ella.
 */
function dibujarCubriendo(
  ctx: CanvasRenderingContext2D,
  imagen: HTMLImageElement,
  x: number,
  y: number,
  ancho: number,
  alto: number,
): void {
  const escala = Math.max(ancho / imagen.width, alto / imagen.height);
  const a = imagen.width * escala;
  const h = imagen.height * escala;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, ancho, alto);
  ctx.clip();
  ctx.drawImage(imagen, x + (ancho - a) / 2, y + (alto - h) / 2, a, h);
  ctx.restore();
}

/** Parte un texto en las líneas que caben, y devuelve las que quepan. */
function enLineas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  ancho: number,
  maximo: number,
): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= ancho) {
      actual = prueba;
      continue;
    }
    if (actual) lineas.push(actual);
    actual = palabra;
    if (lineas.length === maximo) break;
  }

  if (actual && lineas.length < maximo) lineas.push(actual);
  return lineas.slice(0, maximo);
}

function fuente(tamano: number, peso = 700): string {
  return `${peso} ${tamano}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
}

/**
 * Arma el cartel y devuelve la imagen lista para guardar.
 *
 * El orden de arriba abajo es el de las preguntas que hace quien ve una rifa:
 * qué se rifa, cuánto cuesta el número, con qué lotería y qué día, y a quién
 * se le compra.
 */
export async function dibujarCartelRifa(rifa: PublicacionRifa): Promise<Blob | null> {
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO;
  lienzo.height = LADO;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;

  // Fondo.
  const fondo = ctx.createLinearGradient(0, 0, LADO, LADO);
  fondo.addColorStop(0, AZUL);
  fondo.addColorStop(1, AZUL_OSCURO);
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, LADO, LADO);

  /*
   * La foto del premio ocupa la mitad de arriba: es lo que hace que alguien
   * pare de deslizar. Cuando no hay foto no se deja el hueco vacío —quedaba un
   * campo azul enorme con el texto flotando al fondo—: la franja se encoge y
   * el contenido sube a ocupar el cartel.
   */
  const foto = rifa.imagenes?.[0] ? await cargarImagen(rifa.imagenes[0]) : null;
  const ALTO_FOTO = foto ? 470 : 300;

  if (foto) {
    dibujarCubriendo(ctx, foto, 0, 0, LADO, ALTO_FOTO);
    // Un velo abajo para que el texto blanco se lea sobre cualquier foto.
    const velo = ctx.createLinearGradient(0, ALTO_FOTO - 220, 0, ALTO_FOTO);
    velo.addColorStop(0, "rgba(16,46,99,0)");
    velo.addColorStop(1, "rgba(16,46,99,0.95)");
    ctx.fillStyle = velo;
    ctx.fillRect(0, ALTO_FOTO - 220, LADO, 220);
  }

  // Cinta con la palabra RIFA.
  ctx.fillStyle = VERDE;
  ctx.fillRect(56, 52, 190, 62);
  ctx.fillStyle = BLANCO;
  ctx.font = fuente(34);
  ctx.textAlign = "center";
  ctx.fillText("RIFA", 56 + 95, 52 + 43);
  ctx.textAlign = "left";

  // Qué se rifa.
  let y = ALTO_FOTO + 96;
  ctx.fillStyle = BLANCO;
  ctx.font = fuente(foto ? 62 : 72);
  for (const linea of enLineas(ctx, rifa.premio || rifa.titulo, LADO - 112, foto ? 2 : 3)) {
    ctx.fillText(linea, 56, y);
    y += foto ? 74 : 86;
  }

  // El precio del número, que es la segunda pregunta de todo el mundo.
  y += 24;
  const precio = formatearPrecio(rifa.precioNumero, rifa.moneda);
  ctx.fillStyle = VERDE;
  ctx.font = fuente(80);
  ctx.fillText(precio, 56, y);
  // El "el número" va pegado al precio, así que hay que medirlo con la fuente
  // grande antes de cambiar a la pequeña.
  const anchoPrecio = ctx.measureText(precio).width;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = fuente(34, 500);
  ctx.fillText("el número", 56 + anchoPrecio + 18, y);

  // Lotería y día del sorteo.
  y += 70;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = fuente(36, 600);
  ctx.fillText(`Juega con ${rifa.loteria}`, 56, y);
  y += 52;
  ctx.fillText(`Sorteo: ${formatearFecha(rifa.fechaSorteo)}`, 56, y);

  if (rifa.numerosDisponibles > 0) {
    y += 52;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = fuente(32, 500);
    ctx.fillText(
      `Quedan ${rifa.numerosDisponibles} de ${rifa.totalNumeros} números`,
      56,
      y,
    );
  }

  // A quién se le compra. Sin esto el cartel no sirve para nada.
  const ALTO_PIE = 132;
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, LADO - ALTO_PIE, LADO, ALTO_PIE);

  ctx.fillStyle = BLANCO;
  ctx.font = fuente(38);
  ctx.fillText(`${rifa.autorNombre} ${rifa.autorApellido}`.trim(), 56, LADO - ALTO_PIE + 54);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = fuente(34, 500);
  ctx.fillText(formatearTelefono(rifa.autorTelefono), 56, LADO - ALTO_PIE + 100);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = fuente(26, 600);
  ctx.fillText("Compra Venta Mara", LADO - 56, LADO - ALTO_PIE + 54);
  ctx.fillText("San Rafael del Moján", LADO - 56, LADO - ALTO_PIE + 96);
  ctx.textAlign = "left";

  return new Promise((resolver) => lienzo.toBlob((b) => resolver(b), "image/png"));
}

/** Lanza la descarga del cartel. */
export function descargarCartel(imagen: Blob, nombre: string): void {
  const url = URL.createObjectURL(imagen);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombre}.png`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
