import Decimal from "decimal.js";
import { addMonths } from "date-fns";

export type CreditInput = {
  precioVehiculo: number;
  cuotaInicialPorcentaje: number;
  cuotaBalonPorcentaje: number;
  tipoTasa: "EFECTIVA" | "NOMINAL";
  tasaInteres: number;
  capitalizacionDias: number;
  plazoMeses: number;
  fechaDesembolso: Date;
  periodoGraciaTipo: "NONE" | "PARTIAL" | "TOTAL";
  periodosGracia: number;
  seguroDesgravamenPorcentaje: number;
  seguroVehicularPorcentaje: number;
  portesMontoFijo: number;
  baseAnual: 360 | 365;
  tasaDescuentoAnual: number;
};

export type CashFlowRow = {
  numeroMes: number;
  fechaPago: Date;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  seguroDesgravamen: number;
  seguroVehicular: number;
  cuota: number;
  saldoFinal: number;
};

type CalculationResult = {
  rows: CashFlowRow[];
  van: number;
  tir: number;
  tcea: number;
};

const money = (v: Decimal.Value) => new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const rate = (v: Decimal.Value) => new Decimal(v).toDecimalPlaces(10, Decimal.ROUND_HALF_UP);

function periodicRate(input: CreditInput) {
  const annual = new Decimal(input.tasaInteres).div(100);
  if (input.tipoTasa === "EFECTIVA") {
    return rate(new Decimal(1).plus(annual).pow(new Decimal(30).div(input.baseAnual)).minus(1));
  }
  const m = new Decimal(input.baseAnual).div(input.capitalizacionDias);
  const teAnual = new Decimal(1).plus(annual.div(m)).pow(m).minus(1);
  return rate(new Decimal(1).plus(teAnual).pow(new Decimal(30).div(input.baseAnual)).minus(1));
}

function irr(flows: number[]) {
  let x0 = 0.1;
  for (let i = 0; i < 200; i += 1) {
    let fx = 0;
    let dfx = 0;
    for (let t = 0; t < flows.length; t += 1) {
      fx += flows[t] / (1 + x0) ** t;
      if (t > 0) dfx += (-t * flows[t]) / (1 + x0) ** (t + 1);
    }
    if (Math.abs(fx) < 1e-8) return x0;
    if (Math.abs(dfx) < 1e-10) break;
    x0 -= fx / dfx;
    if (x0 <= -0.9999) x0 = -0.9999;
  }
  return x0;
}

export function calculateCredit(input: CreditInput): CalculationResult {
  const i = periodicRate(input);
  const precio = new Decimal(input.precioVehiculo);
  const inicial = precio.mul(input.cuotaInicialPorcentaje).div(100);
  const principal = precio.minus(inicial);
  const balon = principal.mul(input.cuotaBalonPorcentaje).div(100);
  const nReal = input.plazoMeses - input.periodosGracia;

  // FIX 2: For TOTAL grace, cuotaBase is calculated AFTER grace ends using the
  // capitalized saldo (which is larger than original principal). For NONE/PARTIAL
  // the saldo doesn't change during grace, so we can pre-calculate.
  let cuotaBase = new Decimal(0);
  if (input.periodoGraciaTipo !== "TOTAL" && nReal > 0) {
    const amortizable = principal.minus(balon);
    cuotaBase = amortizable.mul(i).div(
      new Decimal(1).minus(new Decimal(1).plus(i).pow(-nReal))
    );
  }

  const rows: CashFlowRow[] = [];
  let saldo = principal;
  // outFlows: debtor perspective — CF0 = +principal (receives), CFt = -cuota (pays)
  const outFlows = [principal.toNumber()];
  const discountRate = new Decimal(input.tasaDescuentoAnual).div(100).div(12);
  // FIX 1: VAN from debtor perspective: starts at +principal, subtract PV of each payment
  let van = principal;

  for (let m = 1; m <= input.plazoMeses; m += 1) {
    // FIX 2: Recalculate cuotaBase at the first amortization period after total grace,
    // using the actual (capitalized) saldo minus the balloon.
    if (
      m === input.periodosGracia + 1 &&
      input.periodoGraciaTipo === "TOTAL" &&
      nReal > 0
    ) {
      const amortizableActual = saldo.minus(balon);
      cuotaBase = amortizableActual.greaterThan(0)
        ? amortizableActual
            .mul(i)
            .div(new Decimal(1).minus(new Decimal(1).plus(i).pow(-nReal)))
        : new Decimal(0);
    }

    const saldoInicial = saldo;
    const interes = saldo.mul(i);
    const segDes = saldo.mul(input.seguroDesgravamenPorcentaje).div(100);
    const segVeh = saldo.mul(input.seguroVehicularPorcentaje).div(100);
    let amort = new Decimal(0);
    let cuota = new Decimal(0);

    if (m <= input.periodosGracia) {
      if (input.periodoGraciaTipo === "PARTIAL") {
        cuota = interes.plus(segDes).plus(segVeh).plus(input.portesMontoFijo);
      } else if (input.periodoGraciaTipo === "TOTAL") {
        // Interest capitalizes into the balance; no payment required
        saldo = saldo.plus(interes);
      }
    } else if (m === input.plazoMeses) {
      // Final period: pay remaining balance minus balloon, then balloon itself
      amort = saldo.minus(balon).greaterThan(0) ? saldo.minus(balon) : new Decimal(0);
      cuota = amort.plus(interes).plus(segDes).plus(segVeh).plus(input.portesMontoFijo).plus(balon);
      saldo = new Decimal(0);
    } else {
      // Normal French method period: constant base cuota, amortization = cuotaBase - interest
      amort = cuotaBase.minus(interes);
      if (amort.lessThan(0)) amort = new Decimal(0);
      cuota = cuotaBase.plus(segDes).plus(segVeh).plus(input.portesMontoFijo);
      saldo = saldo.minus(amort);
    }

    const row: CashFlowRow = {
      numeroMes: m,
      fechaPago: addMonths(input.fechaDesembolso, m),
      saldoInicial: money(saldoInicial).toNumber(),
      interes: money(interes).toNumber(),
      amortizacion: money(amort).toNumber(),
      seguroDesgravamen: money(segDes).toNumber(),
      seguroVehicular: money(segVeh).toNumber(),
      cuota: money(cuota).toNumber(),
      saldoFinal: money(saldo).toNumber(),
    };
    rows.push(row);
    outFlows.push(-row.cuota); // debtor pays each period (negative from debtor's POV)
    // FIX 1: subtract the discounted cuota from the initial principal received
    van = van.minus(
      new Decimal(row.cuota).div(new Decimal(1).plus(discountRate).pow(m))
    );
  }

  const tirPeriodica = irr(outFlows);
  const tcea = (1 + tirPeriodica) ** (input.baseAnual / 30) - 1;
  return {
    rows,
    van: money(van).toNumber(),
    tir: Number((tirPeriodica * 100).toFixed(6)),
    tcea: Number((tcea * 100).toFixed(6)),
  };
}
