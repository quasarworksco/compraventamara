/**
 * Ubicación de los negocios del directorio.
 *
 * En San Rafael media calle no tiene número. "Av. 3, al lado de la panadería"
 * le sirve a quien ya sabe dónde es y a nadie más, así que la dirección
 * escrita no se sustituye: se le añade un punto exacto para que cualquiera
 * abra Maps y llegue.
 *
 * El punto entra de dos maneras. La buena es el GPS, porque quien registra su
 * negocio suele estar dentro de él; la otra es pegar un enlace de Google Maps,
 * para quien lo hace desde la casa. De ahí las dos mitades de este archivo.
 */

import type { Coordenadas } from "./types";

/** Un punto válido de verdad: dentro del planeta y no en el (0,0) del Atlántico. */
export function coordenadasValidas(punto: Coordenadas | undefined): punto is Coordenadas {
  if (!punto) return false;
  const { lat, lng } = punto;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // El (0,0) es lo que devuelve un campo vacío mal interpretado, no un local.
  return Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001;
}

/** Seis decimales: unos diez centímetros. Más cifras solo engordan el documento. */
function redondear(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

export function normalizarCoordenadas(lat: number, lng: number): Coordenadas {
  return { lat: redondear(lat), lng: redondear(lng) };
}

/**
 * Saca las coordenadas de lo que sea que la persona haya pegado.
 *
 * Google escribe la misma ubicación de varias formas según de dónde salga el
 * enlace —de la app, del navegador, de compartir—, así que se prueban todas
 * en orden de fiabilidad. Los `!3d...!4d...` van primero porque son el punto
 * del sitio; el `@lat,lng` es el centro de la pantalla, que suele coincidir
 * pero no siempre.
 */
export function leerCoordenadas(texto: string): Coordenadas | null {
  const entrada = texto.trim();
  if (!entrada) return null;

  const patrones = [
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,           // punto del sitio
    /[?&](?:q|query|ll|daddr|destination)=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i,
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,                // centro del mapa
    /^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/,   // pegado a mano
  ];

  for (const patron of patrones) {
    const encontrado = entrada.match(patron);
    if (!encontrado) continue;
    const punto = normalizarCoordenadas(Number(encontrado[1]), Number(encontrado[2]));
    if (coordenadasValidas(punto)) return punto;
  }

  return null;
}

/**
 * Los enlaces cortos de Google no traen las coordenadas dentro.
 *
 * Resolverlos exige seguir la redirección, y eso el navegador no lo permite
 * contra otro dominio. Antes que fallar en silencio, se reconoce el caso para
 * poder decirle a la persona qué hacer en su lugar.
 */
export function esEnlaceCorto(texto: string): boolean {
  return /(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(texto);
}

/** El punto en Google Maps, para mirarlo. */
export function enlaceMapa(punto: Coordenadas): string {
  return `https://www.google.com/maps/search/?api=1&query=${punto.lat},${punto.lng}`;
}

/** Cómo llegar desde donde esté quien lo abre. */
export function enlaceComoLlegar(punto: Coordenadas): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${punto.lat},${punto.lng}`;
}

/** "10.396100, -71.737700", para que se vea que quedó guardado. */
export function coordenadasLegibles(punto: Coordenadas): string {
  return `${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}`;
}

/**
 * Pide la ubicación al navegador.
 *
 * Los mensajes de error se traducen aquí porque los del navegador llegan en
 * inglés y sin salida: "User denied Geolocation" no le dice a nadie que tiene
 * que entrar a los permisos del sitio.
 */
export function ubicacionActual(): Promise<Coordenadas> {
  return new Promise((resolver, rechazar) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      rechazar(new Error("Este teléfono no permite compartir la ubicación."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolver(normalizarCoordenadas(posicion.coords.latitude, posicion.coords.longitude)),
      (fallo) => {
        if (fallo.code === fallo.PERMISSION_DENIED) {
          rechazar(
            new Error(
              "No diste permiso de ubicación. Actívalo en los ajustes del navegador para este sitio, o pega el enlace de Google Maps.",
            ),
          );
        } else if (fallo.code === fallo.POSITION_UNAVAILABLE) {
          rechazar(new Error("No se pudo tomar la ubicación. Prueba al aire libre."));
        } else {
          rechazar(new Error("La ubicación tardó demasiado. Inténtalo otra vez."));
        }
      },
      // Alta precisión: se está marcando la puerta de un local, no una ciudad.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
