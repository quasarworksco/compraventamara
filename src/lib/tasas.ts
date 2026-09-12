"use client";

/**
 * Tasas del día: oficial (BCV) y referencia del mercado (Binance / paralelo).
 *
 * El sitio se publica como HTML estático, así que no hay servidor donde
 * consultar: la lectura ocurre en el navegador de cada visitante. Eso obliga a
 * que la fuente permita CORS, y ninguna fuente pública es del todo fiable, de
 * modo que se intentan varias en orden y, si todas fallan, se usa el respaldo
 * que un administrador escribe a mano desde el panel.
 *
 * La consecuencia práctica: la portada nunca se queda sin cifras, y si algún
 * día las fuentes automáticas dejan de responder, basta con cargar la tasa
 * desde /admin para que el pueblo siga viéndola.
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

/** Las tasas se guardan un rato para no pedirlas en cada navegación. */
const CLAVE_CACHE = "mara-tasas";
const VIDA_CACHE = 30 * 60 * 1000;

type Lectura = { bcv: number | null; binance: number | null };

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

/** dolarapi: devuelve una lista con una entrada por fuente. */
async function desdeDolarApi(señal: AbortSignal): Promise<Lectura | null> {
  const respuesta = await fetch("https://ve.dolarapi.com/v1/dolares", { signal: señal });
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as { fuente?: string; promedio?: number }[];
  if (!Array.isArray(datos)) return null;

  const buscar = (fuente: string) =>
    numero(datos.find((d) => d.fuente === fuente)?.promedio);

  return { bcv: buscar("oficial"), binance: buscar("paralelo") ?? buscar("bitcoin") };
}

/** pydolarve: devuelve los monitores en la raíz del objeto. */
async function desdePyDolar(señal: AbortSignal): Promise<Lectura | null> {
  const respuesta = await fetch("https://pydolarve.org/api/v2/tipo-cambio?currency=usd", {
    signal: señal,
  });
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as Record<string, unknown>;
  const precio = (clave: string) => {
    const nodo = datos[clave] ?? (datos.monitors as Record<string, unknown> | undefined)?.[clave];
    if (nodo && typeof nodo === "object" && "price" in nodo) {
      return numero((nodo as { price?: unknown }).price);
    }
    return null;
  };

  return { bcv: precio("bcv"), binance: precio("binance") ?? precio("enparalelovzla") };
}

const FUENTES = [desdeDolarApi, desdePyDolar];

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

function leerCache(): Tasas | null {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    if (!crudo) return null;
    const guardado = JSON.parse(crudo) as Tasas;
    if (Date.now() - guardado.actualizadoEn > VIDA_CACHE) return null;
    return guardado;
  } catch {
    return null;
  }
}

function guardarCache(tasas: Tasas): void {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(tasas));
  } catch {
    // Si el navegador no deja guardar, se vuelve a pedir la próxima vez.
  }
}

export function useTasas(): { tasas: Tasas; cargando: boolean } {
  const [tasas, setTasas] = useState<Tasas>(SIN_DATOS);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;

    (async () => {
      const guardado = leerCache();
      if (guardado) {
        if (vigente) setTasas(guardado);
        return;
      }

      for (const fuente of FUENTES) {
        try {
          const lectura = await fuente(control.signal);
          if (lectura && (lectura.bcv !== null || lectura.binance !== null)) {
            const resultado: Tasas = { ...lectura, actualizadoEn: Date.now(), origen: "api" };
            guardarCache(resultado);
            if (vigente) setTasas(resultado);
            return;
          }
        } catch {
          // CORS, la fuente caída o la red del visitante: se prueba la siguiente.
        }
      }

      const respaldo = await leerRespaldo();
      if (vigente) setTasas(respaldo ?? SIN_DATOS);
    })().finally(() => {
      if (vigente) setCargando(false);
    });

    return () => {
      vigente = false;
      control.abort();
    };
  }, []);

  return { tasas, cargando };
}

/** Respaldo manual: lo usa un administrador cuando las fuentes fallan. */
export async function guardarTasasManuales(bcv: number, binance: number): Promise<void> {
  await setDoc(doc(db(), "configuracion", "tasas"), {
    bcv,
    binance,
    actualizadoEn: Date.now(),
  });
}
