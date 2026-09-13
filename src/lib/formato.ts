/** Utilidades de presentación compartidas por toda la aplicación. */

import {
  DIVISAS,
  MOTIVOS_REPORTE,
  type Divisa,
  type Moneda,
  type MetodoPago,
  type MotivoReporte,
  type TipoPublicacion,
} from "./types";

/** "dólares", "pesos colombianos", "euros". */
export function nombreDivisa(divisa: Divisa): string {
  return (DIVISAS.find((d) => d.codigo === divisa)?.nombre ?? divisa).toLowerCase();
}

/** El símbolo de cada divisa, para escribir los montos como se leen. */
export function formatearDivisa(monto: number, divisa: Divisa): string {
  const simbolo = DIVISAS.find((d) => d.codigo === divisa)?.simbolo ?? divisa;
  const decimales = Number.isInteger(monto) ? 0 : 2;
  const numero = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto);
  return `${simbolo}${numero}`;
}

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
  mototaxi: "Transporte",
  divisa: "Divisas",
  rifa: "Rifa",
};

export const ETIQUETA_MOTIVO: Record<MotivoReporte, string> = Object.fromEntries(
  MOTIVOS_REPORTE.map((m) => [m.id, m.etiqueta]),
) as Record<MotivoReporte, string>;

/**
 * Placa en limpio: mayúsculas, sin guiones ni espacios.
 *
 * En Venezuela la misma placa se escribe "AB123CD", "AB-123-CD" o "ab 123 cd"
 * según quien la copie. Guardadas así, dos fichas del mismo carro no parecen
 * dos carros distintos, y buscar por placa encuentra.
 */
export function normalizarPlaca(entrada: string): string {
  return entrada.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** La placa como se lee en el vehículo: "AB123CD" → "AB123CD", separada en bloques. */
export function formatearPlaca(placa: string): string {
  const limpia = normalizarPlaca(placa);
  // Formato venezolano corriente: tres bloques de letras y números.
  const bloques = limpia.match(/^([A-Z]+)(\d+)([A-Z]*)$/);
  if (!bloques) return limpia;
  return [bloques[1], bloques[2], bloques[3]].filter(Boolean).join(" ");
}

/**
 * Cuánto se aparta una tasa de su referencia, en porcentaje.
 * Positivo significa por encima de la referencia; negativo, por debajo.
 */
export function diferenciaPorcentual(tasa: number, referencia: number): number | null {
  if (!referencia || !Number.isFinite(referencia) || !Number.isFinite(tasa)) return null;
  return ((tasa - referencia) / referencia) * 100;
}

/** "+3,2%" o "−1,5%", con el signo menos tipográfico. */
export function formatearDiferencia(porcentaje: number): string {
  const valor = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(porcentaje));
  if (Math.abs(porcentaje) < 0.05) return "igual";
  return `${porcentaje > 0 ? "+" : "−"}${valor}%`;
}

/** Fecha de sorteo legible: "sábado 4 de octubre". */
export function formatearFecha(iso: string): string {
  // Se fija el mediodía UTC para que el día no se corra por la zona horaria.
  const fecha = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Días que faltan para una fecha ISO. Negativo si ya pasó. */
export function diasHasta(iso: string): number {
  const objetivo = new Date(`${iso}T23:59:59Z`).getTime();
  if (Number.isNaN(objetivo)) return 0;
  return Math.ceil((objetivo - Date.now()) / 86_400_000);
}

/** Texto para buscar: sin acentos y en minúsculas. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
