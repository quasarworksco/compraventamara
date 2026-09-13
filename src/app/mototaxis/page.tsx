"use client";

/**
 * Transporte del pueblo: dos directorios, uno de mototaxis y otro de taxis.
 *
 * Son el mismo oficio con distinto vehículo, así que comparten ficha y se
 * separan por una pestaña en vez de duplicar la sección entera. Quien necesita
 * una moto no quiere ver carros, y al revés, pero quien mantiene esto tampoco
 * quiere dos páginas que envejezcan por separado.
 *
 * La ficha se pinta como un carnet —foto, nombre, código de miembro, vehículo
 * y placa— porque ese es su trabajo real: que el pasajero compruebe, antes de
 * montarse, que el que llegó es el que se anunció.
 *
 * Los disponibles suben arriba: a quien necesita una carrera no le sirve ver
 * primero a los que hoy no están trabajando.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

import { CabeceraSeccion } from "@/components/cabecera-seccion";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import { IconCarro, IconMoto, IconPin, IconPlus } from "@/components/icons";
import {
  Avatar,
  Boton,
  Esqueleto,
  EstadoVacio,
  Insignia,
  SelloSeguro,
  SelloVerificado,
} from "@/components/ui";
import {
  formatearPlaca,
  formatearPrecio,
  formatearTelefono,
  iniciales,
  nombreCompleto,
} from "@/lib/formato";
import { estaDestacada, useFiltro, usePublicaciones } from "@/lib/publicaciones";
import { CLASES_TRANSPORTE, type ClaseTransporte, type PublicacionMototaxi } from "@/lib/types";

export default function PaginaTransporte() {
  const [busqueda, setBusqueda] = useState("");
  const [clase, setClase] = useState<ClaseTransporte>("mototaxi");

  const { publicaciones, cargando } = usePublicaciones({ tipo: "mototaxi", tope: 120 });
  const filtrados = useFiltro(publicaciones, busqueda);

  const todos = useMemo(
    () => filtrados.filter((p): p is PublicacionMototaxi => p.tipo === "mototaxi"),
    [filtrados],
  );

  const lista = useMemo(
    () =>
      todos
        // Las fichas anteriores a los taxis no traen clase: son mototaxis.
        .filter((t) => (t.clase ?? "mototaxi") === clase)
        .sort(
          (a, b) =>
            Number(b.disponible) - Number(a.disponible) ||
            Number(estaDestacada(b)) - Number(estaDestacada(a)) ||
            b.creadaEn - a.creadaEn,
        ),
    [todos, clase],
  );

  const cuantos = (id: ClaseTransporte) =>
    todos.filter((t) => (t.clase ?? "mototaxi") === id).length;

  const esTaxi = clase === "taxi";

  return (
    <>
      <CabeceraSeccion
        titulo="Mototaxis y taxis"
        detalle="Carreras dentro y fuera del pueblo"
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        marcador="Buscar por sector, nombre o placa"
      />

      {/* Moto o carro: es lo primero que decide quien llega. */}
      <div role="tablist" aria-label="Tipo de transporte" className="mx-4 mt-3 flex gap-2">
        {CLASES_TRANSPORTE.map((opcion) => {
          const activa = clase === opcion.id;
          return (
            <button
              key={opcion.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setClase(opcion.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${
                activa
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-surface text-fg-muted"
              }`}
            >
              {opcion.id === "taxi" ? <IconCarro size={18} /> : <IconMoto size={18} />}
              {opcion.plural}
              <span className={activa ? "text-white/70" : "text-fg-subtle"}>
                {cuantos(opcion.id)}
              </span>
            </button>
          );
        })}
      </div>

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
          </>
        ) : lista.length === 0 ? (
          <EstadoVacio
            icono={esTaxi ? <IconCarro size={26} /> : <IconMoto size={26} />}
            titulo={esTaxi ? "Ningún taxi registrado" : "Ningún mototaxi registrado"}
            detalle={
              esTaxi
                ? "Si trabajas el carro, regístrate y que te consigan cuando te necesiten."
                : "Si trabajas la moto, regístrate y que te consigan cuando te necesiten."
            }
            accion={
              <Link href="/publicar/?tipo=mototaxi">
                <Boton icono={<IconPlus size={18} />}>Registrarme</Boton>
              </Link>
            }
          />
        ) : (
          lista.map((conductor) => <Carnet key={conductor.id} conductor={conductor} />)
        )}
      </main>
    </>
  );
}

/**
 * El carnet del conductor.
 *
 * Foto arriba, y debajo el vehículo con su placa en grande y monoespaciada,
 * como se lee en la chapa. La placa es el único dato de aquí que se puede
 * comprobar de un vistazo desde la acera.
 */
function Carnet({ conductor }: { conductor: PublicacionMototaxi }) {
  const persona = nombreCompleto(conductor.autorNombre, conductor.autorApellido);
  const esTaxi = (conductor.clase ?? "mototaxi") === "taxi";
  const destacada = estaDestacada(conductor);

  return (
    <article
      className={`tarjeta p-3.5 ${destacada ? "ring-2 ring-brand-400" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          size={56}
          url={conductor.autorFoto}
          nombre={iniciales(conductor.autorNombre, conductor.autorApellido)}
        />

        {/* El nombre se queda con todo el ancho. En un carnet es el dato que
            se compara con la persona que llegó, así que cortarlo para meter
            una insignia al lado sería cambiar lo importante por lo cómodo;
            la disponibilidad baja a la línea de la tarifa, donde sobra sitio. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h2 className="min-w-0 text-[15px] font-semibold leading-snug text-fg">{persona}</h2>
            <span className="mt-0.5 shrink-0">
              {conductor.autorSeguro ? (
                <SelloSeguro size={14} />
              ) : conductor.autorVerificado ? (
                <SelloVerificado size={14} />
              ) : null}
            </span>
          </div>
          <p className="text-xs tabular-nums text-fg-subtle">{conductor.autorCodigo}</p>
          <a
            href={`tel:${conductor.autorTelefono}`}
            className="text-sm font-medium tabular-nums text-brand-600 dark:text-brand-300"
          >
            {formatearTelefono(conductor.autorTelefono)}
          </a>
        </div>
      </div>

      {/* El vehículo: lo que se compara con lo que llega a la puerta. */}
      <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-fg-muted">
          {esTaxi ? <IconCarro size={19} /> : <IconMoto size={19} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-fg-subtle">
            {esTaxi ? "Carro" : "Moto"}
          </p>
          <p className="clamp-1 text-sm font-semibold text-fg">
            {conductor.modelo || "Sin indicar"}
          </p>
        </div>
        {conductor.placa ? (
          <span className="shrink-0 rounded-md border border-line bg-surface px-2 py-1 text-sm font-bold tracking-widest tabular-nums text-fg">
            {formatearPlaca(conductor.placa)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-fg">
            {formatearPrecio(conductor.tarifaDesde, conductor.moneda)}
          </span>
          <span className="text-sm text-fg-muted">la carrera mínima</span>
        </p>
        <Insignia tono={conductor.disponible ? "compra" : "neutro"}>
          {conductor.disponible ? "Disponible" : "No disponible"}
        </Insignia>
      </div>

      {conductor.descripcion ? (
        <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-fg-muted">
          {conductor.descripcion}
        </p>
      ) : null}

      {conductor.cobertura.length > 0 ? (
        <div className="mt-2.5">
          <p className="mb-1.5 text-xs font-medium text-fg-subtle">Sectores que cubre</p>
          <div className="flex flex-wrap gap-1.5">
            {conductor.cobertura.map((sector) => (
              <Insignia key={sector}>
                <IconPin size={12} />
                {sector}
              </Insignia>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <BotonWhatsApp
          telefono={conductor.autorTelefono}
          etiqueta="Pedir una carrera"
          mensaje={`Hola ${conductor.autorNombre}, te escribo por Mara Comercio. ¿Estás disponible para una carrera?`}
        />
      </div>
    </article>
  );
}
