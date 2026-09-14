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

/**
 * Lo que una fuente sabe, con la fecha que ella misma declara.
 *
 * La fecha propia es la parte importante y la que faltaba. Una fuente puede
 * contestar al instante y estar sirviendo la tasa de hace cuatro días: si solo
 * se mira que respondió, esa cifra vieja gana sobre una buena cargada a mano.
 */
type Lectura = {
  bcv: number | null;
  binance: number | null;
  /** Cuándo dice la fuente que cambió cada cifra, si lo dice. */
  bcvEn?: number | null;
  binanceEn?: number | null;
};

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

/** Convierte una fecha en texto a milisegundos, o null si no se entiende. */
function fecha(valor: unknown): number | null {
  if (typeof valor !== "string" || valor.length === 0) return null;
  const marca = Date.parse(valor);
  return Number.isFinite(marca) ? marca : null;
}

/** dolarapi: devuelve una lista con una entrada por fuente. */
async function desdeDolarApi(señal: AbortSignal): Promise<Lectura | null> {
  const respuesta = await fetch("https://ve.dolarapi.com/v1/dolares", { signal: señal });
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as {
    fuente?: string;
    promedio?: number;
    fechaActualizacion?: string;
  }[];
  if (!Array.isArray(datos)) return null;

  const entrada = (fuente: string) => datos.find((d) => d.fuente === fuente);
  const oficial = entrada("oficial");
  const paralelo = entrada("paralelo") ?? entrada("bitcoin");

  return {
    bcv: numero(oficial?.promedio),
    binance: numero(paralelo?.promedio),
    // Esta fecha ya venía en la respuesta y se estaba tirando a la basura.
    bcvEn: fecha(oficial?.fechaActualizacion),
    binanceEn: fecha(paralelo?.fechaActualizacion),
  };
}

/** Lee un monitor de pydolarve, que anida el precio y su fecha. */
function monitorPyDolar(nodo: unknown): { precio: number | null; en: number | null } {
  if (!nodo || typeof nodo !== "object") return { precio: null, en: null };
  const m = nodo as { price?: unknown; last_update?: unknown };
  return { precio: numero(m.price), en: fecha(m.last_update) };
}

/** pydolarve v2. */
async function desdePyDolar(señal: AbortSignal): Promise<Lectura | null> {
  const respuesta = await fetch("https://pydolarve.org/api/v2/tipo-cambio?currency=usd", {
    signal: señal,
  });
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as Record<string, unknown>;
  const sacar = (clave: string) =>
    monitorPyDolar(datos[clave] ?? (datos.monitors as Record<string, unknown> | undefined)?.[clave]);

  const bcv = sacar("bcv");
  const paralelo = sacar("binance").precio !== null ? sacar("binance") : sacar("enparalelovzla");

  return { bcv: bcv.precio, binance: paralelo.precio, bcvEn: bcv.en, binanceEn: paralelo.en };
}

/**
 * pydolarve v1.
 *
 * Se añade como segundo camino a la misma fuente porque la ruta v2 está
 * fallando desde los navegadores del pueblo. No se sustituye una por otra: si
 * mañana v2 vuelve, sigue sirviendo, y mientras tanto esta responde.
 */
async function desdePyDolarV1(señal: AbortSignal): Promise<Lectura | null> {
  const respuesta = await fetch("https://pydolarve.org/api/v1/dollar", { signal: señal });
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as Record<string, unknown>;
  const monitores = (datos.monitors ?? datos) as Record<string, unknown>;

  const bcv = monitorPyDolar(monitores.bcv);
  const paralelo =
    monitorPyDolar(monitores.binance).precio !== null
      ? monitorPyDolar(monitores.binance)
      : monitorPyDolar(monitores.enparalelovzla);

  return { bcv: bcv.precio, binance: paralelo.precio, bcvEn: bcv.en, binanceEn: paralelo.en };
}

const FUENTES = [desdeDolarApi, desdePyDolar, desdePyDolarV1];

/** El nombre de cada fuente, para poder decir cuál falló. */
const NOMBRES = ["ve.dolarapi.com", "pydolarve.org (v2)", "pydolarve.org (v1)"];

/* ----------------------------------------------------------------- */
/* Elegir entre lo que dice cada una                                  */
/* ----------------------------------------------------------------- */

interface Candidato {
  valor: number;
  /** Cuándo cambió la cifra, según quien la publica. */
  en: number;
  origen: "api" | "manual";
}

/**
 * Se queda con la cifra más reciente, no con la primera que llegue.
 *
 * Este es el arreglo de fondo. Antes el respaldo manual solo entraba si TODAS
 * las fuentes fallaban, de modo que una fuente que respondía con la tasa de
 * hace cuatro días le ganaba a la tasa correcta cargada a mano esa mañana.
 * Comparando fechas se resuelve solo, y además se resuelve bien el fin de
 * semana: el BCV no publica sábado ni domingo, así que "vieja" no es lo mismo
 * que "mala" y no se puede descartar por un simple umbral de horas.
 */
function masReciente(a: Candidato | null, b: Candidato | null): Candidato | null {
  if (!a) return b;
  if (!b) return a;
  return b.en > a.en ? b : a;
}

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
       * Se pregunta a todas y se compara, en vez de quedarse con la primera.
       *
       * Antes se aceptaba la primera respuesta que trajera cualquiera de las
       * dos cifras y se dejaba de preguntar, y el respaldo manual solo entraba
       * si TODAS fallaban. Dos consecuencias, las dos vistas en producción: si
       * una fuente cambiaba el nombre de un campo, la portada se quedaba sin
       * esa cifra teniendo otra fuente la buena a un paso; y una fuente que
       * respondía con la tasa de hace cuatro días le ganaba a la tasa correcta
       * cargada a mano esa misma mañana.
       *
       * Ahora cada cifra se decide por su fecha, y el respaldo manual compite
       * de igual a igual.
       */
      let bcv: Candidato | null = null;
      let binance: Candidato | null = null;
      const ahora = Date.now();

      const lecturas = await Promise.all(
        FUENTES.map(async (fuente) => {
          try {
            return await fuente(control.signal);
          } catch {
            // CORS, la fuente caída o la red del visitante: cuenta como nada.
            return null;
          }
        }),
      );

      for (const lectura of lecturas) {
        if (!lectura) continue;
        if (lectura.bcv !== null) {
          // Sin fecha propia, lo más honesto es suponer que es de ahora: es lo
          // que haría cualquiera al leerla, y deja que otra con fecha explícita
          // y más reciente la desbanque.
          bcv = masReciente(bcv, {
            valor: lectura.bcv,
            en: lectura.bcvEn ?? ahora,
            origen: "api",
          });
        }
        if (lectura.binance !== null) {
          binance = masReciente(binance, {
            valor: lectura.binance,
            en: lectura.binanceEn ?? ahora,
            origen: "api",
          });
        }
      }

      // El respaldo manual entra siempre, no solo cuando todo lo demás falla.
      const respaldo = await leerRespaldo();
      if (respaldo?.bcv) {
        bcv = masReciente(bcv, {
          valor: respaldo.bcv,
          en: respaldo.actualizadoEn,
          origen: "manual",
        });
      }
      if (respaldo?.binance) {
        binance = masReciente(binance, {
          valor: respaldo.binance,
          en: respaldo.actualizadoEn,
          origen: "manual",
        });
      }

      if (bcv || binance) {
        const origenes = [bcv?.origen, binance?.origen].filter(Boolean);
        const resultado: Tasas = {
          bcv: bcv?.valor ?? null,
          binance: binance?.valor ?? null,
          bcvEn: bcv?.en,
          binanceEn: binance?.en,
          actualizadoEn: ahora,
          origen: origenes.every((o) => o === origenes[0])
            ? (origenes[0] as "api" | "manual")
            : "mixto",
        };
        guardarCache(resultado);
        if (vigente) setTasas(resultado);
        return;
      }

      if (vigente) setTasas(SIN_DATOS);
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
export interface PruebaDeFuente {
  nombre: string;
  bcv: number | null;
  binance: number | null;
  /** La fecha que declara la propia fuente, si la declara. */
  bcvEn?: number | null;
  binanceEn?: number | null;
  fallo?: string;
}

export async function probarFuentes(): Promise<PruebaDeFuente[]> {
  const control = new AbortController();

  return Promise.all(
    FUENTES.map(async (fuente, indice) => {
      try {
        const lectura = await fuente(control.signal);
        if (!lectura) {
          return { nombre: NOMBRES[indice], bcv: null, binance: null, fallo: "Respondió vacío." };
        }
        return { nombre: NOMBRES[indice], ...lectura };
      } catch (error) {
        return {
          nombre: NOMBRES[indice],
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
