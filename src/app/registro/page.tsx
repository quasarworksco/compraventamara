"use client";

/**
 * Registro de un miembro del grupo.
 *
 * Se piden solo cinco cosas: foto, nombre, apellido, teléfono y contraseña.
 * El identificador del miembro (MC-00000) lo asigna el sistema.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { SelectorFoto } from "@/components/selector-foto";
import { Aviso, Boton, Campo, CampoClave, Selector } from "@/components/ui";
import { mensajeError, useSesion } from "@/lib/auth";
import { normalizarTelefono } from "@/lib/formato";
import { ZONAS } from "@/lib/pueblo";

interface Errores {
  foto?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  clave?: string;
}

export default function PaginaRegistro() {
  const { registrar, configurado } = useSesion();
  const router = useRouter();

  const [fotoUrl, setFotoUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [zona, setZona] = useState(ZONAS[0]);
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): Errores {
    const nuevos: Errores = {};
    if (!fotoUrl) nuevos.foto = "La foto es obligatoria para registrarte.";
    if (nombre.trim().length < 2) nuevos.nombre = "Escribe tu nombre.";
    if (apellido.trim().length < 2) nuevos.apellido = "Escribe tu apellido.";
    // 58 + 3 de operadora + 7 del abonado = 12 dígitos en Venezuela.
    if (normalizarTelefono(telefono).length !== 12) {
      nuevos.telefono = "El número debe tener 11 dígitos, por ejemplo 0412 1234567.";
    }
    if (clave.length < 6) nuevos.clave = "Mínimo 6 caracteres.";
    return nuevos;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setFallo(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await registrar({ nombre, apellido, telefono, clave, fotoUrl, zona });
      router.replace("/perfil");
    } catch (error) {
      setFallo(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <BarraSuperior titulo="Crear cuenta" subtitulo="Solo toma un minuto" volverA="/" />

      <main className="px-4 py-5">
        {!configurado ? (
          <Aviso tono="error">
            Firebase todavía no está conectado, así que el registro no guardará nada. Rellena
            las variables <code>NEXT_PUBLIC_FIREBASE_*</code> en <code>.env.local</code>.
          </Aviso>
        ) : null}

        <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
          <SelectorFoto valor={fotoUrl} onCambio={setFotoUrl} onError={setFallo} />
          {errores.foto ? (
            <p className="-mt-2 text-center text-sm text-danger">{errores.foto}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Campo
              etiqueta="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
              enterKeyHint="next"
              error={errores.nombre}
            />
            <Campo
              etiqueta="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              autoComplete="family-name"
              enterKeyHint="next"
              error={errores.apellido}
            />
          </div>

          <Campo
            etiqueta="Teléfono (WhatsApp)"
            type="tel"
            inputMode="tel"
            placeholder="0412 1234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
            error={errores.telefono}
            ayuda="Con este número inicias sesión y te escriben por WhatsApp."
          />

          <Selector
            etiqueta="Tu sector"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
          >
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Selector>

          <CampoClave
            etiqueta="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="new-password"
            enterKeyHint="done"
            error={errores.clave}
            ayuda="Al menos 6 caracteres. Anótala: se recupera solo con un administrador."
          />

          {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

          <Boton type="submit" ancho cargando={enviando} disabled={!configurado}>
            Crear mi cuenta
          </Boton>

          <p className="text-center text-sm text-fg-muted">
            ¿Ya estás registrado?{" "}
            <Link href="/entrar" className="font-semibold text-brand-600 dark:text-brand-300">
              Inicia sesión
            </Link>
          </p>

          <p className="text-center text-xs text-fg-subtle">
            Al registrarte aceptas que tu nombre, tu foto y tu teléfono sean visibles para los
            demás miembros: es lo que permite cerrar tratos con confianza.
          </p>
        </form>
      </main>
    </>
  );
}
