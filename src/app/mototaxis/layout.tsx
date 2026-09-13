import { metadatosDeSeccion } from "@/lib/metadatos";

export const metadata = metadatosDeSeccion({
  titulo: "Mototaxis y taxis",
  descripcion:
    "Quién está rodando en San Rafael del Moján: mototaxis y taxis, con el vehículo, la placa, la carrera mínima y los sectores que cubre cada uno.",
  imagen: "mototaxis",
});

export default function Capa({ children }: LayoutProps<"/mototaxis">) {
  return children;
}
