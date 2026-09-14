/**
 * Modelo de datos de Mara Comercio (Firestore).
 *
 * Colecciones:
 *   miembros/{uid}               perfil público de cada persona registrada
 *   administradores/{uid}        quién puede moderar; lo reparte el correo dueño
 *   contadores/miembros          correlativo para el identificador MC-00000
 *   configuracion/tasas          respaldo manual del precio del dólar
 *   publicaciones/{id}           mercado, negocios, mototaxis, divisas y rifas
 *   salas/{sala}/mensajes/{id}   chat en vivo del pueblo (se borra cada 36 h)
 *
 * No hay conversaciones privadas dentro de la plataforma: el trato se cierra
 * por WhatsApp, que es donde el pueblo ya conversa.
 */

/** Los módulos del grupo. */
export type TipoPublicacion =
  | "producto"
  | "negocio"
  | "mototaxi"
  | "divisa"
  | "rifa"
  | "carrera";

/**
 * Lo que no caduca solo.
 *
 * Un negocio del directorio y un mototaxi son fichas de quién es alguien, no
 * anuncios de algo que se acaba: la panadería sigue siendo la panadería, y
 * quien trabaja la moto la sigue trabajando. Hacerles cumplir los 30 días del
 * marketplace vaciaba el directorio cada mes y obligaba a registrarse de nuevo
 * a gente que no había cambiado nada.
 */
export const TIPOS_PERMANENTES: TipoPublicacion[] = ["negocio", "mototaxi"];

export function esPermanente(tipo: TipoPublicacion): boolean {
  return TIPOS_PERMANENTES.includes(tipo);
}

/** Cuánto vive una carrera pedida antes de retirarse sola. */
export const HORAS_VIGENCIA_CARRERA = 2;

/** Días que vive una publicación del marketplace antes de vencer. */
export const DIAS_VIGENCIA = 30;

/** Días de antelación con que se avisa al dueño de que su anuncio vence. */
export const DIAS_AVISO_VENCIMIENTO = 5;

export const MS_POR_DIA = 86_400_000;

export const MS_POR_HORA = 3_600_000;

/**
 * Una oferta de divisas vive seis horas.
 *
 * La tasa se mueve varias veces al día: un tablón con ofertas de ayer no es
 * información, es ruido. Quien sigue disponible lo confirma con un toque y su
 * oferta vuelve a contar seis horas desde cero; quien no, desaparece solo.
 */
export const HORAS_VIGENCIA_DOLAR = 6;

export type Moneda = "USD" | "VES";

/**
 * Las divisas que se cambian en el pueblo.
 *
 * No solo dólares: por la frontera entra mucho peso colombiano, y quien
 * recibe remesas de Europa trae euros. Cada oferta dice cuál vende y a qué
 * tasa, porque no es lo mismo.
 */
export type Divisa = "USD" | "COP" | "EUR";

export const DIVISAS: { codigo: Divisa; nombre: string; simbolo: string }[] = [
  { codigo: "USD", nombre: "Dólares", simbolo: "$" },
  { codigo: "COP", nombre: "Pesos colombianos", simbolo: "COP$" },
  { codigo: "EUR", nombre: "Euros", simbolo: "€" },
];

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
  /**
   * Lo activa la administración. Además de dar el sello de confianza, es la
   * llave del tablón de divisas: sin verificar no se puede publicar allí.
   */
  verificado: boolean;
  /**
   * Distinción que da la administración por encima de la verificación.
   *
   * Verificar dice "esta persona es quien dice ser". Vendedor Seguro dice algo
   * más fuerte: "de esta persona respondemos". Se reserva a quien ya tiene
   * historial de cambios cumplidos, y por eso sus ofertas de divisas encabezan
   * el tablón: quien llega nuevo al pueblo tiene a quién acudir primero.
   */
  vendedorSeguro?: boolean;
  /** Desde cuándo lo es, para poder retirarlo con criterio. */
  seguroDesde?: number;
  /**
   * Nota que la administración le deja ver al miembro la próxima vez que
   * entre. No bloquea nada: es un aviso, del estilo "tu foto se ve borrosa".
   */
  advertencia?: string;
  /**
   * La foto de perfil no es de la persona, y hasta que la cambie no puede
   * publicar ni escribir en el chat.
   *
   * La foto es lo que permite reconocer a alguien al cerrar un trato en
   * persona. Una cuenta con la foto de otro —o con un logo, o un paisaje— es
   * exactamente la que conviene a quien viene a estafar, así que aquí la foto
   * no es decoración del perfil: es el perfil.
   *
   * El miembro solo puede apagar esta marca subiendo una foto distinta; las
   * reglas no le dejan quitársela sin cambiarla.
   */
  fotoRechazada?: boolean;
  /** El miembro pidió que lo verifiquen y espera respuesta. */
  solicitaVerificacion?: boolean;
  /** Cuándo lo pidió, para que la administración atienda por orden. */
  solicitadoEn?: number;
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
  /**
   * Hasta cuándo va destacada. Lo escribe solo la administración, cuando quien
   * publica ha pagado por ello; las reglas impiden que el autor se lo ponga.
   */
  destacadaHasta?: number;
  /**
   * Cuándo se cerró el anuncio. Se llena al marcarlo vendido.
   *
   * Cerrar en vez de borrar es lo que permite saber cuánto se cierra de verdad
   * aquí: un anuncio borrado no deja ninguna huella de que sirvió para algo.
   */
  cerradaEn?: number;
  /** Copia del autor para pintar la tarjeta sin una segunda lectura. */
  autorUid: string;
  autorCodigo: string;
  autorNombre: string;
  autorApellido: string;
  autorTelefono: string;
  /** Foto del autor: en la venta de divisas es clave poder reconocer a la persona. */
  autorFoto: string;
  autorVerificado: boolean;
  /**
   * Copia de la distinción Vendedor Seguro. Como el resto de los datos del
   * autor, las reglas la contrastan contra el perfil real: sin eso, cualquiera
   * se pondría el distintivo que hace que le escriban a él primero.
   */
  autorSeguro: boolean;
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
  /**
   * Rubro principal. Es el que encabeza la ficha y bajo el que se lista en el
   * índice del directorio.
   */
  categoria: string;
  /**
   * Todos los rubros del negocio, el principal incluido.
   *
   * Muy pocos negocios del pueblo hacen una sola cosa: la misma tienda vende
   * celulares, instala cámaras y tira cableado. Obligarla a elegir uno la
   * dejaba invisible para dos de cada tres vecinos que la buscaban.
   *
   * Las fichas anteriores no lo traen: quien lo lea debe caer en `categoria`.
   */
  categorias?: string[];
  direccion: string;
  horario: string;
  /** Enlace opcional a Instagram, catálogo, etc. */
  enlace?: string;
  /**
   * Punto exacto del local.
   *
   * La dirección escrita no basta en un pueblo donde media calle no tiene
   * número: "Av. 3, al lado de la panadería" le sirve a quien ya sabe dónde
   * es. Con el punto, cualquiera abre Maps y llega.
   */
  coordenadas?: Coordenadas;
  /** Los negocios del directorio no vencen mientras el dueño los mantenga. */
  permanente: true;
}

/** Un punto en el mapa, como lo entiende Google Maps. */
export interface Coordenadas {
  lat: number;
  lng: number;
}

/**
 * Moto o carro. Son el mismo oficio con distinto vehículo —una persona, una
 * zona que cubre y una tarifa mínima—, así que comparten ficha y se separan en
 * dos directorios por este campo, en vez de duplicar todo el modelo.
 */
export type ClaseTransporte = "mototaxi" | "taxi";

export const CLASES_TRANSPORTE: {
  id: ClaseTransporte;
  etiqueta: string;
  plural: string;
  vehiculo: string;
}[] = [
  { id: "mototaxi", etiqueta: "Mototaxi", plural: "Mototaxis", vehiculo: "la moto" },
  { id: "taxi", etiqueta: "Taxi", plural: "Taxis", vehiculo: "el carro" },
];

export interface PublicacionMototaxi extends PublicacionBase {
  tipo: "mototaxi";
  /**
   * Moto o carro. Los documentos anteriores a los taxis no lo traen, así que
   * quien lo lea debe tratar la ausencia como "mototaxi".
   */
  clase?: ClaseTransporte;
  /**
   * Marca y modelo del vehículo, p. ej. "Bera 150" o "Chevrolet Aveo".
   *
   * Junto con la placa es lo que permite comprobar, antes de montarse, que el
   * que llegó es el que se anunció. Por eso la ficha se pinta como un carnet:
   * foto, nombre, código de miembro y vehículo, todo junto.
   */
  modelo?: string;
  /** Placa del vehículo. Se guarda en mayúsculas y sin guiones. */
  placa?: string;
  /** Sectores que cubre el motorizado. */
  cobertura: string[];
  /** Lo que cuesta la carrera más corta. */
  tarifaDesde: number;
  moneda: Moneda;
  disponible: boolean;
}

/** Quien publica dice si compra o vende dólares, y a qué tasa. */
export type OperacionDivisa = "compra" | "venta";

export type MetodoPago = "pago-movil" | "efectivo" | "zelle" | "binance" | "transferencia";

export interface PublicacionDivisa extends PublicacionBase {
  tipo: "divisa";
  operacion: OperacionDivisa;
  /** Qué moneda se compra o se vende. */
  divisa: Divisa;
  /** Bolívares por una unidad de esa moneda. */
  tasa: number;
  /** Cuánto tiene disponible, en su propia moneda. Un solo número: un rango
   *  obligaba a quien publica a pensar dos cifras donde solo tiene una. */
  monto: number;
  metodos: MetodoPago[];
}

/** Rifa del pueblo: premio, precio del número, lotería y día del sorteo. */
export interface PublicacionRifa extends PublicacionBase {
  tipo: "rifa";
  /** Qué se rifa. */
  premio: string;
  precioNumero: number;
  moneda: Moneda;
  /** Lotería con la que juega, p. ej. "Triple Zulia". */
  loteria: string;
  /** Fecha del sorteo en formato ISO corto (AAAA-MM-DD). */
  fechaSorteo: string;
  /** Sorteo del día, p. ej. "Zulia A" o "8:00 pm". Opcional. */
  sorteo?: string;
  /** Cuántos números tiene la rifa. */
  totalNumeros: number;
  /** Cuántos quedan por vender. Lo actualiza quien la organiza. */
  numerosDisponibles: number;
}

/**
 * Alguien pide una carrera y los conductores la ven.
 *
 * Es el camino inverso del directorio: en vez de buscar quién está rodando y
 * escribirle uno por uno, se deja el viaje puesto y el que quiera lo toma.
 * Sirve sobre todo de madrugada y bajo aguacero, que es cuando hay que
 * escribirle a cinco para que conteste uno.
 *
 * Vive dos horas. Una carrera de hace medio día no es una carrera, es basura
 * en el tablón.
 */
export interface PublicacionCarrera extends PublicacionBase {
  tipo: "carrera";
  /** De dónde sale. */
  origen: string;
  /** Adónde va. */
  destino: string;
  /**
   * Punto exacto de recogida, si lo compartió. Es lo que convierte "estoy por
   * el Uveral" en algo a lo que un motorizado puede llegar sin llamar.
   */
  puntoOrigen?: Coordenadas;
  /** Si prefiere moto, carro, o le da igual. */
  prefiere: ClaseTransporte | "cualquiera";
  /** Lo que ofrece pagar, si lo quiso decir. 0 significa "a convenir". */
  pago: number;
  moneda: Moneda;
}

export type Publicacion =
  | PublicacionProducto
  | PublicacionNegocio
  | PublicacionMototaxi
  | PublicacionDivisa
  | PublicacionRifa
  | PublicacionCarrera;

/* ----------------------------------------------------------------- */
/* Reportes                                                           */
/* ----------------------------------------------------------------- */

/**
 * Por qué alguien reporta algo.
 *
 * La lista es corta a propósito: con veinte motivos nadie elige bien y la
 * cola de moderación se llena de "otro". Estos cinco cubren lo que de verdad
 * pasa en un grupo de compraventa.
 */
export type MotivoReporte =
  | "estafa"
  | "no-existe"
  | "precio-enganoso"
  | "ofensivo"
  | "repetido"
  | "otro";

export const MOTIVOS_REPORTE: { id: MotivoReporte; etiqueta: string; ayuda: string }[] = [
  { id: "estafa", etiqueta: "Es una estafa", ayuda: "Cobró y no entregó, o pidió adelanto sospechoso." },
  { id: "no-existe", etiqueta: "Lo que ofrece no existe", ayuda: "El artículo o el negocio no es real." },
  { id: "precio-enganoso", etiqueta: "El precio engaña", ayuda: "Anuncia un precio y al escribir cobra otro." },
  { id: "ofensivo", etiqueta: "Contenido ofensivo", ayuda: "Insultos, violencia o algo que no va aquí." },
  { id: "repetido", etiqueta: "Está repetido", ayuda: "La misma publicación varias veces." },
  { id: "otro", etiqueta: "Otra cosa", ayuda: "Cuéntanos qué pasa." },
];

export type EstadoReporte = "abierto" | "resuelto" | "descartado";

/**
 * Un aviso de la comunidad. Vive en `reportes/{id}`.
 *
 * Solo la administración los lee: quién reportó a quién no puede ser público
 * en un pueblo donde todos se conocen, o nadie volvería a reportar.
 */
export interface Reporte {
  id: string;
  /** Qué se reporta: un anuncio concreto o la persona detrás. */
  sobre: "publicacion" | "miembro";
  /** Id de la publicación, o uid del miembro. */
  objetivoId: string;
  /** Copia de lo reportado, para que la cola se entienda sin abrir nada. */
  objetivoTitulo: string;
  objetivoAutorUid: string;
  motivo: MotivoReporte;
  detalle: string;
  reportanteUid: string;
  reportanteCodigo: string;
  reportanteNombre: string;
  creadoEn: number;
  estado: EstadoReporte;
  resueltoEn?: number;
  resueltoPor?: string;
}

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

/** La sala del chat en vivo. Hoy solo existe la general. */
export type SalaId = "general";

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
  /**
   * El documento guarda además `expiraEn` como Timestamp de Firestore
   * (creadoEn + 36 h), que es lo que lee la política TTL para borrarlo.
   * No se declara aquí porque la interfaz nunca lo lee: para saber si un
   * mensaje sigue vigente basta con `creadoEn`.
   */
}
