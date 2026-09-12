"use client";

/**
 * Edición del propio perfil.
 *
 * Hace falta de verdad: la gente cambia de número, y el teléfono guardado es
 * el que aparece en todos sus anuncios y por el que la contactan. Sin esto,
 * un cambio de línea dejaba sus publicaciones apuntando a un número muerto.
 *
 * Lo que no se toca desde aquí: el código de miembro y el sello de verificado.
 * Esos los decide la administración, y las reglas de Firestore lo imponen.
 */
import { useState, type FormEvent } from "react";

import { useSesion } from "@/lib/auth";
import { normalizarTelefono } from "@/lib/formato";
import { ZONAS } from "@/lib/pueblo";
import type { Miembro } from "@/lib/types";
import { SelectorFoto } from "./selector-foto";
import { Aviso, Boton, Campo, Selector } from "./ui";

export function EditarPerfil({
  miembro,
  alTerminar,
}: {
  miembro: Miembro;
  alTerminar: () => void;
}) {
  const { actualizarPerfil } = useSesion();

  const [fotoUrl, setFotoUrl] = useState(miembro.fotoUrl);
  const [nombre, setNombre] = useState(miembro.nombre);
  const [apellido, setApellido] = useState(miembro.apellido);
  const [telefono, setTelefono] = useState(miembro.telefono);
  const [zona, setZona] = useState(miembro.zona ?? ZONAS[0]);
  const [fallo, setFallo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const telefonoCambia = normalizarTelefono(telefono) !== miembro.telefono;

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setFallo(null);

    if (nombre.trim().length < 2 || apellido.trim().length < 2) {
      setFallo("Escribe tu nombre y tu apellido.");
      return;
    }
    if (normalizarTelefono(telefono).length !== 12) {
      setFallo("El número debe tener 11 dígitos, por ejemplo 0412 1234567.");
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono,
        zona: zona.trim() || undefined,
        fotoUrl,
      });
      alTerminar();
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="tarjeta flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold text-fg-muted">Editar mis datos</h2>

      <SelectorFoto valor={fotoUrl} onCambio={setFotoUrl} onError={setFallo} />

      <div className="grid grid-cols-2 gap-3">
        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="given-name"
        />
        <Campo
          etiqueta="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          autoComplete="family-name"
        />
      </div>

      <Campo
        etiqueta="Teléfono (WhatsApp)"
        type="tel"
        inputMode="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        autoComplete="tel"
      />

      <Selector etiqueta="Tu sector" value={zona} onChange={(e) => setZona(e.target.value)}>
        {ZONAS.map((z) => (
          <option key={z}>{z}</option>
        ))}
      </Selector>

      {telefonoCambia ? (
        <Aviso>
          Con este número inicias sesión, y no cambia: seguirás entrando con el anterior. El
          nuevo es el que verá la gente y por el que te escribirán.
        </Aviso>
      ) : null}

      {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

      <div className="flex gap-2">
        <Boton type="button" variante="secundario" ancho onClick={alTerminar}>
          Cancelar
        </Boton>
        <Boton type="submit" ancho cargando={guardando}>
          Guardar
        </Boton>
      </div>
    </form>
  );
}
