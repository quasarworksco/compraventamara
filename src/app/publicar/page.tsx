"use client";

/**
 * Publicar: un solo formulario que cambia de forma según lo que se publique.
 *
 * Se eligió una sola pantalla en vez de cinco para que el vendedor aprenda el
 * flujo una vez: elige qué es, llena lo que le piden y publica.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import {
  IconCarro,
  IconDollar,
  IconMoto,
  IconStore,
  IconTag,
  IconTicket,
  IconVerified,
} from "@/components/icons";
import { SelectorImagenes } from "@/components/selector-imagenes";
import { SelectorUbicacion } from "@/components/selector-ubicacion";
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Esqueleto,
  Insignia,
  Selector,
} from "@/components/ui";
import { useSesion } from "@/lib/auth";
import { enlaceSeguro } from "@/lib/enlaces";
import { mensajeFirestore } from "@/lib/errores";
import {
  ETIQUETA_METODO,
  diasHasta,
  nombreDivisa,
  normalizarPlaca,
} from "@/lib/formato";
import {
  CATEGORIAS_MERCADO,
  CATEGORIAS_NEGOCIO,
  LOTERIAS,
  RUBROS_NEGOCIO,
  ZONAS,
} from "@/lib/pueblo";
import {
  actualizarPublicacion,
  crearPublicacion,
  publicarOfertaDivisa,
  usePublicacion,
  type BorradorDe,
} from "@/lib/publicaciones";
import {
  CLASES_TRANSPORTE,
  DIVISAS,
  HORAS_VIGENCIA_DOLAR,
  type Divisa,
  type MetodoPago,
  type Moneda,
  type ClaseTransporte,
  type Coordenadas,
  type Publicacion,
  type TipoPublicacion,
} from "@/lib/types";

const TIPOS = [
  { tipo: "producto", titulo: "Artículo", detalle: "Vehículo, celular, bien", Icono: IconTag },
  { tipo: "negocio", titulo: "Negocio", detalle: "Ficha del directorio", Icono: IconStore },
  { tipo: "divisa", titulo: "Divisas", detalle: "Compro o vendo efectivo", Icono: IconDollar },
  { tipo: "rifa", titulo: "Rifa", detalle: "Números y sorteo", Icono: IconTicket },
  { tipo: "mototaxi", titulo: "Transporte", detalle: "Mototaxi o taxi", Icono: IconMoto },
] as const satisfies readonly { tipo: TipoPublicacion; titulo: string; detalle: string; Icono: typeof IconTag }[];

const METODOS: MetodoPago[] = ["pago-movil", "efectivo", "zelle", "binance", "transferencia"];

/**
 * Lo que se ofrece, que es lo que este formulario sirve.
 *
 * Pedir una carrera queda fuera a propósito: es el acto contrario —"necesito"
 * en vez de "tengo"—, se decide en dos segundos y desde la propia sección de
 * transporte. Meterlo aquí como un sexto tipo obligaba a pasar por un asistente
 * de publicación a alguien que está parado bajo la lluvia.
 */
type TipoOfrecido = Exclude<TipoPublicacion, "carrera">;

export default function PaginaPublicar() {
  return (
    <Suspense fallback={<Esqueleto className="m-4 h-40" />}>
      <Publicar />
    </Suspense>
  );
}

/**
 * Decide si se está creando o corrigiendo.
 *
 * Cuando se corrige, el formulario no se monta hasta tener la publicación:
 * así cada campo nace ya con su valor, en vez de aparecer vacío y llenarse
 * después de un parpadeo.
 */
function Publicar() {
  const parametros = useSearchParams();
  const idEditar = parametros.get("editar") ?? "";
  const { publicacion, cargando } = usePublicacion(idEditar);

  if (idEditar && cargando) return <Esqueleto className="m-4 h-40" />;

  return (
    <Formulario
      inicial={idEditar ? publicacion : null}
      tipoPedido={(parametros.get("tipo") ?? "producto") as TipoOfrecido}
    />
  );
}

function Formulario({
  inicial,
  tipoPedido,
}: {
  /** La publicación que se corrige, o null si se está creando una nueva. */
  inicial: Publicacion | null;
  tipoPedido: TipoOfrecido;
}) {
  const { miembro, cargando, configurado } = useSesion();
  const router = useRouter();

  const editando = inicial !== null;
  const [tipo, setTipo] = useState<TipoOfrecido>(() => {
    // Una carrera pedida no se corrige desde aquí: se retira y se pide otra.
    // Si llegara una por la URL, el formulario cae en el tipo por defecto en
    // vez de quedarse en un estado que no sabe pintar.
    const deLaPublicacion =
      inicial && inicial.tipo !== "carrera" ? inicial.tipo : undefined;
    if (deLaPublicacion) return deLaPublicacion;
    return TIPOS.some((t) => t.tipo === tipoPedido) ? tipoPedido : "producto";
  });

  /** Lee un campo de la publicación que se corrige, si es de ese tipo. */
  function de<T extends Publicacion["tipo"], C extends keyof Extract<Publicacion, { tipo: T }>>(
    deTipo: T,
    campo: C,
  ): Extract<Publicacion, { tipo: T }>[C] | undefined {
    if (!inicial || inicial.tipo !== deTipo) return undefined;
    return (inicial as Extract<Publicacion, { tipo: T }>)[campo];
  }

  /** Los números se editan como texto; vacío cuando no hay nada que corregir. */
  const num = (valor: number | undefined) => (valor === undefined ? "" : String(valor));

  // Campos comunes.
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [zona, setZona] = useState(inicial?.zona ?? ZONAS[0]);
  const [imagenes, setImagenes] = useState<string[]>(inicial?.imagenes ?? []);

  // Artículo.
  const [precio, setPrecio] = useState(num(de("producto", "precio")));
  const [moneda, setMoneda] = useState<Moneda>(
    de("producto", "moneda") ?? de("rifa", "moneda") ?? de("mototaxi", "moneda") ?? "USD",
  );
  const [categoria, setCategoria] = useState(
    de("producto", "categoria") ?? CATEGORIAS_MERCADO[0],
  );
  const [condicion, setCondicion] = useState<"nuevo" | "usado">(
    de("producto", "condicion") ?? "usado",
  );
  const [cantidad, setCantidad] = useState(num(de("producto", "cantidad")) || "1");

  // Negocio.
  const [rubro, setRubro] = useState(de("negocio", "categoria") ?? CATEGORIAS_NEGOCIO[0]);
  /**
   * Los rubros de más. Muy pocos negocios del pueblo hacen una sola cosa: la
   * misma tienda vende celulares, instala cámaras y tira cableado. Obligarla a
   * elegir uno la dejaba invisible para dos de cada tres vecinos.
   */
  const [rubrosExtra, setRubrosExtra] = useState<string[]>(
    (de("negocio", "categorias") ?? []).filter((r) => r !== de("negocio", "categoria")),
  );
  const [direccion, setDireccion] = useState(de("negocio", "direccion") ?? "");
  const [horario, setHorario] = useState(de("negocio", "horario") ?? "");
  const [enlace, setEnlace] = useState(de("negocio", "enlace") ?? "");
  const [coordenadas, setCoordenadas] = useState<Coordenadas | undefined>(
    de("negocio", "coordenadas"),
  );

  // Divisas.
  const [operacion, setOperacion] = useState<"compra" | "venta">(
    de("divisa", "operacion") ?? "venta",
  );
  const [divisa, setDivisa] = useState<Divisa>(de("divisa", "divisa") ?? "USD");
  const [tasa, setTasa] = useState(num(de("divisa", "tasa")));
  const [monto, setMonto] = useState(num(de("divisa", "monto")));
  const [metodos, setMetodos] = useState<MetodoPago[]>(
    de("divisa", "metodos") ?? ["efectivo"],
  );

  // Rifa.
  const [premio, setPremio] = useState(de("rifa", "premio") ?? "");
  const [precioNumero, setPrecioNumero] = useState(num(de("rifa", "precioNumero")));
  const [loteria, setLoteria] = useState(de("rifa", "loteria") ?? LOTERIAS[0]);
  const [fechaSorteo, setFechaSorteo] = useState(de("rifa", "fechaSorteo") ?? "");
  const [sorteo, setSorteo] = useState(de("rifa", "sorteo") ?? "");
  const [totalNumeros, setTotalNumeros] = useState(
    num(de("rifa", "totalNumeros")) || "100",
  );

  // Transporte: mototaxi o taxi.
  const [clase, setClase] = useState<ClaseTransporte>(de("mototaxi", "clase") ?? "mototaxi");
  const [modelo, setModelo] = useState(de("mototaxi", "modelo") ?? "");
  const [placa, setPlaca] = useState(de("mototaxi", "placa") ?? "");
  const [tarifaDesde, setTarifaDesde] = useState(num(de("mototaxi", "tarifaDesde")));
  const [cobertura, setCobertura] = useState<string[]>(de("mototaxi", "cobertura") ?? []);

  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return <Esqueleto className="m-4 h-40" />;

  if (!miembro) {
    return (
      <>
        <BarraSuperior titulo="Publicar" volverA="/" />
        <main className="px-4 py-8 text-center">
          <p className="text-fg-muted">
            Para publicar necesitas una cuenta. Así el comprador sabe con quién trata.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/registro">
              <Boton ancho>Crear mi cuenta</Boton>
            </Link>
            <Link href="/entrar">
              <Boton ancho variante="secundario">
                Ya tengo cuenta
              </Boton>
            </Link>
          </div>
        </main>
      </>
    );
  }

  function construirBorrador(): BorradorDe<TipoOfrecido> {
    const comun = { descripcion: descripcion.trim(), zona, imagenes };

    switch (tipo) {
      case "producto":
        return {
          ...comun,
          tipo: "producto",
          titulo: titulo.trim(),
          precio: Number(precio),
          moneda,
          categoria,
          condicion,
          cantidad: Math.max(1, Number(cantidad) || 1),
        };
      case "negocio":
        return {
          ...comun,
          tipo: "negocio",
          titulo: titulo.trim(),
          categoria: rubro,
          // El principal siempre va primero y sin repetirse.
          categorias: [rubro, ...rubrosExtra.filter((r) => r !== rubro)],
          direccion: direccion.trim(),
          horario: horario.trim(),
          enlace: enlaceSeguro(enlace) ?? undefined,
          coordenadas,
          permanente: true,
        };
      case "divisa":
        return {
          ...comun,
          tipo: "divisa",
          titulo: `${operacion === "venta" ? "Vendo" : "Compro"} ${nombreDivisa(divisa)} en efectivo`,
          operacion,
          divisa,
          tasa: Number(tasa),
          monto: Number(monto) || 0,
          metodos,
        };
      case "rifa":
        return {
          ...comun,
          tipo: "rifa",
          titulo: `Rifa de ${premio.trim()}`,
          premio: premio.trim(),
          precioNumero: Number(precioNumero),
          moneda,
          loteria,
          fechaSorteo,
          sorteo: sorteo.trim() || undefined,
          totalNumeros: Number(totalNumeros) || 100,
          numerosDisponibles: Number(totalNumeros) || 100,
        };
      case "mototaxi":
        return {
          ...comun,
          tipo: "mototaxi",
          titulo: `${clase === "taxi" ? "Taxi" : "Mototaxi"} · ${miembro!.nombre} ${miembro!.apellido}`,
          clase,
          modelo: modelo.trim(),
          placa: normalizarPlaca(placa),
          cobertura,
          tarifaDesde: Number(tarifaDesde),
          moneda,
          // Al corregir la ficha no se reabre solo a quien había colgado la
          // moto: si estaba marcado como no disponible, sigue estándolo.
          disponible: de("mototaxi", "disponible") ?? true,
        };
    }
  }

  /**
   * El tablón de divisas está reservado a los miembros verificados: publicar
   * allí significa citar a un vecino para un intercambio de efectivo en mano.
   */
  const puedePublicarDivisas = miembro?.verificado === true;

  function validar(): string | null {
    if (tipo === "divisa" && !puedePublicarDivisas) {
      return "Para publicar divisas tu cuenta debe estar verificada.";
    }
    if (tipo === "producto") {
      if (titulo.trim().length < 3) return "Ponle un título al artículo.";
      if (!Number(precio)) return "Indica el precio.";
    }
    if (tipo === "negocio") {
      if (titulo.trim().length < 3) return "Escribe el nombre del negocio.";
      if (!direccion.trim()) return "Indica dónde queda el negocio.";
      if (enlace.trim() && !enlaceSeguro(enlace)) {
        return "Ese enlace no se entiende. Pega la dirección completa, empezando por https://";
      }
    }
    if (tipo === "divisa") {
      if (!Number(tasa)) return "Indica a qué tasa operas.";
      if (metodos.length === 0) return "Elige al menos un método de pago.";
    }
    if (tipo === "rifa") {
      if (premio.trim().length < 3) return "Indica qué se rifa.";
      if (!Number(precioNumero)) return "Indica el precio del número.";
      if (!fechaSorteo) return "Indica el día del sorteo.";
      // Se comprueba aquí para no hacer el viaje a Firestore y volver con un
      // "permiso denegado" que no le explica nada a nadie.
      const dias = diasHasta(fechaSorteo);
      if (dias < 0) return "Ese día ya pasó. Pon la fecha del sorteo que viene.";
      if (dias > 365) {
        return "El sorteo no puede estar a más de un año. Publícala cuando se acerque.";
      }
    }
    if (tipo === "mototaxi") {
      if (!modelo.trim()) {
        return clase === "taxi"
          ? "Indica la marca y el modelo del carro."
          : "Indica la marca y el modelo de la moto.";
      }
      // La placa es lo que deja a un pasajero comprobar, antes de montarse,
      // que el que llegó es el que se anunció. Sin ella el carnet no sirve.
      if (normalizarPlaca(placa).length < 4) return "Escribe la placa completa.";
      if (!Number(tarifaDesde)) return "Indica cuánto cuesta la carrera mínima.";
    }
    return null;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setFallo(null);

    const problema = validar();
    if (problema) {
      setFallo(problema);
      return;
    }

    setEnviando(true);
    try {
      const borrador = construirBorrador();

      // Corregir algo ya publicado no lo mueve de sitio ni le cambia la fecha:
      // se actualiza y se vuelve a su ficha.
      if (editando) {
        await actualizarPublicacion(inicial.id, borrador);
        router.replace(`/publicacion/?id=${inicial.id}`);
        return;
      }

      // Las divisas van por su propia vía: cada quien tiene una sola oferta
      // viva, así que si ya tenía una se reescribe en lugar de duplicarse.
      if (borrador.tipo === "divisa") {
        await publicarOfertaDivisa(borrador, miembro!);
        router.replace("/dolares");
        return;
      }

      const id = await crearPublicacion(borrador, miembro!);
      router.replace(`/publicacion/?id=${id}`);
    } catch (error) {
      setFallo(mensajeFirestore(error, tipo === "divisa" ? "publicar-divisa" : "publicar"));
      setEnviando(false);
    }
  }

  function alternarMetodo(metodo: MetodoPago) {
    setMetodos((previos) =>
      previos.includes(metodo) ? previos.filter((m) => m !== metodo) : [...previos, metodo],
    );
  }

  function alternarSector(sector: string) {
    setCobertura((previos) =>
      previos.includes(sector) ? previos.filter((s) => s !== sector) : [...previos, sector],
    );
  }

  return (
    <>
      <BarraSuperior
        titulo={editando ? "Editar publicación" : "Publicar"}
        subtitulo={miembro.codigo}
        volverA={editando ? `/publicacion/?id=${inicial.id}` : "/"}
      />

      <main className="px-4 py-4">
        {!configurado ? (
          <Aviso tono="error">Firebase no está conectado: la publicación no se guardará.</Aviso>
        ) : null}

        {/* Qué se va a publicar */}
        <fieldset className="mb-5" disabled={editando}>
          <legend className="mb-2 text-sm font-medium text-fg-muted">
            {editando ? "Qué publicaste" : "¿Qué vas a publicar?"}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ tipo: valor, titulo: nombre, detalle, Icono }) => {
              const bloqueado = valor === "divisa" && !puedePublicarDivisas;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setTipo(valor)}
                  aria-pressed={tipo === valor}
                  className={`pulsable relative flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center ${
                    tipo === valor
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-100"
                      : "border-line bg-surface text-fg-muted"
                  } ${bloqueado ? "opacity-55" : ""}`}
                >
                  <Icono size={21} />
                  <span className="text-xs font-semibold">{nombre}</span>
                  <span className="text-[10px] leading-tight text-fg-subtle">
                    {bloqueado ? "Requiere verificación" : detalle}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          {tipo === "producto" ? (
            <>
              <Campo
                etiqueta="¿Qué vendes?"
                placeholder="Moto Bera 150, año 2019"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Campo
                  etiqueta="Precio"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
                <Selector
                  etiqueta="Moneda"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as Moneda)}
                >
                  <option value="USD">Dólares</option>
                  <option value="VES">Bolívares</option>
                </Selector>
              </div>
              <Selector
                etiqueta="Categoría"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS_MERCADO.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Selector>
              <div className="grid grid-cols-2 gap-3">
                <Selector
                  etiqueta="Condición"
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value as "nuevo" | "usado")}
                >
                  <option value="usado">Usado</option>
                  <option value="nuevo">Nuevo</option>
                </Selector>
                <Campo
                  etiqueta="Cantidad"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {tipo === "negocio" ? (
            <>
              <Campo
                etiqueta="Nombre del negocio"
                placeholder="Panadería La Espiga"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <Selector
                etiqueta="Rubro principal"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                ayuda="Es el que encabeza tu ficha y bajo el que sales en el índice."
              >
                {RUBROS_NEGOCIO.map((grupo) => (
                  <optgroup key={grupo.grupo} label={grupo.grupo}>
                    {grupo.rubros.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </optgroup>
                ))}
              </Selector>

              <RubrosExtra
                principal={rubro}
                elegidos={rubrosExtra}
                alCambiar={setRubrosExtra}
              />
              <Campo
                etiqueta="Dirección"
                placeholder="Av. principal, frente a la plaza"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
              <Campo
                etiqueta="Horario"
                placeholder="Lunes a sábado, 8:00 am a 6:00 pm"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
              <Campo
                etiqueta="Enlace (opcional)"
                type="url"
                inputMode="url"
                placeholder="https://instagram.com/tunegocio"
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                ayuda="Instagram, catálogo o página."
              />
              <SelectorUbicacion valor={coordenadas} alCambiar={setCoordenadas} />
            </>
          ) : null}

          {tipo === "divisa" && !puedePublicarDivisas ? (
            <SinVerificar />
          ) : null}

          {tipo === "divisa" ? (
            <>
              <Selector
                etiqueta="¿Qué moneda?"
                value={divisa}
                onChange={(e) => setDivisa(e.target.value as Divisa)}
              >
                {DIVISAS.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.nombre}
                  </option>
                ))}
              </Selector>
              <Selector
                etiqueta="Operación"
                value={operacion}
                onChange={(e) => setOperacion(e.target.value as "compra" | "venta")}
              >
                <option value="venta">Vendo {nombreDivisa(divisa)} en efectivo</option>
                <option value="compra">Compro {nombreDivisa(divisa)} en efectivo</option>
              </Selector>
              <Campo
                etiqueta={`Tasa (bolívares por ${divisa === "COP" ? "peso" : divisa === "EUR" ? "euro" : "dólar"})`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
              />
              <Campo
                etiqueta={`¿Cuánto ${operacion === "venta" ? "vendes" : "buscas"}? (${nombreDivisa(divisa)})`}
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="500"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                ayuda="Lo que tienes disponible ahora mismo."
              />
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-fg-muted">
                  Métodos que aceptas
                </legend>
                <div className="flex flex-wrap gap-2">
                  {METODOS.map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => alternarMetodo(metodo)}
                      aria-pressed={metodos.includes(metodo)}
                      className={`min-h-10 rounded-pill border px-3.5 text-sm font-medium ${
                        metodos.includes(metodo)
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-surface text-fg-muted"
                      }`}
                    >
                      {ETIQUETA_METODO[metodo]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Aviso>
                Tu nombre, tu foto y tu teléfono se mostrarán junto a la oferta, para que quien
                te busque sepa a quién va a ver. La oferta se retira sola a las{" "}
                {HORAS_VIGENCIA_DOLAR} horas; para seguir en el tablón basta con tocar
                &ldquo;sigo disponible&rdquo;. Cada persona tiene una sola oferta viva: si ya
                tenías una, esta la sustituye.
              </Aviso>
            </>
          ) : null}

          {tipo === "rifa" ? (
            <>
              <Campo
                etiqueta="¿Qué se rifa?"
                placeholder="Una moto Bera 150 nueva"
                value={premio}
                onChange={(e) => setPremio(e.target.value)}
              />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Campo
                  etiqueta="Precio del número"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={precioNumero}
                  onChange={(e) => setPrecioNumero(e.target.value)}
                />
                <Selector
                  etiqueta="Moneda"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as Moneda)}
                >
                  <option value="USD">Dólares</option>
                  <option value="VES">Bolívares</option>
                </Selector>
              </div>
              <Selector
                etiqueta="Juega con"
                value={loteria}
                onChange={(e) => setLoteria(e.target.value)}
              >
                {LOTERIAS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Selector>
              <div className="grid grid-cols-2 gap-3">
                <Campo
                  etiqueta="Día del sorteo"
                  type="date"
                  value={fechaSorteo}
                  onChange={(e) => setFechaSorteo(e.target.value)}
                />
                <Campo
                  etiqueta="Sorteo (opcional)"
                  placeholder="Zulia A, 1:00 pm"
                  value={sorteo}
                  onChange={(e) => setSorteo(e.target.value)}
                />
              </div>
              <Campo
                etiqueta="¿Cuántos números tiene?"
                type="number"
                inputMode="numeric"
                min="1"
                value={totalNumeros}
                onChange={(e) => setTotalNumeros(e.target.value)}
                ayuda="La rifa se retira sola el día después del sorteo."
              />
            </>
          ) : null}

          {tipo === "mototaxi" ? (
            <>
              {/* Moto o carro. Se elige primero porque cambia lo que se
                  pregunta después y en cuál de los dos directorios sale. */}
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-fg-muted">
                  ¿Qué manejas?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {CLASES_TRANSPORTE.map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => setClase(opcion.id)}
                      aria-pressed={clase === opcion.id}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${
                        clase === opcion.id
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-surface text-fg-muted"
                      }`}
                    >
                      {opcion.id === "taxi" ? <IconCarro size={18} /> : <IconMoto size={18} />}
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Campo
                etiqueta={clase === "taxi" ? "Marca y modelo del carro" : "Marca y modelo de la moto"}
                placeholder={clase === "taxi" ? "Chevrolet Aveo" : "Bera BR-150"}
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
              <Campo
                etiqueta="Placa"
                placeholder="AB123CD"
                autoCapitalize="characters"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                ayuda="Tu ficha se ve como un carnet: con tu foto, tu código de miembro y la placa, el pasajero comprueba antes de montarse que eres tú."
              />

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Campo
                  etiqueta="Carrera mínima"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={tarifaDesde}
                  onChange={(e) => setTarifaDesde(e.target.value)}
                />
                <Selector
                  etiqueta="Moneda"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as Moneda)}
                >
                  <option value="USD">Dólares</option>
                  <option value="VES">Bolívares</option>
                </Selector>
              </div>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-fg-muted">
                  Sectores que cubres
                </legend>
                <div className="flex flex-wrap gap-2">
                  {ZONAS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => alternarSector(sector)}
                      aria-pressed={cobertura.includes(sector)}
                      className={`min-h-10 rounded-pill border px-3.5 text-sm font-medium ${
                        cobertura.includes(sector)
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-surface text-fg-muted"
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          <AreaTexto
            etiqueta={tipo === "divisa" ? "Detalles (opcional)" : "Descripción"}
            placeholder={
              tipo === "divisa"
                ? "Entrego en el centro, de 9 a 5."
                : "Cuenta el estado, los detalles y cómo entregas."
            }
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <Selector etiqueta="Sector" value={zona} onChange={(e) => setZona(e.target.value)}>
            {ZONAS.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </Selector>

          {tipo !== "divisa" ? (
            <SelectorImagenes valores={imagenes} onCambio={setImagenes} onError={setFallo} />
          ) : null}

          {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

          <div className="flex items-center gap-2">
            <Insignia tono="marca">
              {editando ? `Corriges tu publicación · ${miembro.codigo}` : `Publicas como ${miembro.codigo}`}
            </Insignia>
          </div>

          <Boton
            type="submit"
            ancho
            cargando={enviando}
            disabled={!configurado || (tipo === "divisa" && !puedePublicarDivisas)}
          >
            {editando ? "Guardar los cambios" : "Publicar"}
          </Boton>
        </form>
      </main>
    </>
  );
}

/**
 * Lo que ve quien intenta publicar en divisas sin estar verificado.
 * Ofrece el camino en lugar de dejarlo en un muro.
 */
function SinVerificar() {
  const { miembro, solicitarVerificacion } = useSesion();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const yaPedida = enviado || miembro?.solicitaVerificacion === true;

  async function pedir() {
    setEnviando(true);
    try {
      await solicitarVerificacion();
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta flex flex-col gap-3 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300">
          <IconVerified size={20} />
        </span>
        <div>
          <p className="font-semibold text-fg">El tablón de divisas pide verificación</p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            Publicar divisas significa citar a un vecino para entregar efectivo en mano, así
            que la administración revisa antes a quién deja publicar. Mientras tanto puedes
            ver todas las ofertas y escribir por WhatsApp a quien quieras.
          </p>
        </div>
      </div>

      {yaPedida ? (
        <p className="rounded-xl bg-surface-2 p-3 text-sm text-fg-muted">
          Tu solicitud está en la lista. Te avisamos en cuanto la revisen.
        </p>
      ) : (
        <Boton ancho variante="secundario" cargando={enviando} onClick={pedir}>
          Solicitar verificación
        </Boton>
      )}
    </div>
  );
}

/**
 * Los demás rubros del negocio.
 *
 * Va plegado por defecto: la mayoría se registra con uno solo, y desplegar una
 * lista de cincuenta rubros delante de todo el mundo convierte un formulario
 * de un minuto en uno de cinco. Quien hace varias cosas sabe que las hace y
 * abre esto a propósito.
 */
function RubrosExtra({
  principal,
  elegidos,
  alCambiar,
}: {
  principal: string;
  elegidos: string[];
  alCambiar: (rubros: string[]) => void;
}) {
  function alternar(rubro: string) {
    alCambiar(
      elegidos.includes(rubro) ? elegidos.filter((r) => r !== rubro) : [...elegidos, rubro],
    );
  }

  const cuantos = elegidos.filter((r) => r !== principal).length;

  return (
    <details className="rounded-xl border border-line bg-surface">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-3.5 text-sm font-medium text-fg-muted">
        ¿Haces algo más?
        <span className="text-xs text-fg-subtle">
          {cuantos > 0 ? `${cuantos} rubro${cuantos === 1 ? "" : "s"} más` : "Opcional"}
        </span>
      </summary>

      <div className="flex flex-col gap-3 border-t border-line p-3.5">
        <p className="text-xs text-fg-subtle">
          Saldrás en el directorio bajo cada uno de los que marques, y te encontrarán
          buscando cualquiera de ellos.
        </p>

        {RUBROS_NEGOCIO.map((grupo) => (
          <fieldset key={grupo.grupo}>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {grupo.grupo}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {grupo.rubros.map((r) => {
                const esPrincipal = r === principal;
                const activo = esPrincipal || elegidos.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={esPrincipal}
                    onClick={() => alternar(r)}
                    aria-pressed={activo}
                    className={`min-h-9 rounded-pill border px-3 text-sm font-medium disabled:opacity-60 ${
                      activo
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-surface text-fg-muted"
                    }`}
                  >
                    {r}
                    {esPrincipal ? " ·  principal" : ""}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </details>
  );
}
