"use client";

/**
 * Las estaciones que están surtiendo hoy.
 *
 * Es el dato más buscado del municipio, así que va arriba de todo lo demás del
 * pie: antes incluso que los teléfonos de emergencia, porque esto se consulta a
 * diario y aquello se consulta una vez al año.
 *
 * Lo que manda aquí es la hora. "Están surtiendo" no significa nada sin decir
 * desde cuándo: una cola se acaba en dos horas. Por eso la hora del parte se
 * pinta al lado del título y no escondida abajo, y por eso el parte desaparece
 * solo a las 24 horas: mandar a alguien a cruzar el municipio con el tanque en
 * reserva para encontrar la bomba cerrada es peor que no decirle nada.
 */
import { HORAS_VIGENCIA_ESTACIONES, parteVigente, useEstaciones } from "@/lib/estaciones";
import { hace } from "@/lib/formato";
import { useAhora } from "@/lib/reloj";
import { IconSurtidor } from "./icons";
import { Esqueleto } from "./ui";

export function EstacionesSurtiendo() {
  const { parte, cargando } = useEstaciones();
  const ahora = useAhora(5 * 60_000);

  const vigente = parteVigente(parte, ahora);

  if (cargando) {
    return (
      <section className="px-4">
        <Esqueleto className="h-32" />
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-estaciones" className="px-4">
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="flex items-center gap-2.5 border-b border-line bg-surface-2 px-3.5 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <IconSurtidor size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-estaciones" className="text-sm font-bold text-fg">
              Estaciones surtiendo
            </h2>
            <p className="text-xs text-fg-subtle">
              {vigente
                ? `Parte de las ${parte.horaDelParte ?? hace(parte.actualizadoEn)} · cargado ${hace(parte.actualizadoEn)}`
                : `Se actualiza a diario · vale ${HORAS_VIGENCIA_ESTACIONES} horas`}
            </p>
          </div>
        </div>

        {vigente ? (
          <ul>
            {parte.estaciones.map((estacion, indice) => (
              <li
                key={`${estacion.nombre}-${indice}`}
                className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5 last:border-0"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-verde-500" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-fg">
                  {estacion.nombre}
                </span>
                <span className="flex shrink-0 gap-1">
                  {estacion.combustibles.map((c) => (
                    <span
                      key={c}
                      className={`rounded-pill px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        c === "diesel"
                          ? "bg-fg/8 text-fg-muted"
                          : "bg-verde-100 text-verde-600"
                      }`}
                    >
                      {c === "diesel" ? "Diésel" : "Gasolina"}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          /* Callar es más útil que enseñar el parte de ayer: en gasolina, un
             dato viejo manda a alguien a hacer una cola que ya no existe. */
          <p className="px-3.5 py-5 text-center text-sm text-fg-muted">
            Todavía no hay parte de hoy.
          </p>
        )}
      </div>
    </section>
  );
}
