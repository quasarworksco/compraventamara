"use client";

/**
 * Chat en vivo del pueblo.
 *
 * Los mensajes duran 36 horas y desaparecen. Es deliberado: el chat es para
 * lo que está pasando hoy —quién tiene gas, quién vende, quién va para
 * Maracaibo—, no un archivo permanente de conversaciones.
 *
 * El borrado tiene dos capas que se complementan:
 *  1. La consulta solo pide los mensajes de las últimas 36 horas, así que el
 *     chat se ve reiniciado en el mismo instante en que vencen.
 *  2. Una política TTL de Firestore sobre el campo `expiraEn` borra de verdad
 *     los documentos, sin necesidad de un servidor que haga limpieza.
 *     Se activa en la consola: Firestore -> TTL -> campo `expiraEn`.
 */
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit as limitar,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import type { Mensaje, Miembro, SalaId } from "./types";

/** Lo que vive un mensaje antes de esfumarse. */
export const HORAS_DE_VIDA = 36;
const MS_DE_VIDA = HORAS_DE_VIDA * 60 * 60 * 1000;

/** Cuántos mensajes se traen como máximo al abrir una sala. */
const TOPE_MENSAJES = 200;

export interface Sala {
  id: SalaId;
  nombre: string;
  detalle: string;
}

export const SALAS: Sala[] = [
  { id: "general", nombre: "General", detalle: "Lo que pasa hoy en el pueblo" },
  { id: "mercado", nombre: "Compra y venta", detalle: "Busco, vendo, cambio" },
  { id: "dolar", nombre: "Dólares", detalle: "Tasas y disponibilidad al momento" },
  { id: "mototaxis", nombre: "Mototaxis", detalle: "Carreras y disponibilidad" },
];

/** Suscripción en vivo a los mensajes vigentes de una sala. */
export function useMensajes(sala: SalaId): { mensajes: Mensaje[]; cargando: boolean } {
  const [estado, setEstado] = useState<{ clave: string; mensajes: Mensaje[] }>({
    clave: "",
    mensajes: [],
  });

  useEffect(() => {
    if (!firebaseListo) return;

    // El corte se calcula al suscribirse; el TTL se encarga del resto.
    const corte = Date.now() - MS_DE_VIDA;

    return onSnapshot(
      query(
        collection(db(), "salas", sala, "mensajes"),
        where("creadoEn", ">", corte),
        orderBy("creadoEn", "asc"),
        limitar(TOPE_MENSAJES),
      ),
      (snapshot) => {
        setEstado({
          clave: sala,
          mensajes: snapshot.docs.map((d) => ({ ...(d.data() as Mensaje), id: d.id })),
        });
      },
      () => setEstado({ clave: sala, mensajes: [] }),
    );
  }, [sala]);

  const resuelto = estado.clave === sala;
  return {
    mensajes: resuelto ? estado.mensajes : [],
    cargando: firebaseListo && !resuelto,
  };
}

/** Publica un mensaje en una sala. Devuelve sin esperar a que se confirme. */
export async function enviarMensaje(
  sala: SalaId,
  texto: string,
  autor: Miembro,
  imagenUrl?: string,
): Promise<void> {
  const limpio = texto.trim();
  if (!limpio && !imagenUrl) return;

  const creadoEn = Date.now();
  await addDoc(collection(db(), "salas", sala, "mensajes"), {
    texto: limpio.slice(0, 1000),
    autorUid: autor.uid,
    autorCodigo: autor.codigo,
    autorNombre: autor.nombre,
    autorFoto: autor.fotoUrl,
    ...(imagenUrl ? { imagenUrl } : {}),
    creadoEn,
    // El campo que lee la política TTL de Firestore.
    expiraEn: new Date(creadoEn + MS_DE_VIDA),
  });
}

/** Cuánto le queda de vida a un mensaje, en horas. */
export function horasRestantes(mensaje: Mensaje): number {
  return Math.max(0, Math.ceil((mensaje.creadoEn + MS_DE_VIDA - Date.now()) / 3_600_000));
}
