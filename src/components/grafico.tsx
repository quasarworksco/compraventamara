"use client";

/**
 * Gráficos del panel de administración.
 *
 * Son deliberadamente pobres en color: una sola serie, un solo azul de la
 * marca. Pintar cada barra de un color distinto cuando todas miden lo mismo
 * gasta el único canal libre en repetir lo que la longitud ya dice, y encima
 * insinúa categorías que no existen.
 *
 * Ningún valor vive solo dentro de un tooltip. La lectura al pasar el dedo
 * ayuda, pero el número también está en la tabla que cada gráfico despliega:
 * un dato que solo aparece al pasar el ratón no existe en un móvil.
 */
import { useState, type ReactNode } from "react";

import type { Punto } from "@/lib/estadisticas";

/* ----------------------------------------------------------------- */
/* Cifras sueltas                                                     */
/* ----------------------------------------------------------------- */

/**
 * Una cifra con su nombre. Cuando la historia es un número, el número es el
 * gráfico: una barra sola no explica nada que el número no diga mejor.
 */
export function Cifra({
  etiqueta,
  valor,
  detalle,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: number | string;
  detalle?: string;
  tono?: "neutro" | "marca" | "aviso";
}) {
  const fondo = {
    neutro: "border-line bg-surface",
    marca: "border-brand-200 bg-brand-50",
    aviso: "border-verde-200 bg-verde-50",
  }[tono];

  return (
    <div className={`flex flex-col justify-between rounded-card border p-3 ${fondo}`}>
      <p className="text-xs font-medium leading-tight text-fg-muted">{etiqueta}</p>
      <p className="mt-1.5 text-[26px] font-bold leading-none text-fg">{valor}</p>
      {detalle ? <p className="mt-1 text-[11px] leading-tight text-fg-subtle">{detalle}</p> : null}
    </div>
  );
}

/** Rejilla de cifras: dos por fila en móvil, tres cuando hay sitio. */
export function Cifras({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{children}</div>;
}

/* ----------------------------------------------------------------- */
/* Marco común                                                        */
/* ----------------------------------------------------------------- */

function Marco({
  titulo,
  lectura,
  children,
  datos,
  unidad,
}: {
  titulo: string;
  /** Lo que se lee arriba a la derecha: el total, o el punto señalado. */
  lectura: ReactNode;
  children: ReactNode;
  datos: Punto[];
  unidad: string;
}) {
  return (
    <figure className="tarjeta p-3.5">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-fg">{titulo}</h3>
        <p className="shrink-0 text-xs tabular-nums text-fg-muted">{lectura}</p>
      </figcaption>

      {children}

      <details className="mt-3 border-t border-line pt-2">
        <summary className="cursor-pointer text-xs font-medium text-fg-subtle">
          Ver los números
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-fg-subtle">
              <th className="pb-1 font-medium">Concepto</th>
              <th className="pb-1 text-right font-medium">{unidad}</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((punto, indice) => (
              <tr key={`${punto.etiqueta}-${indice}`} className="border-t border-line">
                <td className="py-1 text-fg-muted">{punto.detalle ?? punto.etiqueta}</td>
                <td className="py-1 text-right tabular-nums font-medium text-fg">
                  {punto.valor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/* ----------------------------------------------------------------- */
/* Tendencia en columnas                                              */
/* ----------------------------------------------------------------- */

const ALTO = 104;

/**
 * Tendencia diaria.
 *
 * Columnas y no una línea: los días de un pueblo traen cero, una o dos
 * publicaciones, y una línea entre números tan pequeños dibuja pendientes
 * dramáticas donde solo hubo un anuncio de diferencia. Una columna por día
 * dice exactamente eso, "un anuncio", y un día vacío se ve vacío.
 */
export function Tendencia({
  titulo,
  datos,
  unidad,
}: {
  titulo: string;
  datos: Punto[];
  unidad: string;
}) {
  const [senalado, setSenalado] = useState<number | null>(null);

  const total = datos.reduce((suma, p) => suma + p.valor, 0);
  const maximo = Math.max(1, ...datos.map((p) => p.valor));
  const punto = senalado === null ? null : datos[senalado];

  return (
    <Marco
      titulo={titulo}
      unidad={unidad}
      datos={datos}
      lectura={
        punto ? (
          <>
            <span className="font-semibold text-fg">{punto.valor}</span>{" "}
            <span className="capitalize">{punto.detalle ?? punto.etiqueta}</span>
          </>
        ) : (
          <>
            <span className="font-semibold text-fg">{total}</span> en {datos.length} días
          </>
        )
      }
    >
      <div
        role="img"
        aria-label={`${titulo}: ${total} en los últimos ${datos.length} días.`}
        className="relative"
        onPointerLeave={() => setSenalado(null)}
      >
        {/* Techo de la escala. Hairline, un tono por encima del fondo: está
            para dar medida, no para competir con las columnas. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-fg-subtle">{maximo}</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex items-end gap-[2px]" style={{ height: ALTO }}>
          {datos.map((p, indice) => (
            <div
              key={`${p.etiqueta}-${indice}`}
              onPointerEnter={() => setSenalado(indice)}
              className="flex h-full flex-1 cursor-default items-end"
            >
              <span
                className={`w-full rounded-t-[4px] ${
                  senalado === indice ? "bg-brand-700" : "bg-brand-500"
                }`}
                style={{ height: Math.round((p.valor / maximo) * (ALTO - 10)) }}
              />
            </div>
          ))}
        </div>

        <div className="h-px bg-line" />

        <div className="mt-1 flex justify-between text-[10px] text-fg-subtle">
          <span>{datos[0]?.etiqueta}</span>
          <span>{datos[datos.length - 1]?.etiqueta}</span>
        </div>
      </div>
    </Marco>
  );
}

/* ----------------------------------------------------------------- */
/* Comparación en barras                                              */
/* ----------------------------------------------------------------- */

/**
 * Barras horizontales para comparar categorías.
 *
 * Horizontales porque las etiquetas son palabras —"Perfumería y cosméticos",
 * "El Uveral"— y en vertical habría que girarlas o recortarlas. El valor va
 * siempre escrito al lado: nadie debería medir una barra con el ojo.
 */
export function Barras({
  titulo,
  datos,
  unidad,
  vacio = "Todavía no hay datos.",
}: {
  titulo: string;
  datos: Punto[];
  unidad: string;
  vacio?: string;
}) {
  const maximo = Math.max(1, ...datos.map((p) => p.valor));
  const total = datos.reduce((suma, p) => suma + p.valor, 0);

  if (datos.length === 0 || total === 0) {
    return (
      <figure className="tarjeta p-3.5">
        <figcaption className="mb-2 text-sm font-semibold text-fg">{titulo}</figcaption>
        <p className="text-sm text-fg-subtle">{vacio}</p>
      </figure>
    );
  }

  return (
    <Marco
      titulo={titulo}
      unidad={unidad}
      datos={datos}
      lectura={
        <>
          <span className="font-semibold text-fg">{total}</span> en total
        </>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {datos.map((p, indice) => (
          <li key={`${p.etiqueta}-${indice}`} className="flex items-center gap-2.5">
            <span className="w-[38%] shrink-0 clamp-1 text-xs text-fg-muted">{p.etiqueta}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-2.5 rounded-r-[4px] bg-brand-500"
                style={{ width: `${Math.max(p.valor > 0 ? 3 : 0, (p.valor / maximo) * 100)}%` }}
              />
              <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">
                {p.valor}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Marco>
  );
}
