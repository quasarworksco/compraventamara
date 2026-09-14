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

/**
 * Las tasas del día, refrescadas solas.
 *
 * Antes solo se consultaban al montar el componente, y eso bastaba mientras la
 * gente entrara y saliera. No basta en un móvil: la página queda abierta en
 * segundo plano, se vuelve a ella horas después y la cifra que se lee es la de
 * la mañana. El dólar se mueve varias veces al día, así que una tasa vieja
 * mostrada con seguridad es peor que no mostrar ninguna.
 *
 * De ahí los dos disparos: cada media hora mientras la pestaña está abierta, y
 * al volver a ella, que es justo cuando alguien va a mirar el número.
 */
export function useTasas(): { tasas: Tasas; cargando: boolean } {
  const [tasas, setTasas] = useState<Tasas>(SIN_DATOS);
  const [cargando, setCargando] = useState(true);
  /** Sube cuando toca volver a preguntar. */
  const [ronda, setRonda] = useState(0);

  useEffect(() => {
    const reloj = setInterval(() => setRonda((n) => n + 1), VIDA_CACHE);

    const alVolver = () => {
      if (document.visibilityState === "visible") setRonda((n) => n + 1);
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;

    (async () => {
      // La caché sigue mandando: volver a la pestaña a los dos minutos no
      // tiene por qué gastar una consulta. Lo que se evita es que una cifra
      // caducada se quede en pantalla porque nadie recargó.
      const guardado = leerCache();
      if (guardado) {
        if (vigente) setTasas(guardado);
        return;
      }

      /*
       * Las fuentes se combinan en vez de tomar la primera que conteste algo.
       *
       * Antes se aceptaba la primera respuesta que trajera cualquiera de las
       * dos cifras y se dejaba de preguntar. Eso hacía que si la primera fuente
       * cambiaba el nombre de un campo —y la del BCV es justo el que cambia—,
       * la portada se quedaba con el paralelo y sin la tasa oficial, teniendo
       * la segunda fuente la cifra buena a un paso. Ahora cada hueco se
       * rellena con la primera fuente que lo tenga.
       */
      let bcv: number | null = null;
      let binance: number | null = null;

      for (const fuente of FUENTES) {
        if (bcv !== null && binance !== null) break;
        try {
          const lectura = await fuente(control.signal);
          if (!lectura) continue;
          bcv = bcv ?? lectura.bcv;
          binance = binance ?? lectura.binance;
        } catch {
          // CORS, la fuente caída o la red del visitante: se prueba la siguiente.
        }
      }

      if (bcv !== null || binance !== null) {
        const resultado: Tasas = {
          bcv,
          binance,
          actualizadoEn: Date.now(),
          origen: "api",
        };
        guardarCache(resultado);
        if (vigente) setTasas(resultado);
        return;
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
  }, [ronda]);

  return { tasas, cargando };
}

/**
 * Pregunta a cada fuente por separado y cuenta qué contestó.
 *
 * Existe porque desde fuera no hay manera de saber si una fuente pública dejó
 * de responder, cambió el nombre de un campo o bloqueó al navegador por CORS:
 * lo único que se ve es una portada sin cifra. Con esto, quien administra lo
 * comprueba desde su teléfono en un toque y sabe si tiene que cargar la tasa a
 * mano o si el problema es otro.
 */
export async function probarFuentes(): Promise<
  { nombre: string; bcv: number | null; binance: number | null; fallo?: string }[]
> {
  const control = new AbortController();
  const nombres = ["ve.dolarapi.com", "pydolarve.org"];

  return Promise.all(
    FUENTES.map(async (fuente, indice) => {
      try {
        const lectura = await fuente(control.signal);
        if (!lectura) {
          return { nombre: nombres[indice], bcv: null, binance: null, fallo: "Respondió vacío." };
        }
        return { nombre: nombres[indice], ...lectura };
      } catch (error) {
        return {
          nombre: nombres[indice],
          bcv: null,
          binance: null,
          fallo:
            error instanceof Error
              ? error.message
              : "No se pudo conectar (puede ser CORS o la fuente caída).",
        };
      }
    }),
  );
}

/** Respaldo manual: lo usa un administrador cuando las fuentes fallan. */
export async function guardarTasasManuales(bcv: number, binance: number): Promise<void> {
  await setDoc(doc(db(), "configuracion", "tasas"), {
    bcv,
    binance,
    actualizadoEn: Date.now(),
  });
}
