import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Chat en vivo",
  descripcion:
    "Las salas en vivo de San Rafael del Moján. Los mensajes se borran solos a las 36 horas.",
  imagen: "chat",
});

export default function Capa({ children }: LayoutProps<"/chat">) {
  return children;
}
