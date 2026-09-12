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
  IconDollar,
  IconMoto,
  IconStore,
  IconTag,
  IconTicket,
} from "@/components/icons";
import { SelectorImagenes } from "@/components/selector-imagenes";
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
import { ETIQUETA_METODO } from "@/lib/formato";
import {
  CATEGORIAS_MERCADO,
  CATEGORIAS_NEGOCIO,
  LOTERIAS,
  RUBROS_NEGOCIO,
  ZONAS,
} from "@/lib/pueblo";
import {
  crearPublicacion,
  publicarOfertaDolar,
  type BorradorPublicacion,
} from "@/lib/publicaciones";
import { HORAS_VIGENCIA_DOLAR, type MetodoPago, type Moneda, type TipoPublicacion } from "@/lib/types";

const TIPOS = [
  { tipo: "producto", titulo: "Artículo", detalle: "Vehículo, celular, bien", Icono: IconTag },
  { tipo: "negocio", titulo: "Negocio", detalle: "Ficha del directorio", Icono: IconStore },
  { tipo: "dolar", titulo: "Dólares", detalle: "Compro o vendo efectivo", Icono: IconDollar },
  { tipo: "rifa", titulo: "Rifa", detalle: "Números y sorteo", Icono: IconTicket },
  { tipo: "mototaxi", titulo: "Mototaxi", detalle: "Ofrezco carreras", Icono: IconMoto },
] as const satisfies readonly { tipo: TipoPublicacion; titulo: string; detalle: string; Icono: typeof IconTag }[];

const METODOS: MetodoPago[] = ["pago-movil", "efectivo", "zelle", "binance", "transferencia"];

export default function PaginaPublicar() {
  return (
    <Suspense fallback={<Esqueleto className="m-4 h-40" />}>
      <Publicar />
    </Suspense>
  );
}

function Publicar() {
  const { miembro, cargando, configurado } = useSesion();
  const parametros = useSearchParams();
  const router = useRouter();

  const tipoInicial = (parametros.get("tipo") ?? "producto") as TipoPublicacion;
  const [tipo, setTipo] = useState<TipoPublicacion>(
    TIPOS.some((t) => t.tipo === tipoInicial) ? tipoInicial : "producto",
  );

  // Campos comunes.
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [zona, setZona] = useState(ZONAS[0]);
  const [imagenes, setImagenes] = useState<string[]>([]);

  // Artículo.
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("USD");
  const [categoria, setCategoria] = useState(CATEGORIAS_MERCADO[0]);
  const [condicion, setCondicion] = useState<"nuevo" | "usado">("usado");
  const [cantidad, setCantidad] = useState("1");

  // Negocio.
  const [rubro, setRubro] = useState(CATEGORIAS_NEGOCIO[0]);
  const [direccion, setDireccion] = useState("");
  const [horario, setHorario] = useState("");
  const [enlace, setEnlace] = useState("");

  // Dólares.
  const [operacion, setOperacion] = useState<"compra" | "venta">("venta");
  const [tasa, setTasa] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [metodos, setMetodos] = useState<MetodoPago[]>(["efectivo"]);

  // Rifa.
  const [premio, setPremio] = useState("");
  const [precioNumero, setPrecioNumero] = useState("");
  const [loteria, setLoteria] = useState(LOTERIAS[0]);
  const [fechaSorteo, setFechaSorteo] = useState("");
  const [sorteo, setSorteo] = useState("");
  const [totalNumeros, setTotalNumeros] = useState("100");

  // Mototaxi.
  const [tarifaDesde, setTarifaDesde] = useState("");
  const [cobertura, setCobertura] = useState<string[]>([]);

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

  function construirBorrador(): BorradorPublicacion {
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
          direccion: direccion.trim(),
          horario: horario.trim(),
          enlace: enlace.trim() || undefined,
          permanente: true,
        };
      case "dolar":
        return {
          ...comun,
          tipo: "dolar",
          titulo: operacion === "venta" ? "Vendo dólares en efectivo" : "Compro dólares en efectivo",
          operacion,
          tasa: Number(tasa),
          montoMin: Number(montoMin) || 0,
          montoMax: Number(montoMax) || 0,
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
          titulo: `Mototaxi · ${miembro!.nombre} ${miembro!.apellido}`,
          cobertura,
          tarifaDesde: Number(tarifaDesde),
          moneda,
          disponible: true,
        };
    }
  }

  function validar(): string | null {
    if (tipo === "producto") {
      if (titulo.trim().length < 3) return "Ponle un título al artículo.";
      if (!Number(precio)) return "Indica el precio.";
    }
    if (tipo === "negocio") {
      if (titulo.trim().length < 3) return "Escribe el nombre del negocio.";
      if (!direccion.trim()) return "Indica dónde queda el negocio.";
    }
    if (tipo === "dolar") {
      if (!Number(tasa)) return "Indica a qué tasa operas.";
      if (metodos.length === 0) return "Elige al menos un método de pago.";
    }
    if (tipo === "rifa") {
      if (premio.trim().length < 3) return "Indica qué se rifa.";
      if (!Number(precioNumero)) return "Indica el precio del número.";
      if (!fechaSorteo) return "Indica el día del sorteo.";
    }
    if (tipo === "mototaxi" && !Number(tarifaDesde)) {
      return "Indica la tarifa mínima de una carrera.";
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

      // Las divisas van por su propia vía: cada quien tiene una sola oferta
      // viva, así que si ya tenía una se reescribe en lugar de duplicarse.
      if (borrador.tipo === "dolar") {
        await publicarOfertaDolar(borrador, miembro!);
        router.replace("/dolares");
        return;
      }

      const id = await crearPublicacion(borrador, miembro!);
      router.replace(`/publicacion/${id}`);
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo publicar.");
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
      <BarraSuperior titulo="Publicar" subtitulo={miembro.codigo} volverA="/" />

      <main className="px-4 py-4">
        {!configurado ? (
          <Aviso tono="error">Firebase no está conectado: la publicación no se guardará.</Aviso>
        ) : null}

        {/* Qué se va a publicar */}
        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium text-fg-muted">¿Qué vas a publicar?</legend>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ tipo: valor, titulo: nombre, detalle, Icono }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipo(valor)}
                aria-pressed={tipo === valor}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-colors ${
                  tipo === valor
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-100"
                    : "border-line bg-surface text-fg-muted"
                }`}
              >
                <Icono size={21} />
                <span className="text-xs font-semibold">{nombre}</span>
                <span className="text-[10px] leading-tight text-fg-subtle">{detalle}</span>
              </button>
            ))}
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
              <Selector etiqueta="Rubro" value={rubro} onChange={(e) => setRubro(e.target.value)}>
                {RUBROS_NEGOCIO.map((grupo) => (
                  <optgroup key={grupo.grupo} label={grupo.grupo}>
                    {grupo.rubros.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </optgroup>
                ))}
              </Selector>
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
            </>
          ) : null}

          {tipo === "dolar" ? (
            <>
              <Selector
                etiqueta="Operación"
                value={operacion}
                onChange={(e) => setOperacion(e.target.value as "compra" | "venta")}
              >
                <option value="venta">Vendo dólares en efectivo</option>
                <option value="compra">Compro dólares en efectivo</option>
              </Selector>
              <Campo
                etiqueta="Tasa (bolívares por dólar)"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Campo
                  etiqueta="Desde ($)"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={montoMin}
                  onChange={(e) => setMontoMin(e.target.value)}
                />
                <Campo
                  etiqueta="Hasta ($)"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={montoMax}
                  onChange={(e) => setMontoMax(e.target.value)}
                />
              </div>
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
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Campo
                  etiqueta="Tarifa mínima"
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
            etiqueta={tipo === "dolar" ? "Detalles (opcional)" : "Descripción"}
            placeholder={
              tipo === "dolar"
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

          {tipo !== "dolar" ? (
            <SelectorImagenes valores={imagenes} onCambio={setImagenes} onError={setFallo} />
          ) : null}

          {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

          <div className="flex items-center gap-2">
            <Insignia tono="marca">Publicas como {miembro.codigo}</Insignia>
          </div>

          <Boton type="submit" ancho cargando={enviando} disabled={!configurado}>
            Publicar
          </Boton>
        </form>
      </main>
    </>
  );
}
