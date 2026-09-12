"use client";

/** Piezas de interfaz reutilizables. Todo pensado para el pulgar, no para el ratón. */
import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { IconAlert, IconEye, IconEyeOff, IconSpinner, IconVerified } from "./icons";

/* ----------------------------------------------------------------- */
/* Botón                                                              */
/* ----------------------------------------------------------------- */

type Variante = "primario" | "secundario" | "fantasma" | "whatsapp" | "peligro";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
  secundario: "bg-surface-2 text-fg border border-line hover:bg-line/60",
  fantasma: "text-fg-muted hover:bg-surface-2",
  whatsapp: "bg-wa-500 text-[#06302a] hover:bg-wa-400 active:bg-wa-600 active:text-white",
  peligro: "bg-danger text-white hover:opacity-90",
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  /** Ocupa todo el ancho: es lo habitual en móvil. */
  ancho?: boolean;
  icono?: ReactNode;
}

export function Boton({
  variante = "primario",
  cargando = false,
  ancho = false,
  icono,
  children,
  className = "",
  disabled,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTES[variante]} ${ancho ? "w-full" : ""} ${className}`}
    >
      {cargando ? <IconSpinner size={18} /> : icono}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- */
/* Formularios                                                        */
/* ----------------------------------------------------------------- */

interface BaseCampo {
  etiqueta: string;
  ayuda?: string;
  error?: string;
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  className = "",
  ...props
}: BaseCampo & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-12 rounded-xl border bg-surface px-3.5 text-fg placeholder:text-fg-subtle ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-danger">
          <IconAlert size={15} />
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-sm text-fg-subtle">{ayuda}</p>
      ) : null}
    </div>
  );
}

/** Campo de contraseña con el ojito para revelarla. */
export function CampoClave({
  etiqueta,
  ayuda,
  error,
  ...props
}: BaseCampo & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={`min-h-12 w-full rounded-xl border bg-surface pl-3.5 pr-12 text-fg placeholder:text-fg-subtle ${error ? "border-danger" : "border-line"}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-fg-subtle hover:text-fg"
        >
          {visible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
        </button>
      </div>
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <IconAlert size={15} />
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-sm text-fg-subtle">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function AreaTexto({
  etiqueta,
  ayuda,
  error,
  ...props
}: BaseCampo & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={Boolean(error)}
        className={`rounded-xl border bg-surface p-3.5 text-fg placeholder:text-fg-subtle ${error ? "border-danger" : "border-line"}`}
        {...props}
      />
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <IconAlert size={15} />
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-sm text-fg-subtle">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Selector({
  etiqueta,
  ayuda,
  error,
  children,
  ...props
}: BaseCampo & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
        {etiqueta}
      </label>
      <select
        id={id}
        className={`min-h-12 rounded-xl border bg-surface px-3 text-fg ${error ? "border-danger" : "border-line"}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <IconAlert size={15} />
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-sm text-fg-subtle">{ayuda}</p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Presentación                                                       */
/* ----------------------------------------------------------------- */

/** Avatar con iniciales cuando el miembro todavía no subió foto. */
export function Avatar({
  nombre,
  url,
  size = 40,
}: {
  nombre: string;
  url?: string;
  size?: number;
}) {
  if (url) {
    // Imagen remota de Cloudinary: <img> evita configurar dominios en next/image.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-800 dark:text-brand-100"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {nombre}
    </span>
  );
}

export function Insignia({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: "neutro" | "marca" | "verde" | "compra" | "venta";
}) {
  const tonos = {
    neutro: "bg-surface-2 text-fg-muted",
    marca: "bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-100",
    verde: "bg-verde-100 text-verde-600 dark:bg-verde-600/25 dark:text-verde-200",
    compra: "bg-success/12 text-success",
    venta: "bg-sell/12 text-sell",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

/** Sello de miembro verificado por la administración. */
export function SelloVerificado({ size = 15 }: { size?: number }) {
  return (
    <span title="Miembro verificado" className="text-brand-500">
      <IconVerified size={size} />
      <span className="sr-only">Miembro verificado</span>
    </span>
  );
}

export function Aviso({
  children,
  tono = "info",
}: {
  children: ReactNode;
  tono?: "info" | "error";
}) {
  return (
    <div
      role={tono === "error" ? "alert" : undefined}
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
        tono === "error"
          ? "border-danger/35 bg-danger/8 text-danger"
          : "border-line bg-surface-2 text-fg-muted"
      }`}
    >
      <span className="mt-0.5 shrink-0">
        <IconAlert size={17} />
      </span>
      <div className="[&_a]:underline">{children}</div>
    </div>
  );
}

/** Lo que se ve cuando una lista todavía no tiene nada. */
export function EstadoVacio({
  icono,
  titulo,
  detalle,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-fg-subtle">
        {icono}
      </span>
      <h2 className="text-base font-semibold text-fg">{titulo}</h2>
      {detalle ? <p className="max-w-xs text-sm text-fg-muted">{detalle}</p> : null}
      {accion}
    </div>
  );
}

/** Rectángulo gris que ocupa el sitio mientras Firestore responde. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}
