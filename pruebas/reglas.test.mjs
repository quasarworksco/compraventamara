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

// Los perfiles se siembran saltándose las reglas: son el punto de partida.
await entorno.withSecurityRulesDisabled(async (ctx) => {
  const bd = ctx.firestore();
  await setDoc(doc(bd, "miembros", ANA), perfilAna);
  await setDoc(doc(bd, "miembros", BETO), perfilBeto);
});

const ana = entorno.authenticatedContext(ANA).firestore();
const beto = entorno.authenticatedContext(BETO).firestore();
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
