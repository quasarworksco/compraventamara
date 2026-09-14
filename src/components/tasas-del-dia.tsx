"use client";

/** Las dos tasas que el pueblo consulta a diario: la oficial y la del P2P. */
import Link from "next/link";

import { formatearTasa, hace } from "@/lib/formato";
import { useAhora, useContador } from "@/lib/reloj";
import { useTasas } from "@/lib/tasas";
import { IconChevronRight } from "./icons";
import { Esqueleto } from "./ui";

export function TasasDelDia() {
  const { tasas, cargando } = useTasas();
  // La hora entra como dato en vez de leerse al pintar: es la regla de la casa
  // —dos renders seguidos tienen que dar lo mismo— y de paso el aviso de tasa
  // vieja se enciende solo, sin recargar.
  const ahora = useAhora(5 * 60_000);

  return (
    <section aria-labelledby="titulo-tasas" className="px-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="titulo-tasas" className="text-sm font-semibold text-fg-muted">
          El dólar hoy
        </h2>
        {tasas.origen === "manual" ? (
          <p className="text-xs text-fg-subtle">Cargada a mano</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <TarjetaTasa
          nombre="BCV"
          detalle="Tasa oficial"
          valor={tasas.bcv}
          desde={tasas.bcvEn}
          ahora={ahora}
          cargando={cargando}
        />
        <TarjetaTasa
          nombre="Binance"
          detalle="Referencia P2P"
          valor={tasas.binance}
          desde={tasas.binanceEn}
          ahora={ahora}
          cargando={cargando}
          acento
        />
      </div>

      <Link
        href="/dolares"
        className="mt-2.5 flex min-h-12 items-center justify-between tarjeta px-4 text-sm font-medium text-fg active:bg-surface-2"
      >
        Ver quién compra y vende divisas
        <IconChevronRight size={18} className="text-fg-subtle" />
      </Link>
    </section>
  );
}

function TarjetaTasa({
  nombre,
  detalle,
  valor,
  desde,
  ahora,
  cargando,
  acento = false,
}: {
  nombre: string;
  detalle: string;
  valor: number | null;
  /** Cuándo cambió esta cifra, según quien la publica. */
  desde?: number;
  ahora: number;
  cargando: boolean;
  acento?: boolean;
}) {
  const animado = useContador(valor);

  return (
    <div
      className={`cristal asoma rounded-card p-3.5 ${
        acento ? "bg-linear-to-br from-verde-50/90 to-verde-100/70 dark:from-verde-600/20 dark:to-verde-600/10" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{nombre}</p>
      {cargando ? (
        <Esqueleto className="mt-1.5 h-7 w-24" />
      ) : valor === null ? (
        <p className="mt-1 text-lg font-semibold text-fg-subtle">Sin dato</p>
      ) : (
        <p className="mt-0.5 text-xl font-bold tabular-nums text-fg">
          {formatearTasa(animado ?? valor)}
        </p>
      )}
      {/* La edad de la cifra, no la de nuestra consulta. Es la diferencia entre
          "esta tasa es de hace tres minutos" y la verdad, que puede ser que la
          fuente lleva días sin moverla. Quien vende un carro en dólares merece
          saberlo antes de ponerle precio. */}
      <p className="mt-0.5 text-xs text-fg-muted">
        {detalle}
        {valor !== null && desde ? (
          <span className={vieja(desde, ahora) ? "text-sell" : "text-fg-subtle"}>
            {" · "}
            {hace(desde)}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Una cifra que lleva demasiado quieta.
 *
 * Dos días y medio, no uno: el BCV no publica sábados ni domingos, así que un
 * lunes por la mañana la tasa del viernes es la correcta y marcarla en rojo
 * sería asustar sin motivo.
 */
function vieja(desde: number, ahora: number): boolean {
  return ahora - desde > 60 * 60 * 1000 * 60;
}
