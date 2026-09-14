"use client";

/**
 * Lo que la administración le tiene que decir al miembro.
 *
 * Dos cosas distintas caben aquí. Una advertencia es un recado y no impide
 * nada. Una foto rechazada sí: la cuenta queda en pausa hasta que suba otra,
 * porque la foto es lo que permite reconocer a alguien al cerrar un trato en
 * la calle, y una cuenta con la foto de otro es exactamente la que le conviene
 * a quien viene a estafar.
 *
 * La pausa se levanta sola en cuanto cambia la foto: no hay que esperar a que
 * nadie lo apruebe. Las reglas de Firestore permiten apagar la marca solo
 * junto con una foto distinta, así que aquí no hace falta más que subirla.
 */
import { useState } from "react";
import { usePathname } from "next/navigation";

import { useSesion } from "@/lib/auth";
import { SelectorFoto } from "./selector-foto";
import { IconAlert } from "./icons";
import { Aviso, Boton } from "./ui";

export function AvisoCuenta() {
  const { miembro, actualizarPerfil } = useSesion();
  const ruta = usePathname();
  const [foto, setFoto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function cambiarFoto() {
    if (!foto) return;
    setGuardando(true);
    setFallo(null);
    try {
      // Se apagan juntas la foto y la pausa: es el único cambio que las
      // reglas aceptan de parte del propio miembro.
      await actualizarPerfil({ fotoUrl: foto, fotoRechazada: false });
    } catch (error) {
      setFallo(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la foto. Inténtalo otra vez.",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!miembro) return null;

  // El panel es otra puerta, con su propia sesión: un recado para el miembro
  // no pinta nada ahí. Y en el chat a pantalla completa rompería la vista.
  if (ruta.startsWith("/admin") || ruta.startsWith("/chat/")) return null;

  const pausada = miembro.fotoRechazada === true;
  if (!pausada && !miembro.advertencia) return null;

  if (!pausada) {
    return (
      <div className="px-4 pt-3">
        <Aviso>{miembro.advertencia}</Aviso>
      </div>
    );
  }

  return (
    <section className="px-4 pt-3">
      <div className="flex flex-col gap-3 rounded-card border border-danger/35 bg-danger/8 p-4">
        <div className="flex items-start gap-2.5">
          <IconAlert size={19} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <h2 className="text-sm font-bold text-danger">Tu cuenta está en pausa</h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {miembro.advertencia ??
                "Tu foto de perfil no muestra tu cara."}{" "}
              Sube una foto tuya y podrás publicar de nuevo al instante.
            </p>
          </div>
        </div>

        <SelectorFoto valor={foto || miembro.fotoUrl} onCambio={setFoto} onError={setFallo} />

        {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

        <Boton ancho cargando={guardando} disabled={!foto} onClick={cambiarFoto}>
          {foto ? "Guardar mi foto y reactivar la cuenta" : "Elige tu foto arriba"}
        </Boton>
      </div>
    </section>
  );
}
