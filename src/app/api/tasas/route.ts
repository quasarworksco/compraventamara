/**
 * Tasas del dólar del día: oficial (BCV) y referencia P2P (Binance).
 *
 * La consulta se hace en el servidor por dos razones: evita el CORS de la API
 * pública y permite cachear una sola respuesta para todo el pueblo, en vez de
 * que cada teléfono que abre la portada dispare su propia petición.
 */
import { NextResponse } from "next/server";

import type { Tasas } from "@/lib/types";

/** Se refresca cada 30 minutos: las tasas no se mueven más rápido que eso. */
export const revalidate = 1800;

const FUENTE = "https://pydolarve.org/api/v2/tipo-cambio?currency=usd";

interface RespuestaFuente {
  monitors?: Record<string, { price?: number; last_update?: string }>;
  // La v2 devuelve los monitores en la raíz cuando se pide una sola moneda.
  [clave: string]: unknown;
}

function leerPrecio(datos: RespuestaFuente, clave: string): number | null {
  const desdeMonitors = datos.monitors?.[clave]?.price;
  if (typeof desdeMonitors === "number") return desdeMonitors;

  const enRaiz = datos[clave];
  if (enRaiz && typeof enRaiz === "object" && "price" in enRaiz) {
    const precio = (enRaiz as { price?: unknown }).price;
    if (typeof precio === "number") return precio;
  }
  return null;
}

export async function GET() {
  try {
    const respuesta = await fetch(FUENTE, {
      headers: { accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) throw new Error(`La fuente respondió ${respuesta.status}`);

    const datos = (await respuesta.json()) as RespuestaFuente;
    const tasas: Tasas = {
      bcv: leerPrecio(datos, "bcv"),
      binance: leerPrecio(datos, "binance") ?? leerPrecio(datos, "enparalelovzla"),
      actualizadoEn: Date.now(),
      origen: "api",
    };

    // Si la fuente cambió de forma y no se reconoce nada, no servimos ceros.
    if (tasas.bcv === null && tasas.binance === null) {
      throw new Error("La fuente no devolvió ninguna tasa reconocible");
    }

    return NextResponse.json(tasas);
  } catch (error) {
    // La portada se dibuja igual: mostrará el respaldo manual del admin.
    console.error("[tasas] no se pudieron leer las tasas del día:", error);
    const vacio: Tasas = {
      bcv: null,
      binance: null,
      actualizadoEn: Date.now(),
      origen: "sin-datos",
    };
    return NextResponse.json(vacio, { status: 200 });
  }
}
