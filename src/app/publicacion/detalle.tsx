"use client";

/** Ficha completa de una publicación, con galería y contacto. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { BotonCompartir } from "@/components/boton-compartir";
import { BotonWhatsApp } from "@/components/boton-whatsapp";
import {
  IconClock,
  IconImage,
  IconPin,
  IconTicket,
  IconTrash,
} from "@/components/icons";
import {
  Avatar,
  Aviso,
  Boton,
  Esqueleto,
  EstadoVacio,
  Insignia,
  SelloVerificado,
} from "@/components/ui";
import { miniatura } from "@/lib/cloudinary";
import { useSesion } from "@/lib/auth";
import {
  ETIQUETA_METODO,
  ETIQUETA_TIPO,
  formatearFecha,
  formatearPrecio,
  formatearTasa,
  formatearTelefono,
  hace,
  iniciales,
  nombreCompleto,
} from "@/lib/formato";
import {
  borrarPublicacion,
  cambiarEstadoPublicacion,
  diasDeVida,
  usePublicacion,
} from "@/lib/publicaciones";
import type { Publicacion } from "@/lib/types";

export function DetallePublicacion({ id }: { id: string }) {
  const { publicacion, cargando } = usePublicacion(id);
  const { miembro } = useSesion();
  const [indiceFoto, setIndiceFoto] = useState(0);

  if (cargando) {
    return (
      <>
        <BarraSuperior titulo="Publicación" />
        <div className="flex flex-col gap-3 p-4">
          <Esqueleto className="aspect-square w-full" />
          <Esqueleto className="h-6 w-2/3" />
          <Esqueleto className="h-20" />
        </div>
      </>
    );
  }

  if (!publicacion) {
    return (
      <>
        <BarraSuperior titulo="Publicación" />
        <EstadoVacio
          icono={<IconImage size={26} />}
          titulo="Esta publicación ya no está"
          detalle="Puede que se haya vendido o que haya vencido su plazo de 30 días."
          accion={
            <Link href="/mercado">
              <Boton variante="secundario">Ver el marketplace</Boton>
            </Link>
          }
        />
      </>
    );
  }

  const esMia = miembro?.uid === publicacion.autorUid;
  const persona = nombreCompleto(publicacion.autorNombre, publicacion.autorApellido);
  const dias = diasDeVida(publicacion);

  return (
    <>
      <BarraSuperior
        titulo={ETIQUETA_TIPO[publicacion.tipo]}
        subtitulo={publicacion.zona}
        volverA="/mercado"
      />

      <main className="pb-4">
        {/* Galería */}
        {publicacion.imagenes.length > 0 ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={miniatura(publicacion.imagenes[indiceFoto], 900)}
              alt={publicacion.titulo}
              className="aspect-square w-full bg-surface-2 object-cover"
            />
            {publicacion.imagenes.length > 1 ? (
              <div className="scroll-x flex gap-2 p-3">
                {publicacion.imagenes.map((url, indice) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setIndiceFoto(indice)}
                    aria-label={`Ver la foto ${indice + 1}`}
                    aria-pressed={indice === indiceFoto}
                    className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                      indice === indiceFoto ? "border-brand-600" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={miniatura(url, 160)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 px-4 pt-4">
          <div>
            <h1 className="text-xl font-bold leading-snug text-fg">{publicacion.titulo}</h1>
            <Precio publicacion={publicacion} />
          </div>

          <DatosPropios publicacion={publicacion} />

          {publicacion.descripcion ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg-muted">
              {publicacion.descripcion}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            <Insignia>
              <IconPin size={12} />
              {publicacion.zona}
            </Insignia>
            <Insignia>
              <IconClock size={12} />
              {hace(publicacion.creadaEn)}
            </Insignia>
            {publicacion.estado !== "activa" ? (
              <Insignia tono="venta">
                {publicacion.estado === "pausada" ? "Pausada" : "Cerrada"}
              </Insignia>
            ) : null}
          </div>

          {/* Vendedor */}
          <section className="tarjeta p-3.5">
            <h2 className="mb-2.5 text-sm font-semibold text-fg-muted">Publicado por</h2>
            <div className="flex items-center gap-3">
              <Avatar
                size={48}
                url={publicacion.autorFoto}
                nombre={iniciales(publicacion.autorNombre, publicacion.autorApellido)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="clamp-1 font-semibold text-fg">{persona}</p>
                  {publicacion.autorVerificado ? <SelloVerificado /> : null}
                </div>
                <p className="text-xs text-fg-subtle">{publicacion.autorCodigo}</p>
                <a
                  href={`tel:${publicacion.autorTelefono}`}
                  className="text-sm font-medium tabular-nums text-brand-600 dark:text-brand-300"
                >
                  {formatearTelefono(publicacion.autorTelefono)}
                </a>
              </div>
            </div>
          </section>

          {esMia ? (
            <Herramientas publicacion={publicacion} dias={dias} />
          ) : (
            <BotonWhatsApp
              telefono={publicacion.autorTelefono}
              mensaje={`Hola ${publicacion.autorNombre}, te escribo por Mara Comercio. Me interesa "${publicacion.titulo}". ¿Sigue disponible?`}
            />
          )}

          {/* Cada reenvío a un grupo del pueblo trae gente nueva. */}
          <BotonCompartir
            ancho
            titulo={publicacion.titulo}
            texto={textoParaCompartir(publicacion)}
            ruta={`/publicacion/?id=${publicacion.id}`}
            etiqueta="Compartir esta publicación"
          />

          <Aviso>
            Mara Comercio solo pone en contacto a las partes. Revisa lo que compras antes de
            pagar y reúnete en un lugar concurrido.
          </Aviso>
        </div>
      </main>
    </>
  );
}

/** La línea que acompaña al enlace cuando alguien reenvía una publicación. */
function textoParaCompartir(publicacion: Publicacion): string {
  const precio =
    publicacion.tipo === "producto"
      ? ` — ${formatearPrecio(publicacion.precio, publicacion.moneda)}`
      : publicacion.tipo === "rifa"
        ? ` — ${formatearPrecio(publicacion.precioNumero, publicacion.moneda)} el número`
        : publicacion.tipo === "dolar"
          ? ` — ${formatearTasa(publicacion.tasa)} por dólar`
          : "";

  return `${publicacion.titulo}${precio}\n${publicacion.zona}\n\nLo vi en Compra Venta Mara:`;
}

function Precio({ publicacion }: { publicacion: Publicacion }) {
  switch (publicacion.tipo) {
    case "producto":
      return (
        <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-300">
          {formatearPrecio(publicacion.precio, publicacion.moneda)}
        </p>
      );
    case "mototaxi":
      return (
        <p className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-300">
          Desde {formatearPrecio(publicacion.tarifaDesde, publicacion.moneda)}
        </p>
      );
    case "dolar":
      return (
        <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-300">
          {formatearTasa(publicacion.tasa)}
          <span className="ml-1.5 text-sm font-medium text-fg-muted">por dólar</span>
        </p>
      );
    case "rifa":
      return (
        <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-300">
          {formatearPrecio(publicacion.precioNumero, publicacion.moneda)}
          <span className="ml-1.5 text-sm font-medium text-fg-muted">por número</span>
        </p>
      );
    default:
      return null;
  }
}

/** Los datos que solo tienen sentido en un tipo concreto de publicación. */
function DatosPropios({ publicacion }: { publicacion: Publicacion }) {
  if (publicacion.tipo === "rifa") {
    return (
      <dl className="grid grid-cols-2 gap-3 rounded-card bg-surface-2 p-3.5 text-sm">
        <Dato etiqueta="Juega con" valor={publicacion.loteria} />
        <Dato
          etiqueta="Día del sorteo"
          valor={`${formatearFecha(publicacion.fechaSorteo)}${
            publicacion.sorteo ? ` · ${publicacion.sorteo}` : ""
          }`}
        />
        <Dato
          etiqueta="Números"
          valor={`${publicacion.numerosDisponibles} de ${publicacion.totalNumeros} libres`}
        />
        <Dato etiqueta="Premio" valor={publicacion.premio} />
      </dl>
    );
  }

  if (publicacion.tipo === "dolar") {
    return (
      <dl className="grid grid-cols-2 gap-3 rounded-card bg-surface-2 p-3.5 text-sm">
        <Dato
          etiqueta="Operación"
          valor={publicacion.operacion === "venta" ? "Vende efectivo" : "Compra efectivo"}
        />
        <Dato
          etiqueta="Monto"
          valor={`${formatearPrecio(publicacion.montoMin, "USD")} – ${formatearPrecio(
            publicacion.montoMax,
            "USD",
          )}`}
        />
        <div className="col-span-2">
          <dt className="text-xs text-fg-subtle">Métodos</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {publicacion.metodos.map((m) => (
              <Insignia key={m} tono="marca">
                {ETIQUETA_METODO[m]}
              </Insignia>
            ))}
          </dd>
        </div>
      </dl>
    );
  }

  if (publicacion.tipo === "negocio") {
    return (
      <dl className="flex flex-col gap-3 rounded-card bg-surface-2 p-3.5 text-sm">
        <Dato etiqueta="Rubro" valor={publicacion.categoria} />
        <Dato etiqueta="Dirección" valor={publicacion.direccion} />
        {publicacion.horario ? <Dato etiqueta="Horario" valor={publicacion.horario} /> : null}
      </dl>
    );
  }

  if (publicacion.tipo === "producto") {
    return (
      <dl className="grid grid-cols-3 gap-3 rounded-card bg-surface-2 p-3.5 text-sm">
        <Dato etiqueta="Categoría" valor={publicacion.categoria} />
        <Dato etiqueta="Condición" valor={publicacion.condicion === "nuevo" ? "Nuevo" : "Usado"} />
        <Dato etiqueta="Cantidad" valor={String(publicacion.cantidad)} />
      </dl>
    );
  }

  if (publicacion.tipo === "mototaxi" && publicacion.cobertura.length > 0) {
    return (
      <div className="rounded-card bg-surface-2 p-3.5">
        <p className="mb-1.5 text-xs text-fg-subtle">Sectores que cubre</p>
        <div className="flex flex-wrap gap-1.5">
          {publicacion.cobertura.map((sector) => (
            <Insignia key={sector}>{sector}</Insignia>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-subtle">{etiqueta}</dt>
      <dd className="font-semibold text-fg">{valor}</dd>
    </div>
  );
}

/** Acciones disponibles solo para quien publicó. */
function Herramientas({ publicacion, dias }: { publicacion: Publicacion; dias: number }) {
  const [trabajando, setTrabajando] = useState(false);
  const router = useRouter();

  async function cerrar() {
    setTrabajando(true);
    await cambiarEstadoPublicacion(publicacion.id, "cerrada");
    setTrabajando(false);
  }

  async function eliminar() {
    if (!window.confirm("¿Seguro que quieres borrar esta publicación? No se puede deshacer."))
      return;
    setTrabajando(true);
    await borrarPublicacion(publicacion.id);
    router.replace("/perfil");
  }

  return (
    <section className="flex flex-col gap-2.5 tarjeta p-3.5">
      <h2 className="text-sm font-semibold text-fg-muted">Esta publicación es tuya</h2>

      {publicacion.tipo !== "negocio" ? (
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <IconTicket size={15} className="shrink-0" />
          {dias > 0
            ? `Le quedan ${dias} ${dias === 1 ? "día" : "días"} antes de retirarse.`
            : "Ya venció: prorrógala desde tu perfil para volver a mostrarla."}
        </p>
      ) : null}

      <div className="flex gap-2">
        {publicacion.estado === "activa" ? (
          <Boton variante="secundario" ancho cargando={trabajando} onClick={cerrar}>
            Marcar como cerrada
          </Boton>
        ) : null}
        <Boton
          variante="peligro"
          icono={<IconTrash size={17} />}
          cargando={trabajando}
          onClick={eliminar}
        >
          Borrar
        </Boton>
      </div>
    </section>
  );
}
