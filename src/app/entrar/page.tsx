"use client";

/** Inicio de sesión con el mismo número de teléfono del registro. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { Aviso, Boton, Campo, CampoClave } from "@/components/ui";
import { mensajeError, useSesion } from "@/lib/auth";

export default function PaginaEntrar() {
  const { entrar, configurado } = useSesion();
  const router = useRouter();

  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setFallo(null);
    setEnviando(true);
    try {
      await entrar(telefono, clave);
      router.replace("/");
    } catch (error) {
      setFallo(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <BarraSuperior titulo="Entrar" volverA="/" />

      <main className="px-4 py-6">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            etiqueta="Teléfono"
            type="tel"
            inputMode="tel"
            placeholder="0412 1234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
            enterKeyHint="next"
          />

          <CampoClave
            etiqueta="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="done"
          />

          {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

          <Boton type="submit" ancho cargando={enviando} disabled={!configurado}>
            Entrar
          </Boton>

          <p className="text-center text-sm text-fg-muted">
            ¿Todavía no tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-brand-600 dark:text-brand-300">
              Regístrate
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}
