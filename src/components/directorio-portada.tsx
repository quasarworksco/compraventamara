"use client";

/**
 * Los negocios del pueblo, en la portada.
 *
 * Un negocio no es un anuncio: la carnicería de la esquina sigue siendo la
 * carnicería de la esquina dentro de un año. Mezclarla con la moto que
 * alguien vende esta semana perjudica a las dos cosas —el negocio envejece en
 * un feed donde todo caduca, y el anuncio compite con algo que nunca se va—.
 *
 * Por eso el directorio tiene aquí su propio sitio, y se lee como una
 * estantería que se recorre de lado, no como una lista que se agota.
 */
import Link from "next/link";

import { miniatura } from "@/lib/cloudinary";
import { usePublicaciones } from "@/lib/publicaciones";
import type { PublicacionNegocio } from "@/lib/types";
import { IconStore } from "./icons";
import { Esqueleto, SelloSeguro, SelloVerificado } from "./ui";

/** Cuántos caben en la estantería antes de que deje de recorrerse. */
const MAXIMO = 10;

export function DirectorioPortada() {
  const { publicaciones, cargando } = usePublicaciones({ tipo: "negocio", tope: 40 });

  const negocios = publicaciones
    .filter((p): p is PublicacionNegocio => p.tipo === "negocio")
    // Los avalados primero; después, los de apertura más reciente, que es lo
    // que el pueblo todavía no conoce.
    .sort(
      (a, b) =>
        Number(b.autorSeguro ?? false) - Number(a.autorSeguro ?? false) ||
        b.creadaEn - a.creadaEn,
    )
    .slice(0, MAXIMO);

  return (
    <section aria-labelledby="titulo-directorio" className="overflow-hidden">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-4">
        <h2 id="titulo-directorio" className="text-sm font-semibold text-fg-muted">
          Negocios del pueblo
        </h2>
        <Link href="/negocios" className="text-sm font-semibold text-brand-600">
          Ver el directorio
        </Link>
      </div>

      {cargando ? (
        <div className="px-4">
          <Esqueleto className="h-36" />
        </div>
      ) : negocios.length === 0 ? (
        <div className="px-4">
          <Link
            href="/publicar/?tipo=negocio"
            className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-7 text-center"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-verde-400 to-verde-600 text-white">
              <IconStore size={21} />
            </span>
            <span className="text-sm font-semibold text-fg">
              El directorio todavía está vacío
            </span>
            <span className="max-w-xs text-xs text-fg-muted">
              Registra tu negocio y queda para siempre: las fichas del directorio no
              vencen a los 30 días como los anuncios.
            </span>
          </Link>
        </div>
      ) : (
        <ul className="scroll-x flex snap-x snap-mandatory gap-2.5 px-4 pb-1">
          {negocios.map((negocio) => (
            <li key={negocio.id} className="w-[62%] max-w-[230px] shrink-0 snap-start">
              <TarjetaNegocio negocio={negocio} />
            </li>
          ))}

          <li className="w-[42%] max-w-[160px] shrink-0 snap-start">
            <Link
              href="/negocios"
              className="tarjeta pulsable flex h-full flex-col items-center justify-center gap-2 p-3.5 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-fg-muted">
                <IconStore size={19} />
              </span>
              <span className="text-sm font-semibold text-fg">Ver todos</span>
              <span className="text-[11px] leading-tight text-fg-subtle">
                Repuestos, médicos, panaderías y más
              </span>
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}

function TarjetaNegocio({ negocio }: { negocio: PublicacionNegocio }) {
  const foto = negocio.imagenes?.[0];

  return (
    <Link
      href={`/publicacion/?id=${negocio.id}`}
      className="tarjeta pulsable flex h-full flex-col overflow-hidden"
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={miniatura(foto, 400)}
          alt=""
          className="h-24 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-24 w-full items-center justify-center bg-linear-to-br from-verde-400 to-verde-600 text-white">
          <IconStore size={28} />
        </span>
      )}

      <span className="flex flex-1 flex-col gap-0.5 p-2.5">
        <span className="flex items-center gap-1">
          <span className="clamp-1 text-sm font-semibold text-fg">{negocio.titulo}</span>
          {negocio.autorSeguro ? (
            <SelloSeguro size={13} />
          ) : negocio.autorVerificado ? (
            <SelloVerificado size={12} />
          ) : null}
        </span>
        <span className="clamp-1 text-[11px] text-fg-muted">{negocio.categoria}</span>
        {negocio.zona ? (
          <span className="clamp-1 text-[11px] text-fg-subtle">{negocio.zona}</span>
        ) : null}
      </span>
    </Link>
  );
}
