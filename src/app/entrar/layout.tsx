import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Entrar",
  descripcion:
    "Entra con tu número de teléfono a Compra Venta Mara.",
});

export default function Capa({ children }: LayoutProps<"/entrar">) {
  return children;
}
