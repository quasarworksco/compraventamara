"use client";

/**
 * Pantalla de bienvenida.
 *
 * Cubre el primer instante de carga con el logotipo, para que la aplicación
 * no arranque con un destello de página a medio pintar. Se retira sola.
 *
 * Solo aparece una vez por visita: volver del chat o del marketplace no debe
 * costar otra espera. Y no se muestra a quien pidió menos movimiento.
 */
import { useEffect, useState } from "react";

import { Logotipo } from "./logotipo";

const CLAVE = "mara-bienvenida-vista";
const DURACION = 1100;

export function Bienvenida() {
  const [montada, setMontada] = useState(true);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    let yaVista = true;
    try {
      yaVista = sessionStorage.getItem(CLAVE) === "1";
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento (ventana privada) se muestra y ya está.
      yaVista = false;
    }

    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (yaVista || sinMovimiento) {
      // Se retira en el siguiente cuadro, no aquí dentro: escribir estado
      // dentro del efecto provoca un renderizado en cascada.
      const cuadro = requestAnimationFrame(() => setMontada(false));
      return () => cancelAnimationFrame(cuadro);
    }

    const salida = window.setTimeout(() => setSaliendo(true), DURACION);
    const fin = window.setTimeout(() => setMontada(false), DURACION + 420);
    return () => {
      window.clearTimeout(salida);
      window.clearTimeout(fin);
    };
  }, []);

  if (!montada) return null;

  return (
    <div
      aria-hidden="true"
      className={`cielo-mara fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 pb-16 ${
        saliendo ? "bienvenida-sale" : ""
      }`}
    >
      <Logotipo blanco alto={54} className="bienvenida-marca" />
      <p className="bienvenida-marca text-sm font-medium text-brand-100">
        San Rafael del Moján
      </p>
    </div>
  );
}
