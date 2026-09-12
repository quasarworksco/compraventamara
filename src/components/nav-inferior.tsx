"use client";

/**
 * Navegación principal, anclada abajo porque es donde llega el pulgar.
 * El botón de publicar va al centro y sobresale: es la acción que más
 * repite la gente del grupo.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconChat, IconDollar, IconHome, IconPlus, IconTag } from "./icons";

const DESTINOS = [
  { href: "/", etiqueta: "Inicio", Icono: IconHome },
  { href: "/mercado", etiqueta: "Mercado", Icono: IconTag },
  { href: "/dolares", etiqueta: "Dólares", Icono: IconDollar },
  { href: "/chat", etiqueta: "Chat", Icono: IconChat },
] as const;

function estaActivo(ruta: string, href: string): boolean {
  return href === "/" ? ruta === "/" : ruta.startsWith(href);
}

export function NavInferior() {
  const ruta = usePathname();

  // El chat a pantalla completa, el formulario de publicar y el panel de
  // administración se quedan la pantalla entera.
  if (ruta.startsWith("/chat/") || ruta.startsWith("/admin") || ruta === "/publicar") {
    return null;
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="cristal-barra fixed inset-x-0 bottom-0 z-40 border-t border-line"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-safe pt-1">
        {DESTINOS.slice(0, 2).map((destino) => (
          <EnlaceNav key={destino.href} {...destino} activo={estaActivo(ruta, destino.href)} />
        ))}

        <li className="flex w-16 shrink-0 justify-center">
          <Link
            href="/publicar"
            aria-label="Publicar"
            className="pulsable -mt-5 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/35 ring-1 ring-white/20"
          >
            <IconPlus size={26} strokeWidth={2.2} />
          </Link>
        </li>

        {DESTINOS.slice(2).map((destino) => (
          <EnlaceNav key={destino.href} {...destino} activo={estaActivo(ruta, destino.href)} />
        ))}
      </ul>
    </nav>
  );
}

function EnlaceNav({
  href,
  etiqueta,
  Icono,
  activo,
}: {
  href: string;
  etiqueta: string;
  Icono: typeof IconHome;
  activo: boolean;
}) {
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={activo ? "page" : undefined}
        className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
          activo ? "text-brand-600 dark:text-brand-300" : "text-fg-subtle"
        }`}
      >
        <Icono size={23} strokeWidth={activo ? 2.1 : 1.75} />
        {etiqueta}
      </Link>
    </li>
  );
}
