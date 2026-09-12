import { notFound } from "next/navigation";

import { esSalaValida } from "@/lib/salas";
import { SalaChat } from "./sala";

export default async function PaginaSala({ params }: PageProps<"/chat/[sala]">) {
  const { sala } = await params;
  if (!esSalaValida(sala)) notFound();
  return <SalaChat sala={sala} />;
}
