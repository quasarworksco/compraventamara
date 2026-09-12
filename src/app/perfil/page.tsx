"use client";

/**
 * Perfil del miembro: su identificador, sus publicaciones y las prórrogas.
 *
 * Aquí es donde el sistema avisa de que un anuncio está por vencer y ofrece
 * renovarlo, que es el trato que se prometió al publicar: no se borra nada
 * a espaldas de su dueño.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { IconAlert, IconLogout, IconPlus, IconTag } from "@/components/icons";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import {
  Avatar,
  Aviso,
  Boton,
  Esqueleto,
  EstadoVacio,
  Insignia,
  SelloVerificado,
} from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { formatearTelefono, iniciales, nombreCompleto } from "@/lib/formato";
import {
  diasDeVida,
  estaVencida,
  porVencer,
  prorrogarPublicacion,
  usePublicaciones,
} from "@/lib/publicaciones";
import { DIAS_VIGENCIA, type Publicacion } from "@/lib/types";

export default function PaginaPerfil() {
  const { miembro, cargando, salir } = useSesion();
  const router = useRouter();

  const { publicaciones, cargando: cargandoLista } = usePublicaciones({
    autorUid: miembro?.uid,
    tope: 100,
  });

  const { porCaducar, resto } = useMemo(() => {
    const avisos = publicaciones.filter((p) => porVencer(p) || estaVencida(p));
    const otras = publicaciones.filter((p) => !avisos.includes(p));
    return { porCaducar: avisos, resto: otras };
  }, [publicaciones]);

  if (cargando) return <Esqueleto className="m-4 h-40" />;

  if (!miembro) {
    return (
      <>
        <BarraSuperior titulo="Mi perfil" volverA="/" />
        <EstadoVacio
          icono={<IconTag size={26} />}
          titulo="Todavía no tienes cuenta"
          detalle="Regístrate con tu teléfono y una foto para publicar y escribir en el chat."
          accion={
            <div className="flex w-full flex-col gap-2">
              <Link href="/registro">
                <Boton ancho>Crear mi cuenta</Boton>
              </Link>
              <Link href="/entrar">
                <Boton ancho variante="secundario">
                  Ya tengo cuenta
                </Boton>
              </Link>
            </div>
          }
        />
      </>
    );
  }

  async function cerrarSesion() {
    await salir();
    router.replace("/");
  }

  return (
    <>
      <BarraSuperior
        titulo="Mi perfil"
        volverA="/"
        accion={
          <button
            type="button"
            onClick={cerrarSesion}
            aria-label="Cerrar sesión"
            className="flex size-10 items-center justify-center rounded-xl text-fg-muted active:bg-surface-2"
          >
            <IconLogout size={20} />
          </button>
        }
      />

      <main className="flex flex-col gap-5 px-4 py-4">
        {/* Ficha del miembro */}
        <section className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-card">
          <Avatar
            size={64}
            url={miembro.fotoUrl}
            nombre={iniciales(miembro.nombre, miembro.apellido)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="clamp-1 text-lg font-bold text-fg">
                {nombreCompleto(miembro.nombre, miembro.apellido)}
              </h1>
              {miembro.verificado ? <SelloVerificado size={17} /> : null}
            </div>
            <p className="mt-0.5 text-sm tabular-nums text-fg-muted">
              {formatearTelefono(miembro.telefono)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Insignia tono="marca">{miembro.codigo}</Insignia>
              {miembro.zona ? <Insignia>{miembro.zona}</Insignia> : null}
            </div>
          </div>
        </section>

        {/* Avisos de vencimiento */}
        {porCaducar.length > 0 ? (
          <section aria-labelledby="titulo-avisos">
            <h2
              id="titulo-avisos"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg-muted"
            >
              <IconAlert size={16} className="text-danger" />
              Por vencer
            </h2>
            <div className="flex flex-col gap-2.5">
              {porCaducar.map((publicacion) => (
                <AvisoVencimiento key={publicacion.id} publicacion={publicacion} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Publicaciones */}
        <section aria-labelledby="titulo-mias">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="titulo-mias" className="text-sm font-semibold text-fg-muted">
              Mis publicaciones
            </h2>
            <Link
              href="/publicar"
              className="text-sm font-semibold text-brand-600 dark:text-brand-300"
            >
              Publicar
            </Link>
          </div>

          {cargandoLista ? (
            <Esqueleto className="h-28" />
          ) : publicaciones.length === 0 ? (
            <EstadoVacio
              icono={<IconTag size={26} />}
              titulo="Todavía no has publicado nada"
              accion={
                <Link href="/publicar">
                  <Boton icono={<IconPlus size={18} />}>Publicar algo</Boton>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {resto.map((publicacion) => (
                <TarjetaPublicacion key={publicacion.id} publicacion={publicacion} />
              ))}
            </div>
          )}
        </section>

        {!miembro.verificado ? (
          <Aviso>
            Tu cuenta todavía no está verificada. La administración del grupo marca como
            verificados a los miembros con buen historial de ventas.
          </Aviso>
        ) : null}

        <Boton variante="secundario" ancho icono={<IconLogout size={18} />} onClick={cerrarSesion}>
          Cerrar sesión
        </Boton>
      </main>
    </>
  );
}

/** Tarjeta de aviso con el botón de prórroga. */
function AvisoVencimiento({ publicacion }: { publicacion: Publicacion }) {
  const [prorrogando, setProrrogando] = useState(false);
  const [listo, setListo] = useState(false);
  const dias = diasDeVida(publicacion);
  const vencida = estaVencida(publicacion);

  async function prorrogar() {
    setProrrogando(true);
    try {
      await prorrogarPublicacion(publicacion);
      setListo(true);
    } finally {
      setProrrogando(false);
    }
  }

  return (
    <article
      className={`rounded-card border p-3.5 ${
        vencida ? "border-danger/40 bg-danger/8" : "border-line bg-surface shadow-card"
      }`}
    >
      <Link href={`/publicacion/${publicacion.id}`} className="clamp-1 font-semibold text-fg">
        {publicacion.titulo}
      </Link>

      <p className="mt-1 text-sm text-fg-muted">
        {listo
          ? `Prorrogada. Vuelve a estar visible ${DIAS_VIGENCIA} días más.`
          : vencida
            ? "Ya venció y dejó de mostrarse. Prorrógala para volver a publicarla."
            : `Se retira en ${dias} ${dias === 1 ? "día" : "días"}.`}
      </p>

      {!listo ? (
        <Boton
          variante={vencida ? "primario" : "secundario"}
          ancho
          className="mt-2.5"
          cargando={prorrogando}
          onClick={prorrogar}
        >
          Prorrogar {DIAS_VIGENCIA} días
        </Boton>
      ) : null}

      {publicacion.prorrogas > 0 ? (
        <p className="mt-1.5 text-xs text-fg-subtle">
          Prorrogada {publicacion.prorrogas}{" "}
          {publicacion.prorrogas === 1 ? "vez" : "veces"}.
        </p>
      ) : null}
    </article>
  );
}
