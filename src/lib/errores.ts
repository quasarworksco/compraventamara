/**
 * Traduce los fallos de Firestore a algo accionable.
 *
 * "Missing or insufficient permissions" es literalmente cierto y no le sirve a
 * nadie: no dice qué permiso falta ni cómo conseguirlo. En esta plataforma ese
 * error tiene casi siempre una de dos causas concretas, y las dos tienen una
 * salida concreta, así que se nombran.
 */

export type Accion = "publicar" | "publicar-divisa" | "moderar" | "guardar";

export function mensajeFirestore(error: unknown, accion: Accion = "guardar"): string {
  const codigo = (error as { code?: string })?.code ?? "";

  if (codigo === "permission-denied") {
    const comun =
      "Si acabas de actualizar la plataforma, puede que las reglas publicadas en " +
      "Firebase sean de una versión anterior: vuelve a publicarlas.";

    switch (accion) {
      case "publicar-divisa":
        return (
          "Firestore rechazó la publicación. Para publicar divisas tu cuenta tiene que " +
          "estar verificada por la administración. " +
          comun
        );
      case "moderar":
        return (
          "Firestore rechazó el cambio. O tu sesión es anterior a que verificaras tu " +
          "correo —sal y vuelve a entrar—, o las reglas publicadas nombran otro correo " +
          "dueño. " +
          comun
        );
      case "publicar":
        return (
          "Firestore rechazó la publicación. Si tu cuenta está en pausa porque la " +
          "administración pidió que cambies tu foto de perfil, cámbiala y vuelve a " +
          "intentarlo. " +
          comun
        );
      default:
        return `Firestore rechazó la operación. ${comun}`;
    }
  }

  if (codigo === "unavailable") return "Sin conexión con Firestore. Revisa tu internet.";
  if (codigo === "unauthenticated") return "Tu sesión caducó. Vuelve a entrar.";

  return error instanceof Error ? error.message : "No se pudo guardar.";
}
