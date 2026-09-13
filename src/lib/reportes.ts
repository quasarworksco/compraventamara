"use client";

/**
 * Reportes de la comunidad.
 *
 * Hasta ahora la única moderación era la administración recorriendo la lista a
 * mano. En una plataforma donde la gente queda en persona con efectivo eso no
 * alcanza: quien detecta algo raro es quien está delante, y tiene que poder
 * avisar en el momento.
 *
 * Nadie más que la administración lee estos documentos. En un pueblo donde
 * todos se conocen, un tablón público de quién acusó a quién no se usaría ni
 * una vez.
 */
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit as limitar,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import type { Miembro, MotivoReporte, Publicacion, Reporte } from "./types";

const COLECCION = "reportes";

/**
 * Un renglón por persona y por cosa reportada.
 *
 * El identificador se compone en vez de dejar que Firestore lo invente, y las
 * reglas comprueban que sea exactamente este: así el segundo aviso de alguien
 * sobre lo mismo corrige al primero en lugar de sumarse, y nadie puede
 * enterrar la cola repitiendo.
 */
function identificador(
  sobre: Reporte["sobre"],
  objetivoId: string,
  reportanteUid: string,
): string {
  return `${sobre}_${objetivoId}__${reportanteUid}`;
}

export interface BorradorReporte {
  sobre: Reporte["sobre"];
  objetivoId: string;
  objetivoTitulo: string;
  objetivoAutorUid: string;
  motivo: MotivoReporte;
  detalle: string;
}

export async function reportar(borrador: BorradorReporte, quien: Miembro): Promise<void> {
  if (borrador.objetivoAutorUid === quien.uid) {
    throw new Error("No tiene sentido reportarte a ti mismo.");
  }

  const id = identificador(borrador.sobre, borrador.objetivoId, quien.uid);
  const reporte: Omit<Reporte, "id"> = {
    ...borrador,
    detalle: borrador.detalle.trim().slice(0, 1000),
    reportanteUid: quien.uid,
    reportanteCodigo: quien.codigo,
    reportanteNombre: `${quien.nombre} ${quien.apellido}`.trim(),
    creadoEn: Date.now(),
    estado: "abierto",
  };

  // setDoc y no addDoc: si esta persona ya había reportado esto, corrige su
  // aviso anterior en lugar de abrir otro renglón.
  await setDoc(doc(db(), COLECCION, id), { ...reporte, id });
}

/** Lo que hace falta para reportar una publicación, sacado de ella misma. */
export function reporteDePublicacion(publicacion: Publicacion): Omit<BorradorReporte, "motivo" | "detalle"> {
  return {
    sobre: "publicacion",
    objetivoId: publicacion.id,
    objetivoTitulo: publicacion.titulo,
    objetivoAutorUid: publicacion.autorUid,
  };
}

/** Lo mismo, cuando lo que se reporta es la persona y no un anuncio suyo. */
export function reporteDeMiembro(
  uid: string,
  nombre: string,
  codigo: string,
): Omit<BorradorReporte, "motivo" | "detalle"> {
  return {
    sobre: "miembro",
    objetivoId: uid,
    objetivoTitulo: `${nombre} (${codigo})`,
    objetivoAutorUid: uid,
  };
}

/* ----------------------------------------------------------------- */
/* Panel                                                              */
/* ----------------------------------------------------------------- */

export function useReportes(activo: boolean): { reportes: Reporte[]; cargando: boolean } {
  const [estado, setEstado] = useState<{ listo: boolean; reportes: Reporte[] }>({
    listo: false,
    reportes: [],
  });

  useEffect(() => {
    if (!firebaseListo || !activo) return;
    return onSnapshot(
      query(collection(db(), COLECCION), orderBy("creadoEn", "desc"), limitar(300)),
      (snapshot) =>
        setEstado({
          listo: true,
          reportes: snapshot.docs.map((d) => ({ ...(d.data() as Reporte), id: d.id })),
        }),
      () => setEstado({ listo: true, reportes: [] }),
    );
  }, [activo]);

  return { reportes: estado.reportes, cargando: activo && !estado.listo };
}

export async function resolverReporte(
  id: string,
  estado: "resuelto" | "descartado",
  quien: string,
): Promise<void> {
  await updateDoc(doc(db(), COLECCION, id), {
    estado,
    resueltoEn: Date.now(),
    resueltoPor: quien,
  });
}

/** Devuelve un reporte a la cola, por si se cerró por error. */
export async function reabrirReporte(id: string): Promise<void> {
  await updateDoc(doc(db(), COLECCION, id), { estado: "abierto" });
}
