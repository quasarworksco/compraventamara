"use client";

/** Tarjeta de un artículo, tienda o mototaxi dentro de una lista. */
import Link from "next/link";

import { miniatura } from "@/lib/cloudinary";
import { formatearPrecio, hace, iniciales } from "@/lib/formato";
import { estaDestacada } from "@/lib/publicaciones";
import type { Publicacion } from "@/lib/types";
import { IconCheck, IconEstrella, IconImage, IconPin } from "./icons";
import { Avatar, Insignia, SelloSeguro, SelloVerificado } from "./ui";

export function TarjetaPublicacion({
  publicacion,
  indice = 0,
}: {
  publicacion: Publicacion;
  /** Posición en la lista, para escalonar la entrada. */
  indice?: number;
}) {
  const portada = publicacion.imagenes[0];
  const destacada = estaDestacada(publicacion);
  const vendida = publicacion.estado === "cerrada";

  // Las cinco primeras entran escalonadas; de ahí en adelante, todas a la vez,
  // para que bajar por una lista larga no se sienta lento.
  const retardo = `${Math.min(indice, 4) * 55}ms`;

  return (
    <Link
      href={`/publicacion/?id=${publicacion.id}`}
      className={`tarjeta pulsable asoma relative flex gap-3 p-2.5 ${
        destacada ? "ring-2 ring-brand-400" : ""
      }`}
      style={{ animationDelay: retardo }}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={miniatura(portada, 320)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-fg-subtle">
            <IconImage size={26} />
          </span>
        )}

        {/* Vendido: la foto se apaga y lo dice encima. Sigue viéndose lo que
            era, que es justo el punto de no borrarlo. */}
        {vendida ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="flex items-center gap-1 rounded-pill bg-white/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-fg">
              <IconCheck size={12} />
              Vendido
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <h3 className="clamp-2 text-[15px] font-semibold leading-snug text-fg">
            {publicacion.titulo}
          </h3>

          {publicacion.tipo === "producto" ? (
            <p className="mt-1 text-[17px] font-bold text-brand-600 dark:text-brand-300">
              {formatearPrecio(publicacion.precio, publicacion.moneda)}
            </p>
          ) : publicacion.tipo === "mototaxi" ? (
            <p className="mt-1 text-[15px] font-bold text-brand-600 dark:text-brand-300">
              Desde {formatearPrecio(publicacion.tarifaDesde, publicacion.moneda)}
            </p>
          ) : publicacion.tipo === "negocio" ? (
            <p className="clamp-1 mt-1 text-sm text-fg-muted">{publicacion.categoria}</p>
          ) : null}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Avatar
            size={20}
            url={publicacion.autorFoto}
            nombre={iniciales(publicacion.autorNombre, publicacion.autorApellido)}
          />
          <span className="clamp-1 min-w-0">{publicacion.autorNombre}</span>
          {publicacion.autorSeguro ? (
            <SelloSeguro size={14} />
          ) : publicacion.autorVerificado ? (
            <SelloVerificado size={13} />
          ) : null}
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{hace(publicacion.creadaEn)}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {destacada ? (
            <Insignia tono="marca">
              <IconEstrella size={11} />
              Destacado
            </Insignia>
          ) : null}
          <Insignia>
            <IconPin size={12} />
            {publicacion.zona}
          </Insignia>
          {publicacion.tipo === "producto" && publicacion.condicion === "nuevo" ? (
            <Insignia tono="marca">Nuevo</Insignia>
          ) : null}
          {publicacion.tipo === "mototaxi" && publicacion.disponible ? (
            <Insignia tono="compra">Disponible</Insignia>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
