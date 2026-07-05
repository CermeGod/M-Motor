import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const registerSchema = loginSchema;

export const clientSchema = z.object({
  dni: z.string().min(8),
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  correo: z.email(),
  telefono: z.string().min(6),
  consentimientoDatos: z.boolean().refine((v) => v === true, {
    message: "El consentimiento para el tratamiento de datos es obligatorio (Ley 29733)",
  }),
});

export const vehicleSchema = z.object({
  marca: z.string().min(2),
  modelo: z.string().min(2),
  precioVenta: z.number().positive(),
  moneda: z.enum(["PEN", "USD"]),
  tipoMotor: z.string().optional(),
  anio: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  vidaUtilAnos: z.number().int().min(1).max(30).optional(),
  cilindrada: z.string().optional(),
  transmision: z.string().optional(),
  // Service fields
  tieneMantenimiento: z.boolean().optional(),
  descripcionMantenimiento: z.string().optional(),
  costoMantenimientoAnual: z.number().min(0).optional(),
  tieneSOAT: z.boolean().optional(),
  vigenciaSOAT: z.string().optional(),
  tieneSeguroVehicular: z.boolean().optional(),
  coberturaSiniestro: z.string().optional(),
});

export const creditSchema = z.object({
  clientId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  moneda: z.enum(["PEN", "USD"]),
  precioVehiculo: z.number().positive(),
  cuotaInicialPorcentaje: z.number().min(0).max(100),
  cuotaBalonPorcentaje: z.number().min(0).max(100),
  tipoTasa: z.enum(["EFECTIVA", "NOMINAL"]),
  tasaInteres: z.number().min(0).max(100),
  capitalizacionDias: z.number().int().positive(),
  plazoMeses: z.number().int().min(1).max(120),
  fechaDesembolso: z.string(),
  periodoGraciaTipo: z.enum(["NONE", "PARTIAL", "TOTAL"]),
  periodosGracia: z.number().int().min(0).max(24),
  seguroDesgravamenPorcentaje: z.number().min(0).max(100),
  seguroVehicularPorcentaje: z.number().min(0).max(100),
  portesMontoFijo: z.number().min(0),
  baseAnual: z.union([z.literal(360), z.literal(365)]),
  tasaDescuentoAnual: z.number().min(0).max(100).default(12),
}).superRefine((data, ctx) => {
  if (data.periodosGracia > data.plazoMeses) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["periodosGracia"],
      message: "No puede ser mayor al plazo en meses",
    });
  }
  if (data.periodoGraciaTipo === "NONE" && data.periodosGracia !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["periodosGracia"],
      message: "Debe ser 0 cuando no hay periodo de gracia",
    });
  }
});

export function validationErrorMessage(error: z.ZodError) {
  const first = error.issues[0];
  if (!first) return "Datos inválidos";
  return `${first.path.join(".")}: ${first.message}`;
}
