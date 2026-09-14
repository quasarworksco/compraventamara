"use client";

/**
 * Panel de administración.
 *
 * El panel no está para mirar cifras bonitas: está para decidir. Cada número
 * del resumen tiene una acción detrás —a quién verificar, qué sector está
 * vacío, quién sostiene el tablón de divisas— y lo que no lleva a una decisión
 * no se pinta.
 *
 * Cinco pestañas: resumen, miembros, publicaciones, tasas y —solo para el
 * correo dueño— administradores.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { User } from "firebase/auth";

import {
  IconAlert,
  IconBandera,
  IconCheck,
  IconChevronRight,
  IconClose,
  IconDescargar,
  IconDollar,
  IconEscudo,
  IconEstrella,
  IconGrafico,
  IconLogout,
  IconSearch,
  IconSurtidor,
  IconTag,
  IconTrash,
  IconUser,
  IconVerified,
} from "@/components/icons";
import { Barras, Cifra, Cifras, Tendencia } from "@/components/grafico";
import {
  AreaTexto,
  Avatar,
  Aviso,
  Boton,
  Campo,
  Esqueleto,
  EstadoVacio,
  Insignia,
  SelloSeguro,
  SelloVerificado,
} from "@/components/ui";
import { mensajeFirestore } from "@/lib/errores";
import {
  advertirMiembro,
  borrarMiembro,
  cambiarVendedorSeguro,
  cambiarVerificacion,
  rechazarFoto,
  nombrarAdministrador,
  quitarAdministrador,
  useAdministradores,
  useMiembros,
  useTodasLasPublicaciones,
  type NivelAdmin,
} from "@/lib/admin";
import { DIAS_TENDENCIA, calcularResumen } from "@/lib/estadisticas";
import {
  HORAS_VIGENCIA_ESTACIONES,
  borrarParte,
  guardarParte,
  leerParte,
  parteVigente,
  useEstaciones,
  type Estacion,
} from "@/lib/estaciones";
import { exportarMiembros, exportarPublicaciones } from "@/lib/exportar";
import {
  reabrirReporte,
  resolverReporte,
  useReportes,
} from "@/lib/reportes";
import {
  ETIQUETA_MOTIVO,
  ETIQUETA_TIPO,
  formatearTasa,
  formatearTelefono,
  hace,
  iniciales,
  nombreCompleto,
  normalizarBusqueda,
} from "@/lib/formato";
import {
  borrarPublicacion,
  destacarPublicacion,
  estaDestacada,
  estaVigente,
} from "@/lib/publicaciones";
import { useAhora } from "@/lib/reloj";
import { guardarTasasManuales, probarFuentes, useTasas } from "@/lib/tasas";
import type { Miembro, Publicacion, Reporte, TipoPublicacion } from "@/lib/types";

type Pestana =
  | "resumen"
  | "reportes"
  | "miembros"
  | "publicaciones"
  | "estaciones"
  | "tasas"
  | "administradores";

export function PanelAdmin({
  usuario,
  nivel,
  alSalir,
}: {
  usuario: User;
  nivel: NivelAdmin;
  alSalir: () => Promise<void>;
}) {
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const esDueno = nivel === "dueno";
  // La cola se consulta desde la cabecera para poder marcar la pestaña: un
  // reporte sin atender no puede depender de que alguien entre a mirar.
  const { reportes } = useReportes(true);
  const abiertos = reportes.filter((r) => r.estado === "abierto").length;

  const pestanas: { id: Pestana; etiqueta: string; Icono: typeof IconUser }[] = [
    { id: "resumen", etiqueta: "Resumen", Icono: IconGrafico },
    {
      id: "reportes",
      etiqueta: abiertos > 0 ? `Reportes (${abiertos})` : "Reportes",
      Icono: IconBandera,
    },
    { id: "miembros", etiqueta: "Miembros", Icono: IconUser },
    { id: "publicaciones", etiqueta: "Publicaciones", Icono: IconTag },
    { id: "estaciones", etiqueta: "Gasolina", Icono: IconSurtidor },
    { id: "tasas", etiqueta: "Tasas", Icono: IconDollar },
    ...(esDueno
      ? [{ id: "administradores" as const, etiqueta: "Admins", Icono: IconVerified }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-fg">Administración</h1>
            <p className="clamp-1 text-xs text-fg-muted">
              {usuario.email}
              {esDueno ? " · dueño" : ""}
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-brand-600 dark:text-brand-300">
            Ver la página
          </Link>
          <button
            type="button"
            onClick={alSalir}
            aria-label="Cerrar sesión"
            className="flex size-10 items-center justify-center rounded-xl text-fg-muted active:bg-surface-2"
          >
            <IconLogout size={19} />
          </button>
        </div>

        <div className="scroll-x flex gap-2 px-4 pb-2.5">
          {pestanas.map(({ id, etiqueta, Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              aria-pressed={pestana === id}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-medium ${
                pestana === id
                  ? "border-brand-600 bg-brand-600 text-white"
                  : id === "reportes" && abiertos > 0
                    ? "border-danger/40 bg-danger/8 text-danger"
                    : "border-line bg-surface text-fg-muted"
              }`}
            >
              <Icono size={15} />
              {etiqueta}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {pestana === "resumen" ? <SeccionResumen /> : null}
        {pestana === "reportes" ? (
          <SeccionReportes reportes={reportes} correo={usuario.email ?? ""} />
        ) : null}
        {pestana === "miembros" ? <SeccionMiembros /> : null}
        {pestana === "publicaciones" ? <SeccionPublicaciones /> : null}
        {pestana === "estaciones" ? <SeccionEstaciones /> : null}
        {pestana === "tasas" ? <SeccionTasas /> : null}
        {pestana === "administradores" && esDueno ? (
          <SeccionAdministradores correoDueno={usuario.email ?? ""} />
        ) : null}
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Resumen                                                            */
/* ----------------------------------------------------------------- */

function SeccionResumen() {
  const { miembros, cargando: cargandoMiembros } = useMiembros(true);
  const { publicaciones, cargando: cargandoPublicaciones } = useTodasLasPublicaciones(true);
  const { tasas } = useTasas();
  // La hora entra como dato y no se lee durante el render: así dos renders
  // seguidos dan el mismo resumen, y las cuentas se refrescan solas.
  const ahora = useAhora(5 * 60_000);

  const resumen = useMemo(
    () => calcularResumen(miembros, publicaciones, ahora),
    [miembros, publicaciones, ahora],
  );

  if (cargandoMiembros || cargandoPublicaciones) {
    return (
      <div className="flex flex-col gap-3">
        <Esqueleto className="h-24" />
        <Esqueleto className="h-40" />
        <Esqueleto className="h-40" />
      </div>
    );
  }

  const { miembros: gente, publicaciones: anuncios, divisas } = resumen;
  const participacion =
    gente.total > 0 ? Math.round((gente.activos / gente.total) * 100) : 0;

  return (
    <section className="flex flex-col gap-4">
      {gente.esperando > 0 ? (
        <Aviso>
          {gente.esperando === 1
            ? "Hay 1 persona esperando verificación."
            : `Hay ${gente.esperando} personas esperando verificación.`}{" "}
          Sin el sello no pueden publicar en el tablón de divisas.
        </Aviso>
      ) : null}

      {/* El pueblo */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-fg-muted">El pueblo</h2>
        <Cifras>
          <Cifra
            etiqueta="Miembros"
            valor={gente.total}
            detalle={`${gente.nuevos7} esta semana`}
            tono="marca"
          />
          <Cifra
            etiqueta="Verificados"
            valor={gente.verificados}
            detalle={
              gente.esperando > 0 ? `${gente.esperando} en cola` : "nadie esperando"
            }
          />
          <Cifra
            etiqueta="Vendedores Seguros"
            valor={gente.seguros}
            detalle="avalados por ti"
            tono={gente.seguros > 0 ? "aviso" : "neutro"}
          />
          <Cifra
            etiqueta="Han publicado"
            valor={`${participacion}%`}
            detalle={`${gente.activos} de ${gente.total}`}
          />
          <Cifra
            etiqueta="Nuevos en 30 días"
            valor={gente.nuevos30}
            detalle={gente.nuevos30 > 0 ? "sigue creciendo" : "sin registros"}
          />
          <Cifra
            etiqueta="Publicaciones vivas"
            valor={anuncios.activas}
            detalle={`${anuncios.nuevas7} esta semana`}
          />
          <Cifra
            etiqueta="Se vendieron"
            valor={anuncios.cerradas30}
            detalle={`en 30 días · ${anuncios.cerradas} en total`}
          />
          <Cifra
            etiqueta="Destacadas ahora"
            valor={anuncios.destacadas}
            detalle="lo que estás cobrando"
            tono={anuncios.destacadas > 0 ? "aviso" : "neutro"}
          />
        </Cifras>
        <p className="text-xs text-fg-subtle">
          &laquo;Han publicado&raquo; es la cifra que dice si la plataforma se usa o solo
          se mira. Cuando baja, lo que falta no son miembros: son motivos para publicar.
          &laquo;Se vendieron&raquo; solo cuenta lo que su dueño marcó como cerrado, así que
          es un suelo, no el total: siempre habrá quien venda y no lo diga.
        </p>
      </div>

      <Tendencia
        titulo={`Publicaciones por día (${DIAS_TENDENCIA} días)`}
        datos={resumen.actividad}
        unidad="Publicaciones"
      />

      <Tendencia
        titulo={`Registros por día (${DIAS_TENDENCIA} días)`}
        datos={resumen.registros}
        unidad="Registros"
      />

      <Barras
        titulo="Qué se publica"
        datos={anuncios.porTipo}
        unidad="Vivas"
        vacio="Todavía no hay publicaciones vivas."
      />

      {/* Divisas */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-fg-muted">Tablón de divisas</h2>
        <Cifras>
          <Cifra
            etiqueta="Ofertas vivas"
            valor={divisas.ofertasVivas}
            detalle={`${divisas.cambistas} ${
              divisas.cambistas === 1 ? "persona" : "personas"
            }`}
            tono="marca"
          />
          <Cifra
            etiqueta="Venden el dólar a"
            valor={divisas.tasaVentaUsd ? formatearTasa(divisas.tasaVentaUsd) : "—"}
            detalle="promedio de las ofertas"
          />
          <Cifra
            etiqueta="Lo compran a"
            valor={divisas.tasaCompraUsd ? formatearTasa(divisas.tasaCompraUsd) : "—"}
            detalle="promedio de las ofertas"
          />
        </Cifras>
        {tasas.bcv && divisas.tasaVentaUsd ? (
          <p className="text-xs text-fg-subtle">
            El pueblo vende {formatearTasa(divisas.tasaVentaUsd)} frente a los{" "}
            {formatearTasa(tasas.bcv)} del BCV.
          </p>
        ) : null}
      </div>

      <Barras
        titulo="Sectores con más movimiento"
        datos={resumen.zonas}
        unidad="Vivas"
        vacio="Todavía no hay publicaciones con sector."
      />

      <Barras
        titulo="Categorías y rubros más publicados"
        datos={resumen.categorias}
        unidad="Vivas"
        vacio="Todavía no hay categorías."
      />

      {/* Quién sostiene esto */}
      {resumen.masActivos.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold text-fg-muted">Quién publica más</h2>
          <ul className="tarjeta overflow-hidden">
            {resumen.masActivos.map((fila) => (
              <li
                key={fila.codigo || fila.nombre}
                className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0"
              >
                <Avatar
                  size={34}
                  url={fila.miembro?.fotoUrl}
                  nombre={
                    fila.miembro
                      ? iniciales(fila.miembro.nombre, fila.miembro.apellido)
                      : "?"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="clamp-1 flex items-center gap-1 text-sm font-semibold text-fg">
                    {fila.nombre}
                    {fila.miembro?.vendedorSeguro ? <SelloSeguro size={13} /> : null}
                  </p>
                  <p className="text-xs text-fg-subtle">{fila.codigo}</p>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-fg">
                  {fila.total}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-subtle">
            Son quienes sostienen el sitio. Si alguno se va, se nota; conviene tenerlos
            contentos.
          </p>
        </div>
      ) : null}

      {/* Extracción */}
      <div className="flex flex-col gap-2.5 tarjeta p-3.5">
        <h2 className="text-sm font-semibold text-fg">Llevarse los datos</h2>
        <p className="text-xs text-fg-muted">
          Se bajan como CSV, listo para abrir en Excel o en Google Sheets. Incluyen el
          teléfono con el código de país, así que sirven para armar una difusión de
          WhatsApp sin copiar nada a mano.
        </p>
        <div className="flex flex-wrap gap-2">
          <Boton
            variante="secundario"
            icono={<IconDescargar size={16} />}
            onClick={() => exportarMiembros(miembros)}
            disabled={miembros.length === 0}
          >
            Miembros ({miembros.length})
          </Boton>
          <Boton
            variante="secundario"
            icono={<IconDescargar size={16} />}
            onClick={() => exportarPublicaciones(publicaciones, ahora)}
            disabled={publicaciones.length === 0}
          >
            Publicaciones ({publicaciones.length})
          </Boton>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Reportes                                                           */
/* ----------------------------------------------------------------- */

/**
 * La cola de moderación.
 *
 * Abiertos arriba y del más viejo al más nuevo: una cola que ordena por lo
 * último que llegó deja el primer aviso enterrado, que es justo el que lleva
 * más tiempo sin respuesta.
 *
 * Las dos salidas son distintas a propósito. "Atendido" dice que se hizo algo;
 * "sin fundamento" dice que se miró y no había nada. Un solo botón de cerrar
 * borraría esa diferencia, y con ella la manera de notar a quien reporta por
 * deporte.
 */
function SeccionReportes({ reportes, correo }: { reportes: Reporte[]; correo: string }) {
  const [verCerrados, setVerCerrados] = useState(false);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  async function ejecutar(id: string, accion: () => Promise<void>) {
    setFallo(null);
    setTrabajando(id);
    try {
      await accion();
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setTrabajando(null);
    }
  }

  const abiertos = reportes.filter((r) => r.estado === "abierto");
  const cerrados = reportes.filter((r) => r.estado !== "abierto");

  const visibles = verCerrados
    ? cerrados
    : [...abiertos].sort((a, b) => a.creadoEn - b.creadoEn);

  return (
    <section className="flex flex-col gap-3">
      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

      <Aviso>
        Lo que llega aquí no lo ve nadie más. Quien reporta queda en el documento para que
        puedas valorar su criterio, pero su nombre no sale a ninguna parte del sitio.
      </Aviso>

      <div className="flex gap-2">
        <Chip activo={!verCerrados} onClick={() => setVerCerrados(false)}>
          Sin atender ({abiertos.length})
        </Chip>
        <Chip activo={verCerrados} onClick={() => setVerCerrados(true)}>
          Ya cerrados ({cerrados.length})
        </Chip>
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          icono={<IconBandera size={24} />}
          titulo={verCerrados ? "Todavía no has cerrado ninguno" : "No hay nada por atender"}
          detalle={
            verCerrados
              ? "Aquí quedan los reportes que ya resolviste o descartaste."
              : "Cuando alguien reporte un anuncio o a una persona, aparecerá aquí."
          }
        />
      ) : null}

      {visibles.map((reporte) => (
        <article key={reporte.id} className="flex flex-col gap-2.5 tarjeta p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-danger">
              <IconBandera size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{ETIQUETA_MOTIVO[reporte.motivo]}</p>
              <p className="clamp-2 text-xs text-fg-muted">{reporte.objetivoTitulo}</p>
            </div>
            <Insignia tono={reporte.estado === "abierto" ? "venta" : "neutro"}>
              {reporte.estado === "abierto"
                ? "Sin atender"
                : reporte.estado === "resuelto"
                  ? "Atendido"
                  : "Sin fundamento"}
            </Insignia>
          </div>

          {reporte.detalle ? (
            <p className="rounded-xl bg-surface-2 p-2.5 text-sm leading-relaxed text-fg-muted">
              {reporte.detalle}
            </p>
          ) : null}

          <p className="text-xs text-fg-subtle">
            Lo reportó {reporte.reportanteNombre} ({reporte.reportanteCodigo}){" "}
            {hace(reporte.creadoEn)}
          </p>

          <div className="flex flex-wrap gap-2">
            {reporte.sobre === "publicacion" ? (
              <Link href={`/publicacion/?id=${reporte.objetivoId}`} className="flex-1">
                <Boton variante="secundario" ancho className="!min-h-10 !text-sm">
                  Ver la publicación
                </Boton>
              </Link>
            ) : null}

            {reporte.estado === "abierto" ? (
              <>
                <Boton
                  variante="secundario"
                  cargando={trabajando === reporte.id}
                  onClick={() =>
                    ejecutar(reporte.id, () =>
                      resolverReporte(reporte.id, "descartado", correo),
                    )
                  }
                  className="!min-h-10 flex-1 !text-sm"
                >
                  Sin fundamento
                </Boton>
                <Boton
                  cargando={trabajando === reporte.id}
                  onClick={() =>
                    ejecutar(reporte.id, () => resolverReporte(reporte.id, "resuelto", correo))
                  }
                  icono={<IconCheck size={16} />}
                  className="!min-h-10 flex-1 !text-sm"
                >
                  Atendido
                </Boton>
              </>
            ) : (
              <Boton
                variante="secundario"
                cargando={trabajando === reporte.id}
                onClick={() => ejecutar(reporte.id, () => reabrirReporte(reporte.id))}
                className="!min-h-10 flex-1 !text-sm"
              >
                Devolver a la cola
              </Boton>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Miembros                                                           */
/* ----------------------------------------------------------------- */

type FiltroMiembros = "todos" | "esperando" | "verificados" | "seguros" | "pausados";

const FILTROS_MIEMBROS: { id: FiltroMiembros; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "esperando", etiqueta: "Sin verificar" },
  { id: "verificados", etiqueta: "Verificados" },
  { id: "seguros", etiqueta: "Seguros" },
  { id: "pausados", etiqueta: "En pausa" },
];

function SeccionMiembros() {
  const { miembros, cargando } = useMiembros(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroMiembros>("todos");
  // Sin esto, una escritura rechazada no dejaba rastro en pantalla: el botón
  // se pulsaba, la promesa se rompía en el vacío y todo seguía igual.
  const [fallo, setFallo] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  /** La ficha que está abierta, si hay alguna. */
  const [abierto, setAbierto] = useState<string | null>(null);

  async function ejecutar(uid: string, accion: () => Promise<void>) {
    setFallo(null);
    setTrabajando(uid);
    try {
      await accion();
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setTrabajando(null);
    }
  }

  /**
   * Quien todavía no tiene el sello.
   *
   * Antes este filtro solo enseñaba a quien había pedido la verificación
   * expresamente, y esa no es la pregunta que uno le hace a un panel: casi
   * nadie pide nada, se registran y ya. El resultado era un filtro "Esperando"
   * casi siempre vacío mientras la lista tenía gente sin revisar.
   *
   * Ahora "sin verificar" es lo que dice: todos los que faltan. Los que además
   * lo pidieron suben al principio, porque esos sí están esperando respuesta.
   */
  const sinVerificar = (m: Miembro) => !m.verificado;
  const pidio = (m: Miembro) => !m.verificado && m.solicitaVerificacion === true;
  const enPausa = (m: Miembro) => m.fotoRechazada === true;

  const visibles = useMemo(() => {
    const texto = normalizarBusqueda(busqueda.trim());

    const filtrados = miembros
      .filter((m) => {
        if (filtro === "esperando") return sinVerificar(m);
        if (filtro === "verificados") return m.verificado;
        if (filtro === "seguros") return m.vendedorSeguro === true;
        if (filtro === "pausados") return enPausa(m);
        return true;
      })
      .filter((m) =>
        texto
          ? normalizarBusqueda(`${m.nombre} ${m.apellido} ${m.codigo} ${m.telefono}`).includes(
              texto,
            )
          : true,
      );

    /**
     * El orden de la cola, de lo más urgente a lo ya resuelto:
     * primero quien pidió la verificación, después el resto de los que faltan
     * por revisar, y al final los verificados, que son los que ya no piden
     * nada de ti. Dentro de cada grupo, los más viejos primero entre los que
     * esperan, y los más nuevos primero entre los demás.
     */
    const escalon = (m: Miembro) => (pidio(m) ? 0 : !m.verificado ? 1 : 2);

    return [...filtrados].sort((a, b) => {
      const diferencia = escalon(a) - escalon(b);
      if (diferencia !== 0) return diferencia;
      if (pidio(a) && pidio(b)) return (a.solicitadoEn ?? 0) - (b.solicitadoEn ?? 0);
      return b.creadoEn - a.creadoEn;
    });
  }, [miembros, busqueda, filtro]);

  // Se relee de la lista en vivo y no se guarda una copia: así la ficha
  // abierta refleja lo que se acaba de cambiar en ella.
  const ficha = abierto ? (miembros.find((m) => m.uid === abierto) ?? null) : null;

  const pendientes = miembros.filter(pidio).length;
  const porRevisar = miembros.filter(sinVerificar).length;
  const pausados = miembros.filter(enPausa).length;

  if (cargando) return <Esqueleto className="h-40" />;

  return (
    <section className="flex flex-col gap-3">
      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

      {pendientes > 0 ? (
        <Aviso>
          {pendientes === 1
            ? "Hay 1 persona esperando verificación."
            : `Hay ${pendientes} personas esperando verificación.`}{" "}
          Sin el sello no pueden publicar en el tablón de divisas.
        </Aviso>
      ) : null}

      <Campo
        etiqueta="Buscar miembro"
        placeholder="Nombre, código o teléfono"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="scroll-x flex gap-2">
        {FILTROS_MIEMBROS.map(({ id, etiqueta }) => {
          const cuantos =
            id === "esperando" ? porRevisar : id === "pausados" ? pausados : 0;
          return (
            <Chip key={id} activo={filtro === id} onClick={() => setFiltro(id)}>
              {etiqueta}
              {cuantos > 0 ? ` (${cuantos})` : ""}
            </Chip>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-fg-subtle">
          {visibles.length} de {miembros.length} miembros
        </p>
        <Boton
          variante="fantasma"
          icono={<IconDescargar size={15} />}
          onClick={() => exportarMiembros(visibles)}
          disabled={visibles.length === 0}
          className="!min-h-9 !px-2 !text-sm"
        >
          Bajar CSV
        </Boton>
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          icono={<IconSearch size={24} />}
          titulo="Nadie coincide"
          detalle="Prueba con otro filtro o con otro texto."
        />
      ) : null}

      {visibles.map((miembro) => (
        <FilaMiembro
          key={miembro.uid}
          miembro={miembro}
          ocupado={trabajando === miembro.uid}
          alAbrir={() => setAbierto(miembro.uid)}
          alVerificar={() =>
            ejecutar(miembro.uid, () =>
              cambiarVerificacion(miembro.uid, !miembro.verificado),
            )
          }
          alAsegurar={() =>
            ejecutar(miembro.uid, () =>
              cambiarVendedorSeguro(miembro.uid, !miembro.vendedorSeguro),
            )
          }
        />
      ))}

      {ficha ? <FichaMiembro miembro={ficha} alCerrar={() => setAbierto(null)} /> : null}
    </section>
  );
}

/**
 * La ficha completa de un miembro, con la foto en grande.
 *
 * Existe por una razón concreta: para decidir si una foto de perfil es de
 * verdad de la persona hay que verla, y en la lista cabe un círculo de 44
 * píxeles donde todo el mundo parece legítimo. Aquí ocupa la pantalla.
 *
 * Es también su carnet: el código MC, el teléfono, el sector y desde cuándo
 * está. Lo mismo que ve un vecino antes de quedar con él, pero junto y con las
 * acciones al lado.
 */
function FichaMiembro({ miembro, alCerrar }: { miembro: Miembro; alCerrar: () => void }) {
  const { publicaciones } = useTodasLasPublicaciones(true);
  const [nota, setNota] = useState(miembro.advertencia ?? "");
  const [trabajando, setTrabajando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  const suyas = publicaciones.filter((p) => p.autorUid === miembro.uid);

  async function ejecutar(accion: () => Promise<void>, mensaje: string) {
    setFallo(null);
    setHecho(null);
    setTrabajando(true);
    try {
      await accion();
      setHecho(mensaje);
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setTrabajando(false);
    }
  }

  async function borrar() {
    const seguro = window.confirm(
      `¿Borrar la cuenta de ${nombreCompleto(miembro.nombre, miembro.apellido)} (${miembro.codigo})?\n\n` +
        `Se irán también sus ${suyas.length} publicaciones. No se puede deshacer.\n\n` +
        `Si solo quieres que cambie la foto, usa "La foto no es suya" en vez de esto.`,
    );
    if (!seguro) return;
    await ejecutar(async () => {
      await borrarMiembro(miembro.uid);
      alCerrar();
    }, "Cuenta borrada.");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${miembro.nombre}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface pb-safe sm:rounded-3xl">
        {/* La foto, del tamaño en que se puede juzgar. */}
        <div className="relative">
          {miembro.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miembro.fotoUrl}
              alt={`Foto de perfil de ${miembro.nombre}`}
              className="aspect-square w-full rounded-t-3xl object-cover sm:rounded-t-3xl"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-t-3xl bg-surface-2 text-fg-subtle">
              <IconUser size={64} />
            </div>
          )}

          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
          >
            <IconClose size={20} />
          </button>

          {miembro.fotoRechazada ? (
            <p className="absolute inset-x-0 bottom-0 bg-danger/90 px-4 py-2 text-sm font-semibold text-white">
              Cuenta en pausa: debe cambiar esta foto
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3.5 p-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-fg">
                {nombreCompleto(miembro.nombre, miembro.apellido)}
              </h2>
              {miembro.verificado ? <SelloVerificado size={16} /> : null}
              {miembro.vendedorSeguro ? <SelloSeguro size={17} /> : null}
            </div>
            <p className="text-sm tabular-nums text-fg-muted">{miembro.codigo}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-card bg-surface-2 p-3.5 text-sm">
            <div>
              <dt className="text-xs text-fg-subtle">Teléfono</dt>
              <dd>
                <a
                  href={`tel:${miembro.telefono}`}
                  className="font-medium tabular-nums text-brand-600"
                >
                  {formatearTelefono(miembro.telefono)}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-subtle">Sector</dt>
              <dd className="font-medium text-fg">{miembro.zona || "Sin indicar"}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-subtle">Se registró</dt>
              <dd className="font-medium text-fg">{hace(miembro.creadoEn)}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-subtle">Publicaciones</dt>
              <dd className="font-medium text-fg">{suyas.length}</dd>
            </div>
          </dl>

          {suyas.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-fg-subtle">Lo que ha publicado</p>
              <ul className="flex flex-col gap-1">
                {suyas.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/publicacion/?id=${p.id}`}
                      className="clamp-1 text-sm text-brand-600"
                    >
                      {ETIQUETA_TIPO[p.tipo]} · {p.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}
          {hecho ? <Aviso>{hecho}</Aviso> : null}

          <div className="flex flex-wrap gap-2">
            <Boton
              variante={miembro.verificado ? "secundario" : "primario"}
              cargando={trabajando}
              className="!min-h-10 flex-1 !text-sm"
              icono={miembro.verificado ? undefined : <IconCheck size={16} />}
              onClick={() =>
                ejecutar(
                  () => cambiarVerificacion(miembro.uid, !miembro.verificado),
                  miembro.verificado ? "Verificación retirada." : "Miembro verificado.",
                )
              }
            >
              {miembro.verificado ? "Quitar verificación" : "Verificar"}
            </Boton>

            <Boton
              variante="secundario"
              cargando={trabajando}
              disabled={!miembro.verificado}
              icono={<IconEscudo size={16} />}
              className={`!min-h-10 flex-1 !text-sm ${
                miembro.vendedorSeguro ? "" : "!border-verde-300 !text-verde-600"
              }`}
              onClick={() =>
                ejecutar(
                  () => cambiarVendedorSeguro(miembro.uid, !miembro.vendedorSeguro),
                  miembro.vendedorSeguro ? "Aval retirado." : "Ahora es Vendedor Seguro.",
                )
              }
            >
              {miembro.vendedorSeguro ? "Quitar el aval" : "Vendedor Seguro"}
            </Boton>
          </div>

          {/* La foto: el control que da sentido a haberla puesto en grande. */}
          <div className="flex flex-col gap-2 rounded-card border border-line p-3.5">
            <p className="text-sm font-semibold text-fg">¿La foto es de esta persona?</p>
            <p className="text-xs text-fg-muted">
              Si es un logo, un paisaje, la foto de otro o no se le ve la cara, ponla en
              pausa: no podrá publicar ni escribir hasta que suba una suya, y volverá a esta
              cola cuando lo haga.
            </p>
            <Boton
              variante={miembro.fotoRechazada ? "secundario" : "peligro"}
              ancho
              cargando={trabajando}
              className="!min-h-10 !text-sm"
              onClick={() =>
                ejecutar(
                  () => rechazarFoto(miembro.uid, !miembro.fotoRechazada),
                  miembro.fotoRechazada
                    ? "Cuenta reactivada."
                    : "Cuenta en pausa hasta que cambie la foto.",
                )
              }
            >
              {miembro.fotoRechazada ? "Levantar la pausa" : "La foto no es suya"}
            </Boton>
          </div>

          {/* Una advertencia: lo que hay entre no hacer nada y cerrar una cuenta. */}
          <div className="flex flex-col gap-2 rounded-card border border-line p-3.5">
            <AreaTexto
              etiqueta="Dejarle una nota"
              rows={2}
              maxLength={500}
              placeholder="La verá al entrar. Por ejemplo: tu foto se ve muy oscura."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
            <Boton
              variante="secundario"
              ancho
              cargando={trabajando}
              className="!min-h-10 !text-sm"
              onClick={() =>
                ejecutar(
                  () => advertirMiembro(miembro.uid, nota),
                  nota.trim() ? "Nota guardada." : "Nota retirada.",
                )
              }
            >
              {nota.trim() ? "Guardar la nota" : "Quitar la nota"}
            </Boton>
          </div>

          <Boton
            variante="peligro"
            ancho
            cargando={trabajando}
            icono={<IconTrash size={16} />}
            onClick={borrar}
          >
            Borrar la cuenta y sus {suyas.length} publicaciones
          </Boton>
        </div>
      </div>
    </div>
  );
}

function FilaMiembro({
  miembro,
  ocupado,
  alAbrir,
  alVerificar,
  alAsegurar,
}: {
  miembro: Miembro;
  ocupado: boolean;
  alAbrir: () => void;
  alVerificar: () => void;
  alAsegurar: () => void;
}) {
  const seguro = miembro.vendedorSeguro === true;

  return (
    <article
      className={`flex flex-col gap-3 tarjeta p-3 ${
        miembro.fotoRechazada ? "ring-2 ring-danger/40" : ""
      }`}
    >
      {/* Toda la cabecera abre la ficha: para juzgar una foto de perfil hay
          que verla en grande, y en la lista cabe un círculo de 44 píxeles
          donde todo el mundo parece legítimo. */}
      <button
        type="button"
        onClick={alAbrir}
        className="flex items-center gap-3 text-left"
        aria-label={`Ver la ficha de ${nombreCompleto(miembro.nombre, miembro.apellido)}`}
      >
        <Avatar
          size={44}
          url={miembro.fotoUrl}
          nombre={iniciales(miembro.nombre, miembro.apellido)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="clamp-1 font-semibold text-fg">
              {nombreCompleto(miembro.nombre, miembro.apellido)}
            </p>
            {miembro.verificado ? <SelloVerificado size={14} /> : null}
            {seguro ? <SelloSeguro size={15} /> : null}
          </div>
          <p className="text-xs text-fg-subtle">
            {miembro.codigo} · {formatearTelefono(miembro.telefono)}
          </p>
          <p className="text-xs text-fg-subtle">Se registró {hace(miembro.creadoEn)}</p>
          {!miembro.verificado && miembro.solicitaVerificacion ? (
            <span className="mt-1 inline-block">
              <Insignia tono="verde">
                Pidió verificación {hace(miembro.solicitadoEn ?? miembro.creadoEn)}
              </Insignia>
            </span>
          ) : null}
          {seguro && miembro.seguroDesde ? (
            <p className="text-xs text-verde-600">
              Vendedor Seguro desde {hace(miembro.seguroDesde)}
            </p>
          ) : null}
          {miembro.fotoRechazada ? (
            <span className="mt-1 inline-block">
              <Insignia tono="venta">En pausa: debe cambiar su foto</Insignia>
            </span>
          ) : null}
        </div>
        {/* Escrito y no solo insinuado con una flecha: dentro de la ficha están
            la foto en grande y el borrado de la cuenta, y nadie va a descubrir
            que existen tocando una fila que no dice que se pueda tocar. */}
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-600">
          Ver ficha
          <IconChevronRight size={15} />
        </span>
      </button>

      <div className="flex flex-wrap gap-2">
        <Boton
          variante={miembro.verificado ? "secundario" : "primario"}
          cargando={ocupado}
          onClick={alVerificar}
          icono={miembro.verificado ? undefined : <IconCheck size={16} />}
          className="!min-h-10 flex-1 !text-sm"
        >
          {miembro.verificado ? "Quitar verificación" : "Verificar"}
        </Boton>

        <Boton
          variante="secundario"
          cargando={ocupado}
          onClick={alAsegurar}
          disabled={!miembro.verificado}
          icono={<IconEscudo size={16} />}
          className={`!min-h-10 flex-1 !text-sm ${
            seguro ? "" : "!border-verde-300 !text-verde-600"
          }`}
        >
          {seguro ? "Quitar el aval" : "Vendedor Seguro"}
        </Boton>
      </div>

      {!miembro.verificado ? (
        <p className="text-xs text-fg-subtle">
          El aval de Vendedor Seguro se da sobre una identidad ya comprobada: primero
          verificar, después avalar.
        </p>
      ) : null}
    </article>
  );
}

/* ----------------------------------------------------------------- */
/* Publicaciones                                                      */
/* ----------------------------------------------------------------- */

type FiltroEstado = "vivas" | "vencidas" | "todas";

function SeccionPublicaciones() {
  const { publicaciones, cargando } = useTodasLasPublicaciones(true);
  const ahora = useAhora(5 * 60_000);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<TipoPublicacion | null>(null);
  const [estado, setEstado] = useState<FiltroEstado>("vivas");

  const viva = (p: Publicacion) => estaVigente(p, ahora);

  const visibles = useMemo(() => {
    const texto = normalizarBusqueda(busqueda.trim());
    return publicaciones
      .filter((p) => (tipo ? p.tipo === tipo : true))
      .filter((p) => {
        if (estado === "vivas") return viva(p);
        if (estado === "vencidas") return !viva(p);
        return true;
      })
      .filter((p) =>
        texto
          ? normalizarBusqueda(
              `${p.titulo} ${p.zona} ${p.autorNombre} ${p.autorApellido} ${p.autorCodigo}`,
            ).includes(texto)
          : true,
      );
    // `viva` depende de `ahora`, que ya está en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicaciones, busqueda, tipo, estado, ahora]);

  if (cargando) return <Esqueleto className="h-40" />;

  return (
    <section className="flex flex-col gap-3">
      <Campo
        etiqueta="Buscar publicación"
        placeholder="Título, sector o autor"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="scroll-x flex gap-2">
        <Chip activo={tipo === null} onClick={() => setTipo(null)}>
          Todo
        </Chip>
        {(Object.keys(ETIQUETA_TIPO) as TipoPublicacion[]).map((id) => (
          <Chip key={id} activo={tipo === id} onClick={() => setTipo(id)}>
            {ETIQUETA_TIPO[id]}
          </Chip>
        ))}
      </div>

      <div className="scroll-x flex gap-2">
        {(["vivas", "vencidas", "todas"] as FiltroEstado[]).map((id) => (
          <Chip key={id} activo={estado === id} onClick={() => setEstado(id)}>
            {id === "vivas" ? "Vivas" : id === "vencidas" ? "Vencidas o cerradas" : "Todas"}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-fg-subtle">
          {visibles.length} de {publicaciones.length} publicaciones
        </p>
        <Boton
          variante="fantasma"
          icono={<IconDescargar size={15} />}
          onClick={() => exportarPublicaciones(visibles, ahora)}
          disabled={visibles.length === 0}
          className="!min-h-9 !px-2 !text-sm"
        >
          Bajar CSV
        </Boton>
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          icono={<IconSearch size={24} />}
          titulo="Nada por aquí"
          detalle="Prueba con otro filtro o con otro texto."
        />
      ) : null}

      {visibles.map((publicacion) => (
        <FilaPublicacion key={publicacion.id} publicacion={publicacion} viva={viva(publicacion)} />
      ))}
    </section>
  );
}


/**
 * Una publicación en el panel, con el destaque a mano.
 *
 * Destacar se cobra por fuera —Pago Móvil y captura por WhatsApp— y se concede
 * aquí. Es a propósito: montar una pasarela de pago para un pueblo donde todo
 * se paga por Pago Móvil sería resolver un problema que nadie tiene, y meter
 * una dependencia que hay que mantener para siempre.
 *
 * Las reglas de Firestore rechazan este campo si lo escribe el autor, así que
 * el cobro no depende de que la interfaz esconda el botón.
 */
function FilaPublicacion({ publicacion, viva }: { publicacion: Publicacion; viva: boolean }) {
  const [trabajando, setTrabajando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const destacada = estaDestacada(publicacion);

  async function destacar(dias: number) {
    setFallo(null);
    setTrabajando(true);
    try {
      await destacarPublicacion(publicacion.id, dias);
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <article
      className={`flex flex-col gap-2.5 tarjeta p-3 ${destacada ? "ring-2 ring-brand-400" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/publicacion/?id=${publicacion.id}`}
            className="clamp-1 font-semibold text-fg"
          >
            {publicacion.titulo}
          </Link>
          <p className="clamp-1 text-xs text-fg-subtle">
            {publicacion.autorNombre} {publicacion.autorApellido} · {publicacion.autorCodigo}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Insignia tono="marca">{ETIQUETA_TIPO[publicacion.tipo]}</Insignia>
            <Insignia>{hace(publicacion.creadaEn)}</Insignia>
            {destacada ? (
              <Insignia tono="verde">
                <IconEstrella size={11} />
                Destacada {hasta(publicacion.destacadaHasta)}
              </Insignia>
            ) : null}
            {publicacion.estado === "cerrada" ? (
              <Insignia tono="compra">Vendida</Insignia>
            ) : viva ? null : (
              <Insignia tono="venta">Fuera del aire</Insignia>
            )}
          </div>
        </div>
        <Boton
          variante="peligro"
          icono={<IconTrash size={16} />}
          onClick={() => {
            if (window.confirm(`¿Borrar "${publicacion.titulo}"? No se puede deshacer.`)) {
              borrarPublicacion(publicacion.id);
            }
          }}
        >
          Borrar
        </Boton>
      </div>

      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

      <div className="flex flex-wrap gap-2">
        {destacada ? (
          <Boton
            variante="secundario"
            cargando={trabajando}
            onClick={() => destacar(0)}
            className="!min-h-9 !px-3 !text-sm"
          >
            Quitar el destaque
          </Boton>
        ) : (
          <>
            <Boton
              variante="secundario"
              cargando={trabajando}
              onClick={() => destacar(7)}
              icono={<IconEstrella size={15} />}
              className="!min-h-9 !px-3 !text-sm"
            >
              Destacar 7 días
            </Boton>
            <Boton
              variante="secundario"
              cargando={trabajando}
              onClick={() => destacar(15)}
              icono={<IconEstrella size={15} />}
              className="!min-h-9 !px-3 !text-sm"
            >
              15 días
            </Boton>
          </>
        )}
      </div>
    </article>
  );
}

/** "hasta el 4 oct", para saber cuándo se le acaba lo pagado. */
function hasta(marca: number | undefined): string {
  if (!marca) return "";
  return `hasta el ${new Date(marca).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
  })}`;
}

/** Pastilla de filtro. La misma en las dos listas del panel. */
function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-h-9 shrink-0 rounded-pill border px-3.5 text-sm font-medium ${
        activo
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line bg-surface text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}


/* ----------------------------------------------------------------- */
/* Estaciones de servicio                                             */
/* ----------------------------------------------------------------- */

/**
 * El parte diario de gasolina.
 *
 * No se pide una ficha por estación: el parte llega cada día por WhatsApp
 * escrito a mano, y quien lo carga lo tiene en el portapapeles. Se pega tal
 * como llegó, se ve lo que se entendió antes de guardar, y ya. Siete
 * formularios para un mensaje que ya existe es la clase de trabajo que hace
 * que un día nadie lo cargue.
 *
 * Los emojis del mensaje se descartan al interpretarlo: la interfaz pone sus
 * propios iconos.
 */
function SeccionEstaciones() {
  const { parte } = useEstaciones();
  const ahora = useAhora(60_000);

  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  // Se interpreta al vuelo mientras se escribe: así lo que se ve abajo es
  // exactamente lo que se va a guardar, y no hay que publicar para descubrir
  // que una línea no se entendió.
  const leido = useMemo(() => leerParte(texto), [texto]);
  const vigente = parteVigente(parte, ahora);

  async function publicar() {
    setGuardando(true);
    setFallo(null);
    setHecho(null);
    try {
      await guardarParte(leido.estaciones, leido.hora);
      setTexto("");
      setHecho("Parte publicado. Ya se ve en la portada.");
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setGuardando(false);
    }
  }

  async function retirar() {
    if (!window.confirm("¿Retirar el parte de la portada?")) return;
    setGuardando(true);
    setFallo(null);
    try {
      await borrarParte();
      setHecho("Parte retirado.");
    } catch (error) {
      setFallo(mensajeFirestore(error, "moderar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Aviso>
        Pega el mensaje de WhatsApp tal como te llega, con emojis y todo. Se retira solo a
        las {HORAS_VIGENCIA_ESTACIONES} horas: un parte de gasolina de ayer manda a alguien
        a cruzar el municipio en reserva para encontrar la bomba cerrada.
      </Aviso>

      {/* Lo que el pueblo está viendo ahora mismo. */}
      <div className="rounded-card border border-line bg-surface p-3.5 shadow-card">
        <p className="text-sm font-semibold text-fg">En la portada ahora</p>
        {vigente ? (
          <>
            <p className="mt-0.5 text-xs text-fg-subtle">
              {parte.estaciones.length}{" "}
              {parte.estaciones.length === 1 ? "estación" : "estaciones"} ·{" "}
              {parte.horaDelParte ? `parte de las ${parte.horaDelParte} · ` : ""}
              cargado {hace(parte.actualizadoEn)}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {parte.estaciones.map((e, i) => (
                <li key={`${e.nombre}-${i}`}>
                  <Insignia tono="verde">{e.nombre}</Insignia>
                </li>
              ))}
            </ul>
            <Boton
              variante="secundario"
              ancho
              cargando={guardando}
              onClick={retirar}
              className="mt-3 !min-h-10 !text-sm"
            >
              Retirarlo ya
            </Boton>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-fg-subtle">
            No hay parte vigente. La portada dice que todavía no hay parte de hoy.
          </p>
        )}
      </div>

      <AreaTexto
        etiqueta="Pega aquí el mensaje de hoy"
        rows={8}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={"LES INFORMO ESTAS SON LAS ESTACIONES QUE ESTÁN SURTIENDO... HORA 1:12 PM\n\nMARA VIEJA (GASOLINA Y DIÉSEL\nFUERTE MARA (GASOLINA\n..."}
      />

      {/* Lo que se entendió, antes de publicarlo. */}
      {texto.trim() ? (
        <div className="rounded-card border border-line bg-surface p-3.5">
          <p className="text-sm font-semibold text-fg">
            Se entendieron {leido.estaciones.length}{" "}
            {leido.estaciones.length === 1 ? "estación" : "estaciones"}
            {leido.hora ? ` · hora del parte: ${leido.hora}` : ""}
          </p>

          {leido.estaciones.length === 0 ? (
            <p className="mt-1 text-xs text-fg-muted">
              No se reconoció ninguna. Cada línea tiene que nombrar la estación y decir si
              es gasolina, diésel o las dos.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {leido.estaciones.map((estacion: Estacion, indice: number) => (
                <li
                  key={`${estacion.nombre}-${indice}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="min-w-0 flex-1 font-medium text-fg">{estacion.nombre}</span>
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {estacion.combustibles
                      .map((c) => (c === "diesel" ? "Diésel" : "Gasolina"))
                      .join(" + ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}
      {hecho ? <Aviso>{hecho}</Aviso> : null}

      <Boton
        ancho
        cargando={guardando}
        disabled={leido.estaciones.length === 0}
        onClick={publicar}
        icono={<IconSurtidor size={17} />}
      >
        Publicar el parte de hoy
      </Boton>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Tasas                                                              */
/* ----------------------------------------------------------------- */

function SeccionTasas() {
  const { tasas } = useTasas();
  const [bcv, setBcv] = useState("");
  const [binance, setBinance] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);
  const [prueba, setPrueba] = useState<
    { nombre: string; bcv: number | null; binance: number | null; fallo?: string }[] | null
  >(null);

  async function probar() {
    setProbando(true);
    setPrueba(null);
    try {
      setPrueba(await probarFuentes());
    } finally {
      setProbando(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setFallo(null);
    try {
      await guardarTasasManuales(Number(bcv), Number(binance));
      setListo(true);
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudieron guardar las tasas.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Aviso>
        La portada toma las tasas de una fuente pública cada 30 minutos. Este respaldo solo se
        usa si esa fuente falla, así que conviene mantenerlo al día.
      </Aviso>

      <div className="rounded-card border border-line bg-surface p-3.5 text-sm shadow-card">
        <p className="font-semibold text-fg">Lo que se está mostrando ahora</p>
        <p className="mt-1 text-fg-muted">
          BCV: {tasas.bcv ?? "sin dato"} · Binance: {tasas.binance ?? "sin dato"}
        </p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          Origen: {tasas.origen === "api" ? "fuente automática" : tasas.origen === "manual" ? "respaldo manual" : "ninguno"}
        </p>
      </div>

      {/* Desde fuera no hay manera de saber si una fuente pública dejó de
          responder o cambió un campo: lo único que se ve es una portada sin
          cifra. Esto lo contesta desde el teléfono en un toque. */}
      <div className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3.5 shadow-card">
        <p className="text-sm font-semibold text-fg">¿Responden las fuentes?</p>
        <p className="text-xs text-fg-muted">
          Pregunta a cada una por separado, desde este mismo navegador. Si una falla aquí,
          le falla igual a todo el pueblo.
        </p>

        {prueba ? (
          <ul className="flex flex-col gap-1.5">
            {prueba.map((r) => (
              <li key={r.nombre} className="rounded-xl bg-surface-2 p-2.5 text-xs">
                <p className="font-semibold text-fg">{r.nombre}</p>
                {r.fallo ? (
                  <p className="text-danger">{r.fallo}</p>
                ) : (
                  <p className="tabular-nums text-fg-muted">
                    BCV: {r.bcv ?? "no lo trae"} · Binance: {r.binance ?? "no lo trae"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <Boton
          variante="secundario"
          ancho
          cargando={probando}
          onClick={probar}
          className="!min-h-10 !text-sm"
        >
          Probar las fuentes ahora
        </Boton>
      </div>

      <Campo
        etiqueta="Tasa BCV (bolívares por dólar)"
        type="number"
        inputMode="decimal"
        step="any"
        value={bcv}
        onChange={(e) => setBcv(e.target.value)}
      />
      <Campo
        etiqueta="Tasa Binance (bolívares por dólar)"
        type="number"
        inputMode="decimal"
        step="any"
        value={binance}
        onChange={(e) => setBinance(e.target.value)}
      />

      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}
      {listo ? <Aviso>Respaldo guardado.</Aviso> : null}

      <Boton ancho cargando={guardando} onClick={guardar} disabled={!bcv || !binance}>
        Guardar el respaldo
      </Boton>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Administradores                                                    */
/* ----------------------------------------------------------------- */

function SeccionAdministradores({ correoDueno }: { correoDueno: string }) {
  const administradores = useAdministradores(true);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function nombrar() {
    setGuardando(true);
    setFallo(null);
    setListo(false);
    try {
      await nombrarAdministrador(uid.trim(), email, nombre, correoDueno);
      setUid("");
      setEmail("");
      setNombre("");
      setListo(true);
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo nombrar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Aviso>
        Solo tú, como correo dueño, puedes nombrar o quitar administradores. Ellos podrán
        verificar miembros, dar el aval de Vendedor Seguro, borrar publicaciones y cargar
        tasas, pero no repartir permisos.
      </Aviso>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-fg-muted">
          Administradores actuales ({administradores.length})
        </h2>

        <article className="flex items-center gap-3 rounded-card border border-brand-200 bg-brand-50 p-3 dark:border-brand-700 dark:bg-brand-800/40">
          <IconVerified size={20} className="shrink-0 text-brand-600 dark:text-brand-200" />
          <div className="min-w-0 flex-1">
            <p className="clamp-1 font-semibold text-fg">{correoDueno}</p>
            <p className="text-xs text-fg-muted">Dueño de la plataforma</p>
          </div>
        </article>

        {administradores.map((admin) => (
          <article
            key={admin.uid}
            className="flex items-center gap-3 tarjeta p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="clamp-1 font-semibold text-fg">{admin.nombre || admin.email}</p>
              <p className="clamp-1 text-xs text-fg-subtle">{admin.email}</p>
              <p className="text-xs text-fg-subtle">Nombrado {hace(admin.creadoEn)}</p>
            </div>
            <Boton
              variante="peligro"
              onClick={() => {
                if (window.confirm(`¿Quitarle la administración a ${admin.email}?`)) {
                  quitarAdministrador(admin.uid);
                }
              }}
            >
              Quitar
            </Boton>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 tarjeta p-3.5">
        <h2 className="text-sm font-semibold text-fg-muted">Nombrar un administrador</h2>

        <div className="flex items-start gap-2 text-xs text-fg-muted">
          <IconAlert size={15} className="mt-0.5 shrink-0" />
          <p>
            La persona necesita una cuenta de Firebase con ese correo. Pídele que entre una vez
            en <code>/admin</code> y cree su cuenta; el error que verá incluye su identificador,
            que es el UID que va aquí. También aparece en la consola de Firebase, en
            Authentication.
          </p>
        </div>

        <Campo
          etiqueta="UID de Firebase"
          placeholder="Copiado de Authentication"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}
        {listo ? <Aviso>Administrador nombrado.</Aviso> : null}

        <Boton
          ancho
          cargando={guardando}
          onClick={nombrar}
          disabled={!uid.trim() || !email.trim()}
        >
          Nombrar administrador
        </Boton>
      </div>
    </section>
  );
}
