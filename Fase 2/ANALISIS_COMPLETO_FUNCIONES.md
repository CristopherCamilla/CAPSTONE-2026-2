# Análisis Completo de Funciones - Fase 2
## Backend y Frontend - Documentación Detallada

---

## 📋 ÍNDICE

1. [Backend - Estructura y Funciones](#backend)
2. [Frontend - Estructura y Funciones](#frontend)
3. [Flujos de Comunicación](#flujos)
4. [Mapa de Llamadas de Funciones](#mapa-llamadas)

---

# 🔧 BACKEND

## Estructura General

```
backend/
├── src/
│   ├── http/              # Capa HTTP (API REST)
│   │   ├── index.ts       # Punto de entrada del servidor
│   │   ├── routes/        # Definición de rutas
│   │   └── schemas/       # Validación con Zod
│   ├── infra/             # Capa de Infraestructura
│   │   ├── db.ts          # Pool de conexiones MySQL
│   │   ├── env.ts         # Variables de entorno
│   │   └── *Repo.ts       # Repositorios (acceso a BD)
│   └── types/             # Tipos TypeScript
```

---

## 📁 BACKEND - Archivos y Funciones

### 1. `src/http/index.ts` - Servidor Principal

**Función**: Punto de entrada del backend Fastify

**Funciones principales**:

#### `main()` - Función asíncrona principal
- **Llamada**: Se ejecuta automáticamente al iniciar el servidor (línea 64-70)
- **Qué hace**:
  1. Crea instancia de Fastify con logger
  2. Configura proxy trust para producción
  3. Registra plugins:
     - `@fastify/cors`: Permite peticiones desde frontend
     - `@fastify/cookie`: Manejo de cookies HTTP-only
     - `@fastify/jwt`: Autenticación JWT
  4. Crea decorador `authenticate` para proteger rutas
  5. Define endpoint `/api/health` para health checks
  6. Registra todas las rutas de la API
  7. Inicia servidor en puerto 3001

**Flujo de ejecución**:
```
Inicio del servidor
  → main()
    → Fastify.create()
    → app.register(cors)
    → app.register(cookie)
    → app.register(jwt)
    → app.decorate('authenticate')
    → app.register(authRoutes)
    → app.register(usuariosRoutes)
    → ... (todas las rutas)
    → app.listen(3001)
```

**Llamado desde**: 
- Inicio del proceso Node.js (línea 64-70)
- Script `npm run dev` o `npm start`

---

### 2. `src/infra/env.ts` - Variables de Entorno

**Función**: Validación y exportación de variables de entorno

**Funciones**:

#### `envSchema.parse(process.env)` - Validación con Zod
- **Llamada**: Se ejecuta al importar el módulo (línea 17)
- **Qué hace**:
  - Valida que existan todas las variables requeridas
  - Convierte tipos (PORT, DB_PORT a números)
  - Aplica valores por defecto
  - Lanza error si falta alguna variable crítica

**Variables validadas**:
- `NODE_ENV`: 'development' | 'production' | 'test'
- `PORT`: Puerto del servidor (default: 3001)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: Configuración MySQL
- `JWT_SECRET`: Secreto para firmar tokens (mínimo 16 caracteres)

**Llamado desde**: 
- `src/http/index.ts` (línea 5)
- `src/infra/db.ts` (línea 2)
- Todos los archivos que necesitan configuración

---

### 3. `src/infra/db.ts` - Pool de Conexiones MySQL

**Función**: Crea y exporta pool de conexiones a MySQL

**Funciones**:

#### `createPool()` - Crea pool de conexiones
- **Llamada**: Se ejecuta al importar el módulo
- **Qué hace**:
  - Crea pool de conexiones MySQL usando `mysql2/promise`
  - Configura límite de 10 conexiones simultáneas
  - Habilita `decimalNumbers` y `dateStrings` para mejor manejo de tipos

**Configuración**:
```typescript
{
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true
}
```

**Llamado desde**: 
- Todos los repositorios (`*Repo.ts`)
- Se importa como: `import { pool } from './db.js'`

---

### 4. `src/http/routes/auth.routes.ts` - Autenticación

**Función**: Maneja autenticación de usuarios

#### `POST /api/auth/login` (línea 17-67)
- **Llamada**: Frontend → `auth.login()` → `http.post('/api/auth/login')`
- **Qué hace**:
  1. Valida email y password con Zod (`LoginBody`)
  2. Normaliza email (trim, lowercase)
  3. Busca usuario por email: `usuariosRepo.findByEmail()`
  4. Verifica estado del usuario (debe estar activo)
  5. Compara password con bcrypt: `bcrypt.compare()`
  6. Genera JWT: `app.jwt.sign()`
  7. Guarda token en cookie HTTP-only: `reply.setCookie('auth', token)`
  8. Retorna datos del usuario (sin password)

**Flujo**:
```
Frontend: auth.login(email, password)
  → POST /api/auth/login
    → Valida con Zod
    → usuariosRepo.findByEmail(email)
      → MySQL: SELECT * FROM usuarios WHERE email = ?
    → bcrypt.compare(password, hash)
    → jwt.sign({ sub, email, role })
    → setCookie('auth', token)
    → Response: { user: {...} }
```

#### `GET /api/auth/me` (línea 70-75)
- **Llamada**: Frontend → `http.get('/api/auth/me')` (con cookie)
- **Protección**: Requiere `app.authenticate` (preHandler)
- **Qué hace**:
  1. Verifica token JWT desde cookie
  2. Extrae `sub` (user ID) del token
  3. Busca usuario: `usuariosRepo.findSafeById()`
  4. Retorna datos del usuario (sin password)

**Llamado desde**: 
- Frontend puede llamarlo directamente (actualmente no se usa)

#### `GET /api/auth/session` (línea 78-99)
- **Llamada**: Frontend → `auth.me()` → `http.get('/api/auth/session')`
- **Protección**: Ninguna (siempre retorna 200)
- **Qué hace**:
  1. Lee cookie 'auth' del request
  2. Si no hay cookie → retorna `{ user: null }`
  3. Si hay cookie:
     - Verifica JWT: `app.jwt.verify(token)`
     - Busca usuario: `usuariosRepo.findSafeById()`
     - Retorna `{ user: {...} }` o `{ user: null }`
  4. **Nunca lanza error** (siempre 200)

**Llamado desde**: 
- `frontend/stores/auth.ts` → `me()` (línea 53-62)
- `frontend/router/index.ts` → `beforeEach` (línea 72)

#### `POST /api/auth/logout` (línea 102-105)
- **Llamada**: Frontend → `auth.logout()` → `http.post('/api/auth/logout')`
- **Qué hace**:
  1. Limpia cookie 'auth': `reply.clearCookie('auth')`
  2. Retorna `{ ok: true }`

**Llamado desde**: 
- `frontend/stores/auth.ts` → `logout()` (línea 63-66)
- `frontend/components/NavBar.vue` → `onLogout()` (línea 40-47)

---

### 5. `src/http/routes/usuarios.routes.ts` - Gestión de Usuarios

**Función**: CRUD completo de usuarios

#### `GET /api/usuarios` (línea 7-22)
- **Llamada**: Frontend → `usuariosService.list()` → `http.get('/api/usuarios')`
- **Qué hace**:
  1. Parsea query params: `page`, `pageSize`, `search`
  2. Llama: `usuariosRepo.list({ page, pageSize, search })`
  3. Retorna: `{ items: Usuario[], page, pageSize, total }`

**Llamado desde**: 
- `frontend/services/usuarios.ts` → `list()` (línea 23-27)
- `frontend/stores/usuarios.ts` → `fetch()` (línea 17-30)

#### `GET /api/usuarios/:id` (línea 24-31)
- **Llamada**: Frontend → `usuariosService.get(id)` → `http.get('/api/usuarios/:id')`
- **Qué hace**:
  1. Extrae ID de params
  2. Busca: `usuariosRepo.getById(id)`
  3. Elimina password del resultado
  4. Retorna usuario o 404

**Llamado desde**: 
- `frontend/services/usuarios.ts` → `get()` (línea 29-33)

#### `POST /api/usuarios` (línea 33-40)
- **Llamada**: Frontend → `usuariosService.create()` → `http.post('/api/usuarios')`
- **Qué hace**:
  1. Valida datos con `UsuarioCreateSchema` (Zod)
  2. Hashea password: `bcrypt.hash(password, 10)`
  3. Crea usuario: `usuariosRepo.create({ ...data, password: hash })`
  4. Retorna usuario creado (sin password) o 400 si inválido

**Llamado desde**: 
- `frontend/services/usuarios.ts` → `create()` (línea 35-39)
- `frontend/components/UsuarioModal.vue` → `handleSubmit()` (línea 180-195)
- `frontend/stores/usuarios.ts` → `create()` (línea 31-34)

#### `PUT /api/usuarios/:id` (línea 42-52)
- **Llamada**: Frontend → `usuariosService.update()` → `http.put('/api/usuarios/:id')`
- **Qué hace**:
  1. Valida datos con `UsuarioUpdateSchema` (Zod)
  2. Si hay password → lo hashea
  3. Actualiza: `usuariosRepo.update(id, data)`
  4. Retorna usuario actualizado (sin password) o 404

**Llamado desde**: 
- `frontend/services/usuarios.ts` → `update()` (línea 41-45)
- `frontend/stores/usuarios.ts` → `update()` (línea 35-38)

#### `DELETE /api/usuarios/:id` (línea 54-57)
- **Llamada**: Frontend → `usuariosService.remove()` → `http.delete('/api/usuarios/:id')`
- **Qué hace**:
  1. Elimina: `usuariosRepo.remove(id)`
  2. Retorna: `{ ok: true }`

**Llamado desde**: 
- `frontend/services/usuarios.ts` → `remove()` (línea 47-51)
- `frontend/stores/usuarios.ts` → `remove()` (línea 39-42)

---

### 6. `src/infra/usuariosRepo.ts` - Repositorio de Usuarios

**Función**: Acceso a base de datos para usuarios

#### `list(opts)` (línea 19-49)
- **Llamada**: `usuarios.routes.ts` → `GET /api/usuarios`
- **Qué hace**:
  1. Calcula paginación: `offset = (page - 1) * pageSize`
  2. Si hay `search` → agrega WHERE con LIKE en nombre, apellido, usuario, email
  3. Ejecuta: `SELECT * FROM usuarios WHERE ... LIMIT ? OFFSET ?`
  4. Ejecuta: `SELECT COUNT(*) FROM usuarios WHERE ...`
  5. Retorna: `{ items, page, pageSize, total }`

**Query SQL**:
```sql
SELECT id, nombre, apellido, usuario, email, rol, estado, 
       fecha_registro, ultima_conexion
FROM usuarios
WHERE (nombre LIKE ? OR apellido LIKE ? OR usuario LIKE ? OR email LIKE ?)
ORDER BY id DESC
LIMIT ? OFFSET ?
```

#### `getById(id)` (línea 51-58)
- **Llamada**: `usuarios.routes.ts` → `GET /api/usuarios/:id`
- **Qué hace**:
  1. Ejecuta: `SELECT * FROM usuarios WHERE id = ?`
  2. Retorna usuario o `null`

#### `create(data)` (línea 60-70)
- **Llamada**: `usuarios.routes.ts` → `POST /api/usuarios`
- **Qué hace**:
  1. Ejecuta: `INSERT INTO usuarios (nombre, apellido, usuario, email, password, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`
  2. Obtiene `insertId`
  3. Llama `getById(insertId)` para retornar usuario completo

#### `update(id, data)` (línea 72-84)
- **Llamada**: `usuarios.routes.ts` → `PUT /api/usuarios/:id`
- **Qué hace**:
  1. Construye SET dinámicamente según campos enviados
  2. Ejecuta: `UPDATE usuarios SET ... WHERE id = ?`
  3. Llama `getById(id)` para retornar usuario actualizado

#### `remove(id)` (línea 86-89)
- **Llamada**: `usuarios.routes.ts` → `DELETE /api/usuarios/:id`
- **Qué hace**:
  1. Ejecuta: `DELETE FROM usuarios WHERE id = ?`
  2. Retorna: `{ ok: true }`

#### `findByEmail(email)` (línea 91-99)
- **Llamada**: `auth.routes.ts` → `POST /api/auth/login`
- **Qué hace**:
  1. Ejecuta: `SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1`
  2. Retorna usuario o `null`
  3. **Incluye password** (necesario para comparar)

#### `findSafeById(id)` (línea 101-106)
- **Llamada**: `auth.routes.ts` → `GET /api/auth/me` y `GET /api/auth/session`
- **Qué hace**:
  1. Llama `getById(id)`
  2. Elimina password del resultado
  3. Retorna usuario sin password o `null`

---

### 7. `src/http/routes/reportes.routes.ts` - Reportes

**Función**: Endpoints para reportes complejos

#### `GET /api/reportes` (línea 6-30)
- **Llamada**: Frontend → `reportesService.listarReportes()` → `http.get('/api/reportes')`
- **Qué hace**:
  1. Parsea query params: `limit`, `offset`, `codigo`, `genero`, `categoria`, `subcategoria`
  2. Construye objeto `ReportFilters`
  3. Llama: `reportesRepo.list(limit, offset, filters)`
  4. Retorna: `{ items: ReportRow[], total: number }`

**Llamado desde**: 
- `frontend/services/reportes.ts` → `listarReportes()` (línea 29-45)
- `frontend/views/report/ReportProductosSub.vue` → `cargar()` (línea 52-89)

#### `GET /api/reportes/filtros` (línea 34-42)
- **Llamada**: Frontend → `reportesService.obtenerOpcionesFiltros()` → `http.get('/api/reportes/filtros')`
- **Qué hace**:
  1. Llama: `reportesRepo.getFiltros()`
  2. Retorna: `{ generos: string[], categorias: string[], subcategorias: string[] }`

**Llamado desde**: 
- `frontend/services/reportes.ts` → `obtenerOpcionesFiltros()` (línea 55-58)
- `frontend/views/report/ReportProductosSub.vue` → `onMounted()` (línea 100-110)

---

### 8. `src/infra/reportesRepo.ts` - Repositorio de Reportes

**Función**: Consultas complejas con JOINs múltiples

#### `list(limit, offset, filters)` (línea 41-115)
- **Llamada**: `reportes.routes.ts` → `GET /api/reportes`
- **Qué hace**:
  1. Construye WHERE dinámicamente según filtros
  2. Ejecuta query complejo con 8 JOINs:
     - `articulos` (tabla principal)
     - `stock_interco` (LEFT JOIN)
     - `stock_aristo` (LEFT JOIN)
     - `proyeccion_ventas_total` (LEFT JOIN)
     - `genero` (LEFT JOIN)
     - `categoria` (LEFT JOIN)
     - `sub_categoria` (LEFT JOIN)
     - `color` (LEFT JOIN)
  3. Calcula `stock_actual = COALESCE(si.stock,0) + COALESCE(sa.stock,0)`
  4. Solo muestra artículos con stock > 0
  5. Ejecuta COUNT para total
  6. Retorna: `{ items, total }`

**Query SQL** (simplificado):
```sql
SELECT
  ROW_NUMBER() OVER (...) AS row_id,
  a.imagen, a.codigo,
  c.nombre_color,
  g.genero, ca.categoria, sca.subcategoria,
  (COALESCE(si.stock,0) + COALESCE(sa.stock,0)) AS stock_actual,
  COALESCE(p.articulos_en_linea, 0) AS articulos_en_linea,
  COALESCE(p.venta_prom_6m_estimada, 0) AS venta_prom_6m_estimada,
  COALESCE(p.venta_prom_x_articulo_estimada, 0) AS venta_prom_x_articulo_estimada
FROM articulos a
LEFT JOIN stock_interco si ON a.codigo_color = si.codigo_color
LEFT JOIN stock_aristo sa ON a.codigo_color = sa.codigo_color
LEFT JOIN proyeccion_ventas_total p ON a.id_linea = p.id_linea
LEFT JOIN genero g ON a.genero = g.cod_genero
LEFT JOIN categoria ca ON a.categoria = ca.cod_categoria
LEFT JOIN sub_categoria sca ON a.sub_categoria = sca.cod_subcategoria
LEFT JOIN color c ON a.color = c.color
WHERE (COALESCE(si.stock,0) + COALESCE(sa.stock,0)) > 0
  AND (filtros aplicados)
ORDER BY a.codigo
LIMIT ? OFFSET ?
```

#### `getFiltros()` (línea 117-133)
- **Llamada**: `reportes.routes.ts` → `GET /api/reportes/filtros`
- **Qué hace**:
  1. Ejecuta 3 queries:
     - `SELECT DISTINCT genero FROM genero ORDER BY genero`
     - `SELECT DISTINCT categoria FROM categoria ORDER BY categoria`
     - `SELECT DISTINCT subcategoria FROM sub_categoria ORDER BY subcategoria`
  2. Retorna: `{ generos: string[], categorias: string[], subcategorias: string[] }`

---

### 9. Otras Rutas (Resumen)

#### `articulos.routes.ts`
- `GET /api/articulos` - Lista con filtros y paginación
- `GET /api/articulos/:id` - Obtiene uno
- `POST /api/articulos` - Crea
- `PUT /api/articulos/:id` - Actualiza
- `DELETE /api/articulos/:id` - Elimina

#### `categorias.routes.ts`
- `GET /api/categorias` - Lista todas
- `GET /api/categorias/:id` - Obtiene una
- `POST /api/categorias` - Crea
- `PUT /api/categorias/:id` - Actualiza
- `DELETE /api/categorias/:id` - Elimina

#### `stock.routes.ts`
- `GET /api/stock/aristo` - Lista stock Aristo
- `PUT /api/stock/aristo/:id` - Actualiza stock Aristo
- `GET /api/stock/interco` - Lista stock Interco
- `PUT /api/stock/interco/:id` - Actualiza stock Interco

#### `proyeccionVentas.routes.ts`
- `GET /api/proyeccion_ventas_total` - Lista todas
- `GET /api/proyeccion_ventas_total/:id` - Obtiene una
- `POST /api/proyeccion_ventas_total` - Crea
- `PUT /api/proyeccion_ventas_total/:id` - Actualiza
- `DELETE /api/proyeccion_ventas_total/:id` - Elimina

---

# 🎨 FRONTEND

## Estructura General

```
frontend/arrow/
├── src/
│   ├── main.ts            # Punto de entrada
│   ├── App.vue            # Componente raíz
│   ├── router/            # Vue Router
│   ├── stores/            # Pinia stores
│   ├── services/          # Servicios API
│   ├── lib/               # Utilidades (http, api)
│   ├── components/        # Componentes reutilizables
│   ├── views/             # Vistas/páginas
│   └── utils/             # Utilidades (consoleFilter)
```

---

## 📁 FRONTEND - Archivos y Funciones

### 1. `src/main.ts` - Punto de Entrada

**Función**: Inicializa la aplicación Vue

**Flujo de ejecución**:

1. **Importa filtro de consola** (línea 6)
   - `import './utils/consoleFilter'`
   - Se ejecuta inmediatamente (filtra errores de Power BI)

2. **Configura tema** (línea 15-17)
   - Lee `localStorage.getItem('theme')`
   - O usa preferencia del sistema
   - Aplica: `document.documentElement.setAttribute('data-theme', ...)`

3. **Crea app Vue** (línea 19)
   - `createApp(App)`

4. **Registra plugins** (línea 22-24)
   - `app.use(pinia)` - Estado global
   - `app.use(router)` - Navegación
   - `app.use(PrimeVue, { theme: Aura })` - UI components

5. **Hidrata sesión** (línea 27-30)
   - `useAuth(pinia).me()` - Verifica cookie de sesión
   - Espera a que termine (`.finally()`)
   - Monta app: `app.mount('#app')`

**Llamado desde**: 
- Vite al cargar `index.html` → ejecuta `main.ts`

---

### 2. `src/App.vue` - Componente Raíz

**Función**: Layout principal de la aplicación

**Estructura**:
```vue
<template>
  <div class="app">
    <NavBar />           <!-- Header con navegación -->
    <main class="content">
      <router-view />    <!-- Vistas dinámicas -->
    </main>
    <AppFooter />        <!-- Footer -->
  </div>
</template>
```

**Componentes usados**:
- `NavBar` - Navegación superior
- `AppFooter` - Pie de página
- `<router-view>` - Renderiza la vista actual según ruta

**Llamado desde**: 
- `main.ts` → `createApp(App)` (línea 19)

---

### 3. `src/router/index.ts` - Router y Guards

**Función**: Define rutas y protege con autenticación

#### `createRouter()` (línea 42-45)
- **Llamada**: Se ejecuta al importar el módulo
- **Qué hace**: Crea instancia de Vue Router con rutas definidas

**Rutas definidas** (línea 6-40):
- `/login` → `LoginView` (solo para no autenticados)
- `/report` → `ReportView` (requiere auth)
  - `/report/productos` → `ReportProductosSub`
  - `/report/resumen` → `ResumenSub`
- `/*` → `NotFoundView` (404)

#### `router.onError()` (línea 47-57)
- **Llamada**: Automática cuando hay error cargando un chunk
- **Qué hace**: 
  - Detecta errores de carga de módulos
  - Recarga la página automáticamente
  - Útil para actualizaciones en producción

#### `router.beforeEach()` (línea 61-89) - Guard Global
- **Llamada**: Se ejecuta antes de cada navegación
- **Qué hace**:
  1. Normaliza rutas a lowercase (línea 65-67)
  2. Hidrata sesión una vez (línea 70-73):
     - `bootstrapped = false` → llama `auth.me()`
     - `bootstrapped = true` → no vuelve a llamar
  3. Protege rutas privadas (línea 78-81):
     - Si `requiresAuth && !isAuth` → redirige a `/login`
  4. Bloquea login si ya hay sesión (línea 84-86):
     - Si `guestOnly && isAuth` → redirige a `/report`

**Flujo de navegación**:
```
Usuario navega a /report/productos
  → router.beforeEach()
    → Normaliza ruta
    → Si !bootstrapped: auth.me()
      → GET /api/auth/session
        → Verifica cookie
        → auth.user = data.user o null
    → Verifica isAuth
    → Si requiresAuth && !isAuth: redirige a /login
    → Si todo OK: permite navegación
```

**Llamado desde**: 
- Vue Router automáticamente en cada navegación
- `main.ts` → `app.use(router)` (línea 23)

---

### 4. `src/stores/auth.ts` - Store de Autenticación

**Función**: Maneja estado y acciones de autenticación

**Estado** (línea 18-23):
```typescript
{
  user: User | null,        // Usuario actual
  loading: boolean,         // Estado de carga
  error: string,            // Mensaje de error
  returnUrl: string | null  // URL para redirigir después de login
}
```

**Getters** (línea 24-26):
- `isAuthenticated`: `!!user` - Indica si hay sesión activa

#### `login(email, password)` (línea 28-52)
- **Llamada**: 
  - `LoginView.vue` → `onSubmit()` → `auth.login()` (línea 26)
- **Qué hace**:
  1. Inicia loading (mínimo 1.5s para UX)
  2. Llama: `http.post('/api/auth/login', { email, password })`
  3. Si éxito: `this.user = data.user`
  4. Si error: `this.error = 'Credenciales inválidas'`
  5. Retorna `true` o `false`

**Flujo**:
```
LoginView.onSubmit()
  → auth.login(email, password)
    → http.post('/api/auth/login')
      → Backend: POST /api/auth/login
        → Valida credenciales
        → Genera JWT
        → Set cookie 'auth'
        → Response: { user }
    → auth.user = data.user
    → return true
  → router.replace('/report/resumen')
```

#### `me()` (línea 53-62)
- **Llamada**: 
  - `main.ts` → al iniciar app (línea 28)
  - `router/index.ts` → `beforeEach` (línea 72)
- **Qué hace**:
  1. Llama: `http.get('/api/auth/session', { validateStatus: () => true })`
  2. Si hay sesión: `this.user = data.user`
  3. Si no hay: `this.user = null`
  4. **Nunca lanza error** (siempre éxito)

**Flujo**:
```
App inicia / Navegación
  → auth.me()
    → http.get('/api/auth/session')
      → Backend: GET /api/auth/session
        → Lee cookie 'auth'
        → Verifica JWT
        → Response: { user: {...} | null }
    → auth.user = data.user o null
```

#### `logout()` (línea 63-66)
- **Llamada**: 
  - `NavBar.vue` → `onLogout()` → `auth.logout()` (línea 42)
- **Qué hace**:
  1. Llama: `http.post('/api/auth/logout')`
  2. Limpia estado: `this.user = null`

**Flujo**:
```
NavBar.onLogout()
  → auth.logout()
    → http.post('/api/auth/logout')
      → Backend: POST /api/auth/logout
        → clearCookie('auth')
    → auth.user = null
  → router.push('/login')
```

---

### 5. `src/lib/http.ts` - Cliente HTTP

**Función**: Instancia Axios configurada

**Configuración** (línea 6-11):
```typescript
{
  baseURL: '/' (o VITE_API_BASE),
  timeout: 20000,
  withCredentials: true,  // Envía cookies
  headers: { 'Content-Type': 'application/json' }
}
```

**Interceptores**:

#### Request Interceptor (línea 14-18)
- **Llamada**: Antes de cada petición
- **Qué hace**: 
  - Puede agregar token en headers (actualmente comentado)
  - Retorna config sin modificar

#### Response Interceptor (línea 21-37)
- **Llamada**: Después de cada respuesta (o error)
- **Qué hace**:
  - Si hay error Axios → normaliza a `Error` con `status` y `details`
  - Facilita manejo de errores en servicios

**Llamado desde**: 
- Todos los servicios (`services/*.ts`)
- Stores (`stores/auth.ts`)

---

### 6. `src/services/usuarios.ts` - Servicio de Usuarios

**Función**: Wrapper para llamadas API de usuarios

#### `list(params?)` (línea 23-27)
- **Llamada**: 
  - `stores/usuarios.ts` → `fetch()` (línea 20)
- **Qué hace**:
  1. Llama: `http.get('/api/usuarios', { params })`
  2. Retorna: `Paged<Usuario>`

#### `get(id)` (línea 29-33)
- **Llamada**: Directa desde componentes (actualmente no se usa)
- **Qué hace**: `http.get('/api/usuarios/:id')`

#### `create(payload)` (línea 35-39)
- **Llamada**: 
  - `UsuarioModal.vue` → `handleSubmit()` (línea 180)
  - `stores/usuarios.ts` → `create()` (línea 32)
- **Qué hace**:
  1. Llama: `http.post('/api/usuarios', payload)`
  2. Retorna: `Usuario` creado

**Flujo**:
```
UsuarioModal.handleSubmit()
  → usuariosService.create(payload)
    → http.post('/api/usuarios', payload)
      → Backend: POST /api/usuarios
        → Valida con Zod
        → Hashea password
        → Crea en BD
        → Response: Usuario
    → return Usuario
  → emit('usuario-creado')
  → close()
```

#### `update(id, patch)` (línea 41-45)
- **Llamada**: `stores/usuarios.ts` → `update()` (línea 35)
- **Qué hace**: `http.put('/api/usuarios/:id', patch)`

#### `remove(id)` (línea 47-51)
- **Llamada**: `stores/usuarios.ts` → `remove()` (línea 39)
- **Qué hace**: `http.delete('/api/usuarios/:id')`

---

### 7. `src/services/reportes.ts` - Servicio de Reportes

**Función**: Wrapper para llamadas API de reportes

#### `listarReportes(limit, offset, filters?)` (línea 29-45)
- **Llamada**: 
  - `ReportProductosSub.vue` → `cargar()` (línea 69, 73)
- **Qué hace**:
  1. Construye params desde filters
  2. Llama: `http.get('/api/reportes', { params })`
  3. Retorna: `{ items: ReportRow[], total: number }`

**Flujo**:
```
ReportProductosSub.cargar()
  → listarReportes(1200, 0, filters)
    → http.get('/api/reportes', { params })
      → Backend: GET /api/reportes
        → reportesRepo.list(limit, offset, filters)
          → SQL JOIN complejo (8 tablas)
          → Response: { items, total }
    → rows.value = items
    → totalRows.value = total
```

#### `obtenerOpcionesFiltros()` (línea 55-58)
- **Llamada**: 
  - `ReportProductosSub.vue` → `onMounted()` (línea 100-110)
- **Qué hace**:
  1. Llama: `http.get('/api/reportes/filtros')`
  2. Retorna: `{ generos, categorias, subcategorias }`

---

### 8. `src/views/LoginView.vue` - Vista de Login

**Función**: Formulario de autenticación

#### `onSubmit(e)` (línea 20-34)
- **Llamada**: Al enviar formulario (`@submit.prevent`)
- **Qué hace**:
  1. Previene submit default
  2. Limpia error anterior
  3. Llama: `auth.login(email.value, password.value)`
  4. Si éxito: redirige a `/report/resumen` (o `redirect` query)
  5. Si error: muestra mensaje

**Flujo completo**:
```
Usuario ingresa email/password
  → Click "Iniciar sesión"
    → onSubmit(e)
      → auth.login(email, password)
        → http.post('/api/auth/login')
          → Backend valida
          → Set cookie 'auth'
          → Response: { user }
        → auth.user = data.user
        → return true
      → router.replace('/report/resumen')
```

**Estado reactivo**:
- `email` - Input email
- `password` - Input password
- `showPassword` - Toggle mostrar/ocultar password
- `errorMsg` - Mensaje de error (no se usa, usa `auth.error`)

---

### 9. `src/views/report/ReportProductosSub.vue` - Vista de Productos

**Función**: Muestra tabla de productos con filtros

#### `cargar()` (línea 52-89)
- **Llamada**: 
  - `onMounted()` (línea 100)
  - `limpiar()` (línea 42)
  - Manualmente (botón actualizar)
- **Qué hace**:
  1. Inicia loading (mínimo 1.2s)
  2. Valida y limpia filtros
  3. Si no hay filtros → `listarReportes(1200, 0)`
  4. Si hay filtros → `listarReportes(1200, 0, filters)`
  5. Actualiza `rows.value` y `totalRows.value`
  6. Maneja errores

**Flujo**:
```
Componente monta / Usuario aplica filtros
  → cargar()
    → listarReportes(1200, 0, filters)
      → http.get('/api/reportes', { params })
        → Backend: GET /api/reportes
          → SQL JOIN complejo
          → Response: { items, total }
    → rows.value = items
    → totalRows.value = total
```

#### `limpiar()` (línea 35-43)
- **Llamada**: Botón "Limpiar" en UI
- **Qué hace**:
  1. Resetea todos los filtros a vacío
  2. Llama `cargar()` para recargar datos

#### `onMounted()` (línea 100-110)
- **Llamada**: Automática cuando componente se monta
- **Qué hace**:
  1. Carga opciones de filtros: `obtenerOpcionesFiltros()`
  2. Actualiza: `generoOpts`, `categoriaOpts`, `subcategoriaOpts`
  3. Carga datos iniciales: `cargar()`

---

### 10. `src/components/NavBar.vue` - Barra de Navegación

**Función**: Header con navegación y acciones de usuario

#### `onLogout()` (línea 40-47)
- **Llamada**: Botón "Cerrar sesión"
- **Qué hace**:
  1. Llama: `auth.logout()`
  2. Redirige a `/login`
  3. Cierra menú móvil

**Estado reactivo**:
- `open` - Controla menú móvil (hamburguesa)
- `showUsuarioModal` - Controla modal de crear usuario
- `isAuth` - Computed: `auth.isAuthenticated`
- `initials` - Computed: Iniciales del usuario

**Lógica especial**:
- Botón "+ Usuario" solo visible si `auth.user?.email === 'patatas@email.com'` (línea 101)

---

### 11. `src/components/UsuarioModal.vue` - Modal Crear Usuario

**Función**: Formulario modal para crear usuarios

#### `handleSubmit()` (línea 160-195)
- **Llamada**: Botón "Crear Usuario" o submit del form
- **Qué hace**:
  1. Valida formulario: `validateForm()`
  2. Si válido:
     - Inicia loading
     - Llama: `usuariosService.create(payload)`
     - Si éxito: emite `usuario-creado` y cierra modal
     - Si error: muestra mensaje

#### `validateForm()` (línea 140-159)
- **Llamada**: `handleSubmit()` antes de enviar
- **Qué hace**:
  1. Valida cada campo (nombre, apellido, usuario, email, password)
  2. Valida formato de email con regex
  3. Valida password mínimo 6 caracteres
  4. Retorna `true` si válido, `false` si hay errores
  5. Actualiza `errors.value` con mensajes

**Campos del formulario**:
- `nombre`, `apellido`, `usuario`, `email`, `password`
- `rol`: 'admin' | 'editor' | 'usuario'
- `estado`: 'activo' | 'inactivo'

---

### 12. `src/utils/consoleFilter.ts` - Filtro de Consola

**Función**: Filtra errores de Power BI en desarrollo

**Ejecución**: Se ejecuta al importar (línea 6 en `main.ts`)

**Qué hace**:
1. Intercepta `console.error`, `console.warn`, `console.info`
2. Filtra mensajes que contengan patrones de Power BI/Microsoft
3. Solo activo en desarrollo (`import.meta.env.DEV`)

**Patrones filtrados**:
- `dc.services.visualstudio.com`
- `powerbi.com`
- `cookietest`, `ai_session`
- `cookie particionada`
- `Solicitud de origen cruzado bloqueada`
- etc.

---

# 🔄 FLUJOS DE COMUNICACIÓN

## Flujo 1: Login Completo

```
1. Usuario → LoginView
   └─> Ingresa email/password
   
2. LoginView.onSubmit()
   └─> auth.login(email, password)
       └─> http.post('/api/auth/login')
           └─> Backend: POST /api/auth/login
               ├─> Valida con Zod
               ├─> usuariosRepo.findByEmail(email)
               │   └─> MySQL: SELECT * FROM usuarios WHERE email = ?
               ├─> bcrypt.compare(password, hash)
               ├─> jwt.sign({ sub, email, role })
               └─> setCookie('auth', token)
                   └─> Response: { user }
       └─> auth.user = data.user
       └─> return true
   └─> router.replace('/report/resumen')
```

## Flujo 2: Cargar Reportes

```
1. Usuario → ReportProductosSub
   
2. onMounted()
   ├─> obtenerOpcionesFiltros()
   │   └─> http.get('/api/reportes/filtros')
   │       └─> Backend: GET /api/reportes/filtros
   │           └─> reportesRepo.getFiltros()
   │               └─> 3 queries SELECT DISTINCT
   │                   └─> Response: { generos, categorias, subcategorias }
   └─> cargar()
       └─> listarReportes(1200, 0, filters)
           └─> http.get('/api/reportes', { params })
               └─> Backend: GET /api/reportes
                   └─> reportesRepo.list(limit, offset, filters)
                       └─> SQL JOIN complejo (8 tablas)
                           └─> Response: { items, total }
       └─> rows.value = items
```

## Flujo 3: Crear Usuario

```
1. Usuario (patatas@email.com) → NavBar
   └─> Click "+ Usuario"
       └─> showUsuarioModal = true
   
2. UsuarioModal
   └─> Llena formulario
   └─> Click "Crear Usuario"
       └─> handleSubmit()
           ├─> validateForm()
           └─> usuariosService.create(payload)
               └─> http.post('/api/usuarios', payload)
                   └─> Backend: POST /api/usuarios
                       ├─> Valida con Zod
                       ├─> bcrypt.hash(password)
                       └─> usuariosRepo.create(data)
                           └─> MySQL: INSERT INTO usuarios
                               └─> Response: Usuario
           └─> emit('usuario-creado')
           └─> close()
```

## Flujo 4: Verificación de Sesión (Router Guard)

```
1. Usuario navega /report/productos
   
2. router.beforeEach()
   ├─> Normaliza ruta a lowercase
   ├─> Si !bootstrapped:
   │   └─> auth.me()
   │       └─> http.get('/api/auth/session')
   │           └─> Backend: GET /api/auth/session
   │               ├─> Lee cookie 'auth'
   │               ├─> jwt.verify(token)
   │               └─> usuariosRepo.findSafeById(id)
   │                   └─> MySQL: SELECT * WHERE id = ?
   │                       └─> Response: { user: {...} | null }
   │       └─> auth.user = data.user o null
   └─> Verifica isAuth
       ├─> Si requiresAuth && !isAuth: redirige a /login
       └─> Si todo OK: permite navegación
```

---

# 📊 MAPA DE LLAMADAS DE FUNCIONES

## Backend → Backend

```
http/index.ts
  ├─> env.ts (import)
  ├─> auth.routes.ts (register)
  │   └─> usuariosRepo.findByEmail()
  │   └─> usuariosRepo.findSafeById()
  ├─> usuarios.routes.ts (register)
  │   └─> usuariosRepo.list()
  │   └─> usuariosRepo.getById()
  │   └─> usuariosRepo.create()
  │   └─> usuariosRepo.update()
  │   └─> usuariosRepo.remove()
  └─> reportes.routes.ts (register)
      └─> reportesRepo.list()
      └─> reportesRepo.getFiltros()

*Repo.ts
  └─> db.ts (pool.query)
      └─> MySQL Database
```

## Frontend → Backend

```
main.ts
  └─> auth.me()
      └─> http.get('/api/auth/session')
          └─> Backend: GET /api/auth/session

LoginView
  └─> auth.login()
      └─> http.post('/api/auth/login')
          └─> Backend: POST /api/auth/login

NavBar
  └─> auth.logout()
      └─> http.post('/api/auth/logout')
          └─> Backend: POST /api/auth/logout

ReportProductosSub
  ├─> obtenerOpcionesFiltros()
  │   └─> http.get('/api/reportes/filtros')
  │       └─> Backend: GET /api/reportes/filtros
  └─> listarReportes()
      └─> http.get('/api/reportes')
          └─> Backend: GET /api/reportes

UsuarioModal
  └─> usuariosService.create()
      └─> http.post('/api/usuarios')
          └─> Backend: POST /api/usuarios
```

## Frontend → Frontend

```
main.ts
  ├─> App.vue
  │   ├─> NavBar
  │   │   ├─> auth.isAuthenticated (computed)
  │   │   ├─> auth.logout()
  │   │   └─> UsuarioModal (v-if email === 'patatas@email.com')
  │   └─> router-view
  │       ├─> LoginView
  │       │   └─> auth.login()
  │       └─> ReportView
  │           └─> ReportProductosSub
  │               ├─> reportesService.listarReportes()
  │               └─> reportesService.obtenerOpcionesFiltros()
  └─> router
      └─> beforeEach()
          └─> auth.me()

UsuarioModal
  └─> usuariosService.create()
      └─> emit('usuario-creado')
          └─> NavBar: showUsuarioModal = false
```

---

# 📝 RESUMEN DE FUNCIONES POR ARCHIVO

## Backend

| Archivo | Funciones Principales | Llamadas Desde |
|---------|----------------------|----------------|
| `http/index.ts` | `main()` | Inicio del servidor |
| `infra/env.ts` | `envSchema.parse()` | Todos los módulos |
| `infra/db.ts` | `createPool()` | Todos los repositorios |
| `routes/auth.routes.ts` | `POST /api/auth/login`<br>`GET /api/auth/me`<br>`GET /api/auth/session`<br>`POST /api/auth/logout` | Frontend stores |
| `routes/usuarios.routes.ts` | CRUD completo usuarios | Frontend services |
| `routes/reportes.routes.ts` | `GET /api/reportes`<br>`GET /api/reportes/filtros` | Frontend services |
| `infra/usuariosRepo.ts` | `list()`, `getById()`, `create()`, `update()`, `remove()`, `findByEmail()`, `findSafeById()` | Routes |
| `infra/reportesRepo.ts` | `list()`, `getFiltros()` | Routes |

## Frontend

| Archivo | Funciones Principales | Llamadas Desde |
|---------|----------------------|----------------|
| `main.ts` | Inicialización app | Vite |
| `App.vue` | Layout principal | main.ts |
| `router/index.ts` | `beforeEach()` guard | Vue Router |
| `stores/auth.ts` | `login()`, `me()`, `logout()` | Views, Router |
| `stores/usuarios.ts` | `fetch()`, `create()`, `update()`, `remove()` | Components |
| `services/usuarios.ts` | `list()`, `get()`, `create()`, `update()`, `remove()` | Stores, Components |
| `services/reportes.ts` | `listarReportes()`, `obtenerOpcionesFiltros()` | Views |
| `lib/http.ts` | Instancia Axios con interceptores | Services, Stores |
| `views/LoginView.vue` | `onSubmit()` | Usuario (form submit) |
| `views/report/ReportProductosSub.vue` | `cargar()`, `limpiar()`, `onMounted()` | Vue lifecycle |
| `components/NavBar.vue` | `onLogout()` | Usuario (botón) |
| `components/UsuarioModal.vue` | `handleSubmit()`, `validateForm()` | Usuario (form submit) |

---

**Última actualización**: 2025
**Versión**: Fase 2 - Completa y Funcional



