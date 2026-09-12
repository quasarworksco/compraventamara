"use client";

/** Galería de fotos de una publicación: varias imágenes, con vista previa. */
import { useRef, useState } from "react";

import { miniatura, subirImagen } from "@/lib/cloudinary";
import { IconCamera, IconClose, IconSpinner } from "./icons";

export function SelectorImagenes({
  valores,
  onCambio,
  onError,
  maximo = 5,
}: {
  valores: string[];
  onCambio: (urls: string[]) => void;
  onError: (mensaje: string) => void;
  maximo?: number;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(0);

  async function agregar(archivos: FileList | null) {
    if (!archivos?.length) return;
    const libres = maximo - valores.length;
    if (libres <= 0) {
      onError(`Puedes subir hasta ${maximo} fotos.`);
      return;
    }

    const lote = [...archivos].slice(0, libres);
    setSubiendo(lote.length);
    try {
      // En paralelo: con datos móviles flojos, de una en una se hace eterno.
      const urls = await Promise.all(lote.map((archivo) => subirImagen(archivo)));
      onCambio([...valores, ...urls]);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudieron subir las fotos.");
    } finally {
      setSubiendo(0);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-muted">
        Fotos <span className="text-fg-subtle">({valores.length}/{maximo})</span>
      </span>

      <div className="scroll-x flex gap-2 pb-1">
        {valores.map((url, indice) => (
          <div key={url} className="relative size-24 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={miniatura(url, 240)}
              alt={`Foto ${indice + 1}`}
              className="size-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => onCambio(valores.filter((u) => u !== url))}
              aria-label={`Quitar la foto ${indice + 1}`}
              className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-fg text-bg"
            >
              <IconClose size={15} />
            </button>
            {indice === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-pill bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Portada
              </span>
            ) : null}
          </div>
        ))}

        {Array.from({ length: subiendo }, (_, i) => (
          <div
            key={`subiendo-${i}`}
            className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-subtle"
          >
            <IconSpinner size={22} />
          </div>
        ))}

        {valores.length + subiendo < maximo ? (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-fg-subtle active:bg-surface-2"
          >
            <IconCamera size={22} />
            <span className="text-xs font-medium">Agregar</span>
          </button>
        ) : null}
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          agregar(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="text-xs text-fg-subtle">
        La primera foto es la portada. Se comprimen en tu teléfono antes de subirlas.
      </p>
    </div>
  );
}
