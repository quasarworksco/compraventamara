/**
 * Set de iconos de Mara Comercio.
 *
 * Regla del proyecto: no se usan emojis en ninguna parte de la interfaz.
 * Todo símbolo visible sale de este archivo.
 *
 * Los iconos son SVG de trazo sobre una rejilla de 24x24 y heredan el color
 * del texto (`currentColor`), así que se pintan con las clases de Tailwind.
 */
import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  /** Lado del icono en píxeles. Por defecto 24. */
  size?: number;
};

function Icon({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ----------------------------------------------------------------- */
/* Navegación                                                         */
/* ----------------------------------------------------------------- */

export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.2 12 3l9 7.2" />
      <path d="M5.5 9.4V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.4" />
    </Icon>
  );
}

/** Mercado: artículos sueltos que vende cualquier miembro. */
export function IconTag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11.6 3H20a1 1 0 0 1 1 1v8.4a2 2 0 0 1-.6 1.4l-6.6 6.6a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8l6.6-6.6a2 2 0 0 1 1.4-.6Z" />
      <circle cx="16.5" cy="7.5" r="1.5" />
    </Icon>
  );
}

/** Tiendas: negocios con vitrina propia. */
export function IconStore(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4h16l1.2 4.2a3 3 0 0 1-5.9 1 3 3 0 0 1-5.9 0 3 3 0 0 1-5.9-1L4 4Z" />
      <path d="M4.6 10.8V20a1 1 0 0 0 1 1h12.8a1 1 0 0 0 1-1v-9.2" />
      <path d="M9.8 21v-5.2h4.4V21" />
    </Icon>
  );
}

/** Mototaxis: el transporte del grupo. */
export function IconMoto(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M8 17h5.2l3.4-6.2" />
      <path d="M13.2 7.2h3.1l1.9 3.4" />
      <path d="M5 14.4 9 8h4" />
      <path d="M9.4 8 8 5.4H6" />
    </Icon>
  );
}

/** Dólares: compra y venta de divisas. */
export function IconDollar(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.8v18.4" />
      <path d="M16.4 7.1c0-1.8-2-3-4.4-3s-4.4 1.2-4.4 3 1.6 2.6 4.4 3.2c2.8.6 4.7 1.4 4.7 3.4 0 1.9-2.1 3.2-4.7 3.2s-4.7-1.3-4.7-3.2" />
    </Icon>
  );
}

/** Rifas: el ticket con el número. */
export function IconTicket(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8.4V6.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v1.9a2.6 2.6 0 0 0 0 5.2v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a2.6 2.6 0 0 0 0-5.2Z" />
      <path d="M14.2 5.5v2M14.2 11v2M14.2 16.5v2" />
    </Icon>
  );
}

export function IconChat(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.6c0 4.2-3.8 7.6-8.5 7.6a9.6 9.6 0 0 1-2.7-.4L4 21l1.3-3.7A7.2 7.2 0 0 1 3.5 11.6C3.5 7.4 7.3 4 12 4s8.5 3.4 8.5 7.6Z" />
    </Icon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.2a7.5 7.5 0 0 1 15 0" />
    </Icon>
  );
}

/* ----------------------------------------------------------------- */
/* Acciones                                                           */
/* ----------------------------------------------------------------- */

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 5-7 7 7 7" />
    </Icon>
  );
}

export function IconSend(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />
    </Icon>
  );
}

export function IconLapiz(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4.2L19.6 8.6a2.1 2.1 0 0 0 0-3l-1.2-1.2a2.1 2.1 0 0 0-3 0L4 15.8V20Z" />
      <path d="m14.4 5.6 4 4" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
      <path d="M6.2 7l.8 12.1a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L17.8 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </Icon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5h3.7a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-3.7" />
      <path d="M10 8.2 6 12l4 3.8" />
      <path d="M6 12h8.5" />
    </Icon>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.6 6.2A8.9 8.9 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3 3.7" />
      <path d="M6.4 8a17 17 0 0 0-3.9 4s3.5 6.2 9.5 6.2a8.8 8.8 0 0 0 3.3-.65" />
      <path d="M10 10.1a2.8 2.8 0 0 0 3.9 3.9" />
      <path d="M3.5 3.5l17 17" />
    </Icon>
  );
}

/* ----------------------------------------------------------------- */
/* Información                                                        */
/* ----------------------------------------------------------------- */

export function IconPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Icon>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.7 3.5a1 1 0 0 1 1 .6l1.3 3a1 1 0 0 1-.25 1.15L8.2 9.5a12.5 12.5 0 0 0 6.3 6.3l1.25-1.55a1 1 0 0 1 1.15-.25l3 1.3a1 1 0 0 1 .6 1v2.5a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 3.2 5.7 2 2 0 0 1 5.2 3.5Z" />
    </Icon>
  );
}

export function IconCompartir(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="18" cy="5.5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="18.5" r="2.6" />
      <path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4" />
    </Icon>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
      <path d="m3.4 6.5 7.5 5.6a2 2 0 0 0 2.2 0l7.5-5.6" />
    </Icon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.3l3.4 2" />
    </Icon>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5h3L8 6h8l1.5 2.5h3a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </Icon>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="m4 17 4.8-4.4a1.6 1.6 0 0 1 2.2 0L16 17.4" />
      <path d="m13.8 14.4 1.9-1.7a1.6 1.6 0 0 1 2.2 0l2.9 2.6" />
    </Icon>
  );
}

/** Miembro verificado por la administración del grupo. */
export function IconVerified(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 2.8 2.3 1.9 3-.2.7 2.9 2.5 1.6-1.3 2.7 1.3 2.7-2.5 1.6-.7 2.9-3-.2L12 21.2l-2.3-1.9-3 .2-.7-2.9-2.5-1.6L4.8 12 3.5 9.3l2.5-1.6.7-2.9 3 .2L12 2.8Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </Icon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v4.8M12 15.9v.1" />
    </Icon>
  );
}

/**
 * Vendedor Seguro: escudo con visto.
 *
 * Distinto a propósito del sello de verificado, que es una estrella dentada.
 * Dos símbolos parecidos para dos niveles de confianza distintos serían peor
 * que no distinguirlos: quien mira el tablón tiene que notar la diferencia de
 * un vistazo, sin leer.
 */
export function IconEscudo(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.8 4.8 5.6v5.9c0 4.2 3 7.6 7.2 9.7 4.2-2.1 7.2-5.5 7.2-9.7V5.6L12 2.8Z" />
      <path d="m8.9 11.8 2.2 2.2 4-4.3" />
    </Icon>
  );
}

/** Estadísticas del panel. */
export function IconGrafico(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8.5 20v-6M13 20V8.5M17.5 20v-9" />
    </Icon>
  );
}

/** Descargar un archivo: bajar los datos a una hoja de cálculo. */
export function IconDescargar(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </Icon>
  );
}

/** Reportar: una bandera plantada. */
export function IconBandera(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 21V3.6" />
      <path d="M5.5 4.3c3.6-1.5 5.9 1.5 9.5 0 1.4-.6 2.4-.5 3.5 0v9.2c-1.1.5-2.1.6-3.5 0-3.6-1.5-5.9 1.5-9.5 0" />
    </Icon>
  );
}

/** Publicación destacada: una estrella. */
export function IconEstrella(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.3 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.5l5.9-.8L12 3.3Z" />
    </Icon>
  );
}

/** Cómo llegar: el mapa doblado. */
export function IconMapa(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.2 4.3 3.5 6.5v13.2l5.7-2.2 5.6 2.2 5.7-2.2V4.3l-5.7 2.2-5.6-2.2Z" />
      <path d="M9.2 4.3v13.2M14.8 6.5v13.2" />
    </Icon>
  );
}

/** Tomar la ubicación actual: la mira del GPS. */
export function IconLocalizar(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="7.6" />
      <path d="M12 2v2.4M12 19.6V22M22 12h-2.4M4.4 12H2" />
    </Icon>
  );
}

/** Taxi: el carro, para separarlo de la moto en el directorio. */
export function IconCarro(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.6 16.5v2.1a.9.9 0 0 0 .9.9h1.4a.9.9 0 0 0 .9-.9v-1.1M19.4 16.5v2.1a.9.9 0 0 1-.9.9h-1.4a.9.9 0 0 1-.9-.9v-1.1" />
      <path d="M3.4 16.5h17.2v-3.7l-1.5-4.2a1.6 1.6 0 0 0-1.5-1.1H6.4a1.6 1.6 0 0 0-1.5 1.1l-1.5 4.2v3.7Z" />
      <path d="M3.9 12.8h16.2" />
      <path d="M6.9 14.6h.1M17 14.6h.1" />
    </Icon>
  );
}

/** Pedir: una mano levantada, como quien para una moto en la calle. */
export function IconMano(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.2 11V4.8a1.4 1.4 0 0 1 2.8 0V10" />
      <path d="M12 9.6V3.9a1.4 1.4 0 0 1 2.8 0V10" />
      <path d="M14.8 10.3V6.2a1.4 1.4 0 0 1 2.8 0V14a6.2 6.2 0 0 1-6.2 6.2h-.6a5.6 5.6 0 0 1-4.4-2.2l-2.5-3.3a1.4 1.4 0 0 1 2-1.9l2.3 2" />
    </Icon>
  );
}

/** Surtidor de combustible. */
export function IconSurtidor(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20.5h10.5" />
      <path d="M5.4 20.5V4.9a1.4 1.4 0 0 1 1.4-1.4h5.3a1.4 1.4 0 0 1 1.4 1.4v15.6" />
      <path d="M5.4 10.2h8.1" />
      <path d="M16.6 8.2h1.6a1.4 1.4 0 0 1 1.4 1.4v7a1.5 1.5 0 0 1-3 0v-3.2h-3" />
      <path d="M16 6.2 18.3 8" />
    </Icon>
  );
}

export function IconArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  );
}

/* ----------------------------------------------------------------- */
/* Marca                                                              */
/* ----------------------------------------------------------------- */

/** Glifo oficial de WhatsApp: solo para los botones de contacto. */
export function IconWhatsApp({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.99c2.12 0 4.11.83 5.61 2.33a7.87 7.87 0 0 1 2.32 5.6c0 4.37-3.56 7.92-7.93 7.92a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-2.99.78.8-2.92-.19-.3a7.86 7.86 0 0 1-1.21-4.21c0-4.37 3.55-7.93 7.91-7.93Zm-4.4 4.1c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.71 2.72 4.21 3.71.59.24 1.05.38 1.41.49.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28-.24-.13-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.19-.53.06-.25-.12-1.05-.38-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14 0-.3-.03-.47-.03Z" />
    </svg>
  );
}

/** Indicador de carga. La animación va por CSS, no por JS. */
export function IconSpinner({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
