# Diagrama de Comunicación - Fase 2

## 🔄 Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph Frontend["🖥️ FRONTEND (Vue 3 + TypeScript)"]
        V[Views<br/>LoginView<br/>ReportView<br/>HomeView ❌]
        S[Stores<br/>auth.ts<br/>usuarios.ts]
        SRV[Services<br/>reportes.ts<br/>usuarios.ts]
        HTTP[lib/http.ts<br/>Axios Instance]
        API[lib/api.ts<br/>Tipos ⚠️]
    end

    subgraph Backend["⚙️ BACKEND (Fastify + TypeScript)"]
        SERVER[http/index.ts<br/>Fastify Server]
        ROUTES[Routes<br/>auth<br/>usuarios<br/>articulos<br/>categorias<br/>stock<br/>proyeccion<br/>reportes]
        SCHEMAS[Schemas<br/>Zod Validation]
        REPO[Repositories<br/>articulosRepo<br/>categoriasRepo<br/>stockRepo<br/>proyeccionRepo<br/>reportesRepo<br/>usuariosRepo]
        DB[db.ts<br/>MySQL Pool]
    end

    subgraph Database["🗄️ DATABASE (MySQL)"]
        TABLES[(Tables<br/>articulos<br/>categoria<br/>stock_aristo<br/>stock_interco<br/>proyeccion_ventas_total<br/>usuarios<br/>genero<br/>sub_categoria<br/>color)]
    end

    V -->|Usa| S
    S -->|Llama| SRV
    SRV -->|Usa| HTTP
    SRV -.->|Tipos| API
    HTTP -->|HTTP/REST<br/>JSON<br/>Cookies| ROUTES
    ROUTES -->|Valida| SCHEMAS
    SCHEMAS -->|Llama| REPO
    REPO -->|Query| DB
    DB -->|SQL| TABLES
    ROUTES -->|Registra| SERVER
```

## 🔐 Flujo de Autenticación (Login)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant LV as LoginView
    participant AS as auth Store
    participant HTTP as http.ts
    participant BE as Backend<br/>auth.routes
    participant UR as usuariosRepo
    participant DB as MySQL

    U->>LV: Ingresa email/password
    LV->>AS: login(email, password)
    AS->>AS: loading = true
    AS->>HTTP: POST /api/auth/login
    HTTP->>BE: Request con credenciales
    BE->>BE: Valida con Zod
    BE->>UR: findByEmail(email)
    UR->>DB: SELECT * FROM usuarios WHERE email = ?
    DB-->>UR: Usuario encontrado
    UR-->>BE: Usuario con hash
    BE->>BE: bcrypt.compare(password, hash)
    alt Credenciales válidas
        BE->>BE: jwt.sign() → Token
        BE->>BE: setCookie('auth', token)
        BE-->>HTTP: 200 { user }
        HTTP-->>AS: Response con user
        AS->>AS: user = data.user
        AS->>AS: loading = false
        AS-->>LV: true
        LV->>LV: Router.push('/report')
    else Credenciales inválidas
        BE-->>HTTP: 401 { message }
        HTTP-->>AS: Error
        AS->>AS: error = 'Credenciales inválidas'
        AS->>AS: loading = false
        AS-->>LV: false
    end
```

## 📊 Flujo de Reportes (Consulta Compleja)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant RV as ReportView
    participant RS as reportes Service
    participant HTTP as http.ts
    participant BE as Backend<br/>reportes.routes
    participant RR as reportesRepo
    participant DB as MySQL

    U->>RV: Navega a /report/productos
    RV->>RV: Carga filtros
    RV->>RS: obtenerOpcionesFiltros()
    RS->>HTTP: GET /api/reportes/filtros
    HTTP->>BE: Request
    BE->>RR: getFiltros()
    RR->>DB: SELECT DISTINCT genero FROM genero
    RR->>DB: SELECT DISTINCT categoria FROM categoria
    RR->>DB: SELECT DISTINCT subcategoria FROM sub_categoria
    DB-->>RR: Resultados
    RR-->>BE: { generos, categorias, subcategorias }
    BE-->>HTTP: 200 { filtros }
    HTTP-->>RS: Response
    RS-->>RV: Opciones de filtros
    RV->>RV: Usuario aplica filtros
    RV->>RS: listarReportes(limit, offset, filters)
    RS->>HTTP: GET /api/reportes?codigo=X&genero=Y
    HTTP->>BE: Request con query params
    BE->>BE: Parsea filtros
    BE->>RR: list(limit, offset, filters)
    RR->>DB: SELECT complejo con 8 JOINs<br/>WHERE filtros<br/>LIMIT/OFFSET
    Note over DB: JOIN entre:<br/>articulos, stock_aristo,<br/>stock_interco, proyeccion_ventas_total,<br/>genero, categoria,<br/>sub_categoria, color
    DB-->>RR: ResultSet
    RR->>DB: SELECT COUNT(*) para total
    DB-->>RR: Total
    RR-->>BE: { items: ReportRow[], total: number }
    BE-->>HTTP: 200 { items, total }
    HTTP-->>RS: Response
    RS-->>RV: Datos paginados
    RV->>RV: Renderiza tabla
```

## 👥 Flujo de Gestión de Usuarios

```mermaid
sequenceDiagram
    participant U as Usuario Admin
    participant US as usuarios Store
    participant USRV as usuarios Service
    participant HTTP as http.ts
    participant BE as Backend<br/>usuarios.routes
    participant UR as usuariosRepo
    participant DB as MySQL

    U->>US: fetch() - Cargar lista
    US->>USRV: list({ page, pageSize, search })
    USRV->>HTTP: GET /api/usuarios?page=1&pageSize=10&search=X
    HTTP->>BE: Request
    BE->>UR: list({ page, pageSize, search })
    UR->>DB: SELECT * FROM usuarios<br/>WHERE (nombre LIKE ? OR ...)<br/>LIMIT/OFFSET
    UR->>DB: SELECT COUNT(*) FROM usuarios
    DB-->>UR: Items + Total
    UR-->>BE: { items, page, pageSize, total }
    BE-->>HTTP: 200 Response
    HTTP-->>USRV: Paged<Usuario>
    USRV-->>US: Datos
    US->>US: items = res.items<br/>total = res.total

    U->>US: create(newUser)
    US->>USRV: create(payload)
    USRV->>HTTP: POST /api/usuarios
    HTTP->>BE: Request con datos
    BE->>BE: Valida con Zod
    BE->>BE: bcrypt.hash(password)
    BE->>UR: create({ ...data, password: hash })
    UR->>DB: INSERT INTO usuarios VALUES (...)
    DB-->>UR: insertId
    UR->>DB: SELECT * WHERE id = ?
    DB-->>UR: Usuario creado
    UR-->>BE: Usuario (sin password)
    BE-->>HTTP: 201 Created
    HTTP-->>USRV: Usuario
    USRV-->>US: Success
    US->>US: fetch() - Recargar lista
```

## 🔄 Flujo de Verificación de Sesión (Router Guard)

```mermaid
sequenceDiagram
    participant R as Router
    participant AS as auth Store
    participant HTTP as http.ts
    participant BE as Backend<br/>auth.routes

    R->>R: beforeEach() - Navegación
    R->>R: bootstrapped? No
    R->>AS: me()
    AS->>HTTP: GET /api/auth/session<br/>validateStatus: () => true
    HTTP->>BE: Request con Cookie 'auth'
    BE->>BE: Lee cookie 'auth'
    alt Cookie existe y válida
        BE->>BE: jwt.verify(token)
        BE->>BE: usuariosRepo.findSafeById(id)
        BE-->>HTTP: 200 { user: {...} }
        HTTP-->>AS: Response
        AS->>AS: user = data.user
    else Cookie no existe o inválida
        BE-->>HTTP: 200 { user: null }
        HTTP-->>AS: Response
        AS->>AS: user = null
    end
    AS-->>R: Sesión verificada
    R->>R: Verifica meta.requiresAuth
    alt Ruta requiere auth y no hay sesión
        R->>R: Redirige a /login
    else Ruta es /login y hay sesión
        R->>R: Redirige a /report
    else Todo OK
        R->>R: Permite navegación
    end
```

## 📦 Estructura de Datos - Flujo de Reportes

```mermaid
graph LR
    subgraph DB["🗄️ Base de Datos"]
        A[articulos<br/>id, codigo, color,<br/>codigo_color, GENERO,<br/>CATEGORIA, SUB_CATEGORIA]
        SA[stock_aristo<br/>codigo_color, stock]
        SI[stock_interco<br/>codigo_color, stock]
        PV[proyeccion_ventas_total<br/>id_linea, ventas_prom_6m,<br/>ventas_prom_x_articulo]
        G[genero<br/>cod_genero, genero]
        C[categoria<br/>cod_categoria, categoria]
        SC[sub_categoria<br/>cod_subcategoria, subcategoria]
        COL[color<br/>color, nombre_color]
    end

    subgraph REPO["📦 reportesRepo.list()"]
        JOIN[SQL JOIN<br/>8 tablas]
    end

    subgraph RESULT["📊 Resultado"]
        R[ReportRow<br/>imagen, codigo,<br/>nombre_color, genero,<br/>categoria, sub_categoria,<br/>stock_actual,<br/>articulos_en_linea,<br/>venta_prom_6m_estimada,<br/>venta_prom_x_articulo_estimada]
    end

    A -->|LEFT JOIN| JOIN
    SA -->|LEFT JOIN| JOIN
    SI -->|LEFT JOIN| JOIN
    PV -->|LEFT JOIN| JOIN
    G -->|LEFT JOIN| JOIN
    C -->|LEFT JOIN| JOIN
    SC -->|LEFT JOIN| JOIN
    COL -->|LEFT JOIN| JOIN
    JOIN -->|SELECT + WHERE + LIMIT| R
```

## 🚨 Elementos No Utilizados (Marcados en Diagrama)

```mermaid
graph TD
    subgraph NO_USADOS["❌ NO UTILIZADOS"]
        P[Prisma Schema<br/>prisma/schema.prisma<br/>⚠️ Configurado pero no usado]
        PC[Prisma Config<br/>prisma.config.ts<br/>⚠️ No usado]
        CORE[core/<br/>Directorio vacío<br/>❌]
        HV[HomeView.vue<br/>Sin ruta definida<br/>❌]
        ISHTTPS[isHttps()<br/>Función no llamada<br/>❌]
        API_HTTP[api.ts → http<br/>Objeto no usado<br/>❌]
        API_API[api.ts → api<br/>Objeto no usado<br/>❌]
    end

    subgraph USADOS["✅ UTILIZADOS"]
        HTTP_FILE[http.ts<br/>✅ Usado en servicios]
        API_TYPES[api.ts → Tipos<br/>✅ Usado en stores]
    end

    style P fill:#ffcccc
    style PC fill:#ffcccc
    style CORE fill:#ffcccc
    style HV fill:#ffcccc
    style ISHTTPS fill:#ffcccc
    style API_HTTP fill:#ffcccc
    style API_API fill:#ffcccc
    style HTTP_FILE fill:#ccffcc
    style API_TYPES fill:#ccffcc
```

## 🔗 Endpoints API - Mapa Completo

```mermaid
graph TB
    subgraph AUTH["🔐 Autenticación"]
        A1[POST /api/auth/login]
        A2[GET /api/auth/me]
        A3[GET /api/auth/session]
        A4[POST /api/auth/logout]
    end

    subgraph USR["👥 Usuarios"]
        U1[GET /api/usuarios]
        U2[GET /api/usuarios/:id]
        U3[POST /api/usuarios]
        U4[PUT /api/usuarios/:id]
        U5[DELETE /api/usuarios/:id]
    end

    subgraph ART["📦 Artículos"]
        AR1[GET /api/articulos]
        AR2[GET /api/articulos/:id]
        AR3[POST /api/articulos]
        AR4[PUT /api/articulos/:id]
        AR5[DELETE /api/articulos/:id]
    end

    subgraph CAT["📁 Categorías"]
        C1[GET /api/categorias]
        C2[GET /api/categorias/:id]
        C3[POST /api/categorias]
        C4[PUT /api/categorias/:id]
        C5[DELETE /api/categorias/:id]
    end

    subgraph STK["📊 Stock"]
        S1[GET /api/stock/aristo]
        S2[PUT /api/stock/aristo/:id]
        S3[GET /api/stock/interco]
        S4[PUT /api/stock/interco/:id]
    end

    subgraph PROY["📈 Proyección Ventas"]
        P1[GET /api/proyeccion_ventas_total]
        P2[GET /api/proyeccion_ventas_total/:id]
        P3[POST /api/proyeccion_ventas_total]
        P4[PUT /api/proyeccion_ventas_total/:id]
        P5[DELETE /api/proyeccion_ventas_total/:id]
    end

    subgraph REP["📋 Reportes"]
        R1[GET /api/reportes]
        R2[GET /api/reportes/filtros]
    end

    subgraph HEALTH["💚 Health"]
        H1[GET /api/health]
    end

    style AUTH fill:#e1f5ff
    style USR fill:#fff4e1
    style ART fill:#e8f5e9
    style CAT fill:#f3e5f5
    style STK fill:#fff9c4
    style PROY fill:#e0f2f1
    style REP fill:#fce4ec
    style HEALTH fill:#c8e6c9
```

---

## 📝 Leyenda

- ✅ **Verde**: Elemento funcional y utilizado
- ⚠️ **Amarillo**: Elemento configurado pero no usado
- ❌ **Rojo**: Elemento no utilizado (código muerto)
- 🔐 **Azul claro**: Autenticación
- 📊 **Amarillo claro**: Datos/Reportes
- 📦 **Verde claro**: Entidades principales

---

**Nota**: Estos diagramas muestran la comunicación real entre componentes. Los elementos marcados con ❌ o ⚠️ deberían ser eliminados o implementados según las recomendaciones del análisis.



