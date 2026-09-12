/**
 * Logotipo de Compra Venta Mara.
 *
 * Dos versiones del mismo archivo: la de color para fondos claros y la
 * monocroma para el azul de la cabecera, donde el original en color se
 * perdería contra el fondo.
 */
import Image from "next/image";

import logoColor from "../../public/logo.png";
import logoBlanco from "../../public/logo-blanco.png";

export function Logotipo({
  alto = 26,
  blanco = false,
  className = "",
}: {
  alto?: number;
  /** Versión monocroma, para el azul de la cabecera. */
  blanco?: boolean;
  className?: string;
}) {
  const fuente = blanco ? logoBlanco : logoColor;
  return (
    <Image
      src={fuente}
      alt="Compra Venta Mara"
      height={alto}
      width={Math.round((alto * fuente.width) / fuente.height)}
      priority
      className={className}
      style={{ height: alto, width: "auto" }}
    />
  );
}
