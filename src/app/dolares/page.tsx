"use client";

/**
 * Compra y venta de dólares en efectivo.
 *
 * Cada oferta muestra la cara, el nombre completo y el teléfono de quien la
 * publica: en un trato de efectivo, saber a quién vas a ver es media seguridad.
 * Mara Comercio no interviene en la operación, solo pone en contacto.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { CabeceraSeccion } from "@/components/cabecera-seccion";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import { IconArrowDown, IconArrowUp, IconDollar, IconPin, IconPlus } from "@/components/icons";
import { Avatar, Aviso, Boton, Esqueleto, EstadoVacio, Insignia, SelloVerificado } from "@/components/ui";
import {
  ETIQUETA_METODO,
  formatearPrecio,
  formatearTasa,
  formatearTelefono,
  hace,
  iniciales,
  nombreCompleto,
} from "@/lib/formato";
import { usePublicaciones } from "@/lib/publicaciones";
import { useTasas } from "@/lib/tasas";
import type { OperacionDivisa, PublicacionDolar } from "@/lib/types";

export default function PaginaDolares() {
  const [operacion, setOperacion] = useState<OperacionDivisa>("venta");
  const { publicaciones, cargando } = usePublicaciones({ tipo: "dolar", tope: 100 });
  const { tasas } = useTasas();

  const ofertas = useMemo(() => {
    const propias = publicaciones.filter(
      (p): p is PublicacionDolar => p.tipo === "dolar" && p.operacion === operacion,
    );
    // Quien vende, más barato primero; quien compra, mejor pagador primero.
    return propias.sort((a, b) => (operacion === "venta" ? a.tasa - b.tasa : b.tasa - a.tasa));
  }, [publicaciones, operacion]);

  return (
    <>
      <CabeceraSeccion titulo="Dólares" detalle="Efectivo en mano, entre vecinos" />

      {/* Referencia del día, para saber si una oferta está en precio. */}
      <div className="mx-4 mt-3 flex gap-2 rounded-card border border-line bg-surface p-3 text-sm shadow-card">
        <Referencia nombre="BCV" valor={tasas.bcv} />
        <span className="w-px bg-line" aria-hidden="true" />
        <Referencia nombre="Binance" valor={tasas.binance} />
      </div>

      {/* Conmutador compra / venta */}
      <div
        role="tablist"
        aria-label="Tipo de operación"
        className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
      >
        <Pestana
          activa={operacion === "venta"}
          onClick={() => setOperacion("venta")}
          icono={<IconArrowUp size={16} />}
        >
          Venden efectivo
        </Pestana>
        <Pestana
          activa={operacion === "compra"}
          onClick={() => setOperacion("compra")}
          icono={<IconArrowDown size={16} />}
        >
          Compran efectivo
        </Pestana>
      </div>

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-36" />
            <Esqueleto className="h-36" />
          </>
        ) : ofertas.length === 0 ? (
          <EstadoVacio
            icono={<IconDollar size={26} />}
            titulo={
              operacion === "venta" ? "Nadie vende ahora mismo" : "Nadie está comprando ahora"
            }
            detalle="Las ofertas se retiran a los tres días para que las tasas no queden viejas."
            accion={
              <Link href="/publicar?tipo=dolar">
                <Boton icono={<IconPlus size={18} />}>Publicar mi oferta</Boton>
              </Link>
            }
          />
        ) : (
          ofertas.map((oferta) => <TarjetaDivisa key={oferta.id} oferta={oferta} />)
        )}

        <Aviso>
          Mara Comercio solo publica las ofertas: no recibe, no entrega ni garantiza ningún
          dinero. Reúnete en un sitio concurrido y de día, y cuenta el efectivo antes de
          entregar.
        </Aviso>
      </main>
    </>
  );
}

function Referencia({ nombre, valor }: { nombre: string; valor: number | null }) {
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{nombre}</p>
      <p className="font-bold tabular-nums text-fg">
        {valor === null ? "Sin dato" : formatearTasa(valor)}
      </p>
    </div>
  );
}

function Pestana({
  activa,
  onClick,
  icono,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
        activa ? "bg-surface text-fg shadow-card" : "text-fg-muted"
      }`}
    >
      {icono}
      {children}
    </button>
  );
}

function TarjetaDivisa({ oferta }: { oferta: PublicacionDolar }) {
  const persona = nombreCompleto(oferta.autorNombre, oferta.autorApellido);
  const verbo = oferta.operacion === "venta" ? "vendes" : "compras";

  return (
    <article className="tarjeta p-3.5">
      <div className="flex items-start gap-3">
        <Avatar
          size={52}
          url={oferta.autorFoto}
          nombre={iniciales(oferta.autorNombre, oferta.autorApellido)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="clamp-1 text-[15px] font-semibold text-fg">{persona}</h2>
            {oferta.autorVerificado ? <SelloVerificado /> : null}
          </div>
          <p className="text-xs text-fg-subtle">
            {oferta.autorCodigo} · {hace(oferta.creadaEn)}
          </p>
          <a
            href={`tel:${oferta.autorTelefono}`}
            className="mt-0.5 inline-block text-sm font-medium tabular-nums text-brand-600 dark:text-brand-300"
          >
            {formatearTelefono(oferta.autorTelefono)}
          </a>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tabular-nums text-fg">{formatearTasa(oferta.tasa)}</p>
          <p className="text-xs text-fg-muted">por dólar</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-3 text-sm">
        <div>
          <dt className="text-xs text-fg-subtle">Monto disponible</dt>
          <dd className="font-semibold tabular-nums text-fg">
            {formatearPrecio(oferta.montoMin, "USD")} – {formatearPrecio(oferta.montoMax, "USD")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-subtle">Sector</dt>
          <dd className="clamp-1 font-semibold text-fg">{oferta.zona}</dd>
        </div>
      </dl>

      {oferta.metodos.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {oferta.metodos.map((metodo) => (
            <Insignia key={metodo} tono="marca">
              {ETIQUETA_METODO[metodo]}
            </Insignia>
          ))}
        </div>
      ) : null}

      {oferta.descripcion ? (
        <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{oferta.descripcion}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <Insignia>
          <IconPin size={12} />
          {oferta.zona}
        </Insignia>
      </div>

      <div className="mt-3">
        <BotonWhatsApp
          telefono={oferta.autorTelefono}
          mensaje={`Hola ${oferta.autorNombre}, te escribo por Mara Comercio. Vi que ${verbo} dólares a ${formatearTasa(
            oferta.tasa,
          )}. ¿Sigue disponible?`}
        />
      </div>
    </article>
  );
}
