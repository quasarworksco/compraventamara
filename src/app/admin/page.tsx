"use client";

/**
 * Puerta del panel de administración.
 *
 * Deliberadamente separada del resto: aquí no se entra con el teléfono del
 * grupo sino con correo y contraseña, y la pantalla no comparte la navegación
 * inferior del pueblo.
 */
import { useState, type FormEvent } from "react";

import { LogoMark } from "@/components/icons";
import { Aviso, Boton, Campo, CampoClave, Esqueleto } from "@/components/ui";
import { mensajeError, useSesion } from "@/lib/auth";
import {
  CORREO_DUENO,
  crearCuentaDueno,
  entrarComoAdmin,
  reenviarVerificacion,
  useNivelAdmin,
} from "@/lib/admin";
import { PanelAdmin } from "./panel";

export default function PaginaAdmin() {
  const { usuario, cargando: cargandoSesion, configurado, salir } = useSesion();
  const { nivel, cargando: cargandoNivel } = useNivelAdmin(usuario);

  if (cargandoSesion || cargandoNivel) {
    return (
      <main className="p-4">
        <Esqueleto className="h-40" />
      </main>
    );
  }

  if (!usuario) return <Entrada configurado={configurado} />;

  // Con sesión abierta pero sin permisos: puede ser un miembro del grupo que
  // llegó aquí por curiosidad, o el dueño con el correo aún sin verificar.
  if (nivel === "ninguno") {
    const esElDueno = (usuario.email ?? "").toLowerCase() === CORREO_DUENO;
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
        <Cabecera />
        {esElDueno && !usuario.emailVerified ? (
          <>
            <Aviso>
              Te falta verificar el correo. Revisa tu bandeja y abre el enlace que te enviamos;
              después vuelve a entrar. Sin ese paso nadie puede administrar la plataforma, ni
              siquiera tú.
            </Aviso>
            <Boton ancho variante="secundario" onClick={() => reenviarVerificacion(usuario)}>
              Reenviar el correo de verificación
            </Boton>
          </>
        ) : (
          <Aviso tono="error">
            Esta cuenta no tiene permisos de administración.
          </Aviso>
        )}
        <Boton ancho variante="fantasma" onClick={salir}>
          Salir de esta cuenta
        </Boton>
      </main>
    );
  }

  return <PanelAdmin usuario={usuario} nivel={nivel} alSalir={salir} />;
}

function Cabecera() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <LogoMark size={44} className="text-brand-600" />
      <div>
        <h1 className="text-lg font-bold text-fg">Administración</h1>
        <p className="text-sm text-fg-muted">Mara Comercio</p>
      </div>
    </div>
  );
}

function Entrada({ configurado }: { configurado: boolean }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [creando, setCreando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setFallo(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (creando) {
        await crearCuentaDueno(email, clave);
        setAviso(
          "Cuenta creada. Te enviamos un correo de verificación: ábrelo y vuelve a entrar.",
        );
        setCreando(false);
      } else {
        await entrarComoAdmin(email, clave);
      }
    } catch (error) {
      setFallo(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 p-6">
      <Cabecera />

      {!configurado ? (
        <Aviso tono="error">Firebase no está conectado: el panel no podrá funcionar.</Aviso>
      ) : null}

      {!CORREO_DUENO ? (
        <Aviso tono="error">
          Falta definir <code>NEXT_PUBLIC_ADMIN_EMAIL</code> con el correo dueño de la
          plataforma. Sin él no se puede nombrar a nadie.
        </Aviso>
      ) : null}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo
          etiqueta="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          enterKeyHint="next"
        />
        <CampoClave
          etiqueta="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete={creando ? "new-password" : "current-password"}
          enterKeyHint="done"
        />

        {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}
        {aviso ? <Aviso>{aviso}</Aviso> : null}

        <Boton type="submit" ancho cargando={enviando} disabled={!configurado}>
          {creando ? "Crear la cuenta dueña" : "Entrar al panel"}
        </Boton>
      </form>

      <button
        type="button"
        onClick={() => {
          setCreando((v) => !v);
          setFallo(null);
        }}
        className="text-center text-sm text-fg-muted underline"
      >
        {creando
          ? "Ya tengo cuenta, quiero entrar"
          : "Primera vez: crear la cuenta del correo dueño"}
      </button>

      <p className="text-center text-xs text-fg-subtle">
        Esta puerta es solo para la administración. Los miembros entran con su
        número de teléfono desde la página principal.
      </p>
    </main>
  );
}
