import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Crear cuenta",
  descripcion:
    "Regístrate con tu teléfono y una foto para publicar en Compra Venta Mara.",
});

export default function Capa({ children }: LayoutProps<"/registro">) {
  return children;
}
