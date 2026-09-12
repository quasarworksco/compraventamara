import { notFound } from "next/navigation";

import { SALAS } from "@/lib/chat";
import type { SalaId } from "@/lib/types";
import { SalaChat } from "./sala";

export default async function PaginaSala({ params }: PageProps<"/chat/[sala]">) {
  const { sala } = await params;
  if (!SALAS.some((s) => s.id === sala)) notFound();
  return <SalaChat sala={sala as SalaId} />;
}
