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
  IconSearch,
  IconStore,
  IconTag,
  IconTicket,
  IconUser,
} from "@/components/icons";
import { Logotipo } from "@/components/logotipo";
import { SeguridadPueblo } from "@/components/seguridad-pueblo";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { TasasDelDia } from "@/components/tasas-del-dia";
import { Avatar, Aviso, Esqueleto } from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { iniciales } from "@/lib/formato";
import { PUEBLO } from "@/lib/pueblo";
import { usePublicaciones } from "@/lib/publicaciones";

const SECCIONES = [
  {
    href: "/mercado",
    titulo: "Marketplace",
    detalle: "Vehículos, celulares y bienes",
    Icono: IconTag,
  },
  {
    href: "/negocios",
    titulo: "Negocios",
    detalle: "Directorio del pueblo",
    Icono: IconStore,
  },
  {
    href: "/mototaxis",
    titulo: "Mototaxis",
    detalle: "Carreras y tarifas",
    Icono: IconMoto,
  },
  {
    href: "/dolares",
    titulo: "Dólares",
    detalle: "Efectivo en venta",
    Icono: IconDollar,
  },
  {
    href: "/rifas",
    titulo: "Rifas",
    detalle: "Números y sorteos",
    Icono: IconTicket,
  },
  {
    href: "/chat",
    titulo: "Chat en vivo",
    detalle: "Habla con el pueblo",
    Icono: IconChat,
  },
] as const;

export default function Portada() {
  const { miembro, cargando, configurado } = useSesion();
  const { publicaciones, cargando: cargandoPublicaciones } = usePublicaciones({ tope: 6 });
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const termino = busqueda.trim();
    router.push(termino ? `/mercado?q=${encodeURIComponent(termino)}` : "/mercado");
  }

  return (
    <main className="flex flex-col gap-7 pb-6">
      {/* Cabecera del pueblo */}
      <header className="cielo-mara relative overflow-hidden px-4 pb-7 pt-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Logotipo blanco alto={30} />
            <p className="mt-1 text-xs text-brand-100">
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

        <h1 className="asoma mt-6 text-[27px] font-bold leading-tight tracking-tight">
          {PUEBLO.nombre}
        </h1>
        <p className="asoma retardo-1 mt-2 max-w-md text-sm leading-relaxed text-brand-100">
          {PUEBLO.bienvenida}
        </p>

        <form onSubmit={buscar} role="search" className="asoma retardo-2 mt-5">
          <div className="cristal-sobre-azul flex items-center gap-2 rounded-2xl px-3.5 py-1">
            <IconSearch size={19} className="shrink-0 text-white/70" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              type="search"
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar en el marketplace"
              className="min-h-12 w-full bg-transparent text-white outline-none placeholder:text-white/60"
            />
          </div>
        </form>
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

      {/* Accesos a las secciones */}
      <section aria-labelledby="titulo-secciones" className="px-4">
        <h2 id="titulo-secciones" className="mb-2 text-sm font-semibold text-fg-muted">
          El comercio del pueblo
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {SECCIONES.map(({ href, titulo, detalle, Icono }, indice) => (
            <Link
              key={href}
              href={href}
              className={`tarjeta pulsable asoma retardo-${(indice % 4) + 1} flex flex-col gap-2.5 p-3.5`}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/25 ring-1 ring-white/15">
                <Icono size={21} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-fg">{titulo}</span>
                <span className="block text-xs text-fg-muted">{detalle}</span>
              </span>
            </Link>
          ))}
        </div>

      </section>

      {/* Lo último publicado */}
      <section aria-labelledby="titulo-recientes" className="px-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="titulo-recientes" className="text-sm font-semibold text-fg-muted">
            Publicado hace poco
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
            Todavía no hay publicaciones. La primera puede ser la tuya.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {publicaciones.map((publicacion) => (
              <TarjetaPublicacion key={publicacion.id} publicacion={publicacion} />
            ))}
          </div>
        )}
      </section>

      <SeguridadPueblo />

      <footer className="px-4 pt-2 text-center text-xs text-fg-subtle">
        <p>
          Compra Venta Mara · {PUEBLO.nombre}, {PUEBLO.estado}
        </p>
        <p className="mt-1">
          La página conecta a comprador y vendedor. No participa en el pago ni en la entrega.
        </p>
      </footer>
    </main>
  );
}
