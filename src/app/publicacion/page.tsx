"use client";

/**
 * Detalle de una publicación.
 *
 * El identificador viaja en la consulta (`/publicacion/?id=...`) y no en la
 * ruta. En un sitio estático no se puede pregenerar una página por cada
 * publicación: los identificadores los crea Firestore después de compilar.
 */
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Esqueleto } from "@/components/ui";
import { DetallePublicacion } from "./detalle";

export default function PaginaPublicacion() {
  return (
    <Suspense fallback={<Esqueleto className="m-4 h-40" />}>
      <Resolver />
    </Suspense>
  );
}

function Resolver() {
  const id = useSearchParams().get("id") ?? "";
  return <DetallePublicacion id={id} />;
}
