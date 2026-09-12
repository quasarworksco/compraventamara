"use client";

/**
 * Marketplace: lo que vende la gente del pueblo.
 *
 * Los anuncios viven 30 días; el aviso y la prórroga se gestionan desde el
 * perfil de cada quien.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { CabeceraSeccion, ChipsFiltro } from "@/components/cabecera-seccion";
import { IconPlus, IconTag } from "@/components/icons";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { Boton, Esqueleto, EstadoVacio } from "@/components/ui";
import { CATEGORIAS_MERCADO } from "@/lib/pueblo";
import { useFiltro, usePublicaciones } from "@/lib/publicaciones";

export default function PaginaMercado() {
  return (
    <Suspense fallback={<Esqueleto className="m-4 h-40" />}>
      <Mercado />
    </Suspense>
  );
}

function Mercado() {
  const parametros = useSearchParams();
  const [busqueda, setBusqueda] = useState(parametros.get("q") ?? "");
  const [categoria, setCategoria] = useState<string | null>(null);

  const { publicaciones, cargando } = usePublicaciones({ tipo: "producto", tope: 120 });
  const visibles = useFiltro(publicaciones, busqueda, categoria ?? undefined);

  return (
    <>
      <CabeceraSeccion
        titulo="Marketplace"
        detalle="Vehículos, celulares, artículos y bienes"
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        marcador="Buscar en el marketplace"
      />

      <ChipsFiltro
        opciones={CATEGORIAS_MERCADO}
        valor={categoria}
        onCambio={setCategoria}
        etiquetaTodos="Todas"
      />

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-28" />
            <Esqueleto className="h-28" />
            <Esqueleto className="h-28" />
          </>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            icono={<IconTag size={26} />}
            titulo={busqueda || categoria ? "Nada por aquí" : "Todavía no hay artículos"}
            detalle={
              busqueda || categoria
                ? "Prueba con otras palabras o quita el filtro."
                : "Publica lo primero y se lo enseñamos a todo el pueblo."
            }
            accion={
              <Link href="/publicar">
                <Boton icono={<IconPlus size={18} />}>Publicar algo</Boton>
              </Link>
            }
          />
        ) : (
          <>
            <p className="text-xs text-fg-subtle">
              {visibles.length} {visibles.length === 1 ? "publicación" : "publicaciones"}
            </p>
            {visibles.map((publicacion) => (
              <TarjetaPublicacion key={publicacion.id} publicacion={publicacion} />
            ))}
            <p className="px-2 py-4 text-center text-xs text-fg-subtle">
              Los anuncios se retiran a los 30 días. Su dueño recibe aviso antes y puede
              prorrogarlos desde su perfil.
            </p>
          </>
        )}
      </main>
    </>
  );
}
