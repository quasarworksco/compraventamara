# Mara Comercio

La plataforma de comercio de **San Rafael del Moján**, capital del municipio
Mara (Zulia, Venezuela). Su meta es que en el pueblo no haya que preguntar
dónde se consigue algo: si existe, está aquí.

## Qué hay dentro

| Sección | Qué resuelve |
| --- | --- |
| **Portada** | La entrada al pueblo: bienvenida, tasas del dólar del día y los teléfonos de Polimara y atención al ciudadano. |
| **Marketplace** | Vehículos, celulares, artículos y bienes. Los anuncios viven 30 días, avisan antes de vencer y se pueden prorrogar. |
| **Negocios** | Directorio del pueblo por rubro: desde un odontólogo hasta una cauchera. Las fichas no vencen. |
| **Dólares** | Tablón de compra y venta de efectivo con la foto, el nombre completo y el teléfono de quien publica. Cada oferta vive 6 horas y se renueva con un toque; una oferta viva por persona; junto a cada tasa se ve cuánto se aparta del BCV y de Binance. |
| **Rifas** | Qué se rifa, precio del número, con qué lotería juega y el día del sorteo. |
| **Mototaxis** | Quién está rodando, a qué tarifa y qué sectores cubre. |
| **Chat en vivo** | Cuatro salas en tiempo real. Los mensajes se borran solos a las 36 horas. |

Todo trato se cierra por **WhatsApp**: la plataforma presenta la oferta y pone
en contacto, no participa en el pago ni en la entrega.

## Decisiones de diseño

- **Primero el teléfono.** Toda la interfaz se diseñó para una pantalla de
  360 px y para usarse con el pulgar. Lo demás es consecuencia.
- **Sin emojis.** Toda la iconografía es SVG propio, en
  `src/components/icons.tsx`. Se ve igual en cualquier teléfono.
- **Colores del municipio.** Azules y blancos sobre negros, con el verde de la
  bandera solo como acento. Tema claro y oscuro automáticos.
- **El teléfono es la identidad.** Se entra con el mismo número de WhatsApp que
  ya usa todo el mundo, sin coste de SMS (ver la nota más abajo).
- **Foto obligatoria.** Al registrarse hay que subir una foto: cuando dos
  personas quedan para cambiar dólares en efectivo, reconocer a la otra es parte
  de la seguridad del trato.
- **Identificador por miembro.** Cada persona recibe un correlativo irrepetible
  (`MC-00042`), reservado dentro de una transacción de Firestore.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellenar los valores
npm run dev
```

### Variables de entorno

| Variable | De dónde sale |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Consola de Firebase → Configuración del proyecto → Tus apps → SDK |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets (en modo **Unsigned**) |

Todas son públicas por diseño: viajan en el paquete del navegador. Lo que
protege los datos son las reglas de Firestore, no el secreto de la clave.

### Configuración de Firebase

1. **Authentication** → activar el proveedor *Correo electrónico/contraseña*.
   Es lo que sostiene por dentro el inicio de sesión con teléfono.
2. **Firestore** → crear la base de datos y desplegar las reglas:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
3. **Firestore → TTL** → crear una política sobre el campo `expiraEn` del grupo
   de colecciones `mensajes`. Es lo que borra el chat cada 36 horas.
4. **Firestore → TTL** → crear una segunda política sobre `venceEn` en
   `publicaciones` si se quiere que el borrado a los 30 días lo haga Firestore.
   Mientras tanto, las publicaciones vencidas dejan de mostrarse igual.
5. Para nombrar a un administrador, poner `rol: "admin"` a mano en su documento
   de `miembros`. Los admins verifican miembros y cargan la tasa de respaldo.

### Sobre el inicio de sesión con teléfono

Firebase no ofrece "teléfono + contraseña" sin enviar un SMS, y cada SMS se
cobra (requiere plan Blaze). Como el grupo ya se conoce por WhatsApp, el número
se traduce internamente a una dirección de correo que el usuario nunca ve, y la
contraseña se valida contra ella. Resultado: registro instantáneo y sin coste.

La contrapartida es que no hay recuperación de contraseña por correo: hoy la
restablece un administrador. Si en algún momento interesa el código por SMS,
solo hay que sustituir `registrar` y `entrar` en `src/lib/auth.tsx`.

## Estructura

```
src/
  app/            Rutas (App Router)
    api/tasas/    Tasas BCV y Binance, cacheadas 30 min en el servidor
  components/     Interfaz reutilizable, incluido el set de iconos SVG
  lib/            Firebase, Cloudinary, modelo de datos y lógica de negocio
firestore.rules   Quién puede leer y escribir qué
```

## Pendientes antes de abrir al público

- [ ] **Confirmar los teléfonos de emergencia** de `src/lib/pueblo.ts` con
      Polimara, la alcaldía y los bomberos. Hoy son marcadores de posición y
      están señalados como tales en la propia portada.
- [ ] Verificar que la fuente de tasas responde en producción y, si no, cargar
      el respaldo manual desde una cuenta de administrador.
- [ ] Revisar el preset de Cloudinary: debe estar en modo *Unsigned* y conviene
      limitarlo a imágenes y a un tamaño máximo.
