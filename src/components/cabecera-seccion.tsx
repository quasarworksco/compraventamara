"use client";

/** Cabecera común de las secciones: título, buscador y chips de filtro. */
import Link from "next/link";
import type { ReactNode } from "react";

import { IconChevronLeft, IconSearch } from "./icons";

export function CabeceraSeccion({
  titulo,
  detalle,
  busqueda,
  onBusqueda,
  marcador = "Buscar",
  extra,
}: {
  titulo: string;
  detalle?: string;
  busqueda?: string;
  onBusqueda?: (valor: string) => void;
  marcador?: string;
  extra?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="flex items-center gap-1 px-2 pt-2">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-fg-muted active:bg-surface-2"
        >
          <IconChevronLeft size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-fg">{titulo}</h1>
          {detalle ? <p className="clamp-1 text-xs text-fg-muted">{detalle}</p> : null}
        </div>
        {extra}
      </div>

      {onBusqueda ? (
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3">
            <IconSearch size={18} className="shrink-0 text-fg-subtle" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => onBusqueda(e.target.value)}
              placeholder={marcador}
              aria-label={marcador}
              className="min-h-11 w-full bg-transparent text-fg outline-none placeholder:text-fg-subtle"
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** Fila de filtros deslizable. En móvil es más cómoda que un desplegable. */
export function ChipsFiltro({
  opciones,
  valor,
  onCambio,
  etiquetaTodos = "Todo",
}: {
  opciones: readonly string[];
  valor: string | null;
  onCambio: (valor: string | null) => void;
  etiquetaTodos?: string;
}) {
  return (
    <div className="scroll-x flex gap-2 px-4 py-2">
      <Chip activo={valor === null} onClick={() => onCambio(null)}>
        {etiquetaTodos}
      </Chip>
      {opciones.map((opcion) => (
        <Chip key={opcion} activo={valor === opcion} onClick={() => onCambio(opcion)}>
          {opcion}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-h-9 shrink-0 rounded-pill border px-3.5 text-sm font-medium transition-colors ${
        activo
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line bg-surface text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}
