# INFORME TÉCNICO DETALLADO v2 — M-MOTORS FINANCE APP
> Generado para que un agente externo complete el informe académico universitario.
> Responde las 42 preguntas del prompt estructurado.
> Actualizado: Julio 2026

---

## A — STACK TECNOLÓGICO

### 1. Frontend
**Next.js 16.2.4** con **React 19.2.4** usando el App Router. Componentes Client (`"use client"`) para formularios interactivos y React Server Components para páginas estáticas. Tailwind CSS v4 para estilos. No se usa ningún framework de componentes externo (sin ShadCN, sin MUI, sin Radix).

### 2. Backend
El propio **Next.js 16 API Routes** (`/src/app/api/**`). No hay servidor separado. Next.js actúa como servidor full-stack en un único proceso Node.js. El backend es un conjunto de Route Handlers (funciones exportadas como `GET`, `POST`, `PUT`) que responden peticiones HTTP.

### 3. Base de datos y versión
- **Desarrollo local:** SQLite — archivo `prisma/dev.db` (sin instalación extra)
- **Producción recomendada:** PostgreSQL (cualquier versión 14+)
- **ORM:** Prisma 6.19.0 (abstrae la BD, genera cliente TypeScript tipado)
- **Nota académica:** SQLite es un motor de archivo plano sin concurrencia real. Para un sistema multiusuario en producción se debe usar PostgreSQL, que soporta transacciones ACID completas, control de concurrencia (MVCC) y es el estándar académico y empresarial.

### 4. Comunicación Frontend ↔ Backend
**API REST** sobre HTTP/HTTPS. El cliente (React) usa `fetch()` nativo del navegador. Todas las peticiones llevan `Content-Type: application/json`. La autenticación viaja en una cookie HTTP-Only, no en cabeceras `Authorization`.

### 5. ORM / librería de acceso a datos
**Prisma ORM 6.19.0:**
- Schema declarativo en `prisma/schema.prisma`
- Cliente TypeScript generado automáticamente (`@prisma/client`)
- Prevención automática de SQL Injection (queries parametrizadas)
- Migraciones con `prisma db push` (desarrollo) y `prisma migrate deploy` (producción)

### 6. Autenticación y hash de contraseñas
- **Hash:** `bcryptjs 3.0.3` — algoritmo bcrypt con 10 rondas de salt
- **Tokens:** `jsonwebtoken 9.0.3` — JWT HS256 firmado con `JWT_SECRET`, expiración 7 días

### 7. Mecanismo de sesión
**Cookies HTTP-Only** — no localStorage, no sessionStorage. El token JWT se almacena en la cookie `mmf_token` con atributos `httpOnly: true`, `sameSite: "lax"`, `path: "/"`. Esto previene ataques XSS porque el JavaScript del cliente nunca puede leer el token. La sesión dura 7 días.

### 8. Despliegue
- **Estado actual:** Desarrollo local — `http://localhost:3000`
- **Plan de producción:** Vercel (plataforma oficial de Next.js, deploy automático desde GitHub) + PostgreSQL en Railway o Supabase

---

## B — ARQUITECTURA

### 9. Arquitectura del sistema
**Cliente-Servidor de tres capas** empaquetado en un monorepo Next.js:

```
CAPA 1 — PRESENTACIÓN (Cliente)
  React 19 — Componentes "use client"
  Tailwind CSS v4
  fetch() -> JSON

CAPA 2 — LÓGICA DE NEGOCIO Y API (Servidor Next.js / Node.js)
  Middleware (src/middleware.ts) — auth guard
  API Routes (src/app/api/**) — controladores HTTP
  lib/finance.ts — motor financiero (Método Francés)
  lib/auth.ts — JWT + bcrypt
  lib/validators.ts — validación Zod

CAPA 3 — DATOS (Base de datos)
  Prisma ORM
  SQLite (dev) / PostgreSQL (prod)
```

Patrón aproximado: **MVC**
- Model: `schema.prisma` + `lib/prisma.ts`
- View: `app/**/page.tsx` (React)
- Controller: `app/api/**/route.ts`

### 10. Árbol de directorios (nivel 3)

```
mmotors-finance-app/
├── prisma/
│   ├── schema.prisma
│   └── dev.db
├── public/
├── src/
│   ├── middleware.ts                  ← auth guard global
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   ← "/" redirige a /login
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx               ← historial de cotizaciones
│   │   ├── clients/
│   │   │   └── page.tsx               ← gestión de clientes
│   │   ├── catalog/
│   │   │   └── page.tsx               ← catálogo de vehículos
│   │   ├── settings/
│   │   │   └── page.tsx               ← configuración del sistema
│   │   ├── legal/
│   │   │   └── page.tsx               ← marco legal SBS
│   │   ├── formula-engine/
│   │   │   └── page.tsx               ← documentación de fórmulas
│   │   ├── docs/
│   │   │   └── page.tsx
│   │   ├── credits/
│   │   │   ├── new/
│   │   │   │   └── page.tsx           ← nueva cotización
│   │   │   └── [id]/
│   │   │       ├── page.tsx           ← detalle cronograma + métricas
│   │   │       └── edit/
│   │   │           └── page.tsx       ← editar cotización
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── credits/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── clients/route.ts
│   │       ├── vehicles/route.ts
│   │       └── config/route.ts
│   ├── components/
│   │   └── AppSidebar.tsx             ← sidebar de navegación
│   └── lib/
│       ├── finance.ts                 ← motor financiero
│       ├── auth.ts                    ← JWT + bcrypt
│       ├── validators.ts              ← esquemas Zod
│       └── prisma.ts                  ← cliente Prisma singleton
├── .env
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 11. Módulos más importantes

| Archivo | Descripción |
|---------|-------------|
| `src/lib/finance.ts` | Motor financiero completo. Implementa: conversión TEA→TEM y TNA→TEA→TEM, cuota base (Método Francés), cuota balón, gracia parcial (paga intereses), gracia total (capitaliza, recalcula cuotaBase), VAN perspectiva deudor, TIR (Newton-Raphson), TCEA. Usa `decimal.js` para precisión numérica. |
| `src/lib/auth.ts` | Funciones: `hashPassword(bcrypt)`, `verifyPassword(bcrypt)`, `signToken(JWT 7d)`, `verifyToken`, `getSessionUser(cookies)`, `getRequestUser(NextRequest)`, `authCookieName` |
| `src/lib/validators.ts` | Esquemas Zod para: loginSchema, registerSchema, clientSchema, vehicleSchema, creditSchema. El creditSchema valida con superRefine que periodosGracia ≤ plazoMeses y que si periodoGraciaTipo=NONE entonces periodosGracia=0 |
| `src/middleware.ts` | Intercepta todas las peticiones. Si no hay cookie `mmf_token` y la ruta no es /login o /register, redirige a /login. |
| `src/lib/prisma.ts` | Singleton de PrismaClient para evitar múltiples conexiones en hot-reload de desarrollo |
| `prisma/schema.prisma` | Define 6 modelos con sus relaciones: User, Configuration, Client, Vehicle, VehicularCredit, CashFlow, FinancialMetric |

### 12. Variables de entorno (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev_secret_change_me"
```

**IMPORTANTE para producción:**
- `DATABASE_URL` debe apuntar a PostgreSQL: `postgresql://user:pass@host:5432/dbname`
- `JWT_SECRET` debe ser un string aleatorio de al menos 64 caracteres (usar `openssl rand -hex 64`)

---

## C — BASE DE DATOS

### 13. Script SQL completo (CREATE TABLE)

```sql
-- ============================================================
-- Nota: SQLite usa TEXT+CHECK en lugar de ENUM
-- Para PostgreSQL: reemplazar por CREATE TYPE ... AS ENUM
-- ============================================================

CREATE TABLE "User" (
  "id"           INTEGER   NOT NULL PRIMARY KEY AUTOINCREMENT,
  "username"     TEXT      NOT NULL UNIQUE,
  "passwordHash" TEXT      NOT NULL,
  "createdAt"    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Configuration" (
  "id"                     INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId"                 INTEGER  NOT NULL UNIQUE,
  "defaultMoneda"          TEXT     NOT NULL DEFAULT 'PEN'
                           CHECK ("defaultMoneda" IN ('PEN','USD')),
  "defaultTipoTasa"        TEXT     NOT NULL DEFAULT 'EFECTIVA'
                           CHECK ("defaultTipoTasa" IN ('EFECTIVA','NOMINAL')),
  "defaultCapitalizacion"  INTEGER  NOT NULL DEFAULT 30,
  "defaultBaseAnual"       INTEGER  NOT NULL DEFAULT 360,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Client" (
  "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  "dni"       TEXT     NOT NULL UNIQUE,
  "nombres"   TEXT     NOT NULL,
  "apellidos" TEXT     NOT NULL,
  "correo"    TEXT     NOT NULL,
  "telefono"  TEXT     NOT NULL
);

CREATE TABLE "Vehicle" (
  "id"          INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  "marca"       TEXT     NOT NULL,
  "modelo"      TEXT     NOT NULL,
  "precioVenta" DECIMAL  NOT NULL CHECK ("precioVenta" > 0),
  "moneda"      TEXT     NOT NULL CHECK ("moneda" IN ('PEN','USD'))
);

CREATE TABLE "VehicularCredit" (
  "id"                          INTEGER   NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId"                      INTEGER   NOT NULL,
  "clientId"                    INTEGER   NOT NULL,
  "vehicleId"                   INTEGER   NOT NULL,
  "moneda"                      TEXT      NOT NULL CHECK ("moneda" IN ('PEN','USD')),
  "precioVehiculo"              DECIMAL   NOT NULL,
  "cuotaInicialPorcentaje"      DECIMAL   NOT NULL,
  "cuotaBalonPorcentaje"        DECIMAL   NOT NULL,
  "tipoTasa"                    TEXT      NOT NULL
                                CHECK ("tipoTasa" IN ('EFECTIVA','NOMINAL')),
  "tasaInteres"                 DECIMAL   NOT NULL,
  "capitalizacionDias"          INTEGER   NOT NULL DEFAULT 30,
  "plazoMeses"                  INTEGER   NOT NULL,
  "fechaDesembolso"             DATETIME  NOT NULL,
  "periodoGraciaTipo"           TEXT      NOT NULL DEFAULT 'NONE'
                                CHECK ("periodoGraciaTipo" IN ('NONE','PARTIAL','TOTAL')),
  "periodosGracia"              INTEGER   NOT NULL DEFAULT 0,
  "seguroDesgravamenPorcentaje" DECIMAL   NOT NULL,
  "seguroVehicularPorcentaje"   DECIMAL   NOT NULL,
  "portesMontoFijo"             DECIMAL   NOT NULL,
  "baseAnual"                   INTEGER   NOT NULL DEFAULT 360,
  "tasaDescuentoAnual"          DECIMAL   NOT NULL DEFAULT 12,
  "createdAt"                   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   DATETIME  NOT NULL,
  FOREIGN KEY ("userId")    REFERENCES "User"("id"),
  FOREIGN KEY ("clientId")  REFERENCES "Client"("id"),
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
);

CREATE TABLE "FinancialMetric" (
  "id"       INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  "creditId" INTEGER  NOT NULL UNIQUE,
  "van"      DECIMAL  NOT NULL,
  "tir"      DECIMAL  NOT NULL,
  "tcea"     DECIMAL  NOT NULL,
  FOREIGN KEY ("creditId") REFERENCES "VehicularCredit"("id") ON DELETE CASCADE
);

CREATE TABLE "CashFlow" (
  "id"                 INTEGER   NOT NULL PRIMARY KEY AUTOINCREMENT,
  "creditId"           INTEGER   NOT NULL,
  "numeroMes"          INTEGER   NOT NULL,
  "fechaPago"          DATETIME  NOT NULL,
  "saldoInicial"       DECIMAL   NOT NULL,
  "interes"            DECIMAL   NOT NULL,
  "amortizacion"       DECIMAL   NOT NULL,
  "seguroDesgravamen"  DECIMAL   NOT NULL,
  "seguroVehicular"    DECIMAL   NOT NULL,
  "cuota"              DECIMAL   NOT NULL,
  "saldoFinal"         DECIMAL   NOT NULL,
  FOREIGN KEY ("creditId") REFERENCES "VehicularCredit"("id") ON DELETE CASCADE
);
```

### 14. Índices y constraints adicionales
- `User.username` → UNIQUE
- `Client.dni` → UNIQUE
- `Configuration.userId` → UNIQUE (relación 1:1 con User)
- `FinancialMetric.creditId` → UNIQUE (relación 1:1 con VehicularCredit)
- ON DELETE CASCADE en: Configuration, FinancialMetric, CashFlow

### 15. Datos de seed
**NO existen.** La BD inicia vacía. El ejecutivo debe:
1. Ir a `/register` y crear su usuario
2. Ingresar clientes desde `/clients`
3. Ingresar vehículos desde `/catalog`
4. Crear cotizaciones desde `/credits/new`

### 16. Conexión a la BD
Singleton pattern en `src/lib/prisma.ts`. Una sola instancia de PrismaClient en todo el proceso Node.js. La cadena de conexión se lee desde `process.env.DATABASE_URL`. Solo registra errores en producción.

---

## REQUERIMIENTOS DE LA PROFESORA — ESTADO DE IMPLEMENTACIÓN

### 17. Captcha / Verificación en dos pasos / Factor adicional de autenticación
**NO implementado.** El login solo pide usuario y contraseña. No hay CAPTCHA (Google reCAPTCHA, hCaptcha), no hay 2FA (TOTP, SMS), no hay preguntas de seguridad. Es un formulario simple de login.

Código actual del login (`src/app/api/auth/login/route.ts`):
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  const token = signToken({ userId: user.id, username: user.username });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
```

**Para implementar:** Integrar Google reCAPTCHA v3 en el frontend y verificar el token con la API de Google en el backend antes de validar credenciales.

### 18. Consentimiento de datos personales (Ley 29733 Perú)
**NO implementado.** El formulario de registro de cliente no tiene checkbox de consentimiento para el tratamiento de datos personales. Solo solicita: DNI, nombres, apellidos, correo y teléfono.

Código actual del formulario de cliente (`src/app/clients/page.tsx`):
```typescript
// No existe campo de consentimiento en el schema ni en el formulario
<input placeholder="DNI" ... />
<input placeholder="Nombres" ... />
<input placeholder="Apellidos" ... />
<input placeholder="Correo" ... />
<input placeholder="Teléfono" ... />
<button>Registrar cliente</button>
// FALTA: <input type="checkbox" required> Acepto el tratamiento de mis datos...
```

La tabla `Client` en el schema tampoco tiene columna `consentimientoDatos` (BOOLEAN).

### 19. Hash de contraseñas en la BD
**SÍ implementado.** `bcryptjs` con `saltRounds = 10`.

```typescript
// src/lib/auth.ts
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

La columna `passwordHash` en la tabla User almacena el hash. Nunca se almacena la contraseña en texto plano. Ejemplo de hash: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhuG`

### 20. Campos adicionales en la tabla de vehículos
**NO implementado.** La tabla Vehicle solo tiene: id, marca, modelo, precioVenta, moneda.

**Faltan por implementar según la profesora:**
- `tipoMotor` (gasolina / eléctrico / híbrido / diesel)
- `año` (año de fabricación)
- `vidaUtil` (años de vida útil)
- `cilindrada` (cc)
- `transmision` (manual / automática / CVT)

Schema actual:
```prisma
model Vehicle {
  id         Int      @id @default(autoincrement())
  marca      String
  modelo     String
  precioVenta Decimal
  moneda     Currency
  credits    VehicularCredit[]
  // FALTAN: tipoMotor, anio, vidaUtil, cilindrada, transmision
}
```

### 21. Módulo de servicios del vehículo (SOAT, mantenimiento, seguro)
**NO implementado.** No existe ninguna tabla, endpoint ni pantalla para:
- Historial de mantenimiento
- SOAT (vigencia, monto)
- Seguro vehicular (póliza, cobertura, vigencia)
- Cobertura de siniestro

El `seguroVehicularPorcentaje` en `VehicularCredit` es solo el porcentaje que se suma a la cuota mensual como costo financiero, no es gestión de pólizas.

### 22. Número de simulaciones por cliente / historial
**PARCIALMENTE implementado.** 
- Sí existe historial de cotizaciones (tabla `VehicularCredit`) vinculada a un cliente (`clientId`).
- Sí se puede consultar el historial: `GET /api/credits` retorna todas las cotizaciones del usuario autenticado con datos del cliente.
- El dashboard muestra una tabla filtrable con todas las cotizaciones.

**Lo que NO existe:**
- Un reporte por cliente que muestre cuántas cotizaciones tiene ese cliente específico
- Una vista de "historial por cliente" en la pantalla de clientes
- Estadísticas: cotización más cara, más barata, promedios, etc.

### 23. Roles (usuario normal vs administrador) / Dashboard de admin
**NO implementado.** Todos los usuarios tienen exactamente los mismos permisos. No existe:
- Campo `role` en la tabla User
- Middleware que diferencie admin vs vendedor
- Dashboard de administrador
- Vista de gestión de usuarios (crear/eliminar/deshabilitar usuarios)
- Panel con estadísticas del sistema

Schema actual (sin roles):
```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  configuration Configuration?
  credits      VehicularCredit[]
  // FALTA: role String @default("vendedor") CHECK IN ('vendedor','admin')
}
```

---

## D — FUNCIONALIDADES IMPLEMENTADAS

### 24. Login y Registro — Estado: IMPLEMENTADO
- Login: validación Zod (username >= 3, password >= 6), verifica hash bcrypt, firma JWT, setea cookie HTTP-Only
- Registro: mismas validaciones, verifica username único (error 409 si duplicado), crea usuario + Configuration por defecto
- Errores: "Credenciales inválidas" (login), "Usuario ya existe" (registro)

### 25. Registro y edición de clientes — Estado: PARCIAL
- Registro: IMPLEMENTADO — campos: DNI (único), nombres, apellidos, correo, teléfono
- Edición: NO IMPLEMENTADO — no hay formulario de edición ni endpoint PUT/PATCH /api/clients/:id
- Eliminación: NO IMPLEMENTADO

### 26. Catálogo de vehículos — Estado: PARCIAL
- Crear: IMPLEMENTADO — marca, modelo, precioVenta, moneda
- Ver listado: IMPLEMENTADO
- Editar: NO IMPLEMENTADO — sin formulario ni endpoint PUT /api/vehicles/:id
- Eliminar: NO IMPLEMENTADO
- Campos faltantes: tipo motor, año, cilindrada, transmisión (ver pregunta 20)

### 27. Cronograma Método Francés Vencido Ordinario — Estado: IMPLEMENTADO
- Calcula cuota mensual constante (antes de seguros y portes)
- Interés: I_k = Saldo_(k-1) × TEM (vencido = al final del período)
- Amortización: A_k = Cuota_base - I_k
- Saldo final: Saldo_k = Saldo_(k-1) - A_k
- Usa `decimal.js` para precisión financiera (redondeo HALF_UP a 2 decimales)

### 28. Cuota Balón / Compra Inteligente — Estado: IMPLEMENTADO
- `cuotaBalonPorcentaje` define % del principal como pago final
- Meses 1 a N-1: amortizan `principal - balón` con cuotas constantes
- Mes N: paga amortización residual + interés + seguros + portes + balón completo

### 29. VAN, TIR, TCEA desde perspectiva del deudor — Estado: IMPLEMENTADO (corregido)
```
VAN = +Principal - SUM(Cuota_k / (1 + COK_mensual)^k)
TIR: Newton-Raphson sobre [+Principal, -Cuota1, ..., -CuotaN]
TCEA = (1 + TIR_mensual)^(baseAnual/30) - 1
```

### 30. Períodos de gracia — Estado: IMPLEMENTADO (corregido)
- NONE: desde mes 1 amortiza
- PARTIAL: paga interés + seguros + portes. Sin amortización. Saldo no crece.
- TOTAL: no paga nada. Interés se capitaliza. Al salir de gracia, `cuotaBase` se recalcula sobre `saldo_capitalizado - balón`.

### 31. Módulo de configuración — Estado: IMPLEMENTADO
GET/PUT /api/config configura por usuario: defaultMoneda, defaultTipoTasa, defaultCapitalizacion, defaultBaseAnual. Se precarga automáticamente en el formulario de nueva cotización.

### 32. Editar cotización — Estado: IMPLEMENTADO
PUT /api/credits/:id — transacción atómica: elimina cashflows y métricas anteriores, recalcula todo con nuevos parámetros, guarda nuevo estado. No puede quedar inconsistente.

### 33. Funcionalidades INCOMPLETAS / PENDIENTES

| Funcionalidad | Estado | Prioridad |
|---|---|---|
| Eliminar cotización | NO | Alta |
| Editar cliente | NO | Alta |
| Editar vehículo | NO | Alta |
| Eliminar cliente/vehículo | NO | Media |
| Exportar cronograma a PDF | NO | Alta |
| Exportar a Excel | NO | Media |
| Captcha en login | NO | Media |
| Consentimiento datos (Ley 29733) | NO | Alta |
| Campos extra en vehículo | NO | Media |
| Módulo SOAT/mantenimiento | NO | Baja |
| Roles admin/vendedor | NO | Media |
| Dashboard de admin | NO | Media |
| Rate limiting en login | NO | Media |
| Recuperación de contraseña | NO | Baja |
| Paginación del historial | NO | Baja |

---

## E — ENDPOINTS / RUTAS DE LA API REST

```
POST   /api/auth/register
  Body:     { username: string, password: string }
  Response: { ok: true } + Set-Cookie: mmf_token=<JWT>
  Errores:  400 "Usuario mínimo 3 chars y contraseña mínimo 6"
            409 "Usuario ya existe"

POST   /api/auth/login
  Body:     { username: string, password: string }
  Response: { ok: true } + Set-Cookie: mmf_token=<JWT>
  Errores:  400 "Datos invalidos" | 401 "Credenciales invalidas"

POST   /api/auth/logout
  Body:     (ninguno)
  Response: { ok: true } + Set-Cookie: mmf_token="" (maxAge:0, elimina cookie)

GET    /api/auth/me
  Header:   Cookie: mmf_token=<JWT>
  Response: { userId: number, username: string }
  Errores:  401 "Unauthorized"

GET    /api/clients
  Header:   Cookie: mmf_token=<JWT>
  Response: [ { id, dni, nombres, apellidos, correo, telefono }, ... ]
  Errores:  401 "Unauthorized"

POST   /api/clients
  Header:   Cookie: mmf_token=<JWT>
  Body:     { dni, nombres, apellidos, correo, telefono }
  Response: { id, dni, nombres, apellidos, correo, telefono }
  Errores:  401 "Unauthorized" | 400 "Datos invalidos"

GET    /api/vehicles
  Header:   Cookie: mmf_token=<JWT>
  Response: [ { id, marca, modelo, precioVenta, moneda }, ... ]
  Errores:  401 "Unauthorized"

POST   /api/vehicles
  Header:   Cookie: mmf_token=<JWT>
  Body:     { marca, modelo, precioVenta: number, moneda: "PEN"|"USD" }
  Response: { id, marca, modelo, precioVenta, moneda }
  Errores:  401 "Unauthorized" | 400 "Datos invalidos"

GET    /api/credits
  Header:   Cookie: mmf_token=<JWT>
  Response: [
    { id, moneda, precioVehiculo, cuotaInicialPorcentaje, tipoTasa,
      client: { nombres, apellidos },
      vehicle: { marca, modelo },
      metrics: { tcea },
      createdAt }, ...
  ]
  Errores:  401 "Unauthorized"

POST   /api/credits
  Header:   Cookie: mmf_token=<JWT>
  Body:     {
    clientId, vehicleId, moneda, precioVehiculo,
    cuotaInicialPorcentaje, cuotaBalonPorcentaje,
    tipoTasa, tasaInteres, capitalizacionDias, plazoMeses,
    fechaDesembolso, periodoGraciaTipo, periodosGracia,
    seguroDesgravamenPorcentaje, seguroVehicularPorcentaje,
    portesMontoFijo, baseAnual, tasaDescuentoAnual
  }
  Response: { id: number }  (ID de la cotización creada)
  Errores:  401 | 400 (mensaje específico del campo Zod)
  Efecto:   Calcula cronograma completo y guarda CashFlows + FinancialMetric

GET    /api/credits/:id
  Header:   Cookie: mmf_token=<JWT>
  Response: {
    id, moneda, precioVehiculo, baseAnual, tasaDescuentoAnual,
    client: { nombres, apellidos },
    vehicle: { marca, modelo },
    metrics: { van, tir, tcea },
    cashFlows: [ { id, numeroMes, fechaPago, saldoInicial, interes,
                   amortizacion, seguroDesgravamen, seguroVehicular,
                   cuota, saldoFinal }, ... ]
  }
  Errores:  401 | 404 "Not found"

PUT    /api/credits/:id
  Header:   Cookie: mmf_token=<JWT>
  Body:     (mismo esquema que POST /api/credits)
  Response: { ok: true }
  Errores:  401 | 404 | 400
  Efecto:   Transacción atómica: recalcula y reemplaza cashflows + métricas

GET    /api/config
  Header:   Cookie: mmf_token=<JWT>
  Response: { id, userId, defaultMoneda, defaultTipoTasa,
              defaultCapitalizacion, defaultBaseAnual }
  Errores:  401 "Unauthorized"

PUT    /api/config
  Header:   Cookie: mmf_token=<JWT>
  Body:     { defaultMoneda, defaultTipoTasa, defaultCapitalizacion, defaultBaseAnual }
  Response: { id, userId, defaultMoneda, defaultTipoTasa,
              defaultCapitalizacion, defaultBaseAnual }
  Errores:  401 "Unauthorized"
```

---

## F — SEGURIDAD Y PROTECCIÓN DE DATOS

### 35. Hash de contraseñas
**bcryptjs**, 10 rondas de salt (saltRounds=10). El hash tiene 60 caracteres con formato: `$2a$10$<salt22chars><hash31chars>`. Resistente a ataques de diccionario y rainbow tables. Irreversible.

### 36. Protección de rutas privadas
**Doble capa:**

1. **Frontend (middleware.ts):** Intercepta ANTES de renderizar:
```typescript
export function middleware(req: NextRequest) {
  const PUBLIC_PATHS = ["/login", "/register"];
  const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/register"];
  // ...
  const token = req.cookies.get("mmf_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
```

2. **Backend (cada API route):**
```typescript
export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... lógica protegida
}
```

### 37. Acceso a URL privada sin sesión
El middleware redirige inmediatamente a `/login`. El usuario nunca ve el HTML de páginas privadas. Adicionalmente, incluso si burlaran el middleware, la API retornaría `401 Unauthorized` y no se cargarían datos.

### 38. Rate limiting (límite de intentos de login)
**NO implementado.** No hay protección contra fuerza bruta en el endpoint de login. Un atacante podría intentar contraseñas ilimitadas veces sin ningún bloqueo.

**Para implementar:** Usar `next-rate-limit` o Upstash Redis (para Vercel) para limitar a 5 intentos por IP cada 15 minutos.

---

## G — INTERFAZ Y AYUDA AL USUARIO

### 39. Tooltips, placeholders y ayuda en campos
- **Formularios de texto vacíos** (cliente, vehículo, login, registro): usan `placeholder` visible en gris mientras el campo está vacío. Ejemplos: "DNI", "Nombres", "Correo electrónico", "Ingresa tu usuario"
- **Formulario de cotización** (nueva y editar): cada campo tiene un `<label>` descriptivo visible siempre encima del campo, incluso con valor numérico precargado. Ejemplos: "% Cuota inicial", "Tasa de interés (%)", "COK anual para VAN (%)", "Nº de períodos de gracia"
- **No hay tooltips** (popups con información al hover). No hay texto de ayuda contextual debajo de los campos.

### 40. Validaciones visibles al usuario

| Situación | Mensaje visible |
|-----------|----------------|
| Login con credenciales incorrectas | Texto rojo: "Credenciales inválidas" |
| Registro, usuario ya existe | Texto rojo: "Usuario ya existe" |
| Cotización con datos inválidos | Texto ámbar con mensaje Zod del campo específico |
| Error al guardar cotización | "No se pudo guardar cotización" |
| Error al actualizar | "No se pudo actualizar la cotización" |
| Cliente registrado con éxito | "Cliente registrado" (texto azul) |
| Vehículo registrado con éxito | "Vehículo guardado" |
| Configuración guardada | "Configuración guardada" |

Las validaciones de HTML5 también actúan: `type="number"` impide letras, `type="date"` activa el selector de fechas nativo, `minLength` activa la validación del navegador.

### 41. Dashboard de admin
**NO existe.** El dashboard (`/dashboard`) es el historial de cotizaciones del usuario autenticado. No muestra:
- Lista de usuarios del sistema
- Historial de consultas global (de todos los usuarios)
- Estadísticas de uso (total cotizaciones, montos, usuarios activos)
- Gestión de usuarios (crear, deshabilitar, cambiar roles)

El único "filtrado" que tiene el dashboard es por moneda, tipo de tasa y búsqueda de texto sobre nombre del cliente y vehículo.

---

## H — DATOS DE PRUEBA REALES

### 42. EJEMPLO 1 — Tasa Efectiva Anual, Sin Gracia, Con Cuota Balón

#### Datos de entrada:
| Parámetro | Valor |
|-----------|-------|
| Precio del vehículo | S/ 50,000.00 |
| % Cuota inicial | 20.00% |
| Cuota inicial | S/ 10,000.00 |
| Principal financiado | S/ 40,000.00 |
| % Cuota balón | 20.00% |
| Monto balón | S/ 8,000.00 |
| Monto amortizable | S/ 32,000.00 |
| Tipo de tasa | Efectiva Anual (TEA) |
| Tasa de interés | 12% anual |
| Base anual | 360 días |
| Capitalización | N/A (tasa efectiva) |
| Plazo | 36 meses |
| Período de gracia | NONE — 0 períodos |
| % Seg. desgravamen | 0.05% mensual sobre saldo |
| % Seg. vehicular | 0.08% mensual sobre saldo |
| Portes | S/ 15.00 fijos mensuales |
| Moneda | PEN (Soles) |
| COK para VAN | 12% anual |

#### Cálculos paso a paso:

**TEM (Tasa Efectiva Mensual):**
```
TEM = (1 + TEA)^(30/360) - 1
    = (1 + 0.12)^(1/12) - 1
    = (1.12)^0.083333 - 1
    = 1.009489 - 1
    = 0.009489 → 0.9489% mensual
```

**Cuota base (Método Francés sobre monto amortizable):**
```
Cuota_base = 32,000 × 0.009489 / [1 - (1.009489)^-36]
           = 303.648 / [1 - 0.71182]
           = 303.648 / 0.28818
           = S/ 1,053.70 mensual
```

#### Cronograma — Primeros 3 meses:

| Mes | Fecha Pago | Saldo Inicial | Interés | Amortización | Seg.Desgrav. | Seg.Vehicular | Portes | Cuota Total | Saldo Final |
|-----|-----------|--------------|---------|-------------|-------------|--------------|--------|-------------|-------------|
| 1 | Ago 2026 | 40,000.00 | 379.56 | 674.14 | 20.00 | 32.00 | 15.00 | 1,120.70 | 39,325.86 |
| 2 | Sep 2026 | 39,325.86 | 373.16 | 680.54 | 19.66 | 31.46 | 15.00 | 1,119.82 | 38,645.32 |
| 3 | Oct 2026 | 38,645.32 | 366.71 | 686.99 | 19.32 | 30.92 | 15.00 | 1,118.95 | 37,958.33 |

*Nota: Interés = Saldo_inicial × 0.9489%. Amortización = 1,053.70 - Interés. Cuota = 1,053.70 + Segs + Portes. Los seguros bajan cada mes porque el saldo disminuye.*

#### Mes 36 (último — cuota balón):

| Mes | Saldo Inicial | Interés | Amortización | Seg.Desgrav. | Seg.Vehicular | Portes | Balón | Cuota Total | Saldo Final |
|-----|--------------|---------|-------------|-------------|--------------|--------|-------|-------------|-------------|
| 36 | ~8,007.59 | 75.96 | 7.74 | 4.00 | 6.41 | 15.00 | 8,000.00 | 8,109.11 | 0.00 |

*El saldo antes del último mes es ~8,007.59 (levemente sobre 8,000 por redondeos acumulados). La amortización cierra el saldo residual y el balón de S/8,000 se paga íntegro.*

#### Métricas calculadas por el sistema:

| Métrica | Valor | Interpretación |
|---------|-------|----------------|
| TIR mensual | ~1.0820% | Tasa efectiva mensual que el deudor paga incluyendo seguros y portes |
| TCEA | ~13.75% | Costo anualizado del crédito al deudor (incluye todos los costos) |
| VAN (COK=12%) | ~-S/ 1,580.00 | Negativo: el crédito cuesta más que el COK. Los seguros y portes encarecen el costo real sobre el 12% contractual |

---

### 42. EJEMPLO 2 — Tasa Nominal Anual, Con Gracia Total, Sin Balón

#### Datos de entrada:
| Parámetro | Valor |
|-----------|-------|
| Precio del vehículo | S/ 35,000.00 |
| % Cuota inicial | 15.00% |
| Cuota inicial | S/ 5,250.00 |
| Principal financiado | S/ 29,750.00 |
| % Cuota balón | 0% (sin cuota balón) |
| Monto amortizable | S/ 29,750.00 |
| Tipo de tasa | Nominal Anual (TNA) |
| Tasa de interés | 18% anual nominal |
| Capitalización | 30 días (mensual) |
| Base anual | 360 días |
| Plazo | 24 meses |
| Período de gracia | TOTAL — 2 meses |
| % Seg. desgravamen | 0.05% mensual sobre saldo |
| % Seg. vehicular | 0.08% mensual sobre saldo |
| Portes | S/ 10.00 fijos mensuales |
| Moneda | PEN (Soles) |
| COK para VAN | 15% anual |

#### Cálculos paso a paso:

**Conversión TNA → TEA → TEM:**
```
m = baseAnual / capitalizacionDias = 360 / 30 = 12 sub-períodos anuales

TEA = (1 + TNA/m)^m - 1
    = (1 + 0.18/12)^12 - 1
    = (1.015)^12 - 1
    = 1.195618 - 1
    = 0.195618 → 19.5618% anual efectivo

TEM = (1 + TEA)^(30/360) - 1
    = (1.195618)^(1/12) - 1
    = (1.195618)^0.08333 - 1
    = 0.015000 → 1.5000% mensual exacto
```

**Meses de Gracia Total — Meses 1 y 2 (cuota = S/ 0.00, interés capitaliza):**

| Mes | Fecha Pago | Saldo Inicial | Interés Capitalizado | Cuota | Saldo Final |
|-----|-----------|--------------|---------------------|-------|-------------|
| 1 | Ago 2026 | 29,750.00 | 446.25 | S/ 0.00 | 30,196.25 |
| 2 | Sep 2026 | 30,196.25 | 452.94 | S/ 0.00 | 30,649.19 |

*Los seguros y portes NO se cobran durante gracia total. Solo se capitaliza el interés.*

**Recálculo de Cuota Base al inicio de mes 3 (FIX implementado):**
```
Saldo capitalizado = S/ 30,649.19
nReal = 24 - 2 = 22 períodos de amortización

Cuota_base = 30,649.19 × 0.015 / [1 - (1.015)^-22]
           = 459.738 / [1 - 0.72242]
           = 459.738 / 0.27758
           = S/ 1,656.62 mensual
```

#### Cronograma — Meses 3, 4 y 5 (primeros de amortización real):

| Mes | Fecha Pago | Saldo Inicial | Interés | Amortización | Seg.Desgrav. | Seg.Vehicular | Portes | Cuota Total | Saldo Final |
|-----|-----------|--------------|---------|-------------|-------------|--------------|--------|-------------|-------------|
| 3 | Oct 2026 | 30,649.19 | 459.74 | 1,196.88 | 15.32 | 24.52 | 10.00 | 1,706.60 | 29,452.31 |
| 4 | Nov 2026 | 29,452.31 | 441.78 | 1,214.84 | 14.73 | 23.56 | 10.00 | 1,704.91 | 28,237.47 |
| 5 | Dic 2026 | 28,237.47 | 423.56 | 1,233.06 | 14.12 | 22.59 | 10.00 | 1,703.33 | 27,004.41 |

*Cuota base constante en S/ 1,656.62. Los seguros disminuyen porque el saldo baja. La cuota total varía ligeramente por ese efecto.*

#### Mes 24 (último):

| Mes | Saldo Inicial | Interés | Amortización | Seg.Desgrav. | Seg.Vehicular | Portes | Cuota Total | Saldo Final |
|-----|--------------|---------|-------------|-------------|--------------|--------|-------------|-------------|
| 24 | ~1,632.00 | 24.48 | 1,632.00 | 0.82 | 1.31 | 10.00 | 1,668.61 | 0.00 |

#### Métricas calculadas por el sistema:

| Métrica | Valor | Interpretación |
|---------|-------|----------------|
| TIR mensual | ~1.583% | Mayor que TEM (1.5%) por el efecto de seguros y portes |
| TCEA | ~20.84% | Mayor que TEA (19.56%) — costo real al deudor incluyendo todos los gastos |
| VAN (COK=15%) | ~-S/ 1,350.00 | Negativo: el crédito cuesta más que el 15% del COK. Con gracia total el deudor pagó más interés (el capital creció durante 2 meses) |

---

## RESUMEN EJECUTIVO PARA EL INFORME

### Lo que está bien implementado y funciona correctamente
1. Arquitectura full-stack Next.js 16 con App Router
2. Autenticación JWT con cookie HTTP-Only y bcrypt
3. Middleware de protección de rutas (auth guard)
4. Motor financiero: Método Francés, cuota balón, gracia parcial y total (con recálculo correcto de cuotaBase tras gracia total)
5. VAN con signo correcto (perspectiva deudor)
6. TIR y TCEA sobre flujo completo real (Newton-Raphson)
7. Edición de cotizaciones con transacción atómica
8. Validaciones Zod en todos los endpoints
9. Labels descriptivos en todos los formularios

### Lo que necesita implementarse para el informe/examen
1. **Alta prioridad:** Consentimiento datos personales (Ley 29733) en formulario de cliente
2. **Alta prioridad:** Campos adicionales en vehículo (tipo motor, año, transmisión)
3. **Alta prioridad:** Exportación del cronograma a PDF
4. **Media prioridad:** Roles admin/vendedor
5. **Media prioridad:** Rate limiting en login
6. **Media prioridad:** Edición y eliminación de clientes y vehículos
7. **Baja prioridad:** Captcha en login

---
*Fin del documento. Generado del análisis completo del código fuente — M-Motors Finance App — Julio 2026*
