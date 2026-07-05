# INFORME TÉCNICO COMPLETO — M-MOTORS FINANCE APP
> Documento generado para uso académico universitario.
> Actualizado: Julio 2026

---

## SECCIÓN A — STACK TECNOLÓGICO

### 1. Frontend
**Next.js 16.2.4** con **React 19.2.4** usando el App Router. No se usa ningún framework UI externo (sin ShadCN, sin MUI). Tailwind CSS v4 para estilos.

### 2. Backend
El backend es el propio **Next.js API Routes** (`/app/api/*`). No hay servidor Express separado. Next.js actúa como servidor full-stack: sirve el frontend y expone la API REST en el mismo proceso. El runtime es **Node.js** (versión LTS).

### 3. Base de datos
- **Motor actual (desarrollo local):** SQLite — archivo `prisma/dev.db`
- **ORM:** Prisma 6.19.0
- **Nota para producción:** Migrar a **PostgreSQL**. SQLite no tiene control de concurrencia real. El cambio requiere solo modificar `datasource provider = "postgresql"` en `schema.prisma` y actualizar `DATABASE_URL`.

### 4. Comunicación Frontend <-> Backend
**API REST** sobre HTTP/HTTPS. El frontend usa `fetch()` nativo. La comunicación es siempre JSON.

### 5. Formato de intercambio
**JSON** exclusivamente. Todos los endpoints: `Content-Type: application/json`.

### 6. ORM
**Prisma ORM 6.19.0** — cliente TypeScript tipado, prevención automática de SQL Injection, migraciones con `prisma db push`.

### 7. Autenticación
- **Hash contraseñas:** `bcryptjs 3.0.3` con salt rounds = 10
- **Tokens:** `jsonwebtoken 9.0.3` — JWT firmado, expiración 7 días
- **Transporte:** Cookie HTTP-Only (`mmf_token`), `sameSite: lax`
- **Validación en API:** función `getRequestUser(req)` en cada endpoint
- **Guard de rutas frontend:** `src/middleware.ts`

### 8. Despliegue planificado
Vercel (plataforma oficial de Next.js) + PostgreSQL en Railway o Supabase. Estado actual: desarrollo local `http://localhost:3000`.

---

## SECCIÓN B — ARQUITECTURA DEL SISTEMA

### 9. Arquitectura

El sistema sigue una arquitectura **Cliente-Servidor de tres capas** dentro de un monorepo Next.js:

```
NAVEGADOR (Cliente)
  React 19 — Componentes "use client"
  fetch() -> JSON -> API Routes
        |
        | HTTP/HTTPS
        v
NEXT.JS SERVER (Node.js)
  ├── App Router (páginas HTML)
  ├── middleware.ts (auth guard)
  ├── API Routes /api/*
  └── Capa de negocio (lib/)
      ├── finance.ts  (Método Francés, VAN, TIR, TCEA)
      ├── auth.ts     (JWT, bcrypt)
      └── validators.ts (Zod)
        |
        | Prisma ORM
        v
BASE DE DATOS (SQLite / PostgreSQL)
  User, Client, Vehicle, VehicularCredit,
  CashFlow, FinancialMetric, Configuration
```

**Patrón de diseño aproximado: MVC**
- **Model:** `schema.prisma` + `src/lib/prisma.ts`
- **View:** `src/app/**/page.tsx` — componentes React
- **Controller:** `src/app/api/**/route.ts` — manejadores HTTP

### 10. Árbol de directorios

```
mmotors-finance-app/
├── prisma/
│   ├── schema.prisma          <- Esquema de BD
│   └── dev.db                 <- SQLite local
├── src/
│   ├── middleware.ts           <- Auth guard global
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            <- "/" -> /login
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx  <- Historial cotizaciones
│   │   ├── clients/page.tsx
│   │   ├── catalog/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── legal/page.tsx
│   │   ├── formula-engine/page.tsx
│   │   ├── credits/
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── auth/me/route.ts
│   │       ├── credits/route.ts
│   │       ├── credits/[id]/route.ts
│   │       ├── clients/route.ts
│   │       ├── vehicles/route.ts
│   │       └── config/route.ts
│   ├── components/
│   │   └── AppSidebar.tsx
│   └── lib/
│       ├── finance.ts
│       ├── auth.ts
│       ├── validators.ts
│       └── prisma.ts
├── .env
├── next.config.ts
└── package.json
```

### 11. Módulos más importantes

| Archivo | Rol | Descripción |
|---------|-----|-------------|
| `src/lib/finance.ts` | Motor de negocio | Método Francés, cuota balón, gracia total/parcial, VAN, TIR (Newton-Raphson), TCEA |
| `src/lib/auth.ts` | Seguridad | hashPassword, verifyPassword, signToken (JWT 7d), verifyToken, getRequestUser |
| `src/lib/validators.ts` | Validación | Esquemas Zod para todos los endpoints. Valida periodosGracia <= plazoMeses |
| `src/middleware.ts` | Auth guard | Redirige a /login si no hay cookie mmf_token |
| `src/lib/prisma.ts` | Acceso a BD | Singleton PrismaClient |
| `prisma/schema.prisma` | Esquema BD | 6 modelos: User, Client, Vehicle, VehicularCredit, CashFlow, FinancialMetric |
| `src/app/api/credits/route.ts` | API Controller | POST: valida, calcula, guarda. GET: lista por usuario |

### 12. Variables de entorno (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev_secret_change_me"
```

---

## SECCIÓN C — BASE DE DATOS

### 13. Script SQL (traducido de schema.prisma)

```sql
-- SQLite: usa TEXT + CHECK en lugar de ENUM
-- PostgreSQL: CREATE TYPE moneda_enum AS ENUM ('PEN','USD') etc.

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
  "tipoTasa"                    TEXT      NOT NULL CHECK ("tipoTasa" IN ('EFECTIVA','NOMINAL')),
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

### 14. Constraints adicionales
- `User.username` -> UNIQUE
- `Client.dni` -> UNIQUE
- `Configuration.userId` -> UNIQUE (relacion 1-a-1 con User)
- `FinancialMetric.creditId` -> UNIQUE (relacion 1-a-1 con VehicularCredit)
- ON DELETE CASCADE en Configuration, FinancialMetric, CashFlow

### 15. Datos de seed
No existen. La BD comienza vacía. El flujo inicial es: registrar usuario -> agregar clientes/vehículos -> crear cotizaciones.

### 16. Conexión a la BD
- Singleton pattern en `src/lib/prisma.ts`
- Cadena de conexión desde `process.env.DATABASE_URL`
- Solo log de errores en producción

---

## SECCIÓN D — FUNCIONALIDADES IMPLEMENTADAS

### 17. Login y Registro (IMPLEMENTADO)
- Validacion Zod: usuario >= 3 chars, password >= 6 chars
- Hash bcrypt, JWT firmado, cookie HTTP-Only
- Error 409 si usuario duplicado

### 18. Registro de Clientes y Vehículos (IMPLEMENTADO)
- Clientes: dni unico, email validado con Zod
- Vehículos: precio positivo, moneda PEN/USD
- Ambos protegidos con auth

### 19. Cronograma Metodo Frances (IMPLEMENTADO)
Genera fila por periodo: saldoInicial, interes, amortizacion, seguroDesgravamen, seguroVehicular, cuota, saldoFinal. Cuota base constante en periodos sin gracia.

### 20. Cuota Balon / Compra Inteligente (IMPLEMENTADO)
- cuotaBalonPorcentaje define % del principal como pago final
- Meses 1 a N-1: amortizan (principal - balon) con cuotas constantes
- Mes N: amortizacion residual + interes + segs + portes + BALON completo

### 21. VAN, TIR, TCEA (IMPLEMENTADO - corregidos)
- VAN = +principal - SUM(cuota_t / (1+COK_mensual)^t) -- perspectiva deudor
- TIR: Newton-Raphson sobre flujo completo [+principal, -cuota1, ..., -cuotaN]
- TCEA = (1 + TIR_mensual)^(baseAnual/30) - 1

### 22. Periodos de Gracia (IMPLEMENTADO - corregidos)
- NONE: amortizacion desde mes 1
- PARTIAL: paga interes + segs + portes, no amortiza. Saldo no crece.
- TOTAL: no paga nada. Interes capitaliza al saldo. Al terminar la gracia, cuotaBase se RECALCULA sobre saldo_capitalizado - balon.

### 23. Configuracion (IMPLEMENTADO)
GET/PUT /api/config: moneda, tipo tasa, capitalizacion, base anual por defecto por usuario.

### 24. Editar Cotizacion (IMPLEMENTADO)
PUT /api/credits/:id con prisma.$transaction: elimina cashflows y metricas anteriores, recalcula todo, guarda nuevo estado. Atomico.

### 25. Funcionalidades NO implementadas

| Funcionalidad | Estado |
|---|---|
| Eliminar cotizacion | NO (sin boton ni endpoint DELETE) |
| Eliminar/editar cliente o vehiculo | NO |
| Exportar PDF/Excel | NO |
| Paginacion del historial | NO |
| Recuperacion de contrasena | NO |
| Roles admin/vendedor | NO |
| Graficos en dashboard | PARCIAL (solo tabla) |

---

## SECCIÓN E — ENDPOINTS API REST

| Metodo | Ruta | Auth | Body | Respuesta | Descripcion |
|--------|------|------|------|-----------|-------------|
| POST | /api/auth/register | No | {username, password} | {ok:true} + cookie | Crea usuario |
| POST | /api/auth/login | No | {username, password} | {ok:true} + cookie | Autentica |
| POST | /api/auth/logout | No | — | {ok:true} | Elimina cookie |
| GET | /api/auth/me | Si | — | {userId, username} | Usuario en sesion |
| GET | /api/clients | Si | — | Client[] | Lista clientes |
| POST | /api/clients | Si | {dni, nombres, apellidos, correo, telefono} | Client | Crea cliente |
| GET | /api/vehicles | Si | — | Vehicle[] | Lista vehiculos |
| POST | /api/vehicles | Si | {marca, modelo, precioVenta, moneda} | Vehicle | Agrega vehiculo |
| GET | /api/credits | Si | — | VehicularCredit[] | Cotizaciones del usuario |
| POST | /api/credits | Si | creditSchema | {id} | Crea cotizacion completa |
| GET | /api/credits/:id | Si | — | VehicularCredit con cashFlows y metrics | Detalle completo |
| PUT | /api/credits/:id | Si | creditSchema | {ok:true} | Recalcula y actualiza |
| GET | /api/config | Si | — | Configuration | Config del usuario |
| PUT | /api/config | Si | {defaultMoneda, defaultTipoTasa, defaultCapitalizacion, defaultBaseAnual} | Configuration | Actualiza config |

**creditSchema (POST/PUT /api/credits):**
```json
{
  "clientId": 1, "vehicleId": 2, "moneda": "PEN",
  "precioVehiculo": 50000, "cuotaInicialPorcentaje": 20,
  "cuotaBalonPorcentaje": 20, "tipoTasa": "EFECTIVA",
  "tasaInteres": 12, "capitalizacionDias": 30, "plazoMeses": 36,
  "fechaDesembolso": "2026-07-03", "periodoGraciaTipo": "NONE",
  "periodosGracia": 0, "seguroDesgravamenPorcentaje": 0.05,
  "seguroVehicularPorcentaje": 0.08, "portesMontoFijo": 15,
  "baseAnual": 360, "tasaDescuentoAnual": 12
}
```

---

## SECCIÓN F — AYUDA AL USUARIO EN LA INTERFAZ

### 27. Labels y texto descriptivo (IMPLEMENTADO - corregido)
- Nueva Cotizacion (/credits/new): label visible sobre cada campo ("% Cuota inicial", "Tasa de interes (%)", "COK anual para VAN (%)", etc.)
- Editar Cotizacion (/credits/:id/edit): mismo sistema, labels sobre valores precargados
- Selects con opciones descriptivas: "Efectiva (TEA)", "Gracia parcial (paga intereses)", "PEN - Soles"

### 28. Validaciones en el frontend
- minLength={3} en usuario del registro
- minLength={6} en contrasena del registro
- type="number" en campos numericos
- type="date" en fecha de desembolso
- step="0.001" en porcentajes de seguros

### 29. Mensajes de error al usuario

| Situacion | Mensaje |
|-----------|---------|
| Credenciales incorrectas | "Credenciales invalidas" |
| Usuario duplicado | "Usuario ya existe" |
| Datos de cotizacion invalidos | Mensaje Zod del campo especifico |
| Error al guardar cotizacion | "No se pudo guardar cotizacion" |
| Error al actualizar | "No se pudo actualizar la cotizacion" |
| Error al registrar cliente | "No se pudo registrar cliente" |
| Exito guardar cliente | "Cliente registrado" |
| Exito guardar config | "Configuracion guardada" |

---

## SECCIÓN G — SEGURIDAD

### 30. Proteccion de contrasenas
- bcryptjs saltRounds=10. Hash de 60 chars con salt aleatorio. Nunca recuperable.
- Ejemplo hash: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhuG`

### 31. Proteccion de rutas privadas
Backend: cada endpoint llama `getRequestUser(req)` -> si null -> 401 Unauthorized.
Frontend: middleware.ts -> si no hay cookie mmf_token -> redirect /login.

### 32. Proteccion sin autenticar (IMPLEMENTADO - corregido)
- Antes: solo la API bloqueaba, el HTML se servia.
- Ahora: middleware.ts bloquea antes de renderizar cualquier pagina.
- Rutas publicas: /login, /register, /api/auth/login, /api/auth/register

---

## SECCIÓN H — PRUEBAS Y VERIFICACION DE CALCULOS

### 33. Ejemplo 1 — TEA, Sin Gracia, Con Cuota Balon

| Parametro | Valor |
|-----------|-------|
| Precio del vehiculo | S/ 50,000.00 |
| % Cuota inicial | 20% -> S/ 10,000.00 |
| Principal financiado | S/ 40,000.00 |
| % Cuota balon | 20% -> S/ 8,000.00 |
| Monto amortizable | S/ 32,000.00 |
| Tipo de tasa | Efectiva anual (TEA) |
| Tasa de interes | 12% anual |
| Base anual | 360 dias |
| Plazo | 36 meses |
| Periodo de gracia | NONE |
| Seg. desgravamen | 0.05% mensual sobre saldo |
| Seg. vehicular | 0.08% mensual sobre saldo |
| Portes | S/ 15.00 fijo mensual |
| COK para VAN | 12% anual |

**Calculo TEM:**
```
TEM = (1 + 0.12)^(30/360) - 1
    = (1.12)^(1/12) - 1
    = 0.009489 -> 0.9489% mensual
```

**Calculo Cuota Base (Metodo Frances):**
```
Cuota_base = 32,000 x 0.009489 / (1 - (1.009489)^-36)
           = 303.648 / 0.28818
           ≈ S/ 1,053.69 mensual
```

**Cronograma — Primeros 3 meses:**

| Mes | Saldo Inicial | Interes | Amortizacion | Seg.Desgrav. | Seg.Vehicular | Cuota Total | Saldo Final |
|-----|--------------|---------|-------------|-------------|--------------|-------------|-------------|
| 1 | 40,000.00 | 379.56 | 674.13 | 20.00 | 32.00 | 1,120.69 | 39,325.87 |
| 2 | 39,325.87 | 373.16 | 680.53 | 19.66 | 31.46 | 1,119.81 | 38,645.34 |
| 3 | 38,645.34 | 366.71 | 686.98 | 19.32 | 30.92 | 1,118.95 | 37,958.36 |

**Mes 36 (ultimo — con cuota balon):**

| Mes | Saldo Inicial | Interes | Cuota Total | Balon incluido |
|-----|--------------|---------|-------------|----------------|
| 36 | ~8,006.xx | ~75.9x | ~S/ 8,165.xx | S/ 8,000.00 |

**Metricas del sistema:**

| Metrica | Valor aprox. |
|---------|-------------|
| TIR mensual | ~1.082% |
| TCEA | ~13.7% |
| VAN (COK=12%) | ~-S/1,500 a -S/2,500 |

Interpretacion VAN: negativo porque los seguros y portes hacen que el costo real supere el COK del 12%. El credito cuesta mas de lo que justifica el costo de oportunidad del deudor.

---

### 34. Ejemplo 2 — Tasa Nominal, Con Gracia Total

| Parametro | Valor |
|-----------|-------|
| Precio vehiculo | S/ 35,000.00 |
| % Cuota inicial | 15% -> S/ 5,250.00 |
| Principal financiado | S/ 29,750.00 |
| % Cuota balon | 0% (sin balon) |
| Tipo de tasa | Nominal anual (TNA) |
| Tasa de interes | 18% anual nominal |
| Capitalizacion | 30 dias (mensual) |
| Base anual | 360 dias |
| Plazo | 24 meses |
| Periodo de gracia | TOTAL — 2 meses |
| Seg. desgravamen | 0.05% mensual sobre saldo |
| Seg. vehicular | 0.08% mensual sobre saldo |
| Portes | S/ 10.00 fijo |
| COK para VAN | 15% anual |

**Conversion TNA -> TEA -> TEM:**
```
m = 360/30 = 12 sub-periodos anuales

TEA = (1 + 0.18/12)^12 - 1
    = (1.015)^12 - 1
    = 19.562% anual efectivo

TEM = (1 + 0.19562)^(1/12) - 1
    = 1.5000% mensual
```

**Meses de Gracia Total (meses 1 y 2) — interes capitaliza, cuota=0:**

| Mes | Saldo Inicial | Interes Capitalizado | Cuota | Saldo Final |
|-----|--------------|---------------------|-------|-------------|
| 1 | 29,750.00 | 446.25 | S/ 0.00 | 30,196.25 |
| 2 | 30,196.25 | 452.94 | S/ 0.00 | 30,649.19 |

**Recalculo Cuota Base tras gracia total:**
```
Saldo capitalizado: S/ 30,649.19
nReal = 24 - 2 = 22 meses

Cuota_base = 30,649.19 x 0.015 / (1 - (1.015)^-22)
           = 459.74 / 0.27758
           ≈ S/ 1,656.62 mensual
```

**Meses 3, 4 y 5 (primera amortizacion real):**

| Mes | Saldo Inicial | Interes | Amortizacion | Seg.Desgrav. | Seg.Vehicular | Cuota Total | Saldo Final |
|-----|--------------|---------|-------------|-------------|--------------|-------------|-------------|
| 3 | 30,649.19 | 459.74 | 1,196.88 | 15.32 | 24.52 | 1,706.34 | 29,452.31 |
| 4 | 29,452.31 | 441.78 | 1,214.84 | 14.73 | 23.56 | 1,704.87 | 28,237.47 |
| 5 | 28,237.47 | 423.56 | 1,233.06 | 14.12 | 22.59 | 1,703.47 | 27,004.41 |

**Metricas esperadas:**

| Metrica | Valor aprox. |
|---------|-------------|
| TIR mensual | ~1.58% |
| TCEA | ~20.8% |
| VAN (COK=15%) | ~-S/1,200 a -S/2,000 |

Nota: TCEA > TEA (19.56%) porque incluye el efecto de seguros y portes. Con gracia total el deudor paga mas interes total porque el capital crecio durante la gracia.

---

## RESUMEN DE TECNOLOGIAS

| Componente | Tecnologia | Version |
|-----------|-----------|---------|
| Framework web | Next.js (App Router) | 16.2.4 |
| Biblioteca UI | React | 19.2.4 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| ORM | Prisma | 6.19.0 |
| BD desarrollo | SQLite | — |
| BD produccion | PostgreSQL (recomendado) | — |
| Autenticacion | JWT + bcryptjs | jwt 9.0.3, bcrypt 3.0.3 |
| Validacion | Zod | 4.4.2 |
| Precision numerica | decimal.js | 10.6.0 |
| Fechas | date-fns | 4.1.0 |
| Runtime | Node.js | LTS |

---

## FORMULAS IMPLEMENTADAS (para seccion 6c del informe)

```
1. TEA -> TEM:
   TEM = (1 + TEA)^(30/baseAnual) - 1

2. TNA -> TEA -> TEM:
   m = baseAnual / capitalizacionDias
   TEA = (1 + TNA/m)^m - 1
   Luego aplicar formula 1.

3. Cuota base (Metodo Frances):
   C = P x TEM / [1 - (1+TEM)^-n]
   P = principal amortizable = principal - balon
   n = plazoMeses - periodosGracia

4. Interes del periodo k:
   I_k = Saldo_(k-1) x TEM

5. Amortizacion:
   A_k = Cuota_base - I_k   (periodos normales)
   A_k = 0                   (periodos de gracia)

6. Cuota total del periodo k:
   Cuota_k = Cuota_base + SegDesgrav_k + SegVehicular_k + Portes
   SegDesgrav_k   = Saldo_(k-1) x %SegDesgrav
   SegVehicular_k = Saldo_(k-1) x %SegVehicolar

7. Cuota balon (ultimo periodo N):
   amort_N = saldo_(N-1) - balon
   Cuota_N = amort_N + I_N + Segs_N + Portes + balon
   => saldo final = 0

8. VAN perspectiva del deudor:
   VAN = Principal - SUM[Cuota_k / (1 + COK_mensual)^k]
   COK_mensual = COK_anual / 12
   VAN > 0: credito favorable para el deudor

9. TIR mensual (Newton-Raphson):
   Resolver: Principal - SUM[Cuota_k / (1+TIR)^k] = 0
   Flujo: [+Principal, -Cuota1, -Cuota2, ..., -CuotaN]

10. TCEA:
    TCEA = (1 + TIR_mensual)^(baseAnual/30) - 1
```

---
*Fin del documento. Generado a partir del codigo fuente del proyecto M-Motors Finance App.*
