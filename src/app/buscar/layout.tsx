import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Buscar en el pueblo",
  descripcion:
    "Busca en todo Mara Comercio a la vez: artículos, negocios del directorio, mototaxis, taxis y rifas de San Rafael del Moján.",
  indexable: false,
});

export default function Capa({ children }: LayoutProps<"/buscar">) {
  return children;
}
