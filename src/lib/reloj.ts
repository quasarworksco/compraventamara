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

/**
 * Anima un número desde cero hasta su valor.
 *
 * Las tasas del día son la cifra que más se mira de la portada; verlas subir
 * hasta su valor llama la atención sobre ellas sin necesidad de adornos. La
 * curva frena al final, que es lo que hace que el número "aterrice" en lugar
 * de pararse en seco.
 *
 * El avance se guarda junto a la cifra que lo produjo, de modo que "en qué
 * punto va la animación" se deduce al pintar en vez de escribirse dentro del
 * efecto, que provocaría renderizados en cascada.
 */
export function useContador(destino: number | null, duracion = 700): number | null {
  const [estado, setEstado] = useState<{ clave: number | null; avance: number }>({
    clave: null,
    avance: 0,
  });

  useEffect(() => {
    if (destino === null) return;

    // Quien pidió menos movimiento salta directo a la cifra final.
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = sinMovimiento ? 0 : duracion;

    let cuadro = 0;
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const avance = total === 0 ? 1 : Math.min(1, (ahora - inicio) / total);
      // Desaceleración cúbica: frena al llegar en vez de cortarse en seco.
      setEstado({ clave: destino, avance: 1 - Math.pow(1 - avance, 3) });
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };

    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [destino, duracion]);

  if (destino === null) return null;
  return destino * (estado.clave === destino ? estado.avance : 0);
}
