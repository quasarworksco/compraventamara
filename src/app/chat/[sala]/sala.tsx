"use client";

/**
 * Una sala del chat en vivo.
 *
 * Ocupa la pantalla completa, con el campo de escritura fijo abajo: es la
 * disposición que la gente ya conoce de WhatsApp y no hay que explicarla.
 */
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { IconSend, IconSpinner } from "@/components/icons";
import { Avatar, Aviso, Boton } from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { enviarMensaje, useMensajes } from "@/lib/chat";
import { HORAS_DE_VIDA, SALAS } from "@/lib/salas";
import { hora, iniciales } from "@/lib/formato";
import type { Mensaje, SalaId } from "@/lib/types";

export function SalaChat({ sala }: { sala: SalaId }) {
  const { miembro, cargando: cargandoSesion } = useSesion();
  const { mensajes, cargando } = useMensajes(sala);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const finDeLista = useRef<HTMLDivElement>(null);

  const definicion = SALAS.find((s) => s.id === sala);

  // Al llegar un mensaje nuevo, la vista baja sola al final.
  useEffect(() => {
    finDeLista.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!miembro || !texto.trim()) return;

    const borrador = texto;
    setTexto("");
    setEnviando(true);
    setFallo(null);
    try {
      await enviarMensaje(sala, borrador, miembro);
    } catch (error) {
      setTexto(borrador);
      setFallo(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior
        titulo={definicion?.nombre ?? "Chat"}
        subtitulo={`Se borra cada ${HORAS_DE_VIDA} h`}
        volverA="/chat"
      />

      <main className="flex flex-1 flex-col justify-end gap-2 px-3 py-4">
        {cargando ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-fg-subtle">
            <IconSpinner size={18} />
            Cargando la conversación
          </p>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <p className="font-semibold text-fg">La sala está en blanco</p>
            <p className="text-sm text-fg-muted">
              Los mensajes se borraron o todavía nadie ha escrito. Rompe el hielo.
            </p>
          </div>
        ) : (
          mensajes.map((mensaje, indice) => (
            <Burbuja
              key={mensaje.id}
              mensaje={mensaje}
              propio={mensaje.autorUid === miembro?.uid}
              // Los mensajes seguidos del mismo autor no repiten la cabecera.
              agrupado={mensajes[indice - 1]?.autorUid === mensaje.autorUid}
            />
          ))
        )}
        <div ref={finDeLista} />
      </main>

      {/* Escritura */}
      <div className="sticky bottom-0 border-t border-line bg-surface/95 backdrop-blur-md">
        {fallo ? (
          <div className="px-3 pt-3">
            <Aviso tono="error">{fallo}</Aviso>
          </div>
        ) : null}

        {cargandoSesion ? null : miembro ? (
          <form onSubmit={enviar} className="flex items-end gap-2 px-3 py-2.5 pb-safe">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                // Enter envía; Mayús+Enter salta de línea, como en el escritorio.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(e);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Escribe un mensaje"
              aria-label="Escribe un mensaje"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-fg outline-none placeholder:text-fg-subtle"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              aria-label="Enviar"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-45"
            >
              {enviando ? <IconSpinner size={19} /> : <IconSend size={19} />}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2 p-3 pb-safe">
            <p className="text-center text-sm text-fg-muted">
              Para escribir en el chat necesitas una cuenta.
            </p>
            <Link href="/registro">
              <Boton ancho>Crear mi cuenta</Boton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Burbuja({
  mensaje,
  propio,
  agrupado,
}: {
  mensaje: Mensaje;
  propio: boolean;
  agrupado: boolean;
}) {
  return (
    <div className={`flex gap-2 ${propio ? "flex-row-reverse" : ""}`}>
      <div className="w-8 shrink-0">
        {!propio && !agrupado ? (
          <Avatar size={32} url={mensaje.autorFoto} nombre={iniciales(mensaje.autorNombre, "")} />
        ) : null}
      </div>

      <div className={`max-w-[78%] ${propio ? "items-end" : "items-start"} flex flex-col`}>
        {!agrupado ? (
          <p className="mb-0.5 px-1 text-xs text-fg-subtle">
            {propio ? "Tú" : mensaje.autorNombre}
            <span className="ml-1.5">{mensaje.autorCodigo}</span>
          </p>
        ) : null}

        <div
          className={`rounded-2xl px-3.5 py-2 ${
            propio
              ? "rounded-br-md bg-brand-600 text-white"
              : "rounded-bl-md bg-surface text-fg shadow-card"
          }`}
        >
          {mensaje.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mensaje.imagenUrl}
              alt=""
              loading="lazy"
              className="mb-1.5 max-h-64 rounded-lg object-cover"
            />
          ) : null}
          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
            {mensaje.texto}
          </p>
        </div>

        <p className="mt-0.5 px-1 text-[11px] tabular-nums text-fg-subtle">
          {hora(mensaje.creadoEn)}
        </p>
      </div>
    </div>
  );
}
