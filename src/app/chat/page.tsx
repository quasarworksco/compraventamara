"use client";

/**
 * Chat en vivo del pueblo.
 *
 * Una sola sala. La disposición imita a WhatsApp a propósito: es la que toda
 * la gente de San Rafael ya sabe usar, así que no hay nada que explicar.
 * Lo propio salió a la derecha en verde, lo ajeno a la izquierda en blanco con
 * el nombre de quien escribe, la hora en la esquina de la burbuja y el campo
 * de escritura anclado abajo.
 *
 * La única diferencia con WhatsApp, y conviene que se note: aquí los mensajes
 * se borran solos a las 36 horas.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { IconClock, IconSend, IconSpinner } from "@/components/icons";
import { Avatar, Aviso, Boton } from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { enviarMensaje, useMensajes } from "@/lib/chat";
import { hora, iniciales } from "@/lib/formato";
import { HORAS_DE_VIDA } from "@/lib/salas";
import type { Mensaje } from "@/lib/types";

export default function PaginaChat() {
  const { miembro, cargando: cargandoSesion } = useSesion();
  const { mensajes, cargando } = useMensajes();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const finDeLista = useRef<HTMLDivElement>(null);

  // Al llegar un mensaje nuevo, la vista baja sola al final.
  useEffect(() => {
    finDeLista.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  /**
   * Los mensajes seguidos de la misma persona se agrupan: solo el primero
   * lleva avatar y nombre, como en cualquier chat.
   */
  const filas = useMemo(
    () =>
      mensajes.map((mensaje, indice) => ({
        mensaje,
        propio: mensaje.autorUid === miembro?.uid,
        agrupado: mensajes[indice - 1]?.autorUid === mensaje.autorUid,
      })),
    [mensajes, miembro?.uid],
  );

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!miembro || !texto.trim()) return;

    const borrador = texto;
    setTexto("");
    setEnviando(true);
    setFallo(null);
    try {
      await enviarMensaje(borrador, miembro);
    } catch (error) {
      setTexto(borrador);
      setFallo(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-chat">
      <BarraSuperior
        titulo="Chat del pueblo"
        subtitulo={`En vivo · se borra cada ${HORAS_DE_VIDA} h`}
        volverA="/"
      />

      <main className="flex flex-1 flex-col justify-end gap-1 px-3 py-4">
        {cargando ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-fg-subtle">
            <IconSpinner size={18} />
            Cargando la conversación
          </p>
        ) : filas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-fg-subtle shadow-card">
              <IconClock size={24} />
            </span>
            <p className="mt-1 font-semibold text-fg">Aquí no hay nada ahora mismo</p>
            <p className="text-sm text-fg-muted">
              Los mensajes duran {HORAS_DE_VIDA} horas y se borran solos. Rompe el hielo.
            </p>
          </div>
        ) : (
          <>
            <p className="mx-auto mb-2 rounded-pill bg-white/80 px-3 py-1 text-xs text-fg-muted shadow-sm">
              Los mensajes se borran a las {HORAS_DE_VIDA} horas
            </p>
            {filas.map(({ mensaje, propio, agrupado }) => (
              <Burbuja
                key={mensaje.id}
                mensaje={mensaje}
                propio={propio}
                agrupado={agrupado}
              />
            ))}
          </>
        )}
        <div ref={finDeLista} />
      </main>

      {/* Escritura */}
      <div className="sticky bottom-0 border-t border-line bg-surface-2/95 backdrop-blur-md">
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
              className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-line bg-surface px-4 py-2.5 text-fg shadow-sm outline-none placeholder:text-fg-subtle"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              aria-label="Enviar"
              className="pulsable flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-wa-400 to-wa-500 text-[#06302a] shadow-md shadow-wa-600/25 disabled:opacity-45"
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
    <div
      className={`burbuja-entra flex items-end gap-2 ${propio ? "flex-row-reverse" : ""} ${
        agrupado ? "mt-0.5" : "mt-2.5"
      }`}
    >
      {/* El hueco del avatar se reserva siempre, para que las burbujas
          seguidas de una misma persona queden alineadas entre sí. */}
      <div className="w-7 shrink-0">
        {!propio && !agrupado ? (
          <Avatar
            size={28}
            url={mensaje.autorFoto}
            nombre={iniciales(mensaje.autorNombre, "")}
          />
        ) : null}
      </div>

      <div
        className={`relative max-w-[76%] px-3 pb-4 pt-2 text-[15px] leading-snug shadow-sm ${
          propio
            ? "rounded-2xl rounded-br-md bg-burbuja-propia text-fg"
            : "rounded-2xl rounded-bl-md bg-white text-fg"
        }`}
      >
        {!propio && !agrupado ? (
          <p className="mb-0.5 text-[13px] font-semibold text-brand-600">
            {mensaje.autorNombre}
            <span className="ml-1.5 font-normal text-fg-subtle">{mensaje.autorCodigo}</span>
          </p>
        ) : null}

        {mensaje.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mensaje.imagenUrl}
            alt=""
            loading="lazy"
            className="mb-1.5 max-h-64 rounded-lg object-cover"
          />
        ) : null}

        <p className="whitespace-pre-wrap break-words pr-10">{mensaje.texto}</p>

        <span className="absolute bottom-1 right-2.5 text-[11px] tabular-nums text-fg-subtle">
          {hora(mensaje.creadoEn)}
        </span>
      </div>
    </div>
  );
}
