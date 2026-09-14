/**
 * Pruebas de las reglas de seguridad de Mara Comercio.
 *
 * Se ejecutan contra el emulador de Firestore, así que comprueban las reglas
 * de verdad y no una interpretación de ellas. El foco está en lo que un
 * atacante intentaría desde la consola del navegador, saltándose la interfaz.
 */
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";

const entorno = await initializeTestEnvironment({
  projectId: "demo-mara",
  firestore: {
    rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
    host: "127.0.0.1",
    port: 8085,
  },
});

const ANA = "uid-ana";
const BETO = "uid-beto";
const CARLA = "uid-carla";
const DUENO = "uid-dueno";

const perfilAna = {
  uid: ANA, codigo: "MC-00001", nombre: "Ana", apellido: "Perozo",
  telefono: "584121234567", fotoUrl: "https://res.cloudinary.com/x/ana.jpg",
  verificado: true, rol: "miembro", creadoEn: Date.now(),
};
const perfilBeto = {
  uid: BETO, codigo: "MC-00002", nombre: "Beto", apellido: "Uzcátegui",
  telefono: "584129999999", fotoUrl: "https://res.cloudinary.com/x/beto.jpg",
  verificado: false, rol: "miembro", creadoEn: Date.now(),
};
// Carla es Vendedora Segura: verificada y, además, avalada por la
// administración. Su distintivo es el que ordena el tablón de divisas.
const perfilCarla = {
  uid: CARLA, codigo: "MC-00003", nombre: "Carla", apellido: "Fuenmayor",
  telefono: "584141111111", fotoUrl: "https://res.cloudinary.com/x/carla.jpg",
  verificado: true, vendedorSeguro: true, seguroDesde: Date.now(),
  rol: "miembro", creadoEn: Date.now(),
};

// Los perfiles se siembran saltándose las reglas: son el punto de partida.
await entorno.withSecurityRulesDisabled(async (ctx) => {
  const bd = ctx.firestore();
  await setDoc(doc(bd, "miembros", ANA), perfilAna);
  await setDoc(doc(bd, "miembros", BETO), perfilBeto);
  await setDoc(doc(bd, "miembros", CARLA), perfilCarla);
});

const ana = entorno.authenticatedContext(ANA).firestore();
const beto = entorno.authenticatedContext(BETO).firestore();
const carla = entorno.authenticatedContext(CARLA).firestore();
const dueno = entorno
  .authenticatedContext(DUENO, { email: "paulalejo123@gmail.com", email_verified: true })
  .firestore();
const visitante = entorno.unauthenticatedContext().firestore();

const anuncioDe = (perfil, extra = {}) => ({
  tipo: "producto", titulo: "Moto Bera 150", descripcion: "", zona: "El Moján",
  imagenes: [], precio: 800, moneda: "USD", categoria: "Motos",
  condicion: "usado", cantidad: 1, estado: "activa",
  creadaEn: Date.now(), actualizadaEn: Date.now(),
  venceEn: Date.now() + 30 * 86400000, prorrogas: 0,
  autorUid: perfil.uid, autorCodigo: perfil.codigo, autorNombre: perfil.nombre,
  autorApellido: perfil.apellido, autorTelefono: perfil.telefono,
  autorFoto: perfil.fotoUrl, autorVerificado: perfil.verificado,
  ...extra,
});

const pruebas = [];
const probar = (nombre, fn) => pruebas.push([nombre, fn]);

/* --- Publicaciones: suplantación --- */

probar("Beto publica con sus propios datos", () =>
  assertSucceeds(addDoc(collection(beto, "publicaciones"), anuncioDe(perfilBeto))));

probar("Beto NO puede publicar con el nombre y la foto de Ana", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { autorNombre: "Ana", autorFoto: perfilAna.fotoUrl }))));

probar("Beto NO puede regalarse el sello de verificado", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { autorVerificado: true }))));

probar("Beto NO puede poner el código de miembro de Ana", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { autorCodigo: "MC-00001" }))));

probar("Beto NO puede firmar como Ana", () =>
  assertFails(addDoc(collection(beto, "publicaciones"), anuncioDe(perfilAna))));

/* --- Vendedor Seguro --- */

probar("Beto NO puede regalarse el distintivo de Vendedor Seguro", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { autorSeguro: true }))));

probar("Ana, verificada pero sin aval, tampoco puede ponérselo", () =>
  assertFails(addDoc(collection(ana, "publicaciones"),
    anuncioDe(perfilAna, { autorSeguro: true }))));

probar("Carla, avalada, sí publica con su distintivo", () =>
  assertSucceeds(addDoc(collection(carla, "publicaciones"),
    anuncioDe(perfilCarla, { autorSeguro: true }))));

// Una página vieja en caché no manda el campo. Entenderse de menos no hace
// daño a nadie, así que no puede dejar a una avalada sin poder publicar.
probar("Carla publica aunque su navegador no mande el distintivo", () =>
  assertSucceeds(addDoc(collection(carla, "publicaciones"), anuncioDe(perfilCarla))));

probar("Beto NO puede nombrarse a sí mismo Vendedor Seguro", () =>
  assertFails(updateDoc(doc(beto, "miembros", BETO), { vendedorSeguro: true })));

probar("Carla NO puede colarle el distintivo al anuncio de Beto", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(carla, "publicaciones", id), { autorSeguro: true }));
});

probar("Beto NO se pone el distintivo editando su propio anuncio", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(beto, "publicaciones", id), {
    autorSeguro: true, actualizadaEn: Date.now(),
  }));
});

probar("El dueño sí avala a Beto como Vendedor Seguro", () =>
  assertSucceeds(updateDoc(doc(dueno, "miembros", BETO), {
    vendedorSeguro: true, seguroDesde: Date.now(),
  })));

/* --- Publicaciones: divisas y verificación --- */

probar("Ana, verificada, publica una oferta de dólares", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), anuncioDe(perfilAna, {
    tipo: "divisa", titulo: "Vendo dólares", operacion: "venta", tasa: 40,
    montoMin: 10, montoMax: 500, metodos: ["efectivo"],
    venceEn: Date.now() + 6 * 3600000,
  }))));

probar("Beto, sin verificar, NO puede publicar dólares", () =>
  assertFails(addDoc(collection(beto, "publicaciones"), anuncioDe(perfilBeto, {
    tipo: "divisa", titulo: "Vendo dólares", operacion: "venta", tasa: 40,
    montoMin: 10, montoMax: 500, metodos: ["efectivo"],
    venceEn: Date.now() + 6 * 3600000,
  }))));

probar("Nadie fija una oferta de dólares a diez años", () =>
  assertFails(addDoc(collection(ana, "publicaciones"), anuncioDe(perfilAna, {
    tipo: "divisa", titulo: "Vendo dólares", operacion: "venta", tasa: 40,
    montoMin: 10, montoMax: 500, metodos: ["efectivo"],
    venceEn: Date.now() + 3650 * 86400000,
  }))));

probar("Nadie se clava en el primer puesto con una fecha futura", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { creadaEn: Date.now() + 400 * 86400000 }))));

/* --- Publicaciones: edición --- */

probar("Beto NO puede editar el anuncio de Ana", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilAna));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(beto, "publicaciones", id), { titulo: "Secuestrado" }));
});

probar("Beto NO puede borrar el anuncio de Ana", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilAna));
    id = ref.id;
  });
  await assertFails(deleteDoc(doc(beto, "publicaciones", id)));
});

probar("Ana prorroga su propio anuncio", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilAna));
    id = ref.id;
  });
  await assertSucceeds(updateDoc(doc(ana, "publicaciones", id), {
    venceEn: Date.now() + 30 * 86400000, prorrogas: 1, actualizadaEn: Date.now(),
  }));
});

/* --- Perfiles --- */

probar("Beto NO puede autoverificarse", () =>
  assertFails(updateDoc(doc(beto, "miembros", BETO), { verificado: true })));

probar("Beto NO puede cambiarse el código de miembro", () =>
  assertFails(updateDoc(doc(beto, "miembros", BETO), { codigo: "MC-00001" })));

probar("Beto NO puede tocar el perfil de Ana", () =>
  assertFails(updateDoc(doc(beto, "miembros", ANA), { telefono: "584120000000" })));

probar("Beto sí puede pedir que lo verifiquen", () =>
  assertSucceeds(updateDoc(doc(beto, "miembros", BETO), {
    solicitaVerificacion: true, solicitadoEn: Date.now(),
  })));

probar("El dueño sí verifica a Beto", () =>
  assertSucceeds(updateDoc(doc(dueno, "miembros", BETO), {
    verificado: true, solicitaVerificacion: false,
  })));

/* --- Administradores --- */

probar("Beto NO puede nombrarse administrador", () =>
  assertFails(setDoc(doc(beto, "administradores", BETO), {
    uid: BETO, email: "beto@x.com", nombre: "Beto", creadoEn: Date.now(), creadoPor: "x",
  })));

probar("Beto NO puede ni leer la lista de administradores", () =>
  assertFails(getDoc(doc(beto, "administradores", DUENO))));

probar("El dueño nombra a un administrador", () =>
  assertSucceeds(setDoc(doc(dueno, "administradores", ANA), {
    uid: ANA, email: "ana@x.com", nombre: "Ana", creadoEn: Date.now(),
    creadoPor: "paulalejo123@gmail.com",
  })));

/* --- Chat en vivo --- */

const mensajeDe = (perfil, extra = {}) => ({
  texto: "Buenas, ¿quién tiene gas?",
  autorUid: perfil.uid, autorCodigo: perfil.codigo, autorNombre: perfil.nombre,
  autorFoto: perfil.fotoUrl,
  creadoEn: Date.now(), expiraEn: new Date(Date.now() + 36 * 3600000),
  ...extra,
});

probar("Beto escribe en el chat con su nombre", () =>
  assertSucceeds(addDoc(collection(beto, "salas", "general", "mensajes"), mensajeDe(perfilBeto))));

probar("Beto NO puede escribir en el chat firmando como Ana", () =>
  assertFails(addDoc(collection(beto, "salas", "general", "mensajes"),
    mensajeDe(perfilBeto, { autorNombre: "Ana", autorCodigo: "MC-00001" }))));

probar("Nadie deja un mensaje fijo con fecha futura", () =>
  assertFails(addDoc(collection(beto, "salas", "general", "mensajes"),
    mensajeDe(perfilBeto, { creadoEn: Date.now() + 400 * 86400000 }))));

probar("Nadie salva su mensaje del borrado a las 36 horas", () =>
  assertFails(addDoc(collection(beto, "salas", "general", "mensajes"),
    mensajeDe(perfilBeto, { expiraEn: new Date(Date.now() + 365 * 86400000) }))));

probar("No se pueden inventar salas fuera de la general", () =>
  assertFails(addDoc(collection(beto, "salas", "inventada", "mensajes"), mensajeDe(perfilBeto))));

probar("Un mensaje no se reescribe", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(
      collection(ctx.firestore(), "salas", "general", "mensajes"), mensajeDe(perfilBeto));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(beto, "salas", "general", "mensajes", id), { texto: "Otra cosa" }));
});

/* --- Publicaciones destacadas (se pagan, las concede la administración) --- */

probar("Beto NO puede nacer destacado", () =>
  assertFails(addDoc(collection(beto, "publicaciones"),
    anuncioDe(perfilBeto, { destacadaHasta: Date.now() + 7 * 86400000 }))));

probar("Beto NO puede destacarse editando su propio anuncio", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(beto, "publicaciones", id), {
    destacadaHasta: Date.now() + 30 * 86400000, actualizadaEn: Date.now(),
  }));
});

probar("Beto NO se cuela el destaque al prorrogar", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertFails(updateDoc(doc(beto, "publicaciones", id), {
    venceEn: Date.now() + 30 * 86400000, prorrogas: 1,
    destacadaHasta: Date.now() + 7 * 86400000,
  }));
});

probar("Beto sí puede marcar vendido lo suyo", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertSucceeds(updateDoc(doc(beto, "publicaciones", id), {
    estado: "cerrada", cerradaEn: Date.now(), actualizadaEn: Date.now(),
  }));
});

probar("El dueño sí destaca un anuncio", async () => {
  let id;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const ref = await addDoc(collection(ctx.firestore(), "publicaciones"), anuncioDe(perfilBeto));
    id = ref.id;
  });
  await assertSucceeds(updateDoc(doc(dueno, "publicaciones", id), {
    destacadaHasta: Date.now() + 7 * 86400000,
  }));
});

/* --- Reportes --- */

/** Fija para todos los reportes: corregir uno no puede cambiarle la fecha. */
const NACIDO = Date.now();

const reporteDe = (quien, extra = {}) => ({
  sobre: "publicacion", objetivoId: "pub-1", objetivoTitulo: "Moto Bera 150",
  objetivoAutorUid: ANA, motivo: "estafa", detalle: "Cobró y no entregó.",
  reportanteUid: quien.uid, reportanteCodigo: quien.codigo,
  reportanteNombre: `${quien.nombre} ${quien.apellido}`,
  creadoEn: NACIDO, estado: "abierto",
  ...extra,
});

/** El identificador que exigen las reglas: uno por persona y cosa reportada. */
const idReporte = (r) => `${r.sobre}_${r.objetivoId}__${r.reportanteUid}`;

probar("Beto reporta un anuncio de Ana", () => {
  const r = reporteDe(perfilBeto);
  return assertSucceeds(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

probar("Beto NO puede inventarse el identificador para repetir el reporte", () => {
  const r = reporteDe(perfilBeto);
  return assertFails(setDoc(doc(beto, "reportes", "otro-renglon-mas"), r));
});

probar("Beto NO puede reportar firmando como Ana", () => {
  const r = reporteDe(perfilAna, { objetivoAutorUid: CARLA });
  return assertFails(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

probar("Nadie se reporta a sí mismo", () => {
  const r = reporteDe(perfilBeto, { objetivoId: "pub-mia", objetivoAutorUid: BETO });
  return assertFails(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

// El agujero que encontraron estas pruebas: el aviso ya puesto se reescribía
// para señalar a otro, conservando el identificador y el motivo.
probar("Beto NO puede reapuntar su reporte contra otra persona", () => {
  const r = reporteDe(perfilBeto, { objetivoAutorUid: CARLA });
  return assertFails(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

probar("Un reporte nace abierto, no resuelto", () => {
  const r = reporteDe(perfilBeto, { objetivoId: "pub-9", estado: "resuelto" });
  return assertFails(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

probar("Beto NO puede leer los reportes", () => {
  const r = reporteDe(perfilBeto);
  return assertFails(getDoc(doc(beto, "reportes", idReporte(r))));
});

probar("Beto NO puede cerrar su propio reporte", () => {
  const r = reporteDe(perfilBeto);
  return assertFails(updateDoc(doc(beto, "reportes", idReporte(r)), { estado: "descartado" }));
});

probar("Beto NO puede borrar el reporte que puso", () => {
  const r = reporteDe(perfilBeto);
  return assertFails(deleteDoc(doc(beto, "reportes", idReporte(r))));
});

probar("Beto sí puede corregir el motivo mientras nadie lo atienda", () => {
  const r = reporteDe(perfilBeto, { motivo: "repetido" });
  return assertSucceeds(setDoc(doc(beto, "reportes", idReporte(r)), r));
});

probar("El dueño sí lee y resuelve los reportes", async () => {
  const r = reporteDe(perfilBeto);
  await assertSucceeds(getDoc(doc(dueno, "reportes", idReporte(r))));
  await assertSucceeds(updateDoc(doc(dueno, "reportes", idReporte(r)), {
    estado: "resuelto", resueltoEn: Date.now(), resueltoPor: "paulalejo123@gmail.com",
  }));
});

probar("Un visitante sin cuenta NO puede reportar", () => {
  const r = reporteDe(perfilBeto, { objetivoId: "pub-7" });
  return assertFails(setDoc(doc(visitante, "reportes", idReporte(r)), r));
});

/* --- Foto rechazada: la cuenta queda en pausa --- */

// Dina tiene la foto de otra persona y la administración la marcó.
const DINA = "uid-dina";
const perfilDina = {
  uid: DINA, codigo: "MC-00004", nombre: "Dina", apellido: "Chirinos",
  telefono: "584249999999", fotoUrl: "https://res.cloudinary.com/x/no-es-ella.jpg",
  verificado: true, fotoRechazada: true,
  advertencia: "Tu foto de perfil no muestra tu cara.",
  rol: "miembro", creadoEn: Date.now(),
};
await entorno.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "miembros", DINA), perfilDina);
});
const dina = entorno.authenticatedContext(DINA).firestore();

probar("Dina, con la foto rechazada, NO puede publicar", () =>
  assertFails(addDoc(collection(dina, "publicaciones"), anuncioDe(perfilDina))));

probar("Dina tampoco puede escribir en el chat", () =>
  assertFails(addDoc(collection(dina, "salas", "general", "mensajes"), mensajeDe(perfilDina))));

probar("Dina NO puede levantarse la pausa sin cambiar la foto", () =>
  assertFails(updateDoc(doc(dina, "miembros", DINA), { fotoRechazada: false })));

probar("Dina NO se quita la advertencia que le dejó la administración", () =>
  assertFails(updateDoc(doc(dina, "miembros", DINA), { advertencia: "" })));

probar("Dina sí se reactiva subiendo una foto distinta", () =>
  assertSucceeds(updateDoc(doc(dina, "miembros", DINA), {
    fotoUrl: "https://res.cloudinary.com/x/dina-de-verdad.jpg", fotoRechazada: false,
  })));

probar("Y entonces sí publica", () =>
  assertSucceeds(addDoc(collection(dina, "publicaciones"), anuncioDe({
    ...perfilDina, fotoUrl: "https://res.cloudinary.com/x/dina-de-verdad.jpg",
  }))));

probar("El dueño sí pone una cuenta en pausa", () =>
  assertSucceeds(updateDoc(doc(dueno, "miembros", DINA), {
    fotoRechazada: true, advertencia: "Tu foto no muestra tu cara.",
  })));

probar("El dueño sí puede borrar una cuenta", () =>
  assertSucceeds(deleteDoc(doc(dueno, "miembros", DINA))));

/* --- Transporte y carreras --- */

probar("Una ficha de mototaxi no caduca", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), anuncioDe(perfilAna, {
    tipo: "mototaxi", titulo: "Mototaxi · Ana", clase: "mototaxi",
    modelo: "Bera BR-150", placa: "AC5H31A", cobertura: ["El Moján"],
    tarifaDesde: 1, moneda: "USD", disponible: true,
    venceEn: new Date("2100-01-01T00:00:00Z").getTime(),
  }))));

probar("Ana pide una carrera", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), anuncioDe(perfilAna, {
    tipo: "carrera", titulo: "Carrera: El Moján → Santa Cruz",
    origen: "El Moján", destino: "Santa Cruz", prefiere: "cualquiera",
    pago: 2, moneda: "USD",
    venceEn: Date.now() + 2 * 3600000,
  }))));

probar("Nadie deja una carrera pedida colgada un mes", () =>
  assertFails(addDoc(collection(ana, "publicaciones"), anuncioDe(perfilAna, {
    tipo: "carrera", titulo: "Carrera eterna",
    origen: "El Moján", destino: "Santa Cruz", prefiere: "cualquiera",
    pago: 2, moneda: "USD",
    venceEn: Date.now() + 30 * 86400000,
  }))));

probar("Un tipo inventado sigue sin entrar", () =>
  assertFails(addDoc(collection(ana, "publicaciones"),
    anuncioDe(perfilAna, { tipo: "loquesea" }))));

/* --- Rifas: el sorteo puede ser dentro de meses --- */

const rifaDe = (perfil, dias, extra = {}) => {
  // Lo mismo que calcula la aplicación: el sorteo más un día de gracia para
  // anunciar al ganador.
  const sorteo = new Date(Date.now() + dias * 86400000);
  const fechaSorteo = sorteo.toISOString().slice(0, 10);
  return anuncioDe(perfil, {
    tipo: "rifa", titulo: "Rifa de una nevera", premio: "Una nevera",
    precioNumero: 1, moneda: "USD", loteria: "Triple Lago",
    fechaSorteo, totalNumeros: 100, numerosDisponibles: 100,
    venceEn: new Date(`${fechaSorteo}T23:59:59Z`).getTime() + 86400000,
    ...extra,
  });
};

probar("Una rifa que sortea la semana que viene", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), rifaDe(perfilAna, 7))));

// El caso que rompía: quien rifa para Navidad en octubre veía
// "Firestore rechazó la operación" y no había manera de publicarla.
probar("Una rifa que sortea dentro de dos meses", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), rifaDe(perfilAna, 60))));

probar("Una rifa que sortea dentro de diez meses", () =>
  assertSucceeds(addDoc(collection(ana, "publicaciones"), rifaDe(perfilAna, 300))));

probar("Pero no una rifa a cinco años vista", () =>
  assertFails(addDoc(collection(ana, "publicaciones"), rifaDe(perfilAna, 1825))));

/* --- Tasas y visitantes --- */

probar("Un visitante sin cuenta puede leer las publicaciones", () =>
  assertSucceeds(getDoc(doc(visitante, "publicaciones", "cualquiera"))));

probar("Un visitante NO puede publicar", () =>
  assertFails(addDoc(collection(visitante, "publicaciones"), anuncioDe(perfilAna))));

probar("Beto NO puede cambiar la tasa de respaldo", () =>
  assertFails(setDoc(doc(beto, "configuracion", "tasas"), { bcv: 1, binance: 1 })));

probar("El dueño sí carga la tasa de respaldo", () =>
  assertSucceeds(setDoc(doc(dueno, "configuracion", "tasas"), {
    bcv: 40, binance: 45, actualizadoEn: Date.now(),
  })));

probar("Una colección no contemplada queda cerrada", () =>
  assertFails(setDoc(doc(beto, "loquesea", "x"), { a: 1 })));

/* --- Ejecución --- */

let bien = 0;
const fallos = [];
for (const [nombre, fn] of pruebas) {
  try {
    await fn();
    console.log(`  ok  ${nombre}`);
    bien++;
  } catch (error) {
    console.log(`  NO  ${nombre}`);
    fallos.push(`${nombre}: ${error.message?.split("\n")[0]}`);
  }
}

console.log(`\n${bien} de ${pruebas.length} pruebas pasaron.`);
if (fallos.length) {
  console.log("\nFallos:");
  for (const f of fallos) console.log("  - " + f);
}
await entorno.cleanup();
process.exit(fallos.length ? 1 : 0);
