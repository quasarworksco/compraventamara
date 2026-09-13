import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Mi perfil",
  descripcion:
    "Tus publicaciones, tus prórrogas y tus datos.",
  indexable: false,
});

export default function Capa({ children }: LayoutProps<"/perfil">) {
  return children;
}
