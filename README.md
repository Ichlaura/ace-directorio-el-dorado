# ACE · Directorio de Emprendimientos — Capítulo El Dorado

Proyecto Vite + React + TypeScript basado en la **primera propuesta aprobada**. Incluye directorio público, formulario de registro, panel de administración y conexión a Supabase.

## Instalar y probar

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Editar `.env` con **Project URL** y **anon/public key** de Supabase. No usar nunca `service_role` en Vite. Para compilar: `npm run build`.

## Crear la base de datos

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor** y ejecutar `supabase_schema.sql` (una sola vez en una base nueva).
3. En **Authentication > Users**, crear la cuenta del superadministrador. Confirmar correo si aplica.
4. En SQL Editor ejecutar, sustituyendo el correo:
   ```sql
   insert into public.admin_users(user_id,role)
   select id,'superadmin' from auth.users where email='TU_EMAIL_REAL'
   on conflict(user_id) do update set role='superadmin';
   ```
5. Para añadir administradores, primero crearles cuentas en Authentication > Users y luego usar la sección **Administradores** del panel.
6. En **Storage**, verificar el bucket `business-logos` (creado por SQL). Los archivos se almacenan como públicos. No subir documentos privados.

## Subir a Vercel

Subir el contenido de esta carpeta a GitHub. En Vercel seleccionar framework **Vite** o **Other**, Build Command `npm run build`, Output Directory `dist`. Configurar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Project Settings > Environment Variables y volver a desplegar.

## Rutas

- `/#/directory` no se utiliza; la aplicación navega internamente a `/#/directory` desde el botón **Directorio** (la interfaz gestiona el estado en sesión).
- `/#/register`: formulario público.
- `/#/admin`: acceso privado de administradores.
- Los enlaces individuales de negocios usan `/#/negocio/ID`.

## Migración del Excel de Google Forms

El archivo **separado** `ACE_Importacion_Privada.sql` contiene 23 registros del Excel recibido. **Incluye información privada**, por lo que **NO debe publicarse en GitHub ni subirse a la carpeta public/**. Ejecutarlo en Supabase SQL Editor después del esquema. Los registros quedan `pending`.

El formulario nuevo sustituye al de Google Forms para futuras inscripciones. Los negocios existentes se migran una sola vez desde el Excel. El formulario externo no se sincroniza automáticamente.

## Seguridad y alcance

- Los visitantes solo pueden consultar registros `approved`.
- El formulario público solo crea registros `pending`; no puede aprobarlos.
- Las respuestas privadas y nombres de responsables no se exponen en el directorio público.
- El panel exige autenticación y rol `admin`/`superadmin`.
- Los usuarios con sesión iniciada pero sin rol administrativo no pueden consultar el panel.
- Este MVP no tiene antispam ni verificación de consentimiento avanzada. Antes de uso público real, añadir CAPTCHA/Turnstile, política de privacidad y moderación de imágenes.
- No sustituye un sistema de gestión documental ni tiene historial de auditoría. Para producción conviene registrar aprobaciones, cambios y usuarios responsables.
