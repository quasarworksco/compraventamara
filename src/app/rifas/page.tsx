"use client";

/**
 * Rifas del pueblo.
 *
 * Lo que la gente necesita ver de un vistazo: qué se rifa, cuánto cuesta el
 * número, con qué lotería juega y qué día sale. Se ordenan por el sorteo más
 * cercano, porque es el que urge.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { CabeceraSeccion, ChipsFiltro } from "@/components/cabecera-seccion";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import { IconClock, IconImage, IconPlus, IconTicket } from "@/components/icons";
import { Avatar, Boton, Esqueleto, EstadoVacio, Insignia } from "@/components/ui";
import { miniatura } from "@/lib/cloudinary";
import {
  diasHasta,
  formatearFecha,
  formatearPrecio,
  iniciales,
  nombreCompleto,
} from "@/lib/formato";
import { LOTERIAS } from "@/lib/pueblo";
import { useFiltro, usePublicaciones } from "@/lib/publicaciones";
import type { PublicacionRifa } from "@/lib/types";

export default function PaginaRifas() {
  const [busqueda, setBusqueda] = useState("");
  const [loteria, setLoteria] = useState<string | null>(null);

  const { publicaciones, cargando } = usePublicaciones({ tipo: "rifa", tope: 100 });
  const filtradas = useFiltro(publicaciones, busqueda);

  const rifas = useMemo(() => {
    return filtradas
      .filter((p): p is PublicacionRifa => p.tipo === "rifa")
      .filter((r) => (loteria ? r.loteria === loteria : true))
      .sort((a, b) => a.fechaSorteo.localeCompare(b.fechaSorteo));
  }, [filtradas, loteria]);

  return (
    <>
      <CabeceraSeccion
        titulo="Rifas"
        detalle="Números en venta y sorteos del pueblo"
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        marcador="Buscar una rifa"
      />

      <ChipsFiltro
        opciones={LOTERIAS}
        valor={loteria}
        onCambio={setLoteria}
        etiquetaTodos="Todas"
      />

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
          </>
        ) : rifas.length === 0 ? (
          <EstadoVacio
            icono={<IconTicket size={26} />}
            titulo="No hay rifas activas"
            detalle="Cuando alguien publique una, aparecerá aquí hasta el día del sorteo."
            accion={
              <Link href="/publicar?tipo=rifa">
                <Boton icono={<IconPlus size={18} />}>Publicar mi rifa</Boton>
              </Link>
            }
          />
        ) : (
          rifas.map((rifa) => <TarjetaRifa key={rifa.id} rifa={rifa} />)
        )}
      </main>
    </>
  );
}

function TarjetaRifa({ rifa }: { rifa: PublicacionRifa }) {
  const dias = diasHasta(rifa.fechaSorteo);
  const portada = rifa.imagenes[0];
  const agotada = rifa.numerosDisponibles <= 0;
  const vendidos = rifa.totalNumeros - rifa.numerosDisponibles;
  const porcentaje =
    rifa.totalNumeros > 0 ? Math.min(100, Math.round((vendidos / rifa.totalNumeros) * 100)) : 0;

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="flex gap-3 p-3.5">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miniatura(portada, 280)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-fg-subtle">
              <IconImage size={24} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="clamp-2 text-[15px] font-semibold leading-snug text-fg">
            {rifa.premio}
          </h2>
          <p className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-300">
            {formatearPrecio(rifa.precioNumero, rifa.moneda)}
            <span className="ml-1 text-xs font-medium text-fg-muted">por número</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Insignia tono="marca">{rifa.loteria}</Insignia>
            {rifa.sorteo ? <Insignia>{rifa.sorteo}</Insignia> : null}
          </div>
        </div>
      </div>

      <div className="border-t border-line px-3.5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <IconClock size={16} className="shrink-0 text-fg-subtle" />
          <span className="clamp-1 flex-1 capitalize text-fg">
            {formatearFecha(rifa.fechaSorteo)}
          </span>
          <span
            className={`shrink-0 text-xs font-semibold ${
              dias < 0 ? "text-fg-subtle" : dias <= 2 ? "text-danger" : "text-fg-muted"
            }`}
          >
            {dias < 0
              ? "Ya se jugó"
              : dias === 0
                ? "Se juega hoy"
                : dias === 1
                  ? "Mañana"
                  : `En ${dias} días`}
          </span>
        </div>

        {/* Cuántos números quedan, de un vistazo. */}
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-fg-muted">
              {agotada
                ? "Números agotados"
                : `Quedan ${rifa.numerosDisponibles} de ${rifa.totalNumeros}`}
            </span>
            <span className="tabular-nums text-fg-subtle">{porcentaje}% vendido</span>
          </div>
          <div
            className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-2"
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Números vendidos"
          >
            <div className="h-full bg-verde-400" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-line p-3.5">
        <Avatar
          size={34}
          url={rifa.autorFoto}
          nombre={iniciales(rifa.autorNombre, rifa.autorApellido)}
        />
        <div className="min-w-0 flex-1">
          <p className="clamp-1 text-sm font-medium text-fg">
            {nombreCompleto(rifa.autorNombre, rifa.autorApellido)}
          </p>
          <p className="text-xs text-fg-subtle">{rifa.autorCodigo}</p>
        </div>
        <BotonWhatsApp
          compacto
          telefono={rifa.autorTelefono}
          etiqueta={`Escribir a ${rifa.autorNombre} por la rifa`}
          mensaje={`Hola ${rifa.autorNombre}, te escribo por Mara Comercio. Quiero comprar números de la rifa de ${rifa.premio}. ¿Cuáles quedan?`}
        />
      </div>
    </article>
  );
}
