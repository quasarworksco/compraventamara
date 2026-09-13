/**
 * La sala del chat en vivo.
 *
 * Hay una sola, y es deliberado: cuatro salas en un pueblo de este tamaño
 * reparten a la poca gente que está escribiendo en un momento dado, y cuatro
 * salas vacías se sienten más muertas que una con movimiento.
 *
 * La colección de Firestore sigue admitiendo el nombre de sala en la ruta por
 * si algún día vuelven a hacer falta; hoy solo existe "general".
 */
import type { SalaId } from "./types";

/** Lo que vive un mensaje antes de esfumarse. */
export const HORAS_DE_VIDA = 36;

export const MS_DE_VIDA = HORAS_DE_VIDA * 60 * 60 * 1000;

export const SALA_GENERAL: SalaId = "general";
