"use client";

/**
 * Pizarra de divisas de la portada.
 *
 * Una oferta de cambio no se mira como se mira una moto: no hay foto que
 * valga, se compara de un vistazo quién da mejor tasa. Por eso va en filas
 * apretadas —quién, cuánto y a cómo— y no en las tarjetas del marketplace,
 * donde además quedaba perdida entre celulares y muebles.
 */
import Link from "next/link";

import {
  formatearDivisa,
  formatearTasa,
  hace,
  iniciales,
  nombreDivisa,
} from "@/lib/formato";
import { usePublicaciones } from "@/lib/publicaciones";
import { useAhora } from "@/lib/reloj";
import type { PublicacionDivisa } from "@/lib/types";
import { BotonWhatsApp } from "./boton-whatsapp";
import { Avatar, Esqueleto, SelloSeguro, SelloVerificado } from "./ui";

/** Cuántas caben antes de que la portada se vuelva un tablón. */
const MAXIMO = 4;

export function PizarraDivisas() {
  const { publicaciones, cargando } = usePublicaciones({ tipo: "divisa", tope: 40 });
  const ahora = useAhora();

  const ofertas = publicaciones
    .filter((p): p is PublicacionDivisa => p.tipo === "divisa")
    .filter((o) => o.venceEn > ahora)
    // Los Vendedores Seguros van delante. Es el sentido de la distinción: en
    // un tablón donde todas las ofertas se parecen, el pueblo tiene que ver
    // primero a quien la administración avala, sobre todo quien llega nuevo.
    // Dentro de cada grupo manda la confirmación más reciente, que sigue
    // premiando a quien mantiene su oferta al día.
    .sort(
      (a, b) =>
        Number(b.autorSeguro ?? false) - Number(a.autorSeguro ?? false) ||
        b.actualizadaEn - a.actualizadaEn,
    )
    .slice(0, MAXIMO);

  // Una pizarra vacía no aporta nada: si no hay ofertas, no se ocupa sitio.
  if (!cargando && ofertas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-pizarra" className="px-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="titulo-pizarra" className="text-sm font-semibold text-fg-muted">
          Divisas ahora
        </h2>
        <Link href="/dolares" className="text-sm font-semibold text-brand-600">
          Ver todas
        </Link>
      </div>

      {cargando ? (
        <Esqueleto className="h-32" />
      ) : (
        <ul className="tarjeta overflow-hidden">
          {ofertas.map((oferta) => (
            <li key={oferta.id} className="border-b border-line last:border-0">
              <FilaDivisa oferta={oferta} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaDivisa({ oferta }: { oferta: PublicacionDivisa }) {
  const divisa = oferta.divisa ?? "USD";
  const vende = oferta.operacion === "venta";

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Avatar
        size={36}
        url={oferta.autorFoto}
        nombre={iniciales(oferta.autorNombre, oferta.autorApellido)}
      />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-semibold text-fg">
          <span className="clamp-1">{oferta.autorNombre}</span>
          {oferta.autorSeguro ? (
            <SelloSeguro size={14} />
          ) : oferta.autorVerificado ? (
            <SelloVerificado size={13} />
          ) : null}
        </p>
        <p className="clamp-1 text-xs text-fg-subtle">
          <span className={vende ? "text-success" : "text-sell"}>
            {vende ? "vende" : "compra"}
          </span>{" "}
          {formatearDivisa(oferta.monto, divisa)} · {hace(oferta.actualizadaEn)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[15px] font-bold tabular-nums leading-tight text-fg">
          {formatearTasa(oferta.tasa)}
        </p>
        <p className="text-[11px] text-fg-subtle">
          por {nombreDivisa(divisa).replace(/e?s$/, "")}
        </p>
      </div>

      <BotonWhatsApp
        compacto
        telefono={oferta.autorTelefono}
        etiqueta={`Escribir a ${oferta.autorNombre}`}
        mensaje={`Hola ${oferta.autorNombre}, te escribo por Mara Comercio. Vi que ${
          vende ? "vendes" : "compras"
        } ${nombreDivisa(divisa)} a ${formatearTasa(oferta.tasa)}. ¿Sigue disponible?`}
      />
    </div>
  );
}
