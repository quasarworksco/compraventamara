"use client";

/**
 * Qué estaciones de servicio están surtiendo hoy en el municipio.
 *
 * Es el dato más buscado del pueblo y llega cada día por WhatsApp, en un
 * mensaje escrito a mano. Así que el panel no pide siete formularios: se pega
 * el mensaje tal como llegó y se interpreta aquí.
 *
 * Y caduca. Un parte de gasolina de ayer no es información vieja, es una
 * información que hace daño: manda a alguien a cruzar el municipio con el
 * tanque en reserva para encontrar la bomba cerrada. Pasadas las horas de
 * vigencia deja de mostrarse, y la portada dice que no hay parte de hoy en vez
 * de enseñar el de ayer.
 */
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db, firebaseListo } from "./firebase";

/** Cuánto vale un parte antes de dejar de mostrarse. */
export const HORAS_VIGENCIA_ESTACIONES = 24;

export type Combustible = "gasolina" | "diesel";

export interface Estacion {
  nombre: string;
  combustibles: Combustible[];
}

export interface ParteEstaciones {
  estaciones: Estacion[];
  /** Cuándo se cargó. Es lo que decide si todavía vale. */
  actualizadoEn: number;
  /** La hora que decía el mensaje original, si la traía. */
  horaDelParte?: string;
}

const VACIO: ParteEstaciones = { estaciones: [], actualizadoEn: 0 };

/**
 * Interpreta el mensaje de WhatsApp.
 *
 * Llega siempre con la misma forma —una línea por estación, precedida de un
 * emoji, y el combustible entre paréntesis sin cerrar— pero escrito a mano por
 * una persona distinta cada día, así que se aceptan las variantes: con o sin
 * paréntesis, con "Y" o con coma, en mayúsculas o no.
 *
 * Los emojis se descartan: en esta plataforma no se usan, y los iconos los
 * pone la interfaz.
 */
export function leerParte(texto: string): { estaciones: Estacion[]; hora?: string } {
  const lineas = texto.split(/\r?\n/);

  // La cabecera suele traer la hora a la que se hizo el recorrido, y es justo
  // lo que le da valor al parte: "están surtiendo" no significa nada sin ella.
  const hora = texto.match(/\b(\d{1,2}[:.]\d{2}\s*(?:[AaPp]\.?\s*[Mm]\.?)?)/)?.[1]?.trim();

  const estaciones: Estacion[] = [];

  for (const cruda of lineas) {
    // Fuera emojis, viñetas y espacios raros.
    const linea = cruda
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}️]/gu, " ")
      .replace(/[•*\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!linea) continue;
    // La cabecera del mensaje no es una estación.
    if (/informo|estaci[oó]n(es)?\s+que|surtiendo|municipio\s+mara\s+hora/i.test(linea)) continue;

    const combustibles: Combustible[] = [];
    if (/gasolina/i.test(linea)) combustibles.push("gasolina");
    if (/di[eé]sel|diesel|gasoil|gasoil/i.test(linea)) combustibles.push("diesel");

    // Sin combustible nombrado no se sabe qué se está diciendo; mejor no
    // adivinar, que aquí adivinar manda a alguien a hacer una cola inútil.
    if (combustibles.length === 0) continue;

    const nombre = linea
      .replace(/\(?\s*(gasolina|di[eé]sel|diesel|gasoil)\s*\)?/gi, " ")
      .replace(/\s+[yY]\s*$/g, " ")
      .replace(/[(),]/g, " ")
      .replace(/\s+[yY]\s+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (nombre.length < 2 || nombre.length > 80) continue;
    estaciones.push({ nombre, combustibles });
  }

  return { estaciones, hora };
}

/** Verdadero mientras el parte siga valiendo. */
export function parteVigente(parte: ParteEstaciones, ahora: number): boolean {
  if (parte.actualizadoEn <= 0 || parte.estaciones.length === 0) return false;
  return ahora - parte.actualizadoEn < HORAS_VIGENCIA_ESTACIONES * 3_600_000;
}

export function useEstaciones(): { parte: ParteEstaciones; cargando: boolean } {
  const [estado, setEstado] = useState<{ listo: boolean; parte: ParteEstaciones }>({
    listo: false,
    parte: VACIO,
  });

  useEffect(() => {
    if (!firebaseListo) return;
    return onSnapshot(
      doc(db(), "configuracion", "estaciones"),
      (snapshot) =>
        setEstado({
          listo: true,
          parte: snapshot.exists() ? (snapshot.data() as ParteEstaciones) : VACIO,
        }),
      () => setEstado({ listo: true, parte: VACIO }),
    );
  }, []);

  return { parte: estado.parte, cargando: !estado.listo };
}

export async function guardarParte(
  estaciones: Estacion[],
  horaDelParte?: string,
): Promise<void> {
  await setDoc(doc(db(), "configuracion", "estaciones"), {
    estaciones: estaciones.slice(0, 40),
    actualizadoEn: Date.now(),
    ...(horaDelParte ? { horaDelParte } : {}),
  });
}

/** Retira el parte del día, cuando deja de ser cierto antes de las 24 horas. */
export async function borrarParte(): Promise<void> {
  await setDoc(doc(db(), "configuracion", "estaciones"), {
    estaciones: [],
    actualizadoEn: 0,
  });
}
