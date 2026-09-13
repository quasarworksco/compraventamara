"use client";

/**
 * "Cómo llegar": abre Google Maps con la ruta hasta el local.
 *
 * Va a la ruta y no a la ficha del sitio porque quien toca este botón no
 * quiere ver dónde queda, quiere ir.
 */
import { enlaceComoLlegar } from "@/lib/mapas";
import type { Coordenadas } from "@/lib/types";
import { IconMapa } from "./icons";

export function BotonMapa({
  punto,
  compacto = false,
  etiqueta = "Cómo llegar",
}: {
  punto: Coordenadas;
  compacto?: boolean;
  etiqueta?: string;
}) {
  const comun =
    "pulsable inline-flex items-center justify-center gap-2 rounded-xl bg-surface-2 font-semibold text-fg border border-line";

  return (
    <a
      href={enlaceComoLlegar(punto)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={etiqueta}
      className={
        compacto
          ? `${comun} size-11 shrink-0`
          : `${comun} min-h-11 w-full px-4 text-[15px]`
      }
    >
      <IconMapa size={compacto ? 19 : 18} />
      {compacto ? null : etiqueta}
    </a>
  );
}
