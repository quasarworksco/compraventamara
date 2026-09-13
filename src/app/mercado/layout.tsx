import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Marketplace",
  descripcion:
    "Vehículos, celulares, artículos y bienes en venta en San Rafael del Moján. Contacto directo por WhatsApp.",
  imagen: "mercado",
});

export default function Capa({ children }: LayoutProps<"/mercado">) {
  return children;
}
