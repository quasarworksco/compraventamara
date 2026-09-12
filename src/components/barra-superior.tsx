"use client";

/** Cabecera de las pantallas interiores: volver, título y una acción opcional. */
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { IconChevronLeft } from "./icons";

export function BarraSuperior({
  titulo,
  subtitulo,
  accion,
  /** Ruta a la que volver si no hay historial (entrada directa por enlace). */
  volverA = "/",
}: {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
  volverA?: string;
}) {
  const router = useRouter();

  return (
    <header className="cristal-barra sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(volverA))}
          aria-label="Volver"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-fg-muted hover:bg-surface-2"
        >
          <IconChevronLeft size={22} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="clamp-1 text-base font-semibold text-fg">{titulo}</h1>
          {subtitulo ? <p className="clamp-1 text-xs text-fg-muted">{subtitulo}</p> : null}
        </div>

        {accion ? <div className="shrink-0">{accion}</div> : null}
      </div>
    </header>
  );
}
