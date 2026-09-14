"use client";

/**
 * Búsqueda en todo el pueblo a la vez.
 *
 * El buscador de la portada iba solo al marketplace, así que quien escribía
 * "panadería" no encontraba la panadería: estaba en el directorio, no entre
 * los artículos en venta. Alguien que busca algo no sabe —ni tiene por qué
 * saber— en cuál de las cinco secciones lo pusimos nosotros.
 *
 * Los resultados salen agrupados por sección y no revueltos, porque un
 * mototaxi y un sofá no se comparan: lo que se compara son los sofás entre sí.
 */
import Link from "next/link";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BarraSuperior } from "@/components/barra-superior";
import { IconSearch } from "@/components/icons";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { Esqueleto, EstadoVacio } from "@/components/ui";
import { ETIQUETA_TIPO, normalizarBusqueda } from "@/lib/formato";
import { useFiltro, usePublicaciones } from "@/lib/publicaciones";
import type { Publicacion, TipoPublicacion } from "@/lib/types";

/** El orden en que se enseñan las secciones: lo más buscado primero. */
const ORDEN: TipoPublicacion[] = [
  "producto",
  "negocio",
  "mototaxi",
  "rifa",
  "divisa",
  "carrera",
];

export default function PaginaBuscar() {
  return (
    <Suspense fallback={<Esqueleto className="m-4 h-40" />}>
      <Buscador />
    </Suspense>
  );
}

function Buscador() {
  const parametros = useSearchParams();
  const router = useRouter();
  const inicial = parametros.get("q") ?? "";

  const [texto, setTexto] = useState(inicial);

  // Se traen todas las secciones de una vez y se filtra aquí. Firestore no
  // hace búsqueda por texto libre, y montar un buscador aparte para un pueblo
  // sería desproporcionado: con unos cientos de anuncios en memoria, filtrar
  // en el navegador es instantáneo.
  const { publicaciones, cargando } = usePublicaciones({ tope: 300 });
  const encontrados = useFiltro(publicaciones, texto);

  const porSeccion = useMemo(() => {
    if (!normalizarBusqueda(texto.trim())) return [];
    return ORDEN.map((tipo) => ({
      tipo,
      resultados: encontrados.filter((p) => p.tipo === tipo),
    })).filter((grupo) => grupo.resultados.length > 0);
  }, [encontrados, texto]);

  const total = porSeccion.reduce((suma, g) => suma + g.resultados.length, 0);
  const buscando = normalizarBusqueda(texto.trim()).length > 0;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    // La URL guarda lo buscado para que el resultado se pueda compartir.
    router.replace(texto.trim() ? `/buscar/?q=${encodeURIComponent(texto.trim())}` : "/buscar/");
  }

  return (
    <>
      <BarraSuperior titulo="Buscar" volverA="/" />

      <main className="flex flex-col gap-3 px-4 py-3">
        <form onSubmit={enviar} role="search">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3.5">
            <IconSearch size={19} className="shrink-0 text-fg-subtle" />
            <input
              autoFocus
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Panadería, moto, repuestos, dólares..."
              aria-label="Buscar en todo el pueblo"
              className="min-h-12 w-full bg-transparent text-fg outline-none placeholder:text-fg-subtle"
            />
          </div>
        </form>

        {!buscando ? (
          <EstadoVacio
            icono={<IconSearch size={24} />}
            titulo="¿Qué buscas?"
            detalle="Se busca a la vez en artículos, negocios, mototaxis, taxis, rifas y divisas."
          />
        ) : cargando ? (
          <>
            <Esqueleto className="h-28" />
            <Esqueleto className="h-28" />
          </>
        ) : total === 0 ? (
          <EstadoVacio
            icono={<IconSearch size={24} />}
            titulo={`Nada por "${texto.trim()}"`}
            detalle="Prueba con una palabra más corta, o mira el directorio completo por rubros."
            accion={
              <Link href="/negocios" className="text-sm font-semibold text-brand-600">
                Ver el directorio
              </Link>
            }
          />
        ) : (
          <>
            <p className="text-xs text-fg-subtle">
              {total} {total === 1 ? "resultado" : "resultados"} en {porSeccion.length}{" "}
              {porSeccion.length === 1 ? "sección" : "secciones"}
            </p>

            {porSeccion.map(({ tipo, resultados }) => (
              <Seccion key={tipo} tipo={tipo} resultados={resultados} />
            ))}
          </>
        )}
      </main>
    </>
  );
}

/** Dónde vive cada sección, para el enlace de "ver todo". */
const RUTA: Record<TipoPublicacion, string> = {
  producto: "/mercado",
  negocio: "/negocios",
  mototaxi: "/mototaxis",
  rifa: "/rifas",
  divisa: "/dolares",
  carrera: "/mototaxis",
};

function Seccion({ tipo, resultados }: { tipo: TipoPublicacion; resultados: Publicacion[] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg-muted">
          {ETIQUETA_TIPO[tipo]}
          <span className="ml-1.5 font-normal text-fg-subtle">{resultados.length}</span>
        </h2>
        <Link href={RUTA[tipo]} className="text-sm font-semibold text-brand-600">
          Ver la sección
        </Link>
      </div>

      {/* Seis por sección: si hay más, la sección propia los enseña mejor. */}
      {resultados.slice(0, 6).map((publicacion, indice) => (
        <TarjetaPublicacion key={publicacion.id} publicacion={publicacion} indice={indice} />
      ))}
    </section>
  );
}
