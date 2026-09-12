"use client";

/**
 * Administración de Mara Comercio.
 *
 * El panel es una puerta distinta a la de los miembros: mientras el pueblo
 * entra con su número de teléfono, la administración entra con correo y
 * contraseña.
 *
 * Hay un único correo dueño —el que aparece en `NEXT_PUBLIC_ADMIN_EMAIL`— y es
 * el único que puede nombrar o quitar administradores. Los demás administran
 * el contenido, pero no se reparten permisos entre ellos.
 *
 * El correo dueño debe estar verificado en Firebase. Sin esa condición,
 * cualquiera que llegase antes podría registrar ese mismo correo y quedarse
 * con el mando; verificarlo exige tener acceso real a la bandeja.
 */
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db, firebaseListo } from "./firebase";
import type { Miembro } from "./types";

/** Correo dueño de la plataforma. Se define en las variables de entorno. */
export const CORREO_DUENO = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();

export interface Administrador {
  uid: string;
  email: string;
  nombre: string;
  creadoEn: number;
  /** Correo de quien lo nombró. */
  creadoPor: string;
}

export type NivelAdmin = "dueno" | "admin" | "ninguno";

/** Qué puede hacer quien tiene la sesión abierta ahora mismo. */
export function useNivelAdmin(usuario: User | null): { nivel: NivelAdmin; cargando: boolean } {
  const [estado, setEstado] = useState<{ clave: string; nivel: NivelAdmin }>({
    clave: "",
    nivel: "ninguno",
  });

  const clave = usuario?.uid ?? "";

  // Ser el dueño se sabe con solo mirar el token: no hace falta ir a Firestore.
  const correo = (usuario?.email ?? "").toLowerCase();
  const esDueno = Boolean(
    CORREO_DUENO && correo === CORREO_DUENO && usuario?.emailVerified,
  );

  useEffect(() => {
    if (!firebaseListo || !usuario || esDueno) return;
    return onSnapshot(
      doc(db(), "administradores", usuario.uid),
      (snapshot) => setEstado({ clave, nivel: snapshot.exists() ? "admin" : "ninguno" }),
      () => setEstado({ clave, nivel: "ninguno" }),
    );
  }, [clave, usuario, esDueno]);

  if (esDueno) return { nivel: "dueno", cargando: false };

  const resuelto = estado.clave === clave;
  return {
    nivel: resuelto ? estado.nivel : "ninguno",
    cargando: firebaseListo && Boolean(usuario) && !resuelto,
  };
}

/** Entrada al panel con correo y contraseña. */
export async function entrarComoAdmin(email: string, clave: string): Promise<void> {
  await signInWithEmailAndPassword(auth(), email.trim().toLowerCase(), clave);
}

/**
 * Crea la cuenta del correo dueño la primera vez y le envía la verificación.
 * Solo funciona con el correo configurado: no es un registro abierto.
 */
export async function crearCuentaDueno(email: string, clave: string): Promise<void> {
  const correo = email.trim().toLowerCase();
  if (!CORREO_DUENO || correo !== CORREO_DUENO) {
    throw new Error("Ese correo no es el dueño de la plataforma.");
  }
  const credencial = await createUserWithEmailAndPassword(auth(), correo, clave);
  await sendEmailVerification(credencial.user);
}

/** Reenvía el correo de verificación al usuario con sesión abierta. */
export async function reenviarVerificacion(usuario: User): Promise<void> {
  await sendEmailVerification(usuario);
}

/* ----------------------------------------------------------------- */
/* Administradores                                                    */
/* ----------------------------------------------------------------- */

export function useAdministradores(activo: boolean): Administrador[] {
  const [lista, setLista] = useState<Administrador[]>([]);

  useEffect(() => {
    if (!firebaseListo || !activo) return;
    return onSnapshot(
      query(collection(db(), "administradores"), orderBy("creadoEn", "asc")),
      (snapshot) => setLista(snapshot.docs.map((d) => ({ ...(d.data() as Administrador) }))),
      () => setLista([]),
    );
  }, [activo]);

  return lista;
}

/**
 * Nombra administrador a una persona que ya tiene cuenta de Firebase con ese
 * correo. Se busca su uid entre los miembros; si no aparece, hay que pedirle
 * que entre una vez al panel para que su cuenta exista.
 */
export async function nombrarAdministrador(
  uid: string,
  email: string,
  nombre: string,
  nombradoPor: string,
): Promise<void> {
  const admin: Administrador = {
    uid,
    email: email.trim().toLowerCase(),
    nombre: nombre.trim(),
    creadoEn: Date.now(),
    creadoPor: nombradoPor,
  };
  await setDoc(doc(db(), "administradores", uid), admin);
}

export async function quitarAdministrador(uid: string): Promise<void> {
  await deleteDoc(doc(db(), "administradores", uid));
}

/* ----------------------------------------------------------------- */
/* Miembros                                                           */
/* ----------------------------------------------------------------- */

export function useMiembros(activo: boolean): { miembros: Miembro[]; cargando: boolean } {
  const [estado, setEstado] = useState<{ listo: boolean; miembros: Miembro[] }>({
    listo: false,
    miembros: [],
  });

  useEffect(() => {
    if (!firebaseListo || !activo) return;
    return onSnapshot(
      query(collection(db(), "miembros"), orderBy("creadoEn", "desc")),
      (snapshot) =>
        setEstado({ listo: true, miembros: snapshot.docs.map((d) => d.data() as Miembro) }),
      () => setEstado({ listo: true, miembros: [] }),
    );
  }, [activo]);

  return { miembros: estado.miembros, cargando: activo && !estado.listo };
}

/**
 * Marca o desmarca a un miembro como verificado.
 *
 * Al resolverla, la solicitud sale de la cola: si se verifica, ya no hace
 * falta; si se le quita el sello, tendrá que volver a pedirlo.
 */
export async function cambiarVerificacion(uid: string, verificado: boolean): Promise<void> {
  await updateDoc(doc(db(), "miembros", uid), {
    verificado,
    solicitaVerificacion: false,
  });
}
