/** Utilidades de presentación compartidas por toda la aplicación. */

import type { Moneda, MetodoPago, TipoPublicacion } from "./types";

/** Precio con el símbolo correcto y sin decimales inútiles. */
export function formatearPrecio(monto: number, moneda: Moneda): string {
  const decimales = moneda === "USD" ? (Number.isInteger(monto) ? 0 : 2) : 2;
  const numero = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto);
  return moneda === "USD" ? `$${numero}` : `Bs ${numero}`;
}

/** Tasa de cambio: siempre dos decimales, como la canta el grupo. */
export function formatearTasa(tasa: number): string {
  return `Bs ${new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tasa)}`;
}

/** "hace 5 min", "hace 3 h", "hace 2 d". Pensado para tarjetas y chats. */
export function hace(marca: number): string {
  const segundos = Math.max(0, Math.floor((Date.now() - marca) / 1000));
  if (segundos < 60) return "ahora";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return new Date(marca).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

/** Hora corta para las burbujas del chat. */
export function hora(marca: number): string {
  return new Date(marca).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Deja el teléfono en el formato que espera wa.me: solo dígitos, con el
 * código de país. Asume Venezuela (58) cuando el número viene local.
 */
export function normalizarTelefono(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "");
  if (digitos.startsWith("58")) return digitos;
  if (digitos.startsWith("0")) return `58${digitos.slice(1)}`;
  return `58${digitos}`;
}

/** Teléfono legible: 0412-123-4567. */
export function formatearTelefono(telefono: string): string {
  const d = normalizarTelefono(telefono);
  const local = `0${d.slice(2)}`;
  if (local.length !== 11) return telefono;
  return `${local.slice(0, 4)}-${local.slice(4, 7)}-${local.slice(7)}`;
}

/** Enlace de WhatsApp con el mensaje ya redactado. */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${normalizarTelefono(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

/** Convierte 42 en "MC-00042". */
export function codigoMiembro(correlativo: number): string {
  return `MC-${String(correlativo).padStart(5, "0")}`;
}

/** Nombre y apellido en una sola línea, sin espacios de más. */
export function nombreCompleto(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.replace(/\s+/g, " ").trim();
}

/** Iniciales para el avatar cuando el miembro no tiene foto. */
export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export const ETIQUETA_METODO: Record<MetodoPago, string> = {
  "pago-movil": "Pago Móvil",
  efectivo: "Efectivo",
  zelle: "Zelle",
  binance: "Binance",
  transferencia: "Transferencia",
};

export const ETIQUETA_TIPO: Record<TipoPublicacion, string> = {
  producto: "Artículo",
  negocio: "Negocio",
  mototaxi: "Mototaxi",
  dolar: "Divisas",
};

/** Texto para buscar: sin acentos y en minúsculas. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
