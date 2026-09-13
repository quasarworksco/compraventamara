import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Dólares",
  descripcion:
    "Compra y venta de efectivo entre vecinos de San Rafael del Moján, con la tasa del día del BCV y Binance a la vista.",
  imagen: "dolares",
});

export default function Capa({ children }: LayoutProps<"/dolares">) {
  return children;
}
