"use client";

/**
 * Marcar en el mapa dónde queda un local.
 *
 * Dos caminos, y el orden importa: primero el GPS, porque quien registra su
 * negocio casi siempre está dentro de él y con un toque queda la puerta
 * marcada al metro. Pegar un enlace de Maps es el plan B, para quien lo hace
 * desde la casa por la noche.
 */
import { useState } from "react";

import {
  coordenadasLegibles,
  coordenadasValidas,
  enlaceMapa,
  esEnlaceCorto,
  leerCoordenadas,
  ubicacionActual,
} from "@/lib/mapas";
import type { Coordenadas } from "@/lib/types";
import { IconCheck, IconClose, IconLocalizar, IconMapa } from "./icons";
import { Boton, Campo } from "./ui";

export function SelectorUbicacion({
  valor,
  alCambiar,
}: {
  valor: Coordenadas | undefined;
  alCambiar: (punto: Coordenadas | undefined) => void;
}) {
  const [pegado, setPegado] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function tomarDelGps() {
    setFallo(null);
    setBuscando(true);
    try {
      alCambiar(await ubicacionActual());
      setPegado("");
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo tomar la ubicación.");
    } finally {
      setBuscando(false);
    }
  }

  function leerDelEnlace(texto: string) {
    setPegado(texto);
    setFallo(null);
    if (!texto.trim()) return;

    const punto = leerCoordenadas(texto);
    if (punto) {
      alCambiar(punto);
      return;
    }

    setFallo(
      esEnlaceCorto(texto)
        ? "Ese enlace corto no trae la ubicación dentro. Ábrelo en Google Maps y copia el enlace de la barra de direcciones, o usa el botón de arriba estando en el local."
        : "No encontré la ubicación en ese texto. Pega el enlace completo de Google Maps.",
    );
  }

  const puesta = coordenadasValidas(valor);

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-sm font-medium text-fg-muted">Ubicación exacta</p>
        <p className="mt-0.5 text-sm text-fg-subtle">
          La dirección escrita le sirve a quien ya sabe dónde es. Con el punto en el mapa,
          cualquiera llega.
        </p>
      </div>

      {puesta ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-verde-200 bg-verde-50 p-3">
          <IconCheck size={18} className="shrink-0 text-verde-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-verde-600">Ubicación guardada</p>
            <p className="clamp-1 text-xs tabular-nums text-fg-muted">
              {coordenadasLegibles(valor)}
            </p>
          </div>
          <a
            href={enlaceMapa(valor)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold text-brand-600"
          >
            Ver
          </a>
          <button
            type="button"
            onClick={() => {
              alCambiar(undefined);
              setPegado("");
            }}
            aria-label="Quitar la ubicación"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-subtle active:bg-surface-2"
          >
            <IconClose size={17} />
          </button>
        </div>
      ) : null}

      <Boton
        type="button"
        variante="secundario"
        ancho
        cargando={buscando}
        onClick={tomarDelGps}
        icono={<IconLocalizar size={17} />}
      >
        {puesta ? "Volver a tomarla aquí" : "Estoy en el local, tomarla ahora"}
      </Boton>

      <Campo
        etiqueta="O pega el enlace de Google Maps"
        placeholder="https://www.google.com/maps/..."
        value={pegado}
        onChange={(e) => leerDelEnlace(e.target.value)}
        error={fallo ?? undefined}
      />

      {!puesta && !fallo ? (
        <p className="flex items-start gap-1.5 text-xs text-fg-subtle">
          <IconMapa size={14} className="mt-0.5 shrink-0" />
          Es opcional, pero un negocio sin punto en el mapa se encuentra mucho menos.
        </p>
      ) : null}
    </div>
  );
}
