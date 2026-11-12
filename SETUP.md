# E-Medicine v2 — instalación y verificación

Reconstrucción de [E-medicine de No Country](https://github.com/No-Country-simulation/c19-68-t-node-react).
Esta entrega conecta registro, login y turnos de pacientes y profesionales.

## Requisitos

- Node.js 22.14 o superior y npm.
- PostgreSQL 17 (o una base PostgreSQL compatible).
- Una base de desarrollo propia; no utilizar credenciales del historial del repositorio.

## Iniciar en desarrollo

1. En backend, ejecutar `npm ci` y copiar `.env.example` a `.env`.
2. Completar DATABASE_URL con la base propia y JWT_SECRET con un secreto nuevo.
   Generarlo con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
3. Ejecutar `npm run db:setup` en backend. Crea tablas faltantes y el índice único de correo,
   sin borrar ni alterar tablas existentes. Si ya hay correos duplicados ignorando mayúsculas,
   resolverlos antes de volver a ejecutar. Las migraciones antiguas incompletas no se utilizan.
4. Ejecutar `npm run dev` en backend (puerto 4700).
5. En frontend, ejecutar `npm ci` y copiar `.env.example` a `.env.local`.
6. Ejecutar `npm run dev` en frontend y abrir http://localhost:3000/auth/sign-up.

El frontend llama siempre a /api en su propio dominio. Next.js reenvía esas llamadas a API_URL
(variable de servidor, sin sufijo /api). Esto mantiene la cookie HttpOnly en el mismo dominio;
no se usa NEXT_PUBLIC_API_URL. FRONTEND_URL en el backend debe coincidir con el origen visible
del frontend. Admite varios orígenes exactos separados por comas.

## Recorrido para probar

1. Crear una cuenta de profesional, indicando especialidad, e iniciar sesión.
2. En **Disponibilidad**, habilitar días y franjas; guardar.
3. Cerrar sesión y crear una cuenta de paciente.
4. En **Reservar turno**, elegir profesional, fecha, horario y motivo.
5. La reserva se guarda como **Pendiente** y aparece en **Mis turnos** de ambos usuarios.
6. Iniciar sesión como profesional y abrir el turno para **Confirmar turno**.
7. Paciente y profesional pueden reprogramar un turno futuro. Vuelve a Pendiente.
8. Ambos pueden cancelar turnos pendientes o confirmados propios.
9. El profesional puede marcar como Atendido un turno confirmado a partir de su inicio.

Las consultas duran 30 minutos. Las fechas y horarios se interpretan en APPOINTMENT_TIME_ZONE
(por defecto America/Argentina/Buenos_Aires), visible en las pantallas. Las franjas semanales
se repiten cada semana. Cambiar disponibilidad no puede dejar reservas futuras fuera de horario.
Los bloqueos transaccionales de PostgreSQL evitan reservas superpuestas del médico o paciente,
incluso cuando llegan simultáneamente desde distintas instancias del backend.

## Verificaciones

En frontend:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Con ambos servidores encendidos: `npm run test:e2e`.
  Instalar Chromium de Playwright con `npx playwright install chromium` si no está disponible.
  E2E_BASE_URL permite cambiar http://localhost:3000. Las pruebas usan cuentas ficticias únicas.

En backend:

- Definir TEST_DATABASE_URL con una base **local** cuyo nombre termine en `_test`.
- Ejecutar `npm test`. Cada ejecución crea y elimina únicamente su esquema aleatorio.
- Las pruebas cubren autenticación, permisos, persistencia, disponibilidad, reserva concurrente,
  reprogramación, cancelación, atención y logout. No usan Supabase ni datos reales.

## Despliegue

- Vercel usa dos proyectos del mismo repositorio: `e-medicinev2`, con raíz `frontend`,
  y `e-medicinev2-backend`, con raíz `backend`. Ambos usan Node.js 22.
- Backend: DATABASE_URL, JWT_SECRET nuevo, NODE_ENV=production, FRONTEND_URL y APPOINTMENT_TIME_ZONE.
- Configurar DB_SSL=true si el proveedor lo exige. Mantener verificación de certificados.
  DB_SSL_REJECT_UNAUTHORIZED=false sólo es una excepción explícita para un entorno controlado.
- Ejecutar db:setup una vez con acceso a la base correspondiente. Revisar el esquema si ya existe.
- Frontend: API_URL con el origen HTTPS del backend y reconstruir el proyecto.
- Los secretos antiguos publicados en Git **deben rotarse**; quitarlos de la documentación no los revoca.
- El limitador de intentos actual es por proceso; un despliegue con varias instancias requiere
  un almacenamiento compartido del limitador antes de abrirlo a tráfico público amplio.
- Los previews deben usar una base separada y sus propias variables. No asignarles la conexión
  de producción. API_URL debe apuntar al backend de ese preview y FRONTEND_URL permitir su
  origen exacto. Mantener la protección de Vercel y verificar el acceso entre ambos proyectos.
- Cambiar una variable de Vercel sólo afecta nuevos despliegues. Para revocar un JWT anterior
  hay que publicar el backend con el nuevo secreto y retirar los despliegues anteriores que
  aún lo utilicen. Rotar la contraseña de PostgreSQL en Supabase revoca la conexión anterior.
- Antes de publicar: revisar el esquema existente, ejecutar db:setup con la conexión nueva,
  probar registro/login y el ciclo completo de un turno en el entorno correspondiente.

## Revisión en GitHub

El workflow `.github/workflows/verify.yml` comprueba cambios de la rama principal y las ramas
`codex/**`. Usa una base PostgreSQL descartable, sin credenciales externas, para ejecutar las
pruebas del backend; después valida lint, compilación, tipos y el recorrido completo en Chromium.
La compilación y las pruebas locales no sustituyen la verificación del despliegue conectado a
su base de datos.

## Alcance

Este flujo no incluye pagos, videollamadas, recuperación de contraseña, verificación por correo
ni validación de matrícula profesional. No muestra consultas clínicas ficticias en los paneles.
Las cuentas pueden ingresar después del registro; confirmed permanece false porque no hay
verificación de correo. La rotación de secretos y la publicación en producción se gestionan por separado.
