"use client";

/**
 * Tasas del día para la portada.
 *
 * Primero se intenta la API pública (vía `/api/tasas`). Si falla —la fuente se
 * cae más a menudo de lo que uno quisiera— se usa el respaldo que un admin
 * escribe a mano en `configuracion/tasas`, para que la portada nunca quede
 * sin cifras.
 */
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import type { Tasas } from "./types";

const SIN_DATOS: Tasas = {
  bcv: null,
  binance: null,
  actualizadoEn: 0,
  origen: "sin-datos",
};

async function leerRespaldo(): Promise<Tasas | null> {
  if (!firebaseListo) return null;
  try {
    const snapshot = await getDoc(doc(db(), "configuracion", "tasas"));
    if (!snapshot.exists()) return null;
    const datos = snapshot.data() as Partial<Tasas>;
    return {
      bcv: datos.bcv ?? null,
      binance: datos.binance ?? null,
      actualizadoEn: datos.actualizadoEn ?? 0,
      origen: "manual",
    };
  } catch {
    return null;
  }
}

export function useTasas(): { tasas: Tasas; cargando: boolean } {
  const [tasas, setTasas] = useState<Tasas>(SIN_DATOS);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const respuesta = await fetch("/api/tasas");
        const desdeApi = (await respuesta.json()) as Tasas;
        if (desdeApi.bcv !== null || desdeApi.binance !== null) {
          if (vigente) setTasas(desdeApi);
          return;
        }
      } catch {
        // Se intenta el respaldo justo abajo.
      }

      const respaldo = await leerRespaldo();
      if (vigente) setTasas(respaldo ?? SIN_DATOS);
    })().finally(() => {
      if (vigente) setCargando(false);
    });

    return () => {
      vigente = false;
    };
  }, []);

  return { tasas, cargando };
}

/** Respaldo manual: lo usa un administrador cuando la fuente automática falla. */
export async function guardarTasasManuales(bcv: number, binance: number): Promise<void> {
  await setDoc(doc(db(), "configuracion", "tasas"), {
    bcv,
    binance,
    actualizadoEn: Date.now(),
  });
}
