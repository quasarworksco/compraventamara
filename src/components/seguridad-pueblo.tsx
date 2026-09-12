"use client";

/**
 * Bloque de seguridad de la portada.
 *
 * Cada número es un enlace `tel:`: en una emergencia, un toque basta.
 */
import { CONTACTOS, PUEBLO } from "@/lib/pueblo";
import { IconPhone, IconVerified } from "./icons";

export function SeguridadPueblo() {
  return (
    <section aria-labelledby="titulo-seguridad" className="px-4">
      <h2 id="titulo-seguridad" className="mb-2 text-sm font-semibold text-fg-muted">
        Seguridad y atención al ciudadano
      </h2>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line bg-brand-600 p-4 text-white">
          <span className="mt-0.5 shrink-0 text-sun-300">
            <IconVerified size={22} />
          </span>
          <div>
            <p className="text-[15px] font-semibold">{PUEBLO.nombre} es un pueblo seguro</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-100">
              Patrullaje permanente de Polimara y coordinación directa con la comunidad.
              Ante cualquier situación, estos son los números a los que llamar.
            </p>
          </div>
        </div>

        <ul>
          {CONTACTOS.map((contacto) => (
            <li key={contacto.id} className="border-b border-line last:border-0">
              <a
                href={`tel:${contacto.telefono.replace(/\D/g, "")}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                  <IconPhone size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-fg">{contacto.nombre}</p>
                  <p className="clamp-1 text-xs text-fg-muted">{contacto.detalle}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                  {contacto.telefono}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {CONTACTOS.some((c) => !c.confirmado) ? (
        <p className="mt-2 text-xs text-fg-subtle">
          Los números marcados como provisionales deben confirmarse con cada organismo antes
          de abrir la página al público.
        </p>
      ) : null}
    </section>
  );
}
