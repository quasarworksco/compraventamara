import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Negocios del pueblo",
  descripcion:
    "El directorio de San Rafael del Moján: médicos, odontólogos, panaderías, carnicerías, repuestos, caucheras y mucho más.",
  imagen: "negocios",
});

export default function Capa({ children }: LayoutProps<"/negocios">) {
  return children;
}
