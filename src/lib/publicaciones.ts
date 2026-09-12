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
  doc,
  limit as limitar,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import { normalizarBusqueda } from "./formato";
import type { Miembro, Publicacion, TipoPublicacion } from "./types";

const COLECCION = "publicaciones";

export interface OpcionesLista {
  tipo?: TipoPublicacion;
  autorUid?: string;
  /** Número máximo de documentos a traer. */
  tope?: number;
}

export interface ResultadoLista {
  publicaciones: Publicacion[];
  cargando: boolean;
  error: string | null;
}

/** Suscripción en vivo a las publicaciones activas. */
export function usePublicaciones(opciones: OpcionesLista = {}): ResultadoLista {
  const { tipo, autorUid, tope = 60 } = opciones;
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseListo) {
      setCargando(false);
      return;
    }

    const restricciones: QueryConstraint[] = [];
    if (tipo) restricciones.push(where("tipo", "==", tipo));
    if (autorUid) restricciones.push(where("autorUid", "==", autorUid));
    else restricciones.push(where("estado", "==", "activa"));
    restricciones.push(orderBy("creadaEn", "desc"), limitar(tope));

    setCargando(true);
    return onSnapshot(
      query(collection(db(), COLECCION), ...restricciones),
      (snapshot) => {
        setPublicaciones(
          snapshot.docs.map((d) => ({ ...(d.data() as Publicacion), id: d.id })),
        );
        setCargando(false);
        setError(null);
      },
      (fallo) => {
        setError(fallo.message);
        setCargando(false);
      },
    );
  }, [tipo, autorUid, tope]);

  return { publicaciones, cargando, error };
}

/** Suscripción a una publicación concreta. */
export function usePublicacion(id: string) {
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!firebaseListo || !id) {
      setCargando(false);
      return;
    }
    return onSnapshot(
      doc(db(), COLECCION, id),
      (snapshot) => {
        setPublicacion(
          snapshot.exists() ? ({ ...(snapshot.data() as Publicacion), id: snapshot.id }) : null,
        );
        setCargando(false);
      },
      () => setCargando(false),
    );
  }, [id]);

  return { publicacion, cargando };
}

/** Campos que aporta quien publica; el resto se deriva de su perfil. */
export type BorradorPublicacion = Omit<
  Publicacion,
  | "id"
  | "creadaEn"
  | "actualizadaEn"
  | "estado"
  | "autorUid"
  | "autorCodigo"
  | "autorNombre"
  | "autorApellido"
  | "autorTelefono"
  | "autorFoto"
  | "autorVerificado"
>;

/**
 * Guarda una publicación copiando los datos del autor dentro del documento.
 * Duplicar el nombre y el teléfono evita una segunda lectura por tarjeta, que
 * en una lista de 40 artículos se nota tanto en velocidad como en cuota.
 */
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
    autorUid: autor.uid,
    autorCodigo: autor.codigo,
    autorNombre: autor.nombre,
    autorApellido: autor.apellido,
    autorTelefono: autor.telefono,
    autorFoto: autor.fotoUrl,
    autorVerificado: autor.verificado,
  });
  return referencia.id;
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
      const heno = normalizarBusqueda(
        `${p.titulo} ${p.descripcion} ${p.zona} ${p.autorNombre} ${p.autorApellido}`,
      );
      return busqueda.split(/\s+/).every((palabra) => heno.includes(palabra));
    });
  }, [publicaciones, texto, categoria]);
}
