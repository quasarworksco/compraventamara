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
  IconChevronRight,
  IconDollar,
  IconMoto,
  IconSearch,
  IconStore,
  IconTag,
  IconUser,
  LogoMark,
} from "@/components/icons";
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
      <header className="bg-brand-600 px-4 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark size={38} className="text-brand-800" />
            <div>
              <p className="text-[17px] font-bold leading-tight">Mara Comercio</p>
              <p className="text-xs text-brand-100">
                {PUEBLO.municipio} · {PUEBLO.estado}
              </p>
            </div>
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
              className="flex min-h-10 items-center gap-1.5 rounded-pill bg-white/15 px-3.5 text-sm font-semibold"
            >
              <IconUser size={17} />
              Entrar
            </Link>
          )}
        </div>

        <h1 className="mt-5 text-2xl font-bold leading-tight">{PUEBLO.nombre}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-100">{PUEBLO.bienvenida}</p>

        <form onSubmit={buscar} role="search" className="mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1 dark:bg-surface">
            <IconSearch size={19} className="shrink-0 text-fg-subtle" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              type="search"
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar en el marketplace"
              className="min-h-11 w-full bg-transparent text-fg outline-none placeholder:text-fg-subtle"
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
          {SECCIONES.map(({ href, titulo, detalle, Icono }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3.5 shadow-card active:bg-surface-2"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                <Icono size={21} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-fg">{titulo}</span>
                <span className="block text-xs text-fg-muted">{detalle}</span>
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/chat"
          className="mt-2.5 flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4 shadow-card active:bg-surface-2"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-600 dark:bg-sun-600/25 dark:text-sun-200">
            <IconChat size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-fg">Chat en vivo</span>
            <span className="block text-xs text-fg-muted">
              Conversa con el pueblo en tiempo real
            </span>
          </span>
          <IconChevronRight size={18} className="shrink-0 text-fg-subtle" />
        </Link>
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
          Mara Comercio · {PUEBLO.nombre}, {PUEBLO.estado}
        </p>
        <p className="mt-1">
          La página conecta a comprador y vendedor. No participa en el pago ni en la entrega.
        </p>
      </footer>
    </main>
  );
}
