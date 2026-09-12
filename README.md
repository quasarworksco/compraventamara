# Compra Venta Mara

La plataforma de comercio de **San Rafael del Moján**, capital del municipio
Mara (Zulia, Venezuela). Su meta es que en el pueblo no haya que preguntar
dónde se consigue algo: si existe, está aquí.

**En línea:** https://maracomercio.dgp-link.com

## Qué hay dentro

| Sección | Qué resuelve |
| --- | --- |
| **Portada** | La entrada al pueblo: bienvenida, el precio del dólar del día y los teléfonos de Polimara y atención al ciudadano, marcables de un toque. |
| **Marketplace** | Vehículos, celulares, artículos y bienes. Los anuncios viven 30 días, avisan antes de vencer y se prorrogan desde el perfil. |
| **Negocios** | Directorio del pueblo con 53 rubros en 10 grupos: desde un odontólogo hasta una cauchera. Las fichas no vencen. |
| **Dólares** | Compra y venta de efectivo, solo para miembros verificados. Cada oferta vive 6 horas y se renueva con un toque. |
| **Rifas** | Qué se rifa, precio del número, con qué lotería juega y el día del sorteo. |
| **Mototaxis** | Quién está rodando, a qué tarifa y qué sectores cubre. |
| **Chat en vivo** | Cuatro salas en tiempo real. Los mensajes se borran solos a las 36 horas. |
| **Administración** | Panel aparte en `/admin`: verificar miembros, moderar publicaciones y cargar la tasa de respaldo. |

Todo trato se cierra por **WhatsApp**: la plataforma presenta la oferta y pone
en contacto, no participa en el pago ni en la entrega. Por eso tampoco hay
mensajería privada dentro del sitio.

## Decisiones de diseño

- **Primero el teléfono.** Toda la interfaz se diseñó para una pantalla de
  360 px y para usarse con el pulgar.
- **Sin emojis.** Toda la iconografía es SVG propio, en
  `src/components/icons.tsx`, más el paisaje del pueblo en
  `src/components/paisaje-mara.tsx`.
- **Colores del municipio.** El azul sale del propio logotipo (`#194a99`), con
  el verde de la bandera como acento. Tema claro y oscuro automáticos.
- **El teléfono es la identidad.** Se entra con el mismo número de WhatsApp que
  ya usa todo el mundo, sin coste de SMS (ver la nota más abajo).
- **Foto obligatoria.** Al registrarse hay que subir una foto: cuando dos
  personas quedan para cambiar dólares en efectivo, reconocer a la otra es
  parte de la seguridad del trato.
- **Identificador por miembro.** Cada persona recibe un correlativo irrepetible
  (`MC-00042`), reservado dentro de una transacción de Firestore.
- **Movimiento contenido.** Solo se animan `transform` y `opacity`, y todo se
  anula con `prefers-reduced-motion`.

## Cómo se publica

El sitio se exporta como HTML estático y lo sirve **GitHub Pages** desde la
raíz de `main`. Cada cambio en `main` dispara `.github/workflows/publicar.yml`,
que instala, compila, revisa tipos y estilo, copia el sitio a la raíz y hace el
commit. No hay que tocar ningún ajuste del repositorio.

Cada publicación anota en `.sitio-generado` qué entradas de primer nivel creó,
para que la siguiente borre exactamente esas. Los archivos del proyecto están
en una lista protegida que el script nunca toca.

Que no haya servidor tiene tres consecuencias, todas resueltas:

- **No hay rutas de API.** Las tasas del dólar se leen desde el navegador,
  probando dos fuentes públicas en orden y cayendo al respaldo manual de
  Firestore si ninguna responde.
- **El detalle de una publicación lee su id de la consulta**
  (`/publicacion/?id=...`): no se pueden pregenerar páginas para
  identificadores que aún no existen. Las salas del chat sí se generan una a
  una, porque son un conjunto cerrado.
- **Las rutas terminan en barra**, porque Pages busca el `index.html` de cada
  carpeta.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y rellenar los valores
npm run dev
```

`npm run build` genera el sitio en `out/`.

### Probar las reglas de seguridad

Las reglas de Firestore son la única frontera real de la plataforma: la
interfaz se puede saltar desde la consola del navegador, ellas no. Se prueban
contra el emulador de verdad, no contra una interpretación de ellas.

```bash
cd pruebas && npm install && npm run probar
```

Hacen falta Java 21 y salida a internet la primera vez, para descargar el
emulador. En CI las ejecuta `.github/workflows/reglas.yml` cada vez que alguien
toca `firestore.rules`.

Las 31 pruebas cubren lo que intentaría un atacante saltándose la interfaz:
publicar con el nombre y la foto de un vecino, regalarse el sello de
verificado, colarse en el tablón de divisas sin estar verificado, clavar un
anuncio en el primer puesto con una fecha futura, salvar un mensaje del borrado
a las 36 horas, nombrarse administrador o editar lo ajeno.

### Variables de entorno

| Variable | De dónde sale |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Consola de Firebase → Configuración del proyecto → Tus apps → SDK |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets (en modo **Unsigned**) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | El correo dueño del panel `/admin` |

Todas son públicas por diseño: viajan en el paquete del navegador. Por eso los
valores de producción están en `.env.production`, versionado a propósito para
que el despliegue no necesite configuración manual. Lo que protege los datos
son las reglas de `firestore.rules`, no el secreto de la clave. **Nunca poner
ahí una clave privada**: ni el API secret de Cloudinary, ni una credencial de
cuenta de servicio de Firebase.

### Configuración de Firebase

1. **Authentication** → activar el proveedor *Correo electrónico/contraseña*.
   Es lo que sostiene por dentro el inicio de sesión con teléfono.
2. **Firestore Database** → crear la base de datos y pegar `firestore.rules` en
   la pestaña *Reglas*.
3. **Firestore → TTL** → política sobre el campo `expiraEn` del grupo de
   colecciones `mensajes`. Es lo que borra el chat cada 36 horas.
4. **Firestore → TTL** → una segunda política sobre `venceEn` en
   `publicaciones`, si se quiere que el borrado lo haga Firestore. Mientras
   tanto, lo vencido deja de mostrarse igual.
5. Entrar a `/admin` con el correo de `NEXT_PUBLIC_ADMIN_EMAIL`, crear la
   cuenta y **verificar el correo**. Sin ese paso nadie puede administrar.

No hacen falta índices compuestos: las consultas usan solo igualdades y el
orden se aplica en el cliente. Si algún día el volumen crece de verdad, el
cambio es desplegar índices y devolver el `orderBy` a la consulta en
`src/lib/publicaciones.ts`.

### Sobre el inicio de sesión con teléfono

Firebase no ofrece "teléfono + contraseña" sin enviar un SMS, y cada SMS se
cobra (requiere plan Blaze). Como el pueblo ya se conoce por WhatsApp, el
número se traduce internamente a una dirección que el usuario nunca ve, y la
contraseña se valida contra ella. Resultado: registro instantáneo y sin coste.

La contrapartida es que no hay recuperación de contraseña por correo: hoy la
restablece un administrador. Si en algún momento interesa el código por SMS,
solo hay que sustituir `registrar` y `entrar` en `src/lib/auth.tsx`.

## Estructura

```
src/
  app/            Rutas (App Router)
  components/     Interfaz reutilizable, iconos SVG y el paisaje del pueblo
  lib/            Firebase, Cloudinary, modelo de datos y lógica de negocio
scripts/          Copia del sitio construido a la raíz para GitHub Pages
pruebas/          Pruebas de las reglas contra el emulador de Firestore
firestore.rules   Quién puede leer y escribir qué
```

## Pendientes antes de abrir al público

- [ ] **Confirmar los teléfonos de emergencia** de `src/lib/pueblo.ts` con
      Polimara, la alcaldía y los bomberos. Hoy son marcadores de posición y
      están señalados como tales en la propia portada.
- [ ] Comprobar en el navegador que alguna de las dos fuentes de tasas responde
      con CORS. Si no, cargar la tasa a mano desde `/admin`.
- [ ] Limitar el preset de Cloudinary a imágenes y a un tamaño máximo.
