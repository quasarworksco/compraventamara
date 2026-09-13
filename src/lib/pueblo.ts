/**
 * Datos de San Rafael del Moján, capital del municipio Mara (Zulia).
 *
 * Viven en el código, no en Firestore, porque casi nunca cambian y así la
 * portada se sirve completa desde el primer momento, sin esperar a la red.
 *
 * Los teléfonos de emergencia están confirmados. Si alguno cambia, este es el
 * único sitio donde hay que tocarlo: un número mal puesto en una emergencia es
 * peor que no tener ninguno.
 */

/**
 * El grupo de WhatsApp del pueblo.
 *
 * La plataforma y el grupo se alimentan mutuamente: quien llega por un enlace
 * compartido encuentra aquí la puerta al grupo, y quien ya está en el grupo
 * encuentra aquí sus anuncios ordenados y buscables.
 */
export const GRUPO_WHATSAPP =
  "https://chat.whatsapp.com/Fljz6V4RQjC5JKDQLQRlfB?s=cl&p=i&mlu=0&ilr=4";

/** Quién construyó la plataforma. Firma el pie de la portada. */
export const AUTOR = "DGP GROUP USA";

export const PUEBLO = {
  nombre: "San Rafael del Moján",
  municipio: "Municipio Mara",
  estado: "Zulia",
  gentilicio: "marense",
  /** Texto de bienvenida de la portada. */
  bienvenida:
    "Capital del municipio Mara, a orillas del Golfo de Venezuela. Un pueblo de gente trabajadora, comercio de puerta a puerta y patrullaje permanente.",
} as const;

/**
 * Polimara: la policía municipal.
 *
 * Tiene dos sedes y varios canales, así que no cabe en una simple línea de
 * teléfono como el resto. Los datos están confirmados por el propio cuerpo.
 */
export const POLIMARA = {
  nombre: "Polimara",
  detalle: "Policía Municipal de Mara",
  sedes: [
    {
      nombre: "CCP N.° 1",
      direccion: "Av. 3, sector El Uveral. San Rafael, municipio Mara, 4044",
    },
    {
      nombre: "EP N.° 11",
      direccion: "Sector Las Cruces, parroquia Ricaurte, 4044",
    },
  ],
  telefono: { visible: "(+58) 262 872-0018", marcar: "+582628720018" },
  /**
   * La línea gratuita se muestra tal cual, sin enlace para llamar: el esquema
   * `tel:` no admite letras de forma fiable y un enlace roto en una emergencia
   * es peor que ninguno. Quien la use marca las letras en su propio teclado.
   */
  gratuito: "0800 POLIMARA",
  correo: "policiademara@gmail.com",
} as const;

/** Teléfonos de emergencia que se marcan de un toque. */
export interface ContactoEmergencia {
  id: string;
  nombre: string;
  detalle: string;
  /** Como se lee en pantalla. */
  visible: string;
  /** Como lo recibe el marcador del teléfono. */
  marcar: string;
}

export const CONTACTOS: ContactoEmergencia[] = [
  {
    id: "emergencias",
    nombre: "Emergencias 911",
    detalle: "Sistema Nacional de Emergencias",
    visible: "911",
    marcar: "911",
  },
  {
    id: "bomberos",
    nombre: "Bomberos de Mara",
    detalle: "Incendios y rescate",
    visible: "+58 262-8720531",
    marcar: "+582628720531",
  },
];

/** Sectores del pueblo, para etiquetar y filtrar publicaciones. */
export const ZONAS: string[] = [
  "San Rafael (centro)",
  "El Moján",
  "Las Parcelas",
  "La Sabanita",
  "Cañada Honda",
  "Santa Cruz de Mara",
  "La Sierrita",
  "Ricaurte",
  "Luis de Vicente",
  "Tamare",
  "Carrasquero",
  "Otro sector",
];

/** Categorías del marketplace: lo que de verdad se mueve en el grupo. */
export const CATEGORIAS_MERCADO: string[] = [
  "Vehículos",
  "Motos",
  "Celulares",
  "Tecnología",
  "Electrodomésticos",
  "Muebles y hogar",
  "Ropa y calzado",
  "Repuestos",
  "Herramientas",
  "Agro y animales",
  "Bienes e inmuebles",
  "Comida y bebidas",
  "Servicios",
  "Otros",
];

/**
 * Rubros del directorio de negocios, agrupados.
 *
 * La meta es que en el pueblo no haya que preguntar "¿quién arregla esto?":
 * desde un odontólogo hasta una cauchera, todo debe poder encontrarse aquí.
 */
export interface GrupoRubros {
  grupo: string;
  rubros: string[];
}

export const RUBROS_NEGOCIO: GrupoRubros[] = [
  {
    grupo: "Salud",
    rubros: [
      "Médico general",
      "Consultorio especialista",
      "Odontólogo",
      "Laboratorio clínico",
      "Farmacia",
      "Óptica",
      "Fisioterapia",
      "Enfermería a domicilio",
      "Veterinaria",
    ],
  },
  {
    grupo: "Comida y víveres",
    rubros: [
      "Carnicería",
      "Panadería",
      "Abasto y víveres",
      "Charcutería",
      "Pescadería",
      "Frutería y verdulería",
      "Restaurante",
      "Comida rápida",
      "Heladería",
      "Licorería",
      "Agua potable y hielo",
    ],
  },
  {
    grupo: "Vehículos y motos",
    rubros: [
      "Repuestos de carro",
      "Repuestos de moto",
      "Taller mecánico",
      "Cauchera",
      "Latonería y pintura",
      "Electroauto",
      "Lavado de vehículos",
      "Venta de vehículos",
    ],
  },
  {
    grupo: "Hogar y construcción",
    rubros: [
      "Ferretería",
      "Materiales de construcción",
      "Mueblería",
      "Electrodomésticos",
      "Plomería",
      "Electricidad",
      "Herrería",
      "Carpintería",
      "Aire acondicionado y refrigeración",
      "Albañilería",
    ],
  },
  {
    grupo: "Belleza y cuidado",
    rubros: ["Barbería", "Peluquería", "Manicure y pedicure", "Spa y estética", "Gimnasio"],
  },
  {
    grupo: "Tecnología",
    rubros: [
      "Venta de celulares",
      "Reparación de celulares",
      "Computación",
      "Cibercafé",
      "Internet y cableado",
      "Cámaras de seguridad",
    ],
  },
  {
    grupo: "Ropa y calzado",
    rubros: ["Tienda de ropa", "Zapatería", "Costurería", "Lencería y textiles"],
  },
  {
    grupo: "Servicios profesionales",
    rubros: [
      "Abogado",
      "Contador",
      "Gestoría y trámites",
      "Fotografía y video",
      "Imprenta y publicidad",
      "Academia y clases",
      "Organización de eventos",
      "Fletes y mudanzas",
      "Agencia de lotería",
    ],
  },
  {
    grupo: "Agro y animales",
    rubros: ["Agroinsumos", "Venta de animales", "Alimentos para animales", "Pesca"],
  },
  {
    grupo: "Otros",
    rubros: ["Otro rubro"],
  },
];

/** Lista plana de todos los rubros, para validar y para los selectores. */
export const CATEGORIAS_NEGOCIO: string[] = RUBROS_NEGOCIO.flatMap((g) => g.rubros);

/** Loterías con las que juegan las rifas del pueblo. */
export const LOTERIAS: string[] = [
  "Triple Zulia",
  "Triple Táchira",
  "Triple Caracas",
  "Triple Caliente",
  "Triple Gordo",
  "Chance",
  "Lotto Rey",
  "La Granjita",
  "Selva Plus",
  "Trío Activo",
  "Guácharo Activo",
  "Ricachona",
  "Otra lotería",
];
