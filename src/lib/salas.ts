/**
 * Definición de las salas del chat en vivo.
 *
 * Vive aparte de `chat.ts` a propósito: ese módulo es `"use client"`, y lo que
 * un componente de servidor importa de un módulo de cliente no son los valores
 * sino una referencia opaca. La ruta `/chat/[sala]` valida el parámetro en el
 * servidor, así que necesita el arreglo de verdad.
 */
import type { SalaId } from "./types";

/** Lo que vive un mensaje antes de esfumarse. */
export const HORAS_DE_VIDA = 36;

export const MS_DE_VIDA = HORAS_DE_VIDA * 60 * 60 * 1000;

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

export function esSalaValida(valor: string): valor is SalaId {
  return SALAS.some((sala) => sala.id === valor);
}
