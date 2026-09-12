"use client";

/** Entrada al chat en vivo: las salas del pueblo. */
import Link from "next/link";

import { CabeceraSeccion } from "@/components/cabecera-seccion";
import { IconChat, IconChevronRight, IconClock } from "@/components/icons";
import { Aviso, Boton } from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { HORAS_DE_VIDA, SALAS } from "@/lib/salas";

export default function PaginaChat() {
  const { miembro, cargando } = useSesion();

  return (
    <>
      <CabeceraSeccion titulo="Chat en vivo" detalle="Conversa con el pueblo ahora mismo" />

      <main className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-start gap-2.5 tarjeta bg-surface-2 p-3.5 text-sm text-fg-muted">
          <IconClock size={17} className="mt-0.5 shrink-0" />
          <p>
            Los mensajes duran {HORAS_DE_VIDA} horas y se borran solos. El chat es para lo de
            hoy, no para guardar conversaciones.
          </p>
        </div>

        <ul className="flex flex-col gap-2.5">
          {SALAS.map((sala) => (
            <li key={sala.id}>
              <Link
                href={`/chat/${sala.id}`}
                className="flex min-h-16 items-center gap-3 tarjeta px-4 active:bg-surface-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                  <IconChat size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold text-fg">{sala.nombre}</span>
                    <span
                      className="pulso relative size-1.5 rounded-full bg-verde-500"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="clamp-1 block text-xs text-fg-muted">{sala.detalle}</span>
                </span>
                <IconChevronRight size={18} className="shrink-0 text-fg-subtle" />
              </Link>
            </li>
          ))}
        </ul>

        {!cargando && !miembro ? (
          <>
            <Aviso>Puedes leer sin cuenta, pero para escribir hay que registrarse.</Aviso>
            <Link href="/registro">
              <Boton ancho>Crear mi cuenta</Boton>
            </Link>
          </>
        ) : null}
      </main>
    </>
  );
}
