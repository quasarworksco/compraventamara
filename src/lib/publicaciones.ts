"use client";

/**
 * Lectura y escritura de publicaciones en Firestore.
 *
 * Todas las listas se suscriben en vivo (`onSnapshot`): cuando alguien publica
 * un artículo o cambia su tasa del dólar, el resto del grupo lo ve sin recargar.
 */
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit as limitar,
  onSnapshot,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import { normalizarBusqueda } from "./formato";
import {
  DIAS_AVISO_VENCIMIENTO,
  DIAS_VIGENCIA,
  HORAS_VIGENCIA_CARRERA,
  HORAS_VIGENCIA_DOLAR,
  esPermanente,
  MS_POR_DIA,
  MS_POR_HORA,
  type Miembro,
  type Publicacion,
  type PublicacionCarrera,
  type PublicacionDivisa,
  type TipoPublicacion,
} from "./types";

const COLECCION = "publicaciones";

/** Verdadero mientras la publicación siga pagada como destacada. */
export function estaDestacada(publicacion: Publicacion, ahora = Date.now()): boolean {
  return (publicacion.destacadaHasta ?? 0) > ahora;
}

/**
 * El orden por defecto de todos los listados: lo destacado arriba y, dentro de
 * cada grupo, lo más nuevo primero.
 *
 * Destacar se paga, así que tiene que notarse; pero solo reordena, no aparta a
 * nadie. Quien no paga sigue apareciendo completo debajo, que es la diferencia
 * entre un sitio con publicidad y uno donde ya no se puede vender gratis.
 *
 * Las páginas que ofrecen su propio orden —la mejor tasa en divisas, los
 * disponibles primero en transporte— lo sobrescriben, y así debe ser: un
 * destacado no puede convertir "mejor tasa" en una mentira.
 */
function ordenBase(a: Publicacion, b: Publicacion): number {
  const ahora = Date.now();
  return (
    Number(estaDestacada(b, ahora)) - Number(estaDestacada(a, ahora)) ||
    b.creadaEn - a.creadaEn
  );
}

export interface OpcionesLista {
  tipo?: TipoPublicacion;
  autorUid?: string;
  /** Número máximo de documentos a traer. */
  tope?: number;
  /** Tipos que no deben aparecer. Solo aplica cuando no se pidió uno concreto. */
  excluir?: TipoPublicacion[];
}

export interface ResultadoLista {
  publicaciones: Publicacion[];
  cargando: boolean;
  error: string | null;
}

/**
 * Suscripción en vivo a las publicaciones activas.
 *
 * El estado guarda la consulta que lo produjo. Así "está cargando" se deduce
 * comparando esa clave con la actual, en vez de escribir estado dentro del
 * efecto, que provocaría un renderizado en cascada en cada cambio de filtro.
 *
 * La consulta no ordena en el servidor, y es a propósito. Firestore resuelve
 * varias igualdades con los índices que mantiene solo, pero en cuanto se añade
 * un `orderBy` sobre otro campo exige un índice compuesto que hay que crear a
 * mano en la consola. Ordenar aquí evita ese paso de configuración y, con los
 * pocos cientos de anuncios que mueve un pueblo, ni se nota.
 *
 * Si algún día el volumen crece de verdad, el cambio es desplegar los índices
 * y devolver el `orderBy` a la consulta.
 */
export function usePublicaciones(opciones: OpcionesLista = {}): ResultadoLista {
  const { tipo, autorUid, tope = 60, excluir } = opciones;
  const fuera = excluir?.join(",") ?? "";
  const clave = `${tipo ?? ""}|${autorUid ?? ""}|${tope}|${fuera}`;

  const [estado, setEstado] = useState<{
    clave: string;
    publicaciones: Publicacion[];
    error: string | null;
  }>({ clave: "", publicaciones: [], error: null });

  useEffect(() => {
    if (!firebaseListo) return;

    const restricciones: QueryConstraint[] = [];
    if (tipo) restricciones.push(where("tipo", "==", tipo));
    if (autorUid) restricciones.push(where("autorUid", "==", autorUid));
    else restricciones.push(where("estado", "==", "activa"));
    restricciones.push(limitar(tope));

    return onSnapshot(
      query(collection(db(), COLECCION), ...restricciones),
      (snapshot) => {
        setEstado({
          clave,
          publicaciones: snapshot.docs
            .map((d) => ({ ...(d.data() as Publicacion), id: d.id }))
            .sort(ordenBase),
          error: null,
        });
      },
      (fallo) => setEstado({ clave, publicaciones: [], error: fallo.message }),
    );
  }, [clave, tipo, autorUid, tope]);

  const visibles = useMemo(() => {
    if (estado.clave !== clave) return [];
    if (!excluir?.length) return estado.publicaciones;
    return estado.publicaciones.filter((p) => !excluir.includes(p.tipo));
  }, [estado, clave, excluir]);

  return {
    publicaciones: visibles,
    cargando: firebaseListo && estado.clave !== clave,
    error: estado.error,
  };
}

/** Suscripción a una publicación concreta. */
export function usePublicacion(id: string) {
  const [estado, setEstado] = useState<{ clave: string; publicacion: Publicacion | null }>({
    clave: "",
    publicacion: null,
  });

  useEffect(() => {
    if (!firebaseListo || !id) return;
    return onSnapshot(
      doc(db(), COLECCION, id),
      (snapshot) => {
        setEstado({
          clave: id,
          publicacion: snapshot.exists()
            ? { ...(snapshot.data() as Publicacion), id: snapshot.id }
            : null,
        });
      },
      () => setEstado({ clave: id, publicacion: null }),
    );
  }, [id]);

  const resuelto = estado.clave === id;
  return {
    publicacion: resuelto ? estado.publicacion : null,
    cargando: firebaseListo && Boolean(id) && !resuelto,
  };
}

/**
 * `Omit` aplicado a cada miembro de la unión por separado.
 *
 * El `Omit` normal colapsa la unión y se pierde el discriminante `tipo`, con lo
 * que dejaría de poder distinguirse un borrador de rifa de uno de producto.
 */
type OmitirEnCadaTipo<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Lo que la plataforma calcula por su cuenta y quien publica no escribe. */
type CamposDerivados =
  | "id"
  | "creadaEn"
  | "actualizadaEn"
  | "estado"
  | "venceEn"
  | "prorrogas"
  | "autorUid"
  | "autorCodigo"
  | "autorNombre"
  | "autorApellido"
  | "autorTelefono"
  | "autorFoto"
  | "autorVerificado"
  | "autorSeguro";

/** Campos que aporta quien publica; el resto se deriva de su perfil. */
export type BorradorPublicacion = OmitirEnCadaTipo<Publicacion, CamposDerivados>;

/**
 * El borrador de un subconjunto de tipos.
 *
 * Lo usa el formulario de publicar, que cubre lo que se ofrece pero no las
 * carreras que se piden: esas tienen su propio camino, mucho más corto.
 */
export type BorradorDe<T extends TipoPublicacion> = OmitirEnCadaTipo<
  Extract<Publicacion, { tipo: T }>,
  CamposDerivados
>;

/**
 * Guarda una publicación copiando los datos del autor dentro del documento.
 * Duplicar el nombre y el teléfono evita una segunda lectura por tarjeta, que
 * en una lista de 40 artículos se nota tanto en velocidad como en cuota.
 */
/**
 * Cuánto vive cada tipo de publicación.
 *
 * Un anuncio de venta aguanta un mes; una oferta de divisas, seis horas,
 * porque la tasa se mueve varias veces al día; una rifa muere con su sorteo;
 * y la ficha de un negocio del directorio no vence mientras su dueño la
 * mantenga.
 */
function calcularVencimiento(
  tipo: TipoPublicacion,
  datos: { fechaSorteo?: string } = {},
): number {
  const ahora = Date.now();
  switch (tipo) {
    case "divisa":
      return ahora + HORAS_VIGENCIA_DOLAR * MS_POR_HORA;
    case "carrera":
      return ahora + HORAS_VIGENCIA_CARRERA * MS_POR_HORA;
    case "rifa": {
      if (!datos.fechaSorteo) return ahora + DIAS_VIGENCIA * MS_POR_DIA;
      // Un día de gracia tras el sorteo para que se anuncie al ganador.
      return new Date(`${datos.fechaSorteo}T23:59:59Z`).getTime() + MS_POR_DIA;
    }
    case "negocio":
    case "mototaxi":
      return AÑO_2100;
    default:
      return ahora + DIAS_VIGENCIA * MS_POR_DIA;
  }
}

/** Centinela para las fichas que no vencen. */
const AÑO_2100 = new Date("2100-01-01T00:00:00Z").getTime();

/** Días que le quedan de vida a una publicación. */
export function diasDeVida(publicacion: Publicacion): number {
  return Math.ceil((publicacion.venceEn - Date.now()) / MS_POR_DIA);
}

/** Verdadero cuando toca avisar al dueño de que su anuncio está por vencer. */
export function porVencer(publicacion: Publicacion): boolean {
  if (esPermanente(publicacion.tipo)) return false;
  const dias = diasDeVida(publicacion);
  return dias <= DIAS_AVISO_VENCIMIENTO && dias > 0;
}

export function estaVencida(publicacion: Publicacion): boolean {
  return !esPermanente(publicacion.tipo) && publicacion.venceEn <= Date.now();
}

/**
 * Verdadero mientras la publicación siga a la vista del pueblo.
 *
 * Reúne las dos condiciones que antes se repetían sueltas por media aplicación
 * —que su dueño no la haya cerrado y que no se le haya pasado el plazo—, con
 * la excepción de lo que no caduca. Tenerlo en un solo sitio es lo que evita
 * que una sección se olvide de una de las dos y enseñe anuncios muertos.
 */
export function estaVigente(publicacion: Publicacion, ahora = Date.now()): boolean {
  if (publicacion.estado !== "activa") return false;
  return esPermanente(publicacion.tipo) || publicacion.venceEn > ahora;
}

/**
 * Prórroga: devuelve la publicación a los 30 días completos de vigencia.
 * La pide el dueño desde su perfil cuando el sistema le avisa.
 */
export async function prorrogarPublicacion(publicacion: Publicacion): Promise<void> {
  await updateDoc(doc(db(), COLECCION, publicacion.id), {
    venceEn: Date.now() + DIAS_VIGENCIA * MS_POR_DIA,
    prorrogas: (publicacion.prorrogas ?? 0) + 1,
    estado: "activa",
    actualizadaEn: Date.now(),
  });
}

export async function crearPublicacion(
  borrador: BorradorPublicacion,
  autor: Miembro,
): Promise<string> {
  const ahora = Date.now();
  const referencia = await addDoc(collection(db(), COLECCION), {
    ...borrador,
    estado: "activa",
    creadaEn: ahora,
    actualizadaEn: ahora,
    venceEn: calcularVencimiento(
      borrador.tipo,
      borrador.tipo === "rifa" ? { fechaSorteo: borrador.fechaSorteo } : {},
    ),
    prorrogas: 0,
    autorUid: autor.uid,
    autorCodigo: autor.codigo,
    autorNombre: autor.nombre,
    autorApellido: autor.apellido,
    autorTelefono: autor.telefono,
    autorFoto: autor.fotoUrl,
    autorVerificado: autor.verificado,
    autorSeguro: autor.vendedorSeguro === true,
  });
  return referencia.id;
}

/**
 * "Sigo disponible": el cambista confirma su oferta de un toque.
 *
 * Reinicia las seis horas de vigencia y actualiza la marca de confirmación,
 * que es por la que se ordena el tablón. Quien confirma sube al tope; quien
 * no, va bajando hasta desaparecer.
 */
export async function confirmarDisponibilidad(id: string): Promise<void> {
  const ahora = Date.now();
  await updateDoc(doc(db(), COLECCION, id), {
    actualizadaEn: ahora,
    venceEn: ahora + HORAS_VIGENCIA_DOLAR * MS_POR_HORA,
    estado: "activa",
  });
}

/**
 * La oferta de divisas vigente de un miembro, si tiene alguna.
 *
 * Se filtra por un solo campo a propósito. Combinar `tipo` y `autorUid` en la
 * consulta obligaría a crear un índice compuesto a mano en la consola de
 * Firebase; con una sola igualdad basta el índice que Firestore mantiene solo,
 * y el resto se descarta aquí. Nadie tiene tantas publicaciones como para que
 * la diferencia se note.
 */
async function ofertaDivisaActiva(uid: string): Promise<PublicacionDivisa | null> {
  const resultado = await getDocs(
    query(collection(db(), COLECCION), where("autorUid", "==", uid), limitar(100)),
  );

  const vigente = resultado.docs
    .map((d) => ({ ...(d.data() as Publicacion), id: d.id }))
    .filter((p): p is PublicacionDivisa => p.tipo === "divisa")
    .filter((o) => o.estado === "activa" && o.venceEn > Date.now())
    .sort((a, b) => b.creadaEn - a.creadaEn)[0];

  return vigente ?? null;
}

/**
 * Publica o actualiza la oferta de divisas de un miembro.
 *
 * Cada persona tiene una sola oferta viva: si ya tenía una, se reescribe en
 * lugar de crear otra. Sin esta regla, un solo cambista podría tapar el
 * tablón con diez tasas distintas y dejar fuera al resto del pueblo.
 */
export async function publicarOfertaDivisa(
  borrador: BorradorPublicacion & { tipo: "divisa" },
  autor: Miembro,
): Promise<{ id: string; reemplazada: boolean }> {
  const previa = await ofertaDivisaActiva(autor.uid);
  if (!previa) {
    return { id: await crearPublicacion(borrador, autor), reemplazada: false };
  }

  const ahora = Date.now();
  await updateDoc(doc(db(), COLECCION, previa.id), {
    ...borrador,
    estado: "activa",
    actualizadaEn: ahora,
    venceEn: ahora + HORAS_VIGENCIA_DOLAR * MS_POR_HORA,
    // Los datos del autor se refrescan por si cambió su foto o su teléfono.
    autorNombre: autor.nombre,
    autorApellido: autor.apellido,
    autorTelefono: autor.telefono,
    autorFoto: autor.fotoUrl,
    autorVerificado: autor.verificado,
    autorSeguro: autor.vendedorSeguro === true,
  });

  return { id: previa.id, reemplazada: true };
}

/**
 * Pedir una carrera.
 *
 * Una sola viva por persona, igual que con las divisas: si alguien pudiera
 * dejar cinco peticiones, el tablón de los conductores sería suyo. Volver a
 * pedir reemplaza la anterior, que es lo que alguien quiere decir cuando pide
 * de nuevo.
 */
export async function pedirCarrera(
  borrador: BorradorDe<"carrera">,
  autor: Miembro,
): Promise<{ id: string; reemplazada: boolean }> {
  const previa = await carreraActiva(autor.uid);
  if (!previa) {
    return { id: await crearPublicacion(borrador, autor), reemplazada: false };
  }

  const ahora = Date.now();
  await updateDoc(doc(db(), COLECCION, previa.id), {
    ...borrador,
    estado: "activa",
    actualizadaEn: ahora,
    venceEn: ahora + HORAS_VIGENCIA_CARRERA * MS_POR_HORA,
    autorNombre: autor.nombre,
    autorApellido: autor.apellido,
    autorTelefono: autor.telefono,
    autorFoto: autor.fotoUrl,
    autorVerificado: autor.verificado,
    autorSeguro: autor.vendedorSeguro === true,
  });

  return { id: previa.id, reemplazada: true };
}

/** La carrera vigente de alguien, si tiene alguna pedida. */
async function carreraActiva(uid: string): Promise<PublicacionCarrera | null> {
  const resultado = await getDocs(
    query(collection(db(), COLECCION), where("autorUid", "==", uid), limitar(100)),
  );

  return (
    resultado.docs
      .map((d) => ({ ...(d.data() as Publicacion), id: d.id }))
      .filter((p): p is PublicacionCarrera => p.tipo === "carrera")
      .filter((c) => estaVigente(c))
      .sort((a, b) => b.creadaEn - a.creadaEn)[0] ?? null
  );
}

/**
 * Corrige una publicación ya creada.
 *
 * Solo viajan los campos que su dueño puede cambiar. Quedan fuera a
 * propósito el autor, el tipo y la fecha de creación: las reglas de Firestore
 * exigen que no se muevan, porque son las que impiden que un anuncio cambie
 * de dueño, se convierta en oferta de divisas o se cuele al primer puesto de
 * los listados.
 */
export async function actualizarPublicacion(
  id: string,
  borrador: BorradorPublicacion,
): Promise<void> {
  const campos: Record<string, unknown> = { ...borrador, actualizadaEn: Date.now() };
  delete campos.tipo;
  await updateDoc(doc(db(), COLECCION, id), campos);
}

/**
 * "Ya lo vendí".
 *
 * Cerrar en vez de borrar. Un anuncio borrado no deja rastro de que sirvió
 * para algo, y sin ese rastro no hay manera de saber cuánto se cierra de
 * verdad aquí —que es la única cifra que dice si la plataforma funciona—.
 * Además, su dueño puede reabrirlo si el trato se cae.
 */
export async function marcarVendida(id: string): Promise<void> {
  const ahora = Date.now();
  await updateDoc(doc(db(), COLECCION, id), {
    estado: "cerrada",
    cerradaEn: ahora,
    actualizadaEn: ahora,
  });
}

/** Devuelve a la venta un anuncio cerrado, si el trato no se dio. */
export async function reabrirPublicacion(publicacion: Publicacion): Promise<void> {
  const ahora = Date.now();
  await updateDoc(doc(db(), COLECCION, publicacion.id), {
    estado: "activa",
    cerradaEn: deleteField(),
    actualizadaEn: ahora,
    // Reabrir un anuncio vencido sin devolverle vigencia lo dejaría cerrándose
    // solo al instante siguiente.
    ...(!esPermanente(publicacion.tipo) && publicacion.venceEn <= ahora
      ? { venceEn: calcularVencimiento(publicacion.tipo) }
      : {}),
  });
}

/**
 * Destacar o dejar de destacar. Solo la administración: las reglas rechazan
 * este campo si lo escribe el autor.
 */
export async function destacarPublicacion(id: string, dias: number): Promise<void> {
  await updateDoc(doc(db(), COLECCION, id), {
    destacadaHasta: dias > 0 ? Date.now() + dias * MS_POR_DIA : deleteField(),
  });
}

export async function cambiarEstadoPublicacion(
  id: string,
  estado: Publicacion["estado"],
): Promise<void> {
  await updateDoc(doc(db(), COLECCION, id), { estado, actualizadaEn: Date.now() });
}

export async function borrarPublicacion(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLECCION, id));
}

/**
 * Filtra en el navegador por texto y categoría.
 *
 * Firestore no hace búsqueda por texto libre, y montar Algolia para un grupo
 * de barrio sería desproporcionado: con los últimos cientos de anuncios en
 * memoria, filtrar aquí es instantáneo.
 */
export function useFiltro(
  publicaciones: Publicacion[],
  texto: string,
  categoria?: string,
): Publicacion[] {
  return useMemo(() => {
    const busqueda = normalizarBusqueda(texto.trim());
    return publicaciones.filter((p) => {
      if (categoria && "categoria" in p && p.categoria !== categoria) return false;
      if (!busqueda) return true;
      // La placa y el modelo entran en el pajar: quien busca un mototaxi por
      // la placa que anotó suele tener una buena razón para hacerlo.
      const vehiculo =
        p.tipo === "mototaxi" ? `${p.modelo ?? ""} ${p.placa ?? ""}` : "";
      const heno = normalizarBusqueda(
        `${p.titulo} ${p.descripcion} ${p.zona} ${p.autorNombre} ${p.autorApellido} ${vehiculo}`,
      );
      return busqueda.split(/\s+/).every((palabra) => heno.includes(palabra));
    });
  }, [publicaciones, texto, categoria]);
}
