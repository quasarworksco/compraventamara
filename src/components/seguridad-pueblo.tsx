"use client";

/**
 * Bloque de contacto y seguridad de la portada.
 *
 * Cada número es un enlace `tel:` y el correo un `mailto:`: en una emergencia,
 * un toque basta. Las direcciones de las sedes van completas porque hay dos, y
 * quien llama desde Ricaurte no tiene por qué ir hasta San Rafael.
 */
import { CONTACTOS, POLIMARA, PUEBLO } from "@/lib/pueblo";
import { IconMail, IconPhone, IconPin, IconVerified } from "./icons";

export function SeguridadPueblo() {
  return (
    <section aria-labelledby="titulo-contacto" className="px-4">
      <h2 id="titulo-contacto" className="mb-2 text-sm font-semibold text-fg-muted">
        Contáctanos
      </h2>

      <div className="tarjeta overflow-hidden">
        {/* Cabecera */}
        <div className="cielo-mara flex items-start gap-3 border-b border-line p-4 text-white">
          <span className="mt-0.5 shrink-0 text-verde-300">
            <IconVerified size={22} />
          </span>
          <div>
            <p className="text-[15px] font-semibold">{PUEBLO.nombre} es un pueblo seguro</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-100">
              Patrullaje permanente de {POLIMARA.nombre} y coordinación directa con la
              comunidad. Ante cualquier situación, estos son los canales.
            </p>
          </div>
        </div>

        {/* Canales de Polimara */}
        <div className="border-b border-line px-4 py-3">
          <p className="text-[15px] font-semibold text-fg">{POLIMARA.nombre}</p>
          <p className="text-xs text-fg-muted">{POLIMARA.detalle}</p>

          <div className="mt-2.5 flex flex-col gap-1.5">
            <a
              href={`tel:${POLIMARA.telefono.marcar}`}
              className="pulsable -mx-1.5 flex min-h-11 items-center gap-2.5 rounded-lg px-1.5 active:bg-surface-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                <IconPhone size={17} />
              </span>
              <span className="text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                {POLIMARA.telefono.visible}
              </span>
            </a>

            {/* Sin enlace: `tel:` no marca letras de forma fiable. */}
            <div className="-mx-1.5 flex min-h-11 items-center gap-2.5 px-1.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-verde-50 text-verde-600 dark:bg-verde-600/20 dark:text-verde-200">
                <IconPhone size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{POLIMARA.gratuito}</span>
                <span className="block text-xs text-fg-subtle">Línea gratuita</span>
              </span>
            </div>

            <a
              href={`mailto:${POLIMARA.correo}`}
              className="pulsable -mx-1.5 flex min-h-11 items-center gap-2.5 rounded-lg px-1.5 active:bg-surface-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                <IconMail size={17} />
              </span>
              <span className="clamp-1 text-sm font-medium text-brand-600 dark:text-brand-300">
                {POLIMARA.correo}
              </span>
            </a>
          </div>
        </div>

        {/* Sedes */}
        <ul className="border-b border-line">
          {POLIMARA.sedes.map((sede) => (
            <li key={sede.nombre} className="flex gap-2.5 border-b border-line px-4 py-3 last:border-0">
              <span className="mt-0.5 shrink-0 text-fg-subtle">
                <IconPin size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {POLIMARA.nombre} · {sede.nombre}
                </p>
                <p className="text-sm leading-relaxed text-fg-muted">{sede.direccion}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Otros números de emergencia */}
        <ul>
          {CONTACTOS.map((contacto) => (
            <li key={contacto.id} className="border-b border-line last:border-0">
              <a
                href={`tel:${contacto.marcar}`}
                className="pulsable flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-800 dark:text-brand-200">
                  <IconPhone size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-fg">{contacto.nombre}</p>
                  <p className="clamp-1 text-xs text-fg-muted">{contacto.detalle}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                  {contacto.visible}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
