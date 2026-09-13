import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Mototaxis",
  descripcion:
    "Quién está rodando en San Rafael del Moján, a qué tarifa y qué sectores cubre.",
  imagen: "mototaxis",
});

export default function Capa({ children }: LayoutProps<"/mototaxis">) {
  return children;
}
