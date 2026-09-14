"use client";

/**
 * Portada: la entrada al pueblo.
 *
 * El orden responde a lo que la gente abre la aplicación a buscar: primero
 * quién es este pueblo, enseguida el precio del dólar, después el comercio y,
 * cerrando, los teléfonos de emergencia.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  IconChat,
  IconDollar,
  IconMoto,
  IconChevronRight,
  IconSearch,
  IconStore,
  IconTag,
  IconTicket,
  IconUser,
  IconWhatsApp,
} from "@/components/icons";
import { DirectorioPortada } from "@/components/directorio-portada";
import { EstacionesSurtiendo } from "@/components/estaciones-surtiendo";
import { Logotipo } from "@/components/logotipo";
import { PizarraDivisas } from "@/components/pizarra-divisas";
import { PortadaIglesia } from "@/components/portada-iglesia";
import { TransportePortada } from "@/components/transporte-portada";
import { SeguridadPueblo } from "@/components/seguridad-pueblo";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { TasasDelDia } from "@/components/tasas-del-dia";
import { Avatar, Aviso, Esqueleto } from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { iniciales } from "@/lib/formato";
import { AUTOR, GRUPO_WHATSAPP, PUEBLO } from "@/lib/pueblo";
import { usePublicaciones } from "@/lib/publicaciones";
import type { TipoPublicacion } from "@/lib/types";

/**
 * Las seis secciones del pueblo.
 *
 * Cada una lleva su propio degradado: seis tarjetas del mismo azul se leen
 * como un bloque, y con un acento distinto el ojo distingue de un vistazo
 * adónde va.
 */
const SECCIONES = [
  {
    href: "/mercado",
    titulo: "Marketplace",
    detalle: "Vehículos, celulares y bienes",
    Icono: IconTag,
    acento: "from-brand-500 to-brand-700",
  },
  {
    href: "/negocios",
    titulo: "Negocios",
    detalle: "Directorio del pueblo",
    Icono: IconStore,
    acento: "from-verde-400 to-verde-600",
  },
  {
    href: "/mototaxis",
    titulo: "Transporte",
    detalle: "Mototaxis y taxis",
    Icono: IconMoto,
    acento: "from-brand-400 to-brand-600",
  },
  {
    href: "/dolares",
    titulo: "Divisas",
    detalle: "Efectivo en venta",
    Icono: IconDollar,
    acento: "from-verde-500 to-brand-700",
  },
  {
    href: "/rifas",
    titulo: "Rifas",
    detalle: "Números y sorteos",
    Icono: IconTicket,
    acento: "from-brand-600 to-brand-800",
  },
  {
    href: "/chat",
    titulo: "Chat en vivo",
    detalle: "Habla con el pueblo",
    Icono: IconChat,
    acento: "from-verde-400 to-brand-600",
    envivo: true,
  },
] as const;

/** Estable entre renderizados: si se creara al vuelo, la lista se recalcularía sola. */
const EXCLUIDOS_DEL_FEED: TipoPublicacion[] = ["divisa", "negocio", "mototaxi", "carrera"];

export default function Portada() {
  const { miembro, cargando, configurado } = useSesion();
  // Lo que queda fuera de este feed y por qué. Las divisas tienen su propia
  // pizarra: una oferta de cambio entre una moto y un celular ni se lee ni se
  // compara. Los negocios y los conductores, porque no caducan: la panadería
  // del pueblo no es una novedad de esta semana, y en una lista llamada
  // "publicado hace poco" se hundían en cuanto alguien vendiera algo; cada uno
  // tiene su franja más abajo. Y las carreras pedidas, porque duran dos horas
  // y solo le sirven a quien anda rodando.
  const { publicaciones, cargando: cargandoPublicaciones } = usePublicaciones({
    tope: 12,
    excluir: EXCLUIDOS_DEL_FEED,
  });
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const termino = busqueda.trim();
    // A /buscar y no a /mercado: quien escribe "panadería" quiere la panadería
    // del directorio, y no tiene por qué saber en cuál de las cinco secciones
    // la pusimos nosotros.
    router.push(termino ? `/buscar/?q=${encodeURIComponent(termino)}` : "/buscar/");
  }

  return (
    <main className="flex flex-col gap-7 pb-6">
      {/* Cabecera del pueblo */}
      <header className="relative overflow-hidden px-4 pb-10 pt-5 text-white">
        <PortadaIglesia />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Logotipo blanco alto={30} />
            <p className="sobre-foto mt-1 text-xs text-white/85">
              {PUEBLO.municipio} · {PUEBLO.estado}
            </p>
          </div>

          {cargando ? (
            <Esqueleto className="size-10 rounded-full" />
          ) : miembro ? (
            <Link href="/perfil" aria-label="Mi perfil" className="shrink-0">
              <Avatar
                size={40}
                url={miembro.fotoUrl}
                nombre={iniciales(miembro.nombre, miembro.apellido)}
              />
            </Link>
          ) : (
            <Link
              href="/entrar"
              className="cristal-sobre-azul pulsable flex min-h-10 items-center gap-1.5 rounded-pill px-3.5 text-sm font-semibold"
            >
              <IconUser size={17} />
              Entrar
            </Link>
          )}
        </div>

        <p className="sobre-foto asoma relative z-10 mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-verde-200">
          {PUEBLO.saludo}
        </p>
        <h1 className="sobre-foto asoma retardo-1 relative z-10 mt-1.5 text-[28px] font-bold leading-tight tracking-tight">
          {PUEBLO.nombre}
        </h1>
        <p className="sobre-foto asoma retardo-2 relative z-10 mt-2 max-w-md text-sm leading-relaxed text-white/90">
          {PUEBLO.bienvenida}
        </p>

        <form onSubmit={buscar} role="search" className="asoma retardo-3 relative z-10 mt-5">
          <div className="cristal-sobre-azul flex items-center gap-2 rounded-2xl bg-brand-900/35 px-3.5 py-1">
            <IconSearch size={19} className="shrink-0 text-white/70" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              type="search"
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar en todo el pueblo"
              className="min-h-12 w-full bg-transparent text-white outline-none placeholder:text-white/60"
            />
          </div>
        </form>

        {/* La puerta al grupo: quien llega por un enlace compartido entra ahí,
            y quien ya está en el grupo encuentra aquí sus anuncios ordenados. */}
        <a
          href={GRUPO_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="pulsable asoma retardo-4 relative z-10 mt-3 flex min-h-12 items-center gap-2.5 rounded-2xl bg-linear-to-b from-wa-400 to-wa-500 px-3.5 text-sm font-semibold text-[#06302a] shadow-lg shadow-black/25 ring-1 ring-white/30"
        >
          <IconWhatsApp size={19} className="shrink-0" />
          <span className="flex-1 text-left">Únete al grupo de WhatsApp del pueblo</span>
          <IconChevronRight size={17} className="shrink-0 opacity-60" />
        </a>
      </header>

      {!configurado ? (
        <div className="px-4">
          <Aviso tono="error">
            Falta conectar Firebase. Copia <code>.env.example</code> a{" "}
            <code>.env.local</code> y rellena las variables{" "}
            <code>NEXT_PUBLIC_FIREBASE_*</code> para que funcionen el registro, las
            publicaciones y el chat.
          </Aviso>
        </div>
      ) : null}

      <TasasDelDia />

      <PizarraDivisas />

      {/* Accesos a las secciones */}
      <section aria-labelledby="titulo-secciones" className="px-4">
        <h2 id="titulo-secciones" className="mb-2 text-sm font-semibold text-fg-muted">
          El comercio del pueblo
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {SECCIONES.map((seccion, indice) => (
            <Link
              key={seccion.href}
              href={seccion.href}
              className={`tarjeta pulsable asoma retardo-${(indice % 4) + 1} flex flex-col gap-2.5 p-3.5`}
            >
              <span
                className={`flex size-11 items-center justify-center rounded-xl bg-linear-to-br ${seccion.acento} text-white shadow-sm shadow-brand-700/25 ring-1 ring-white/15`}
              >
                <seccion.Icono size={21} />
              </span>
              <span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[15px] font-semibold text-fg">{seccion.titulo}</span>
                  {"envivo" in seccion ? (
                    <span
                      className="pulso relative size-1.5 rounded-full bg-verde-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span className="block text-xs text-fg-muted">{seccion.detalle}</span>
              </span>
            </Link>
          ))}
        </div>

      </section>

      <DirectorioPortada />

      <TransportePortada />

      {/* Lo último publicado: artículos, mototaxis y rifas. Los negocios no,
          porque no son novedad de nadie: viven arriba, en el directorio. */}
      <section aria-labelledby="titulo-recientes" className="px-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="titulo-recientes" className="text-sm font-semibold text-fg-muted">
            En venta hace poco
          </h2>
          <Link href="/mercado" className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            Ver todo
          </Link>
        </div>

        {cargandoPublicaciones ? (
          <div className="flex flex-col gap-2.5">
            <Esqueleto className="h-28" />
            <Esqueleto className="h-28" />
          </div>
        ) : publicaciones.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-fg-muted">
            Todavía no hay nada en venta. La primera publicación puede ser la tuya.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {publicaciones.slice(0, 6).map((publicacion, indice) => (
              <TarjetaPublicacion
                key={publicacion.id}
                publicacion={publicacion}
                indice={indice}
              />
            ))}
          </div>
        )}
      </section>

      {/* Encima de los teléfonos de emergencia a propósito: esto se consulta
          a diario y aquello se consulta una vez al año. */}
      <EstacionesSurtiendo />

      <SeguridadPueblo />

      <footer className="px-4 pt-2 text-center text-xs text-fg-subtle">
        <p>
          Compra Venta Mara · {PUEBLO.nombre}, {PUEBLO.estado}
        </p>
        <p className="mt-1">
          La página conecta a comprador y vendedor. No participa en el pago ni en la entrega.
        </p>
        <p className="mt-3 border-t border-line pt-3 font-medium text-fg-muted">
          Hecho por {AUTOR}
        </p>
      </footer>
    </main>
  );
}
