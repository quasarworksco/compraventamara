import { notFound } from "next/navigation";

import { SALAS, esSalaValida } from "@/lib/salas";
import { SalaChat } from "./sala";

/**
 * Las salas son un conjunto cerrado y conocido, así que el sitio estático
 * genera una página para cada una al compilar.
 */
export function generateStaticParams() {
  return SALAS.map((sala) => ({ sala: sala.id }));
}

export default async function PaginaSala({ params }: PageProps<"/chat/[sala]">) {
  const { sala } = await params;
  if (!esSalaValida(sala)) notFound();
  return <SalaChat sala={sala} />;
}
