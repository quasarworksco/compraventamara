import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Publicar",
  descripcion:
    "Publica un artículo, tu negocio, una rifa, tu mototaxi o una oferta de dólares.",
  indexable: false,
});

export default function Capa({ children }: LayoutProps<"/publicar">) {
  return children;
}
