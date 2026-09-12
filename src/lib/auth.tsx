"use client";

/**
 * Sesión de Mara Comercio.
 *
 * La identidad del grupo es el número de teléfono: es lo que ya usa todo el
 * mundo en WhatsApp. Firebase Auth no acepta "teléfono + contraseña" sin SMS,
 * así que el teléfono se traduce a una dirección interna y la contraseña se
 * valida contra ella. El usuario nunca ve ese correo.
 *
 * Si más adelante se quiere verificación por SMS real, se sustituye
 * `registrar`/`entrar` por `signInWithPhoneNumber` sin tocar el resto de la
 * aplicación (requiere plan Blaze en Firebase, porque cada SMS se cobra).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db, firebaseListo } from "./firebase";
import { codigoMiembro, nombreCompleto, normalizarTelefono } from "./formato";
import type { Miembro } from "./types";

/** Dominio interno: nunca se muestra ni recibe correo de verdad. */
const DOMINIO_INTERNO = "miembros.maracomercio.app";

/** El teléfono normalizado es la parte local de la dirección interna. */
function telefonoAIdentidad(telefono: string): string {
  return `${normalizarTelefono(telefono)}@${DOMINIO_INTERNO}`;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  telefono: string;
  clave: string;
  /** Foto del miembro, ya subida a Cloudinary. Obligatoria. */
  fotoUrl: string;
  zona?: string;
}

interface Sesion {
  usuario: User | null;
  miembro: Miembro | null;
  /** Verdadero mientras se resuelve si hay sesión abierta. */
  cargando: boolean;
  /** Falso si faltan las variables de entorno de Firebase. */
  configurado: boolean;
  registrar: (datos: DatosRegistro) => Promise<void>;
  entrar: (telefono: string, clave: string) => Promise<void>;
  salir: () => Promise<void>;
  actualizarPerfil: (cambios: Partial<Miembro>) => Promise<void>;
}

const ContextoSesion = createContext<Sesion | null>(null);

/**
 * Reserva el siguiente identificador del grupo dentro de una transacción,
 * de modo que dos registros simultáneos nunca reciban el mismo código.
 */
async function reservarCodigo(): Promise<string> {
  const contador = doc(db(), "contadores", "miembros");
  const correlativo = await runTransaction(db(), async (tx) => {
    const snapshot = await tx.get(contador);
    const siguiente = (snapshot.exists() ? (snapshot.data().ultimo as number) : 0) + 1;
    tx.set(contador, { ultimo: siguiente }, { merge: true });
    return siguiente;
  });
  return codigoMiembro(correlativo);
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  // Sin credenciales de Firebase no hay sesión que resolver: nace ya resuelto.
  const [cargando, setCargando] = useState(firebaseListo);

  useEffect(() => {
    if (!firebaseListo) return;
    return onAuthStateChanged(auth(), (u) => {
      setUsuario(u);
      if (!u) {
        setMiembro(null);
        setCargando(false);
      }
    });
  }, []);

  // El perfil se escucha en vivo: si un admin te verifica, se ve al instante.
  useEffect(() => {
    if (!firebaseListo || !usuario) return;
    return onSnapshot(
      doc(db(), "miembros", usuario.uid),
      (snapshot) => {
        setMiembro(snapshot.exists() ? (snapshot.data() as Miembro) : null);
        setCargando(false);
      },
      () => setCargando(false),
    );
  }, [usuario]);

  const registrar = useCallback(async (datos: DatosRegistro) => {
    const telefono = normalizarTelefono(datos.telefono);
    const credencial = await createUserWithEmailAndPassword(
      auth(),
      telefonoAIdentidad(telefono),
      datos.clave,
    );

    const codigo = await reservarCodigo();
    const perfil: Miembro = {
      uid: credencial.user.uid,
      codigo,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      telefono,
      fotoUrl: datos.fotoUrl,
      zona: datos.zona?.trim() || undefined,
      verificado: false,
      rol: "miembro",
      creadoEn: Date.now(),
    };

    await setDoc(doc(db(), "miembros", credencial.user.uid), perfil);

    // El nombre y la foto también en Auth: así los paneles de Firebase son legibles.
    await updateProfile(credencial.user, {
      displayName: nombreCompleto(perfil.nombre, perfil.apellido),
      photoURL: perfil.fotoUrl,
    });

    setMiembro(perfil);
  }, []);

  const entrar = useCallback(async (telefono: string, clave: string) => {
    await signInWithEmailAndPassword(auth(), telefonoAIdentidad(telefono), clave);
  }, []);

  const salir = useCallback(async () => {
    await signOut(auth());
    setMiembro(null);
  }, []);

  const actualizarPerfil = useCallback(
    async (cambios: Partial<Miembro>) => {
      if (!usuario) throw new Error("No hay sesión abierta.");
      const limpio = { ...cambios };
      if (limpio.telefono) limpio.telefono = normalizarTelefono(limpio.telefono);
      await updateDoc(doc(db(), "miembros", usuario.uid), limpio);
    },
    [usuario],
  );

  const valor = useMemo<Sesion>(
    () => ({
      usuario,
      miembro,
      cargando,
      configurado: firebaseListo,
      registrar,
      entrar,
      salir,
      actualizarPerfil,
    }),
    [usuario, miembro, cargando, registrar, entrar, salir, actualizarPerfil],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): Sesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error("useSesion debe usarse dentro de <ProveedorSesion>.");
  return contexto;
}

/** Lee el perfil público de cualquier miembro (para la ficha del vendedor). */
export async function obtenerMiembro(uid: string): Promise<Miembro | null> {
  const snapshot = await getDoc(doc(db(), "miembros", uid));
  return snapshot.exists() ? (snapshot.data() as Miembro) : null;
}

/** Traduce los códigos de error de Firebase a algo que se entienda. */
export function mensajeError(error: unknown): string {
  const codigo = (error as { code?: string })?.code ?? "";
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Ese número ya está registrado en Mara Comercio. Inicia sesión.";
    case "auth/invalid-email":
      return "El número de teléfono no es válido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Número o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tus datos móviles o el wifi.";
    default:
      return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  }
}
