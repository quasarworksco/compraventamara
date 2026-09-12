/**
 * Detalle de una publicación.
 *
 * La ruta resuelve el parámetro en el servidor y delega el resto en un
 * componente de cliente, que es quien se suscribe en vivo a Firestore.
 */
import { DetallePublicacion } from "./detalle";

export default async function PaginaPublicacion({ params }: PageProps<"/publicacion/[id]">) {
  const { id } = await params;
  return <DetallePublicacion id={id} />;
}
