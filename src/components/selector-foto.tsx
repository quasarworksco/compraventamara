"use client";

/**
 * Selector de foto de perfil.
 *
 * La foto es obligatoria al registrarse: cuando dos personas quedan en una
 * esquina para cambiar dólares en efectivo, poder reconocer a la otra es
 * parte de la seguridad del trato.
 */
import { useRef, useState } from "react";

import { subirImagen } from "@/lib/cloudinary";
import { IconCamera, IconSpinner } from "./icons";

export function SelectorFoto({
  valor,
  onCambio,
  onError,
}: {
  valor: string;
  onCambio: (url: string) => void;
  onError: (mensaje: string) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    try {
      onCambio(await subirImagen(archivo, "miembros"));
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo}
        className="relative size-28 overflow-hidden rounded-full border-2 border-dashed border-line bg-surface-2 text-fg-subtle active:opacity-80"
        aria-label={valor ? "Cambiar foto" : "Agregar foto"}
      >
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={valor} alt="Tu foto de perfil" className="size-full object-cover" />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1">
            <IconCamera size={26} />
            <span className="text-xs font-medium">Tu foto</span>
          </span>
        )}

        {subiendo ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <IconSpinner size={26} />
          </span>
        ) : null}
      </button>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => elegir(e.target.files?.[0])}
      />

      <p className="max-w-60 text-center text-xs text-fg-subtle">
        Una foto tuya, clara y de frente. Puedes tomarla ahora o elegirla de tu galería. Es
        lo que verán los demás al cerrar un trato.
      </p>
    </div>
  );
}
