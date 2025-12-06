# Análisis Completo de la Estructura - Fase 2

## 📋 Resumen Ejecutivo

Este documento analiza la estructura completa del backend y frontend de la Fase 2, identificando problemas, elementos no utilizados, y documentando las funciones y su comunicación.

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Prisma Configurado pero NO Utilizado**
- **Ubicación**: `backend/prisma/`, `backend/prisma.config.ts`
- **Problema**: 
  - Prisma está instalado y configurado (schema.prisma, prisma.config.ts)
  - El código usa `mysql2` directamente en todos los repositorios
  - El schema de Prisma está configurado para PostgreSQL, pero el proyecto usa MySQL
  - No hay imports de Prisma Client en ningún archivo del código
- **Impacto**: Dependencia innecesaria, confusión sobre qué ORM usar
- **Recomendación**: Eliminar Prisma o migrar a Prisma (pero no ambos)

### 2. **Directorio `core/` Vacío**
- **Ubicación**: `backend/src/core/`
- **Problema**: Directorio existe pero está completamente vacío
- **Impacto**: Estructura confusa, sugiere funcionalidad que no existe
- **Recomendación**: Eliminar el directorio o definir su propósito

### 3. **Duplicación de Configuración HTTP en Frontend**
- **Ubicación**: 
  - `frontend/arrow/src/lib/http.ts` ✅ (USADO)
  - `frontend/arrow/src/lib/api.ts` ⚠️ (PARCIALMENTE USADO)
- **Problema**:
  - `api.ts` exporta un objeto `http` que NO se utiliza
  - `api.ts` exporta tipos (`Usuario`, `Paged`) que SÍ se usan
  - `http.ts` es el que realmente se usa en servicios
- **Impacto**: Confusión sobre qué archivo usar, código duplicado
- **Recomendación**: Consolidar en un solo archivo o separar claramente tipos vs instancia HTTP

### 4. **Vista HomeView No Utilizada**
- **Ubicación**: `frontend/arrow/src/views/HomeView.vue`
- **Problema**: 
  - El router redirige `/` a `/login`
  - No hay ruta definida para HomeView
  - El archivo existe pero nunca se carga
- **Impacto**: Código muerto
- **Recomendación**: Eliminar o implementar la ruta

### 5. **Función `isHttps` No Utilizada**
- **Ubicación**: `backend/src/http/routes/auth.routes.ts` (línea 11-14)
- **Problema**: Función definida pero nunca llamada
- **Impacto**: Código muerto
- **Recomendación**: Eliminar o implementar su uso

### 6. **Inconsistencia en Base de Datos**
- **Problema**: 
  - Prisma schema dice `provider = "postgresql"`
  - Código usa MySQL (`mysql2`)
  - Variables de entorno esperan MySQL
- **Impacto**: Confusión sobre qué base de datos usar
- **Recomendación**: Alinear configuración con implementación real

---

## 📁 ESTRUCTURA DEL BACKEND

### Arquitectura General
```
backend/
├── src/
│   ├── core/                    ❌ VACÍO (NO SE USA)
│   ├── http/                     ✅ SERVIDOR PRINCIPAL
│   │   ├── index.ts              ✅ Punto de entrada Fastify
│   │   ├── routes/               ✅ Rutas API
│   │   └── schemas/              ✅ Validación Zod
│   ├── infra/                    ✅ CAPA DE DATOS
│   │   ├── db.ts                 ✅ Pool MySQL
│   │   ├── env.ts                ✅ Variables de entorno
│   │   └── *Repo.ts              ✅ Repositorios (6 archivos)
│   └── types/                    ✅ Tipos TypeScript
├── prisma/                       ⚠️ CONFIGURADO PERO NO USADO
│   └── schema.prisma
└── prisma.config.ts              ⚠️ CONFIGURADO PERO NO USADO
```

### Descripción de Funciones - Backend

#### **1. Servidor HTTP (`src/http/index.ts`)**
**Función**: Punto de entrada principal del backend
**Responsabilidades**:
- Inicializa Fastify con plugins (CORS, Cookie, JWT)
- Configura autenticación mediante decorador `authenticate`
- Registra todas las rutas de la API
- Maneja cookies HTTP-only para tokens JWT
- Configura CORS según entorno (dev/prod)

**Endpoints principales**:
- `GET /api/health` - Health check

#### **2. Rutas de Autenticación (`src/http/routes/auth.routes.ts`)**
**Funciones**:
- `POST /api/auth/login` - Autentica usuario con email/password
  - Valida credenciales con Zod
  - Busca usuario por email
  - Compara password con bcrypt
  - Genera JWT y lo guarda en cookie HTTP-only
  - Retorna datos del usuario (sin password)
  
- `GET /api/auth/me` - Obtiene usuario autenticado (requiere auth)
  - Verifica token JWT
  - Retorna datos del usuario actual
  
- `GET /api/auth/session` - Verifica sesión sin lanzar error
  - Lee cookie de sesión
  - Retorna `{ user: {...} | null }`
  - Nunca retorna 401, siempre 200
  
- `POST /api/auth/logout` - Cierra sesión
  - Limpia cookie de autenticación

**Problema**: Función `isHttps()` definida pero no usada

#### **3. Rutas de Usuarios (`src/http/routes/usuarios.routes.ts`)**
**Funciones**:
- `GET /api/usuarios` - Lista usuarios con paginación y búsqueda
- `GET /api/usuarios/:id` - Obtiene un usuario por ID
- `POST /api/usuarios` - Crea nuevo usuario (hashea password)
- `PUT /api/usuarios/:id` - Actualiza usuario (hashea password si se envía)
- `DELETE /api/usuarios/:id` - Elimina usuario

**Características**:
- Nunca retorna passwords en respuestas
- Búsqueda por nombre, apellido, usuario o email
- Paginación con límite máximo de 100

#### **4. Rutas de Artículos (`src/http/routes/articulos.routes.ts`)**
**Funciones**:
- `GET /api/articulos` - Lista artículos con filtros y paginación
  - Filtros: empresa, codigo, color, codigo_color, categoria, genero
- `GET /api/articulos/:id` - Obtiene un artículo por ID
- `POST /api/articulos` - Crea nuevo artículo
- `PUT /api/articulos/:id` - Actualiza artículo
- `DELETE /api/articulos/:id` - Elimina artículo

#### **5. Rutas de Categorías (`src/http/routes/categorias.routes.ts`)**
**Funciones**:
- `GET /api/categorias` - Lista todas las categorías
- `GET /api/categorias/:id` - Obtiene una categoría por ID
- `POST /api/categorias` - Crea nueva categoría
- `PUT /api/categorias/:id` - Actualiza categoría
- `DELETE /api/categorias/:id` - Elimina categoría

#### **6. Rutas de Stock (`src/http/routes/stock.routes.ts`)**
**Funciones**:
- `GET /api/stock/aristo` - Lista stock de Aristo (opcional filtro por codigo_color)
- `PUT /api/stock/aristo/:id` - Actualiza stock de Aristo
- `GET /api/stock/interco` - Lista stock de Interco (opcional filtro por codigo_color)
- `PUT /api/stock/interco/:id` - Actualiza stock de Interco

#### **7. Rutas de Proyección de Ventas (`src/http/routes/proyeccionVentas.routes.ts`)**
**Funciones**:
- `GET /api/proyeccion_ventas_total` - Lista todas las proyecciones
- `GET /api/proyeccion_ventas_total/:id` - Obtiene proyección por ID
- `POST /api/proyeccion_ventas_total` - Crea nueva proyección
- `PUT /api/proyeccion_ventas_total/:id` - Actualiza proyección
- `DELETE /api/proyeccion_ventas_total/:id` - Elimina proyección

**Nota**: Usa validación con Zod schema

#### **8. Rutas de Reportes (`src/http/routes/reportes.routes.ts`)**
**Funciones**:
- `GET /api/reportes` - Lista reportes con filtros y paginación
  - Filtros: codigo, genero, categoria, subcategoria
  - Retorna: `{ items: ReportRow[], total: number }`
  - Solo muestra artículos con stock > 0
  
- `GET /api/reportes/filtros` - Obtiene opciones para combos de filtros
  - Retorna: `{ generos: string[], categorias: string[], subcategorias: string[] }`

**Query complejo**: Hace JOIN entre múltiples tablas (articulos, stock_aristo, stock_interco, proyeccion_ventas_total, genero, categoria, sub_categoria, color)

#### **9. Repositorios (`src/infra/*Repo.ts`)**
**Patrón**: Cada entidad tiene su repositorio que encapsula acceso a BD

**Repositorios**:
1. **articulosRepo** - CRUD de artículos
2. **categoriasRepo** - CRUD de categorías
3. **stockRepo** - Lectura/actualización de stock (Aristo e Interco)
4. **proyeccionVentasRepo** - CRUD de proyecciones
5. **reportesRepo** - Consultas complejas de reportes + filtros
6. **usuariosRepo** - CRUD de usuarios + `findByEmail`, `findSafeById`

**Tecnología**: Todos usan `mysql2/promise` con connection pool

#### **10. Configuración (`src/infra/`)**
- **db.ts**: Crea pool de conexiones MySQL
- **env.ts**: Valida y exporta variables de entorno con Zod

---

## 📁 ESTRUCTURA DEL FRONTEND

### Arquitectura General
```
frontend/arrow/
├── src/
│   ├── components/               ✅ Componentes reutilizables
│   ├── composables/              ✅ Composables Vue (useTheme)
│   ├── lib/                      ⚠️ DUPLICACIÓN HTTP
│   │   ├── http.ts               ✅ USADO (instancia axios)
│   │   └── api.ts                ⚠️ PARCIAL (solo tipos)
│   ├── router/                   ✅ Vue Router
│   │   └── index.ts              ✅ Rutas + guards
│   ├── services/                 ✅ Servicios API
│   │   ├── reportes.ts           ✅
│   │   └── usuarios.ts           ✅
│   ├── stores/                   ✅ Pinia stores
│   │   ├── auth.ts               ✅ Autenticación
│   │   └── usuarios.ts           ✅ Estado usuarios
│   └── views/                    ✅ Vistas principales
│       ├── LoginView.vue         ✅
│       ├── ReportView.vue         ✅ (con sub-rutas)
│       ├── HomeView.vue           ❌ NO USADA
│       └── NotFoundView.vue       ✅
```

### Descripción de Funciones - Frontend

#### **1. Router (`src/router/index.ts`)**
**Funciones**:
- Define rutas de la aplicación
- Guard global `beforeEach`:
  - Normaliza rutas a lowercase
  - Hidrata sesión una vez al iniciar (llama `auth.me()`)
  - Protege rutas que requieren autenticación
  - Bloquea login si ya hay sesión activa
- Manejo de errores de carga de chunks (recarga automática)

**Rutas**:
- `/` → redirige a `/login`
- `/login` → LoginView (solo para no autenticados)
- `/report` → ReportView (requiere auth)
  - `/report/productos` → ReportProductosSub
  - `/report/resumen` → ResumenSub
  - `/report/detalle` → DetalleSub
- `/*` → NotFoundView

#### **2. Store de Autenticación (`src/stores/auth.ts`)**
**Estado**:
- `user`: Usuario actual o null
- `loading`: Estado de carga
- `error`: Mensaje de error
- `returnUrl`: URL para redirigir después de login

**Funciones**:
- `login(email, password)`: 
  - Autentica usuario
  - Mínimo 1.5s de loading (UX)
  - Maneja errores 401
  - Guarda usuario en estado
  
- `me()`: 
  - Verifica sesión actual
  - No lanza errores (usa validateStatus)
  - Actualiza estado de usuario
  
- `logout()`: 
  - Limpia sesión en backend
  - Limpia estado local

**Getter**:
- `isAuthenticated`: `!!user`

#### **3. Store de Usuarios (`src/stores/usuarios.ts`)**
**Estado**:
- `items`: Lista de usuarios
- `page`, `pageSize`, `total`: Paginación
- `search`: Búsqueda actual
- `loading`, `error`: Estados

**Funciones**:
- `fetch()`: Carga usuarios con filtros actuales
- `create(u)`: Crea usuario y recarga lista
- `update(id, patch)`: Actualiza usuario y recarga lista
- `remove(id)`: Elimina usuario y recarga lista

#### **4. Servicio de Reportes (`src/services/reportes.ts`)**
**Funciones**:
- `listarReportes(limit, offset, filters)`: 
  - Obtiene reportes paginados con filtros
  - Retorna `{ items, total }`
  
- `obtenerOpcionesFiltros()`: 
  - Obtiene opciones para combos (géneros, categorías, subcategorías)
  - Retorna `{ generos, categorias, subcategorias }`

**Tipos exportados**:
- `ReportRow`: Estructura de un reporte
- `ReportFilters`: Filtros disponibles
- `ReportListResult`: Resultado paginado

#### **5. Servicio de Usuarios (`src/services/usuarios.ts`)**
**Funciones**:
- `list(params)`: Lista usuarios con paginación y búsqueda
- `get(id)`: Obtiene un usuario por ID
- `create(payload)`: Crea nuevo usuario
- `update(id, patch)`: Actualiza usuario
- `remove(id)`: Elimina usuario

**Tipos**: Usa tipos de `@/lib/api`

#### **6. HTTP Client (`src/lib/http.ts`)**
**Función**: Instancia Axios configurada
**Configuración**:
- `baseURL`: Desde `VITE_API_BASE` o `/`
- `withCredentials: true`: Envía cookies
- `Content-Type: application/json`

**Uso**: Importado en todos los servicios

#### **7. API Types (`src/lib/api.ts`)**
**Función**: Define tipos TypeScript y helper de errores
**Contenido**:
- Tipos: `Usuario`, `Paged<T>`, `ApiError`
- Función `toApiError()`: Normaliza errores de Axios
- Objeto `http`: ⚠️ **NO SE USA** (duplicado de `http.ts`)
- Objeto `api`: ⚠️ **NO SE USA** (helpers que no se utilizan)

**Uso real**: Solo se importan los tipos `Usuario` y `Paged`

---

## 🔄 DIAGRAMA DE COMUNICACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue 3)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Views      │      │   Stores     │      │  Services    │ │
│  │              │      │              │      │              │ │
│  │ LoginView    │─────▶│  auth.ts     │─────▶│  (no hay)    │ │
│  │ ReportView   │      │  usuarios.ts │      │              │ │
│  │              │      └──────────────┘      │  reportes.ts │ │
│  └──────────────┘             │              │  usuarios.ts │ │
│         │                      │              └──────────────┘ │
│         │                      │                      │         │
│         └──────────────────────┼──────────────────────┘         │
│                                │                                │
│                         ┌──────▼──────┐                         │
│                         │  lib/http.ts │                         │
│                         │  (Axios)    │                         │
│                         └──────┬──────┘                         │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                    HTTP/REST     │
                    (JSON)        │
                    Cookies       │
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                      BACKEND (Fastify)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              src/http/index.ts                           │  │
│  │  • Fastify Server                                        │  │
│  │  • CORS, Cookie, JWT                                     │  │
│  │  • Authenticate Decorator                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│        ┌──────────────────┼──────────────────┐                   │
│        │                  │                  │                   │
│  ┌─────▼─────┐    ┌───────▼───────┐  ┌──────▼──────┐          │
│  │  Routes   │    │    Routes     │  │   Routes    │          │
│  │           │    │               │  │             │          │
│  │ auth      │    │ articulos     │  │ categorias  │          │
│  │ usuarios  │    │ stock         │  │ proyeccion  │          │
│  │           │    │ reportes      │  │             │          │
│  └─────┬─────┘    └───────┬───────┘  └──────┬──────┘          │
│        │                  │                  │                  │
│        └──────────────────┼──────────────────┘                   │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │   Schemas      │                             │
│                  │   (Zod)        │                             │
│                  │   Validación   │                             │
│                  └────────┬────────┘                             │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │   Repositories  │                             │
│                  │                 │                             │
│                  │ articulosRepo   │                             │
│                  │ categoriasRepo  │                             │
│                  │ stockRepo       │                             │
│                  │ proyeccionRepo  │                             │
│                  │ reportesRepo    │                             │
│                  │ usuariosRepo    │                             │
│                  └────────┬────────┘                             │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │   db.ts         │                             │
│                  │   (mysql2 pool) │                             │
│                  └────────┬────────┘                             │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                    SQL Queries
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    MySQL Database                                │
│                                                                   │
│  • articulos                                                     │
│  • categoria                                                     │
│  • stock_aristo / stock_interco                                  │
│  • proyeccion_ventas_total                                       │
│  • usuarios                                                      │
│  • genero, sub_categoria, color                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Flujo de Autenticación

```
1. Usuario → LoginView
2. LoginView → auth.login(email, password)
3. auth Store → http.post('/api/auth/login')
4. Backend → auth.routes.ts → POST /api/auth/login
5. Backend → usuariosRepo.findByEmail()
6. Backend → bcrypt.compare()
7. Backend → jwt.sign() → Cookie 'auth'
8. Backend → Response { user }
9. Frontend → auth.user = data.user
10. Router → Redirige a /report
```

### Flujo de Reportes

```
1. Usuario → ReportView → ReportProductosSub
2. Component → reportesService.listarReportes(filters)
3. Service → http.get('/api/reportes', { params })
4. Backend → reportes.routes.ts → GET /api/reportes
5. Backend → reportesRepo.list(limit, offset, filters)
6. Repo → SQL JOIN complejo (8 tablas)
7. MySQL → ResultSet
8. Backend → Response { items, total }
9. Frontend → Component muestra datos
```

---

## 📊 RESUMEN DE ELEMENTOS NO UTILIZADOS

| Elemento | Ubicación | Estado | Acción Recomendada |
|----------|-----------|--------|-------------------|
| Prisma Schema | `backend/prisma/schema.prisma` | ⚠️ Configurado pero no usado | Eliminar o migrar a Prisma |
| Prisma Config | `backend/prisma.config.ts` | ⚠️ Configurado pero no usado | Eliminar |
| Directorio `core/` | `backend/src/core/` | ❌ Vacío | Eliminar |
| `isHttps()` función | `backend/src/http/routes/auth.routes.ts` | ❌ No llamada | Eliminar |
| `HomeView.vue` | `frontend/arrow/src/views/HomeView.vue` | ❌ Sin ruta | Eliminar o implementar |
| Objeto `http` en api.ts | `frontend/arrow/src/lib/api.ts` | ❌ No usado | Eliminar |
| Objeto `api` en api.ts | `frontend/arrow/src/lib/api.ts` | ❌ No usado | Eliminar |

---

## ✅ ELEMENTOS FUNCIONALES Y BIEN ESTRUCTURADOS

1. **Backend**:
   - ✅ Arquitectura clara (Routes → Repos → DB)
   - ✅ Validación con Zod
   - ✅ Autenticación JWT con cookies
   - ✅ Separación de responsabilidades
   - ✅ Manejo de errores consistente

2. **Frontend**:
   - ✅ Arquitectura Vue 3 + Pinia
   - ✅ Router con guards
   - ✅ Servicios separados
   - ✅ Stores reactivos
   - ✅ Componentes reutilizables

3. **Comunicación**:
   - ✅ REST API bien definida
   - ✅ Tipos compartidos
   - ✅ Manejo de autenticación con cookies

---

## 🎯 RECOMENDACIONES PRIORITARIAS

1. **Eliminar Prisma** (si no se va a usar):
   - Eliminar `prisma/` y `prisma.config.ts`
   - Remover de `package.json` devDependencies

2. **Limpiar código muerto**:
   - Eliminar `core/` vacío
   - Eliminar `HomeView.vue` o implementar ruta
   - Eliminar función `isHttps()`

3. **Consolidar HTTP en frontend**:
   - Mover tipos de `api.ts` a `http.ts` o archivo `types.ts`
   - Eliminar objetos no usados de `api.ts`

4. **Documentar decisiones**:
   - Por qué se usa MySQL y no PostgreSQL
   - Por qué se usa mysql2 y no Prisma

---

## 📝 NOTAS ADICIONALES

- El backend usa **MySQL** aunque Prisma schema dice PostgreSQL
- La autenticación usa **cookies HTTP-only** (más seguro que localStorage)
- Los reportes hacen **JOINs complejos** (8 tablas) - considerar índices
- El frontend tiene **guards de router** bien implementados
- Los servicios usan **tipos TypeScript** correctamente

---

**Fecha de análisis**: 2025
**Versión analizada**: Fase 2



