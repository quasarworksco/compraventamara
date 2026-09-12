"use client";

/**
 * Reloj compartido para las vistas que dependen del paso del tiempo.
 *
 * Leer `Date.now()` durante el render es impuro: React puede repetir un render
 * y obtener dos valores distintos. Además, sin un reloj el tablón de divisas
 * se quedaría congelado —una oferta vencida seguiría a la vista hasta que el
 * usuario recargara—. Con esto, la cuenta atrás avanza sola.
 */
import { useEffect, useState } from "react";

/** Devuelve la hora actual, refrescada cada `intervalo` milisegundos. */
export function useAhora(intervalo = 60_000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [intervalo]);

  return ahora;
}
