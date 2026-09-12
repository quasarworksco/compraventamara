"use client";

/**
 * Botón de contacto directo por WhatsApp.
 *
 * Es el cierre natural de cualquier trato del grupo: la web presenta la oferta
 * y la conversación sigue donde la gente ya está.
 */
import { enlaceWhatsApp } from "@/lib/formato";
import { IconWhatsApp } from "./icons";

export function BotonWhatsApp({
  telefono,
  mensaje,
  etiqueta = "Escribir por WhatsApp",
  compacto = false,
}: {
  telefono: string;
  mensaje: string;
  etiqueta?: string;
  /** Versión de icono solo, para listas densas. */
  compacto?: boolean;
}) {
  const href = enlaceWhatsApp(telefono, mensaje);

  if (compacto) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={etiqueta}
        className="pulsable flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-b from-wa-400 to-wa-500 text-[#06302a] shadow-sm shadow-wa-600/25 ring-1 ring-white/25"
      >
        <IconWhatsApp size={21} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pulsable flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-wa-400 to-wa-500 px-4 text-[15px] font-semibold text-[#06302a] shadow-sm shadow-wa-600/25 ring-1 ring-white/25"
    >
      <IconWhatsApp size={20} />
      {etiqueta}
    </a>
  );
}
