"use client";

/**
 * Mototaxis del pueblo: quién está rodando y a qué tarifa.
 *
 * Los disponibles suben arriba: a quien necesita una carrera no le sirve ver
 * primero a los que hoy no están trabajando.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { CabeceraSeccion } from "@/components/cabecera-seccion";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import { IconMoto, IconPin, IconPlus } from "@/components/icons";
import { Avatar, Boton, Esqueleto, EstadoVacio, Insignia, SelloVerificado } from "@/components/ui";
import { formatearPrecio, formatearTelefono, iniciales, nombreCompleto } from "@/lib/formato";
import { useFiltro, usePublicaciones } from "@/lib/publicaciones";
import type { PublicacionMototaxi } from "@/lib/types";

export default function PaginaMototaxis() {
  const [busqueda, setBusqueda] = useState("");
  const { publicaciones, cargando } = usePublicaciones({ tipo: "mototaxi", tope: 100 });
  const filtrados = useFiltro(publicaciones, busqueda);

  const mototaxis = useMemo(
    () =>
      filtrados
        .filter((p): p is PublicacionMototaxi => p.tipo === "mototaxi")
        .sort((a, b) => Number(b.disponible) - Number(a.disponible)),
    [filtrados],
  );

  return (
    <>
      <CabeceraSeccion
        titulo="Mototaxis"
        detalle="Carreras dentro y fuera del pueblo"
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        marcador="Buscar por sector o nombre"
      />

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-32" />
            <Esqueleto className="h-32" />
          </>
        ) : mototaxis.length === 0 ? (
          <EstadoVacio
            icono={<IconMoto size={26} />}
            titulo="Ningún mototaxi registrado"
            detalle="Si trabajas la moto, regístrate y que te consigan cuando te necesiten."
            accion={
              <Link href="/publicar?tipo=mototaxi">
                <Boton icono={<IconPlus size={18} />}>Registrarme</Boton>
              </Link>
            }
          />
        ) : (
          mototaxis.map((moto) => <TarjetaMototaxi key={moto.id} moto={moto} />)
        )}
      </main>
    </>
  );
}

function TarjetaMototaxi({ moto }: { moto: PublicacionMototaxi }) {
  const persona = nombreCompleto(moto.autorNombre, moto.autorApellido);

  return (
    <article className="tarjeta p-3.5">
      <div className="flex items-start gap-3">
        <Avatar
          size={48}
          url={moto.autorFoto}
          nombre={iniciales(moto.autorNombre, moto.autorApellido)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="clamp-1 text-[15px] font-semibold text-fg">{persona}</h2>
            {moto.autorVerificado ? <SelloVerificado /> : null}
          </div>
          <a
            href={`tel:${moto.autorTelefono}`}
            className="text-sm font-medium tabular-nums text-brand-600 dark:text-brand-300"
          >
            {formatearTelefono(moto.autorTelefono)}
          </a>
        </div>

        <Insignia tono={moto.disponible ? "compra" : "neutro"}>
          {moto.disponible ? "Disponible" : "No disponible"}
        </Insignia>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-fg">
          {formatearPrecio(moto.tarifaDesde, moto.moneda)}
        </span>
        <span className="text-sm text-fg-muted">la carrera desde</span>
      </div>

      {moto.descripcion ? (
        <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-fg-muted">{moto.descripcion}</p>
      ) : null}

      {moto.cobertura.length > 0 ? (
        <div className="mt-2.5">
          <p className="mb-1.5 text-xs font-medium text-fg-subtle">Sectores que cubre</p>
          <div className="flex flex-wrap gap-1.5">
            {moto.cobertura.map((sector) => (
              <Insignia key={sector}>
                <IconPin size={12} />
                {sector}
              </Insignia>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <BotonWhatsApp
          telefono={moto.autorTelefono}
          etiqueta="Pedir una carrera"
          mensaje={`Hola ${moto.autorNombre}, te escribo por Mara Comercio. ¿Estás disponible para una carrera?`}
        />
      </div>
    </article>
  );
}
