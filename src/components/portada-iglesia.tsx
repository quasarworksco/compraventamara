"use client";

/**
 * Cabecera de la portada: la iglesia San Rafael Arcángel.
 *
 * Sustituye al dibujo vectorial que había antes. Una foto real del pueblo dice
 * en un segundo lo que ningún texto: esto es San Rafael, y esta es su plaza.
 *
 * La imagen se mueve muy despacio —un acercamiento de treinta segundos que
 * apenas se percibe mientras se lee— y el degradado de encima solo oscurece lo
 * justo donde va el texto, para que la iglesia se vea y la portada no quede
 * apagada.
 */
import Image from "next/image";

import grande from "../../public/iglesia-san-rafael.jpg";

export function PortadaIglesia() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src={grande}
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 100vw, 640px"
        className="acercamiento object-cover object-[center_38%]"
        placeholder="blur"
      />

      {/* Velo de marca. Se mantiene bajo a propósito: la iglesia tiene que
          verse. Lo que sostiene la legibilidad del texto no es oscurecer la
          foto entera, sino la sombra que lleva cada línea (ver .sobre-foto). */}
      <div className="absolute inset-0 bg-linear-to-b from-brand-900/78 via-brand-900/34 to-brand-800/22" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-bg/85 to-transparent" />
    </div>
  );
}
