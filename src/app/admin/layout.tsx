import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Administración",
  descripcion:
    "Panel de administración de Compra Venta Mara.",
  indexable: false,
});

export default function Capa({ children }: LayoutProps<"/admin">) {
  return children;
}
