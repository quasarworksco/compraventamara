import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Divisas",
  descripcion:
    "Compra y venta de dólares, pesos y euros en efectivo entre vecinos de San Rafael del Moján, con la tasa del día a la vista.",
  imagen: "dolares",
});

export default function Capa({ children }: LayoutProps<"/dolares">) {
  return children;
}
