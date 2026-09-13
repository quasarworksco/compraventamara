import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Publicación",
  descripcion:
    "Un anuncio de Compra Venta Mara, San Rafael del Moján.",
  indexable: false,
});

export default function Capa({ children }: LayoutProps<"/publicacion">) {
  return children;
}
