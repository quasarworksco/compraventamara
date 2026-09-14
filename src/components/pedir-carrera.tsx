"use client";

/**
 * "Quiero una carrera".
 *
 * El camino inverso del directorio: en vez de buscar quién está rodando y
 * escribirle a cinco para que conteste uno, se deja el viaje puesto y el que
 * quiera lo toma. Sirve sobre todo de madrugada y bajo aguacero, que es
 * justamente cuando cuesta conseguir moto.
 *
 * El formulario es corto porque quien lo abre suele estar de pie en la calle:
 * de dónde, adónde, y ya. Todo lo demás es opcional.
 */
import { useState } from "react";

import { useSesion } from "@/lib/auth";
import { mensajeFirestore } from "@/lib/errores";
import { pedirCarrera } from "@/lib/publicaciones";
import { ubicacionActual } from "@/lib/mapas";
import { ZONAS } from "@/lib/pueblo";
import {
  CLASES_TRANSPORTE,
  HORAS_VIGENCIA_CARRERA,
  type ClaseTransporte,
  type Coordenadas,
  type Moneda,
} from "@/lib/types";
import { IconCarro, IconCheck, IconClose, IconLocalizar, IconMoto } from "./icons";
import { AreaTexto, Aviso, Boton, Campo, Selector } from "./ui";

type Prefiere = ClaseTransporte | "cualquiera";

export function PedirCarrera({ alCerrar }: { alCerrar: () => void }) {
  const { miembro } = useSesion();

  const [origen, setOrigen] = useState(miembro?.zona ?? ZONAS[0]);
  const [destino, setDestino] = useState("");
  const [prefiere, setPrefiere] = useState<Prefiere>("cualquiera");
  const [pago, setPago] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("USD");
  const [nota, setNota] = useState("");
  const [punto, setPunto] = useState<Coordenadas | undefined>(undefined);

  const [buscandoPunto, setBuscandoPunto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function tomarPunto() {
    setFallo(null);
    setBuscandoPunto(true);
    try {
      setPunto(await ubicacionActual());
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo tomar la ubicación.");
    } finally {
      setBuscandoPunto(false);
    }
  }

  async function enviar() {
    if (!miembro) return;
    if (!destino.trim()) {
      setFallo("Dinos adónde vas.");
      return;
    }

    setEnviando(true);
    setFallo(null);
    try {
      await pedirCarrera(
        {
          tipo: "carrera",
          titulo: `Carrera: ${origen} → ${destino.trim()}`,
          descripcion: nota.trim(),
          zona: origen,
          imagenes: [],
          origen,
          destino: destino.trim(),
          puntoOrigen: punto,
          prefiere,
          pago: Number(pago) || 0,
          moneda,
        },
        miembro,
      );
      setListo(true);
    } catch (error) {
      setFallo(mensajeFirestore(error, "publicar"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pedir una carrera"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-4 pb-safe sm:rounded-3xl">
        <div className="mb-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-fg">
              {listo ? "Carrera pedida" : "Quiero una carrera"}
            </h2>
            <p className="text-xs text-fg-subtle">
              {listo
                ? "Los conductores del pueblo ya la están viendo."
                : `La verán los mototaxis y taxis durante ${HORAS_VIGENCIA_CARRERA} horas.`}
            </p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-fg-muted active:bg-surface-2"
          >
            <IconClose size={19} />
          </button>
        </div>

        {listo ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-verde-200 bg-verde-50 p-3.5">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-verde-600" />
              <p className="text-sm text-fg-muted">
                El primero que la tome te escribe por WhatsApp para confirmarte. Si consigues
                por otro lado, retírala desde tu perfil.
              </p>
            </div>
            <Boton ancho onClick={alCerrar}>
              Listo
            </Boton>
          </div>
        ) : !miembro ? (
          <Aviso>Para pedir una carrera necesitas una cuenta: así el conductor sabe a quién va a buscar.</Aviso>
        ) : (
          <div className="flex flex-col gap-3">
            <Selector
              etiqueta="¿De dónde sales?"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
            >
              {ZONAS.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Selector>

            <Campo
              etiqueta="¿Adónde vas?"
              placeholder="Al ambulatorio, a Santa Cruz, al mercado..."
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            />

            {/* El punto exacto es lo que convierte "estoy por el Uveral" en
                algo a lo que un motorizado puede llegar sin llamar. */}
            <div className="flex flex-col gap-1.5">
              <Boton
                type="button"
                variante="secundario"
                ancho
                cargando={buscandoPunto}
                onClick={tomarPunto}
                icono={punto ? <IconCheck size={17} /> : <IconLocalizar size={17} />}
              >
                {punto ? "Sabe dónde recogerte" : "Compartir dónde estoy"}
              </Boton>
              <p className="text-xs text-fg-subtle">
                Opcional, pero con esto el conductor llega sin tener que llamarte.
              </p>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-fg-muted">
                ¿En qué prefieres ir?
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: "cualquiera" as const, etiqueta: "Lo que salga" }, ...CLASES_TRANSPORTE].map(
                  (opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => setPrefiere(opcion.id)}
                      aria-pressed={prefiere === opcion.id}
                      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-1 text-sm font-semibold ${
                        prefiere === opcion.id
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-surface text-fg-muted"
                      }`}
                    >
                      {opcion.id === "taxi" ? (
                        <IconCarro size={16} />
                      ) : opcion.id === "mototaxi" ? (
                        <IconMoto size={16} />
                      ) : null}
                      {"plural" in opcion ? opcion.plural : opcion.etiqueta}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Campo
                etiqueta="Lo que ofreces (opcional)"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="A convenir"
                value={pago}
                onChange={(e) => setPago(e.target.value)}
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

            <AreaTexto
              etiqueta="Algo más que deba saber (opcional)"
              rows={2}
              placeholder="Llevo dos bultos. Estoy frente a la panadería."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />

            {fallo ? <Aviso tono="error">{fallo}</Aviso> : null}

            <Boton ancho cargando={enviando} onClick={enviar} disabled={!destino.trim()}>
              Pedir la carrera
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}
