import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Rifas",
  descripcion:
    "Las rifas del pueblo: qué se rifa, cuánto cuesta el número, con qué lotería juega y qué día sale.",
  imagen: "rifas",
});

export default function Capa({ children }: LayoutProps<"/rifas">) {
  return children;
}
