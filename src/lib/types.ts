/**
 * Modelo de datos de Mara Comercio (Firestore).
 *
 * Colecciones:
 *   miembros/{uid}                     perfil público de cada persona registrada
 *   contadores/miembros                correlativo para el identificador MC-00000
 *   publicaciones/{id}                 mercado, tiendas, mototaxis y dólares
 *   salas/{sala}/mensajes/{id}         chat en vivo público (se reinicia cada 36 h)
 *   chats/{chatId}                     conversación privada entre dos miembros
 *   chats/{chatId}/mensajes/{id}       mensajes privados (se reinician cada 36 h)
 */

/** Los cuatro módulos del grupo. */
export type TipoPublicacion = "producto" | "negocio" | "mototaxi" | "dolar";

/** Días que vive una publicación del marketplace antes de vencer. */
export const DIAS_VIGENCIA = 30;

/** Días de antelación con que se avisa al dueño de que su anuncio vence. */
export const DIAS_AVISO_VENCIMIENTO = 5;

export const MS_POR_DIA = 86_400_000;

export type Moneda = "USD" | "VES";

export type EstadoPublicacion = "activa" | "pausada" | "cerrada";

export type Rol = "miembro" | "admin";

/** Perfil de un miembro. El documento vive en `miembros/{uid}`. */
export interface Miembro {
  uid: string;
  /** Identificador correlativo e irrepetible del miembro, p. ej. "MC-00042". */
  codigo: string;
  nombre: string;
  apellido: string;
  /** Teléfono en formato internacional sin signos: "584121234567". Es la identidad del miembro. */
  telefono: string;
  zona?: string;
  /** Foto de la persona, obligatoria: sirve para reconocerla al cerrar un trato. */
  fotoUrl: string;
  /** Lo activa la administración para los vendedores de confianza. */
  verificado: boolean;
  rol: Rol;
  creadoEn: number;
  /** Marca de tiempo de la última vez que estuvo en línea. */
  vistoEn?: number;
}

/** Campos comunes a toda publicación. */
interface PublicacionBase {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  descripcion: string;
  imagenes: string[];
  zona: string;
  estado: EstadoPublicacion;
  creadaEn: number;
  actualizadaEn: number;
  /**
   * Vencimiento del anuncio. La política TTL de Firestore borra el documento
   * al llegar esta fecha; el dueño puede prorrogarla desde su perfil.
   */
  venceEn: number;
  /** Cuántas veces se ha prorrogado. Solo informativo. */
  prorrogas: number;
  /** Copia del autor para pintar la tarjeta sin una segunda lectura. */
  autorUid: string;
  autorCodigo: string;
  autorNombre: string;
  autorApellido: string;
  autorTelefono: string;
  /** Foto del autor: en la venta de divisas es clave poder reconocer a la persona. */
  autorFoto: string;
  autorVerificado: boolean;
}

export type Condicion = "nuevo" | "usado";

export interface PublicacionProducto extends PublicacionBase {
  tipo: "producto";
  precio: number;
  moneda: Moneda;
  categoria: string;
  condicion: Condicion;
  /** Unidades disponibles. El grupo también vende por lotes. */
  cantidad: number;
}

/** Ficha del directorio de negocios del pueblo. */
export interface PublicacionNegocio extends PublicacionBase {
  tipo: "negocio";
  categoria: string;
  direccion: string;
  horario: string;
  /** Enlace opcional a Instagram, catálogo, etc. */
  enlace?: string;
  /** Los negocios del directorio no vencen mientras el dueño los mantenga. */
  permanente: true;
}

export interface PublicacionMototaxi extends PublicacionBase {
  tipo: "mototaxi";
  /** Sectores que cubre el motorizado. */
  cobertura: string[];
  tarifaDesde: number;
  moneda: Moneda;
  disponible: boolean;
}

/** Quien publica dice si compra o vende dólares, y a qué tasa. */
export type OperacionDivisa = "compra" | "venta";

export type MetodoPago = "pago-movil" | "efectivo" | "zelle" | "binance" | "transferencia";

export interface PublicacionDolar extends PublicacionBase {
  tipo: "dolar";
  operacion: OperacionDivisa;
  /** Bolívares por dólar. */
  tasa: number;
  montoMin: number;
  montoMax: number;
  metodos: MetodoPago[];
}

export type Publicacion =
  | PublicacionProducto
  | PublicacionNegocio
  | PublicacionMototaxi
  | PublicacionDolar;

/* ----------------------------------------------------------------- */
/* Tasas del dólar                                                    */
/* ----------------------------------------------------------------- */

export interface Tasas {
  /** Tasa oficial del Banco Central de Venezuela. */
  bcv: number | null;
  /** Referencia del mercado P2P de Binance. */
  binance: number | null;
  /** Marca de tiempo de la última actualización conseguida. */
  actualizadoEn: number;
  /** De dónde salieron: la API pública o el respaldo manual de un admin. */
  origen: "api" | "manual" | "sin-datos";
}

/* ----------------------------------------------------------------- */
/* Chat                                                               */
/* ----------------------------------------------------------------- */

/** Salas públicas del chat en vivo, una por módulo. */
export type SalaId = "general" | "mercado" | "dolar" | "mototaxis";

export interface Mensaje {
  id: string;
  texto: string;
  autorUid: string;
  autorCodigo: string;
  autorNombre: string;
  autorFoto: string;
  /** Imagen opcional alojada en Cloudinary. */
  imagenUrl?: string;
  creadoEn: number;
  /** creadoEn + 36 h. La política TTL de Firestore borra el documento. */
  expiraEn: number;
}

export interface Chat {
  id: string;
  participantes: string[];
  /** Publicación que originó la conversación, si la hubo. */
  publicacionId?: string;
  publicacionTitulo?: string;
  ultimoMensaje: string;
  actualizadoEn: number;
  expiraEn: number;
}
