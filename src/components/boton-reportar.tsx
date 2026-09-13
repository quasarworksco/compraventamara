"use client";

/**
 * Reportar un anuncio o a una persona.
 *
 * Deliberadamente discreto: un botón pequeño al pie, no una alarma roja en
 * medio de la ficha. La inmensa mayoría de lo que se publica aquí está bien, y
 * una plataforma que grita "¿te están estafando?" en cada pantalla enseña
 * desconfianza en vez de resolverla.
 *
 * Discreto no es escondido. Cuando hace falta está, se llega en dos toques y
 * lo que se envía llega a la cola del panel el mismo día.
 */
import { useState } from "react";

import { useSesion } from "@/lib/auth";
import { mensajeFirestore } from "@/lib/errores";
import { reportar, type BorradorReporte } from "@/lib/reportes";
import { MOTIVOS_REPORTE, type MotivoReporte } from "@/lib/types";
import { IconBandera, IconCheck, IconClose } from "./icons";
import { AreaTexto, Aviso, Boton } from "./ui";

type Objetivo = Omit<BorradorReporte, "motivo" | "detalle">;

export function BotonReportar({ objetivo }: { objetivo: Objetivo }) {
  const { miembro } = useSesion();
  const [abierto, setAbierto] = useState(false);

  // A quien no ha entrado no se le ofrece: el reporte va firmado, y uno
  // anónimo sería una puerta abierta para hundir al vecino que cae mal.
  if (!miembro) return null;
  // Reportarse a uno mismo no tiene sentido, y las reglas lo rechazan igual.
  if (miembro.uid === objetivo.objetivoAutorUid) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-pill px-2.5 text-xs font-medium text-fg-subtle active:bg-surface-2"
      >
        <IconBandera size={14} />
        Reportar
      </button>

      {abierto ? <Formulario objetivo={objetivo} alCerrar={() => setAbierto(false)} /> : null}
    </>
  );
}

function Formulario({ objetivo, alCerrar }: { objetivo: Objetivo; alCerrar: () => void }) {
  const { miembro } = useSesion();
  const [motivo, setMotivo] = useState<MotivoReporte | null>(null);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function enviar() {
    if (!miembro || !motivo) return;
    setEnviando(true);
    setFallo(null);
    try {
      await reportar({ ...objetivo, motivo, detalle }, miembro);
      setListo(true);
    } catch (error) {
      setFallo(mensajeFirestore(error, "guardar"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reportar"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-4 pb-safe sm:rounded-3xl">
        <div className="mb-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-fg">
              {listo ? "Reporte enviado" : "¿Qué pasa con esto?"}
            </h2>
            <p className="clamp-2 text-xs text-fg-subtle">{objetivo.objetivoTitulo}</p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-fg-muted active:bg-surface-2"
          >
            <IconClose size={19} />
          </button>
        </div>

        {listo ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-verde-200 bg-verde-50 p-3.5">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-verde-600" />
              <p className="text-sm text-fg-muted">
                Gracias. La administración lo verá hoy mismo. Lo que mandaste no es público:
                nadie más que ella sabe que fuiste tú.
              </p>
            </div>
            <Boton ancho onClick={alCerrar}>
              Listo
            </Boton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1.5">
              {MOTIVOS_REPORTE.map((opcion) => (
                <li key={opcion.id}>
                  <button
                    type="button"
                    onClick={() => setMotivo(opcion.id)}
                    aria-pressed={motivo === opcion.id}
                    className={`w-full rounded-xl border p-3 text-left ${
                      motivo === opcion.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-line bg-surface"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-fg">{opcion.etiqueta}</span>
                    <span className="block text-xs text-fg-muted">{opcion.ayuda}</span>
                  </button>
                </li>
              ))}
            </ul>

            <AreaTexto
              etiqueta="Cuéntanos qué pasó"
              ayuda="Mientras más concreto, más rápido se resuelve."
              rows={3}
              maxLength={1000}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
            />

            {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

            <Boton
              ancho
              cargando={enviando}
              disabled={!motivo}
              onClick={enviar}
              icono={<IconBandera size={17} />}
            >
              Enviar el reporte
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}
