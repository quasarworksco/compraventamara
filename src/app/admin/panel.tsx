"use client";

/**
 * Panel de administración.
 *
 * Cuatro pestañas, ni una más: miembros, publicaciones, tasas y —solo para el
 * correo dueño— administradores.
 */
import Link from "next/link";
import { useState } from "react";
import type { User } from "firebase/auth";

import {
  IconAlert,
  IconCheck,
  IconDollar,
  IconLogout,
  IconTag,
  IconTrash,
  IconUser,
  IconVerified,
} from "@/components/icons";
import {
  Avatar,
  Aviso,
  Boton,
  Campo,
  Esqueleto,
  Insignia,
  SelloVerificado,
} from "@/components/ui";
import {
  cambiarVerificacion,
  mensajeAdmin,
  nombrarAdministrador,
  quitarAdministrador,
  useAdministradores,
  useMiembros,
  type NivelAdmin,
} from "@/lib/admin";
import {
  ETIQUETA_TIPO,
  formatearTelefono,
  hace,
  iniciales,
  nombreCompleto,
} from "@/lib/formato";
import { borrarPublicacion, usePublicaciones } from "@/lib/publicaciones";
import { guardarTasasManuales, useTasas } from "@/lib/tasas";

type Pestana = "miembros" | "publicaciones" | "tasas" | "administradores";

export function PanelAdmin({
  usuario,
  nivel,
  alSalir,
}: {
  usuario: User;
  nivel: NivelAdmin;
  alSalir: () => Promise<void>;
}) {
  const [pestana, setPestana] = useState<Pestana>("miembros");
  const esDueno = nivel === "dueno";

  const pestanas: { id: Pestana; etiqueta: string; Icono: typeof IconUser }[] = [
    { id: "miembros", etiqueta: "Miembros", Icono: IconUser },
    { id: "publicaciones", etiqueta: "Publicaciones", Icono: IconTag },
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
        {pestana === "miembros" ? <SeccionMiembros /> : null}
        {pestana === "publicaciones" ? <SeccionPublicaciones /> : null}
        {pestana === "tasas" ? <SeccionTasas /> : null}
        {pestana === "administradores" && esDueno ? (
          <SeccionAdministradores correoDueno={usuario.email ?? ""} />
        ) : null}
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------- */

function SeccionMiembros() {
  const { miembros, cargando } = useMiembros(true);
  const [busqueda, setBusqueda] = useState("");
  // Sin esto, una escritura rechazada no dejaba rastro en pantalla: el botón
  // se pulsaba, la promesa se rompía en el vacío y todo seguía igual.
  const [fallo, setFallo] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  async function alternarVerificacion(uid: string, verificado: boolean) {
    setFallo(null);
    setTrabajando(uid);
    try {
      await cambiarVerificacion(uid, verificado);
    } catch (error) {
      setFallo(mensajeAdmin(error));
    } finally {
      setTrabajando(null);
    }
  }

  const filtrados = miembros.filter((m) =>
    `${m.nombre} ${m.apellido} ${m.codigo} ${m.telefono}`
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim()),
  );

  // Quien pidió la verificación va arriba: es la cola que hay que atender.
  const visibles = [...filtrados].sort((a, b) => {
    const esperaA = !a.verificado && a.solicitaVerificacion === true;
    const esperaB = !b.verificado && b.solicitaVerificacion === true;
    if (esperaA !== esperaB) return esperaA ? -1 : 1;
    if (esperaA && esperaB) return (a.solicitadoEn ?? 0) - (b.solicitadoEn ?? 0);
    return b.creadoEn - a.creadoEn;
  });

  const pendientes = miembros.filter(
    (m) => !m.verificado && m.solicitaVerificacion === true,
  ).length;

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

      <p className="text-xs text-fg-subtle">
        {visibles.length} de {miembros.length} miembros
      </p>

      {visibles.map((miembro) => (
        <article
          key={miembro.uid}
          className="flex items-center gap-3 tarjeta p-3"
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
          </div>
          <Boton
            variante={miembro.verificado ? "secundario" : "primario"}
            cargando={trabajando === miembro.uid}
            onClick={() => alternarVerificacion(miembro.uid, !miembro.verificado)}
            icono={miembro.verificado ? undefined : <IconCheck size={16} />}
          >
            {miembro.verificado ? "Quitar" : "Verificar"}
          </Boton>
        </article>
      ))}
    </section>
  );
}

/* ----------------------------------------------------------------- */

function SeccionPublicaciones() {
  const { publicaciones, cargando } = usePublicaciones({ tope: 200 });

  if (cargando) return <Esqueleto className="h-40" />;

  return (
    <section className="flex flex-col gap-2.5">
      <p className="text-xs text-fg-subtle">{publicaciones.length} publicaciones activas</p>

      {publicaciones.map((publicacion) => (
        <article
          key={publicacion.id}
          className="flex items-center gap-3 tarjeta p-3"
        >
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
            <div className="mt-1 flex gap-1.5">
              <Insignia tono="marca">{ETIQUETA_TIPO[publicacion.tipo]}</Insignia>
              <Insignia>{hace(publicacion.creadaEn)}</Insignia>
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
        </article>
      ))}
    </section>
  );
}

/* ----------------------------------------------------------------- */

function SeccionTasas() {
  const { tasas } = useTasas();
  const [bcv, setBcv] = useState("");
  const [binance, setBinance] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

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
        verificar miembros, borrar publicaciones y cargar tasas, pero no repartir permisos.
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
