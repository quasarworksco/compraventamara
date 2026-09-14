"use client";

/**
 * Compra y venta de dólares en efectivo.
 *
 * Cada oferta muestra la cara, el nombre completo y el teléfono de quien la
 * publica: en un trato de efectivo, saber a quién vas a ver es media
 * seguridad. Mara Comercio no interviene en la operación, solo pone en
 * contacto.
 *
 * Tres reglas sostienen el tablón:
 *  - Una oferta vive seis horas. Quien sigue disponible lo confirma de un
 *    toque y vuelve al tope; quien no, desaparece solo.
 *  - Cada persona tiene una sola oferta viva, para que nadie tape al resto.
 *  - Junto a cada tasa se ve cuánto se aparta del BCV y de Binance, que es
 *    lo que delata una oferta fuera de mercado.
 */
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { CabeceraSeccion } from "@/components/cabecera-seccion";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconClock,
  IconDollar,
  IconFilter,
  IconPlus,
} from "@/components/icons";
import {
  Avatar,
  Aviso,
  Boton,
  Esqueleto,
  EstadoVacio,
  EtiquetaSeguro,
  Insignia,
  SelloVerificado,
} from "@/components/ui";
import { useSesion } from "@/lib/auth";
import {
  ETIQUETA_METODO,
  diferenciaPorcentual,
  formatearDiferencia,
  formatearDivisa,
  formatearTasa,
  formatearTelefono,
  hace,
  iniciales,
  nombreCompleto,
  nombreDivisa,
} from "@/lib/formato";
import { ZONAS } from "@/lib/pueblo";
import { confirmarDisponibilidad, usePublicaciones } from "@/lib/publicaciones";
import { useAhora } from "@/lib/reloj";
import { useTasas } from "@/lib/tasas";
import {
  DIVISAS,
  HORAS_VIGENCIA_DOLAR,
  MS_POR_HORA,
  type Divisa,
  type MetodoPago,
  type OperacionDivisa,
  type PublicacionDivisa,
  type Tasas,
} from "@/lib/types";

type Orden = "recientes" | "tasa" | "seguros";

const METODOS: MetodoPago[] = ["pago-movil", "efectivo", "zelle", "binance", "transferencia"];

export default function PaginaDolares() {
  const [operacion, setOperacion] = useState<OperacionDivisa>("venta");
  const [divisa, setDivisa] = useState<Divisa>("USD");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [zona, setZona] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const { publicaciones, cargando } = usePublicaciones({ tipo: "divisa", tope: 100 });
  const { tasas } = useTasas();
  const { miembro } = useSesion();
  const ahora = useAhora();

  const ofertas = useMemo(() => {
    const propias = publicaciones
      .filter(
        (p): p is PublicacionDivisa =>
          p.tipo === "divisa" && p.operacion === operacion && (p.divisa ?? "USD") === divisa,
      )
      // El TTL de Firestore tarda en pasar: aquí se descarta lo ya vencido.
      .filter((o) => o.venceEn > ahora)
      .filter((o) => (zona ? o.zona === zona : true))
      .filter((o) => (metodo ? o.metodos.includes(metodo) : true));

    return propias.sort((a, b) => {
      // Ordenar por Vendedor Seguro es una opción, no un empujón silencioso:
      // quien pidió "mejor tasa" tiene que ver de verdad la mejor tasa arriba.
      // Colar ahí a los avalados haría del selector una mentira.
      if (orden === "seguros") {
        return (
          Number(b.autorSeguro ?? false) - Number(a.autorSeguro ?? false) ||
          b.actualizadaEn - a.actualizadaEn
        );
      }
      if (orden === "recientes") return b.actualizadaEn - a.actualizadaEn;
      // Quien vende, más barato primero; quien compra, mejor pagador primero.
      return operacion === "venta" ? a.tasa - b.tasa : b.tasa - a.tasa;
    });
  }, [publicaciones, operacion, divisa, orden, zona, metodo, ahora]);

  const filtrosActivos = (zona ? 1 : 0) + (metodo ? 1 : 0);

  return (
    <>
      <CabeceraSeccion titulo="Divisas" detalle="Efectivo en mano, entre vecinos" />

      {/* Qué moneda se busca. Es lo primero que decide quien llega. */}
      <div
        role="tablist"
        aria-label="Moneda"
        className="scroll-x mx-4 mt-3 flex gap-2"
      >
        {DIVISAS.map((d) => (
          <button
            key={d.codigo}
            type="button"
            role="tab"
            aria-selected={divisa === d.codigo}
            onClick={() => setDivisa(d.codigo)}
            className={`pulsable min-h-10 shrink-0 rounded-pill border px-4 text-sm font-semibold ${
              divisa === d.codigo
                ? "border-brand-600 bg-linear-to-b from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/25"
                : "border-line bg-surface text-fg-muted"
            }`}
          >
            {d.nombre}
          </button>
        ))}
      </div>

      {/* Referencia del día, para saber si una oferta está en precio. */}
      {divisa === "USD" ? (
        <div className="tarjeta mx-4 mt-3 flex gap-2 p-3 text-sm">
          <Referencia nombre="BCV" valor={tasas.bcv} />
          <span className="w-px bg-line" aria-hidden="true" />
          <Referencia nombre="Binance" valor={tasas.binance} />
        </div>
      ) : null}

      {/* Conmutador compra / venta */}
      <div
        role="tablist"
        aria-label="Tipo de operación"
        className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
      >
        <Pestana
          activa={operacion === "venta"}
          onClick={() => setOperacion("venta")}
          icono={<IconArrowUp size={16} />}
        >
          Venden
        </Pestana>
        <Pestana
          activa={operacion === "compra"}
          onClick={() => setOperacion("compra")}
          icono={<IconArrowDown size={16} />}
        >
          Compran
        </Pestana>
      </div>

      {/* Orden y filtros */}
      {/* El grupo de orden se desplaza dentro de su propia caja. Tres pastillas
          que no encogen empujaban la página entera en pantallas de 320 px, y
          un desborde horizontal en móvil se siente como una página rota. */}
      <div className="mt-3 flex items-center gap-2 px-4">
        <div className="scroll-x flex min-w-0 flex-1 gap-1 rounded-pill bg-surface-2 p-1">
          <BotonOrden activo={orden === "recientes"} onClick={() => setOrden("recientes")}>
            Recién confirmadas
          </BotonOrden>
          <BotonOrden activo={orden === "tasa"} onClick={() => setOrden("tasa")}>
            Mejor tasa
          </BotonOrden>
          <BotonOrden activo={orden === "seguros"} onClick={() => setOrden("seguros")}>
            Seguros
          </BotonOrden>
        </div>

        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          className={`pulsable flex min-h-10 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-sm font-medium ${
            filtrosActivos > 0
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-line bg-surface text-fg-muted"
          }`}
        >
          <IconFilter size={16} />
          {filtrosActivos > 0 ? filtrosActivos : "Filtrar"}
        </button>
      </div>

      {filtrosAbiertos ? (
        <div className="tarjeta mx-4 mt-2.5 flex flex-col gap-3 p-3.5">
          <Grupo titulo="Sector">
            <Pildora activa={zona === null} onClick={() => setZona(null)}>
              Todos
            </Pildora>
            {ZONAS.map((z) => (
              <Pildora key={z} activa={zona === z} onClick={() => setZona(zona === z ? null : z)}>
                {z}
              </Pildora>
            ))}
          </Grupo>

          <Grupo titulo="Método de pago">
            <Pildora activa={metodo === null} onClick={() => setMetodo(null)}>
              Todos
            </Pildora>
            {METODOS.map((m) => (
              <Pildora
                key={m}
                activa={metodo === m}
                onClick={() => setMetodo(metodo === m ? null : m)}
              >
                {ETIQUETA_METODO[m]}
              </Pildora>
            ))}
          </Grupo>
        </div>
      ) : null}

      <main className="flex flex-col gap-2.5 px-4 py-3">
        {cargando ? (
          <>
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
          </>
        ) : ofertas.length === 0 ? (
          <EstadoVacio
            icono={<IconDollar size={26} />}
            titulo={
              filtrosActivos > 0
                ? "Nada con esos filtros"
                : operacion === "venta"
                  ? "Nadie vende ahora mismo"
                  : "Nadie está comprando ahora"
            }
            detalle={
              filtrosActivos > 0
                ? "Prueba con otro sector o con otro método de pago."
                : `Las ofertas se retiran solas a las ${HORAS_VIGENCIA_DOLAR} horas para que ninguna tasa quede vieja.`
            }
            accion={
              <Link href="/publicar?tipo=dolar">
                <Boton icono={<IconPlus size={18} />}>
                  {miembro?.verificado ? "Publicar mi oferta" : "Quiero publicar aquí"}
                </Boton>
              </Link>
            }
          />
        ) : (
          ofertas.map((oferta) => (
            <TarjetaDivisa
              key={oferta.id}
              oferta={oferta}
              tasas={tasas}
              ahora={ahora}
              esMia={miembro?.uid === oferta.autorUid}
            />
          ))
        )}

        <Aviso>
          Solo publican aquí los miembros verificados por la administración. Aun así, Mara
          Comercio no recibe, no entrega ni garantiza ningún dinero: reúnete en un sitio
          concurrido y de día, y cuenta el efectivo antes de entregar.
        </Aviso>
      </main>
    </>
  );
}

/* ----------------------------------------------------------------- */

function Referencia({ nombre, valor }: { nombre: string; valor: number | null }) {
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{nombre}</p>
      <p className="font-bold tabular-nums text-fg">
        {valor === null ? "Sin dato" : formatearTasa(valor)}
      </p>
    </div>
  );
}

function Pestana({
  activa,
  onClick,
  icono,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  icono: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={`pulsable flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${
        activa ? "bg-surface text-fg shadow-card" : "text-fg-muted"
      }`}
    >
      {icono}
      {children}
    </button>
  );
}

function BotonOrden({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`pulsable min-h-9 flex-1 rounded-pill px-2 text-xs font-semibold ${
        activo ? "bg-surface text-fg shadow-card" : "text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-fg-subtle">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pildora({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`pulsable min-h-9 rounded-pill border px-3 text-sm font-medium ${
        activa ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- */

function TarjetaDivisa({
  oferta,
  tasas,
  ahora,
  esMia,
}: {
  oferta: PublicacionDivisa;
  tasas: Tasas;
  ahora: number;
  esMia: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const persona = nombreCompleto(oferta.autorNombre, oferta.autorApellido);
  const verbo = oferta.operacion === "venta" ? "vendes" : "compras";
  const horasRestantes = Math.max(0, Math.ceil((oferta.venceEn - ahora) / MS_POR_HORA));

  async function confirmar() {
    setConfirmando(true);
    try {
      await confirmarDisponibilidad(oferta.id);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <article className="tarjeta p-3.5">
      <div className="flex items-start gap-3">
        <Avatar
          size={52}
          url={oferta.autorFoto}
          nombre={iniciales(oferta.autorNombre, oferta.autorApellido)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="clamp-1 text-[15px] font-semibold text-fg">{persona}</h2>
            {oferta.autorVerificado ? <SelloVerificado /> : null}
          </div>
          {oferta.autorSeguro ? (
            <p className="mt-1">
              <EtiquetaSeguro />
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-fg-subtle">{oferta.autorCodigo}</p>
          <a
            href={`tel:${oferta.autorTelefono}`}
            className="mt-0.5 inline-block text-sm font-medium tabular-nums text-brand-600 dark:text-brand-300"
          >
            {formatearTelefono(oferta.autorTelefono)}
          </a>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tabular-nums text-fg">{formatearTasa(oferta.tasa)}</p>
          <p className="text-xs text-fg-muted">
            por {nombreDivisa(oferta.divisa ?? "USD").replace(/e?s$/, "")}
          </p>
        </div>
      </div>

      {/* Cuánto se aparta de las referencias del día. Solo hay referencia
          pública para el dólar, así que en las demás monedas no se muestra. */}
      {(oferta.divisa ?? "USD") === "USD" ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Desviacion etiqueta="BCV" tasa={oferta.tasa} referencia={tasas.bcv} />
          <Desviacion etiqueta="Binance" tasa={oferta.tasa} referencia={tasas.binance} />
        </div>
      ) : null}

      <dl className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-3 text-sm">
        <div>
          <dt className="text-xs text-fg-subtle">Disponible</dt>
          <dd className="font-semibold tabular-nums text-fg">
            {formatearDivisa(oferta.monto, oferta.divisa ?? "USD")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-subtle">Sector</dt>
          <dd className="clamp-1 font-semibold text-fg">{oferta.zona}</dd>
        </div>
      </dl>

      {oferta.metodos.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {oferta.metodos.map((metodo) => (
            <Insignia key={metodo} tono="marca">
              {ETIQUETA_METODO[metodo]}
            </Insignia>
          ))}
        </div>
      ) : null}

      {oferta.descripcion ? (
        <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{oferta.descripcion}</p>
      ) : null}

      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-fg-subtle">
        <IconClock size={13} className="shrink-0" />
        Confirmada {hace(oferta.actualizadaEn)} · se retira en{" "}
        {horasRestantes === 1 ? "1 hora" : `${horasRestantes} horas`}
      </p>

      <div className="mt-3">
        {esMia ? (
          <Boton
            ancho
            variante="secundario"
            icono={<IconCheck size={17} />}
            cargando={confirmando}
            onClick={confirmar}
          >
            Sigo disponible
          </Boton>
        ) : (
          <BotonWhatsApp
            telefono={oferta.autorTelefono}
            mensaje={`Hola ${oferta.autorNombre}, te escribo por Mara Comercio. Vi que ${verbo} ${nombreDivisa(
              oferta.divisa ?? "USD",
            )} a ${formatearTasa(oferta.tasa)}. ¿Sigue disponible?`}
          />
        )}
      </div>
    </article>
  );
}

/** Insignia con la distancia de la oferta respecto a una referencia. */
function Desviacion({
  etiqueta,
  tasa,
  referencia,
}: {
  etiqueta: string;
  tasa: number;
  referencia: number | null;
}) {
  if (referencia === null) return null;

  const diferencia = diferenciaPorcentual(tasa, referencia);
  if (diferencia === null) return null;

  // Más de un 5% por encima de la referencia merece mirarse dos veces.
  const tono = diferencia > 5 ? "venta" : diferencia < -1 ? "compra" : "neutro";

  return (
    <Insignia tono={tono}>
      {formatearDiferencia(diferencia)} vs {etiqueta}
    </Insignia>
  );
}
