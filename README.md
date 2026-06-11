# MDShare — Editor Markdown Colaborativo en Tiempo Real

Proyecto de portfolio full-stack basado en el blueprint de arquitectura:

| Capa | Tecnología |
|---|---|
| Frontend | Angular 19 (standalone components, signals) |
| Backend | Java 21 + Spring Boot 3.5 (WebSockets STOMP/SockJS) |
| Base de datos | Supabase (PostgreSQL) vía Spring Data JPA |
| Autenticación | Supabase Auth (SDK oficial JS, directo desde Angular) |

## Arquitectura de comunicación

```
Angular ──(SDK supabase-js)──────────────► Supabase Auth      (login / sesión)
Angular ──(HTTP /api/documentos)─────────► Spring Boot ─JPA─► PostgreSQL (carga inicial / CRUD)
Angular ──(STOMP /app/editor.cambio/X)──► Spring Boot
Angular ◄─(STOMP /topic/sala/X)────────── Spring Boot         (difusión en vivo, broker en memoria)
                                          Spring Boot ─cada 5 s─► PostgreSQL (persistencia diferida)
```

- Las pulsaciones de teclado **no** tocan la base de datos: Angular las agrupa con
  `debounceTime(150)` y las publica por STOMP. Spring Boot las retransmite de
  inmediato a todos los suscriptores de la sala (`/topic/sala/{salaCodigo}`).
- `DocumentoSyncService` guarda en memoria el último estado de cada documento y un
  scheduler lo persiste en Supabase cada 5 segundos (throttling de escrituras).
- Estrategia de fusión *last-write-wins* (documento completo). El transporte queda
  preparado para evolucionar a OT/CRDT (p. ej. Yjs) sin cambiar la arquitectura.
- La sala de edición usa el `id` del documento como `codigo_sala`. La tabla
  `salas_colaborativas` queda creada como punto de extensión (slugs amigables, salas inactivas…).

## Privacidad y colaboración

- Cada documento es **privado de su propietario** (`documentos.creado_por`).
- El propietario invita a colaboradores **por email** desde el botón "Compartir" del
  editor (tabla `documento_colaboradores`); puede revocar el acceso en cualquier momento.
- El backend filtra todos los endpoints: el lobby solo muestra documentos propios o
  compartidos contigo, y abrir un documento ajeno devuelve 403.
- La identidad viaja en las cabeceras `X-Usuario-Id` / `X-Usuario-Email`, que un
  interceptor HTTP de Angular rellena con la sesión de Supabase. Es privacidad
  funcional: el endurecimiento de producción (que las cabeceras no puedan falsearse)
  es validar el JWT de Supabase en Spring (ver roadmap).

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta [supabase/schema.sql](supabase/schema.sql) en el **SQL Editor** del dashboard.
3. En **Authentication > Providers** asegúrate de tener Email habilitado.
   (Para probar rápido, puedes desactivar "Confirm email".)
4. Apunta estos valores:
   - **Project Settings > API**: `Project URL` y `anon public key` (para Angular).
   - **Project Settings > Database > Connection string (Session pooler)**: host, usuario
     `postgres.<PROJECT_REF>` y contraseña (para Spring Boot).

### 2. Backend (`back/`)

Requiere **JDK 17+** (en esta máquina: `C:\Desarrollo\Java\jdk-21.0.7`; la carpeta
`jdk-21` tiene los permisos restringidos) y **Maven 3.6.3+**
(`C:\Desarrollo\apache-maven-3.9.9`). Ojo: el `JAVA_HOME` global apunta a Java 8.

```powershell
cd back
$env:JAVA_HOME = "C:\Desarrollo\Java\jdk-21.0.7"
$env:SUPABASE_DB_URL  = "jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres"
$env:SUPABASE_DB_USER = "postgres.<PROJECT_REF>"
$env:SUPABASE_DB_PASSWORD = "<password de la BBDD>"
& C:\Desarrollo\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

El backend arranca en `http://localhost:8080` (REST en `/api/**`, WebSocket en `/ws-collaborative`).

### 3. Frontend (`front/`)

1. Rellena `front/src/environments/environment.development.ts` con tu `supabaseUrl`
   y `supabaseAnonKey`.
2. Arranca el servidor de desarrollo:

```powershell
cd front
npm install
npm start
```

Abre `http://localhost:4200`, crea una cuenta, crea un documento y abre la misma URL
del editor en dos pestañas/navegadores para ver la sincronización en vivo.

## Estructura

```
back/   Spring Boot: WebSocketConfig, EditorWebSocketController (STOMP),
        DocumentoSyncService (persistencia diferida), API REST /api/documentos
front/  Angular: SupabaseService (auth), CollaborationSocketService (STOMP+SockJS),
        EditorComponent (debounce + cursor), MarkdownPreviewComponent (marked + DOMPurify)
supabase/schema.sql  Esquema de PostgreSQL (documentos, salas_colaborativas)
```

## Próximos pasos (roadmap del blueprint)

- Panel de presencia ("usuarios conectados") con eventos de conexión/desconexión STOMP.
- Validar el JWT de Supabase en Spring Boot (resource server + JWKS) para proteger
  `/api/**` y el handshake del WebSocket, sustituyendo las cabeceras `X-Usuario-*`.
- Salas con slug propio usando la tabla `salas_colaborativas`.
- Sustituir last-write-wins por parches/CRDT para edición concurrente carácter a carácter.
