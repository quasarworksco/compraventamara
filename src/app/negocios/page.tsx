"use client";

/**
 * Directorio de negocios del pueblo.
 *
 * La idea: que en San Rafael no haya que preguntar "¿quién hace esto?".
 * Desde un odontólogo hasta una cauchera, todo debe poder encontrarse aquí.
 * A diferencia del marketplace, estas fichas no vencen a los 30 días.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { CabeceraSeccion, ChipsFiltro } from "@/components/cabecera-seccion";
import { BotonMapa } from "@/components/boton-mapa";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import { IconClock, IconPin, IconPlus, IconStore } from "@/components/icons";
import { Boton, Esqueleto, EstadoVacio, Insignia, SelloVerificado } from "@/components/ui";
import { miniatura } from "@/lib/cloudinary";
import { coordenadasValidas } from "@/lib/mapas";
import { RUBROS_NEGOCIO } from "@/lib/pueblo";
import { useFiltro, usePublicaciones } from "@/lib/publicaciones";
import type { PublicacionNegocio } from "@/lib/types";

const GRUPOS = RUBROS_NEGOCIO.map((g) => g.grupo);

/**
 * Todos los rubros de un negocio, con el principal delante.
 *
 * Las fichas registradas antes de que se pudiera elegir más de uno solo traen
 * `categoria`, así que ese es el respaldo.
 */
function rubrosDe(negocio: PublicacionNegocio): string[] {
  const todos = negocio.categorias?.length ? negocio.categorias : [negocio.categoria];
  return [...new Set(todos.filter(Boolean))];
}

export default function PaginaNegocios() {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);

  const { publicaciones, cargando } = usePublicaciones({ tipo: "negocio", tope: 200 });
  const filtrados = useFiltro(publicaciones, busqueda);

  const negocios = useMemo(() => {
    const rubrosDelGrupo = grupo
      ? new Set(RUBROS_NEGOCIO.find((g) => g.grupo === grupo)?.rubros ?? [])
      : null;

    return filtrados
      .filter((p): p is PublicacionNegocio => p.tipo === "negocio")
      // Un negocio de varios rubros aparece en todos ellos: quien busca
      // cámaras de seguridad tiene que encontrar a la tienda de celulares que
      // también las instala.
      .filter((n) => (rubrosDelGrupo ? rubrosDe(n).some((r) => rubrosDelGrupo.has(r)) : true));
  }, [filtrados, grupo]);

  // Se agrupan por rubro para que el directorio se lea como un índice.
  const porRubro = useMemo(() => {
    const mapa = new Map<string, PublicacionNegocio[]>();
    for (const negocio of negocios) {
      for (const rubro of rubrosDe(negocio)) {
        const lista = mapa.get(rubro);
        if (lista) lista.push(negocio);
        else mapa.set(rubro, [negocio]);
      }
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [negocios]);

  return (
    <>
      <CabeceraSeccion
        titulo="Negocios del pueblo"
        detalle="Directorio de comercios y servicios"
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        marcador="Médico, panadería, repuestos..."
      />

      <ChipsFiltro opciones={GRUPOS} valor={grupo} onCambio={setGrupo} etiquetaTodos="Todo" />

      <main className="flex flex-col gap-5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-24" />
            <Esqueleto className="h-24" />
          </>
        ) : porRubro.length === 0 ? (
          <EstadoVacio
            icono={<IconStore size={26} />}
            titulo={busqueda || grupo ? "Sin resultados" : "El directorio está vacío"}
            detalle={
              busqueda || grupo
                ? "Prueba con otro rubro o con otras palabras."
                : "Registra tu negocio y que el pueblo sepa dónde encontrarte."
            }
            accion={
              <Link href="/publicar?tipo=negocio">
                <Boton icono={<IconPlus size={18} />}>Registrar mi negocio</Boton>
              </Link>
            }
          />
        ) : (
          porRubro.map(([rubro, lista]) => (
            <section key={rubro}>
              <h2 className="mb-2 text-sm font-semibold text-fg-muted">
                {rubro}
                <span className="ml-1.5 font-normal text-fg-subtle">({lista.length})</span>
              </h2>
              <div className="flex flex-col gap-2.5">
                {lista.map((negocio) => (
                  <TarjetaNegocio key={negocio.id} negocio={negocio} />
                ))}
              </div>
            </section>
          ))
        )}

        {porRubro.length > 0 ? (
          <Link href="/publicar?tipo=negocio" className="pb-2">
            <Boton ancho variante="secundario" icono={<IconPlus size={18} />}>
              Registrar mi negocio
            </Boton>
          </Link>
        ) : null}
      </main>
    </>
  );
}

function TarjetaNegocio({ negocio }: { negocio: PublicacionNegocio }) {
  const logo = negocio.imagenes[0];

  return (
    <article className="tarjeta p-3.5">
      <div className="flex gap-3">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miniatura(logo, 200)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-fg-subtle">
              <IconStore size={22} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="clamp-1 text-[15px] font-semibold text-fg">{negocio.titulo}</h3>
            {negocio.autorVerificado ? <SelloVerificado /> : null}
          </div>

          {negocio.direccion ? (
            <p className="clamp-2 mt-0.5 flex items-start gap-1 text-sm text-fg-muted">
              <IconPin size={14} className="mt-0.5 shrink-0" />
              {negocio.direccion}
            </p>
          ) : null}

          {negocio.horario ? (
            <p className="clamp-1 mt-0.5 flex items-center gap-1 text-sm text-fg-muted">
              <IconClock size={14} className="shrink-0" />
              {negocio.horario}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <BotonWhatsApp
            compacto
            telefono={negocio.autorTelefono}
            etiqueta={`Escribir a ${negocio.titulo}`}
            mensaje={`Hola, los contacto por el directorio de Mara Comercio. Quisiera información sobre ${negocio.titulo}.`}
          />
          {/* Solo aparece si el negocio marcó su punto: un botón que no lleva
              a ningún sitio es peor que no tenerlo. */}
          {coordenadasValidas(negocio.coordenadas) ? (
            <BotonMapa
              compacto
              punto={negocio.coordenadas}
              etiqueta={`Cómo llegar a ${negocio.titulo}`}
            />
          ) : null}
        </div>
      </div>

      {negocio.descripcion ? (
        <p className="clamp-2 mt-2.5 text-sm leading-relaxed text-fg-muted">
          {negocio.descripcion}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Insignia tono="marca">{negocio.categoria}</Insignia>
        <Insignia>
          <IconPin size={12} />
          {negocio.zona}
        </Insignia>
        {negocio.enlace ? (
          <a
            href={negocio.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-brand-600 underline dark:text-brand-300"
          >
            Ver más
          </a>
        ) : null}
      </div>
    </article>
  );
}
