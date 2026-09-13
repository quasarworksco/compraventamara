"use client";

/**
 * Compartir una publicación, o la plataforma entera.
 *
 * Es la vía de crecimiento que tiene sentido aquí: el pueblo ya conversa por
 * WhatsApp, así que cada anuncio que alguien reenvía a un grupo o a un vecino
 * trae gente nueva sin que haya que pagar publicidad.
 *
 * Se usa el menú de compartir del propio teléfono cuando existe, porque deja
 * elegir destino —WhatsApp, un contacto, una nota—. Cuando no existe, se copia
 * el enlace al portapapeles, que es lo que sí funciona en cualquier navegador
 * de escritorio.
 */
import { useState } from "react";

import { IconCheck, IconCompartir } from "./icons";
import { Boton, type BotonProps } from "./ui";

export function BotonCompartir({
  titulo,
  texto,
  ruta,
  etiqueta = "Compartir",
  variante = "secundario",
  ancho = false,
}: {
  /** Título que verá quien reciba el enlace. */
  titulo: string;
  /** Línea que acompaña al enlace. */
  texto: string;
  /** Ruta dentro del sitio, p. ej. "/publicacion/?id=abc". */
  ruta: string;
  etiqueta?: string;
  variante?: BotonProps["variante"];
  ancho?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    // El origen se lee del navegador para que el enlace sirva igual en el
    // dominio del pueblo, en una vista previa o en desarrollo.
    const enlace = `${window.location.origin}${ruta}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url: enlace });
        return;
      } catch {
        // Si la persona cierra el menú sin elegir, no hay nada que hacer.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto}\n${enlace}`);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Sin portapapeles disponible se abre WhatsApp, que es el destino
      // al que iba a ir de todas formas.
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${texto}\n${enlace}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  return (
    <Boton
      variante={variante}
      ancho={ancho}
      onClick={compartir}
      icono={copiado ? <IconCheck size={17} /> : <IconCompartir size={17} />}
    >
      {copiado ? "Enlace copiado" : etiqueta}
    </Boton>
  );
}
