"use client";

/**
 * Mototaxis y taxis en la portada.
 *
 * Tiene su sitio propio por la misma razón que el directorio: una ficha de
 * conductor no es una novedad que se agota, es de quién es alguien. Pero se ve
 * distinta, y a propósito: aquí lo que se mira no es la foto de un producto
 * sino quién está rodando ahora mismo, así que manda la cara y la placa.
 *
 * Los disponibles primero, y los que no lo están no salen: enseñar en la
 * portada a alguien que hoy no trabaja no le sirve a nadie.
 */
import Link from "next/link";

import { formatearPlaca, formatearPrecio, iniciales } from "@/lib/formato";
import { estaDestacada, usePublicaciones } from "@/lib/publicaciones";
import type { PublicacionMototaxi } from "@/lib/types";
import { BotonWhatsApp } from "./boton-whatsapp";
import { IconCarro, IconMoto } from "./icons";
import { Avatar, Esqueleto, SelloSeguro, SelloVerificado } from "./ui";

/** Cuántos caben sin que la portada se vuelva el directorio entero. */
const MAXIMO = 8;

export function TransportePortada() {
  const { publicaciones, cargando } = usePublicaciones({ tipo: "mototaxi", tope: 40 });

  const conductores = publicaciones
    .filter((p): p is PublicacionMototaxi => p.tipo === "mototaxi")
    .filter((c) => c.disponible)
    .sort(
      (a, b) =>
        Number(estaDestacada(b)) - Number(estaDestacada(a)) || b.actualizadaEn - a.actualizadaEn,
    )
    .slice(0, MAXIMO);

  // Sin nadie rodando, la franja no dice nada que valga el espacio.
  if (!cargando && conductores.length === 0) return null;

  return (
    <section aria-labelledby="titulo-transporte" className="overflow-hidden">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-4">
        <h2 id="titulo-transporte" className="text-sm font-semibold text-fg-muted">
          Rodando ahora
        </h2>
        <Link href="/mototaxis" className="text-sm font-semibold text-brand-600">
          Mototaxis y taxis
        </Link>
      </div>

      {cargando ? (
        <div className="px-4">
          <Esqueleto className="h-32" />
        </div>
      ) : (
        <ul className="scroll-x flex snap-x snap-mandatory gap-2.5 px-4 pb-1">
          {conductores.map((conductor) => (
            <li key={conductor.id} className="w-[58%] max-w-[215px] shrink-0 snap-start">
              <TarjetaConductor conductor={conductor} />
            </li>
          ))}

          <li className="w-[42%] max-w-[160px] shrink-0 snap-start">
            <Link
              href="/mototaxis"
              className="tarjeta pulsable flex h-full flex-col items-center justify-center gap-2 p-3.5 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-fg-muted">
                <IconMoto size={19} />
              </span>
              <span className="text-sm font-semibold text-fg">Ver todos</span>
              <span className="text-[11px] leading-tight text-fg-subtle">
                O pide una carrera y que te busquen
              </span>
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}

function TarjetaConductor({ conductor }: { conductor: PublicacionMototaxi }) {
  const esTaxi = (conductor.clase ?? "mototaxi") === "taxi";

  return (
    <div className="tarjeta flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar
          size={40}
          url={conductor.autorFoto}
          nombre={iniciales(conductor.autorNombre, conductor.autorApellido)}
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold text-fg">
            <span className="clamp-1">{conductor.autorNombre}</span>
            {conductor.autorSeguro ? (
              <SelloSeguro size={13} />
            ) : conductor.autorVerificado ? (
              <SelloVerificado size={12} />
            ) : null}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-fg-subtle">
            {esTaxi ? <IconCarro size={12} /> : <IconMoto size={12} />}
            <span className="clamp-1">{conductor.modelo || (esTaxi ? "Taxi" : "Moto")}</span>
          </p>
        </div>
      </div>

      {conductor.placa ? (
        <p className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-center text-xs font-bold tracking-widest tabular-nums text-fg">
          {formatearPlaca(conductor.placa)}
        </p>
      ) : null}

      <p className="text-xs text-fg-muted">
        <span className="font-bold text-fg">
          {formatearPrecio(conductor.tarifaDesde, conductor.moneda)}
        </span>{" "}
        mínima
      </p>

      <div className="mt-auto">
        <BotonWhatsApp
          telefono={conductor.autorTelefono}
          etiqueta={`Pedirle una carrera a ${conductor.autorNombre}`}
          mensaje={`Hola ${conductor.autorNombre}, te escribo por Mara Comercio. ¿Estás disponible para una carrera?`}
        />
      </div>
    </div>
  );
}
