import type { Crianca, Formula, PlanoEnviado } from "../types";
import { ok } from "../format";
import { pd } from "./datas";

export interface PesoAtual {
  data: string;
  kg: number;
  origem: string;
}

/** Peso mais recente entre consultas e pesagens do consultório (pesagem de casa não entra). */
export function pesoAtual(p: Crianca): PesoAtual | undefined {
  const ws: PesoAtual[] = [
    ...p.consultas.filter((c) => ok(c.peso)).map((c) => ({ data: c.data, kg: c.peso as number, origem: "consulta" })),
    ...p.diario.filter((d) => d.autor === "nutri" && ok(d.pesoKg)).map((d) => ({ data: d.data, kg: d.pesoKg as number, origem: "pesagem semanal" })),
  ].sort((a, b) => pd(a.data) - pd(b.data));
  return ws[ws.length - 1];
}

export type SituacaoMeta = "Abaixo da meta" | "Dentro da meta" | "Acima da meta";

export interface CalculoFormula {
  formula: Formula | undefined;
  peso?: PesoAtual;
  kcalMin: number | null;
  kcalMax: number | null;
  protMin: number | null;
  protMax: number | null;
  vol: number | null;
  ofertaKcal: number | null;
  ofertaProt: number | null;
  situacaoKcal: SituacaoMeta | null;
  situacaoProt: SituacaoMeta | null;
  porEtapa: number | null;
  gPorEtapa: number | null;
  medidas: number | null;
  agua: number | null;
  gDia: number | null;
  latasMes: number | null;
  po: boolean;
}

const situacao = (v: number | null, a: number | null, b: number | null): SituacaoMeta | null =>
  !ok(v) || !ok(a) || !ok(b) ? null : v < a * (1 - 1e-9) ? "Abaixo da meta" : v > b * (1 + 1e-9) ? "Acima da meta" : "Dentro da meta";

export function calcularFormula(p: Crianca, formulas: Formula[]): CalculoFormula {
  const P = p.plano;
  const f = formulas.find((x) => x.id === P.formula);
  const peso = pesoAtual(p);
  const w = peso?.kg;
  const by = (k: number) => (ok(w) ? w * k : null);
  const kcalMin = by(P.kcal[0]), kcalMax = by(P.kcal[1]), protMin = by(P.prot[0]), protMax = by(P.prot[1]);
  const vol = ok(P.vol) ? P.vol : ok(f?.kcal) && ok(kcalMin) ? kcalMin / (f!.kcal! / 100) : null;
  const ofertaKcal = ok(vol) && ok(f?.kcal) ? (vol * f!.kcal!) / 100 : null;
  const ofertaProt = ok(vol) && ok(f?.prot) ? (vol * f!.prot!) / 100 : null;
  const porEtapa = ok(vol) ? vol / P.etapas : null;
  const gPorEtapa = ok(porEtapa) ? (porEtapa / P.ml) * P.g : null;
  const medidas = ok(porEtapa) ? Math.ceil(porEtapa / P.ml - 1e-9) : null;
  const gDia = ok(gPorEtapa) ? gPorEtapa * P.etapas : null;
  return {
    formula: f, peso, kcalMin, kcalMax, protMin, protMax, vol, ofertaKcal, ofertaProt,
    situacaoKcal: situacao(ofertaKcal, kcalMin, kcalMax),
    situacaoProt: situacao(ofertaProt, protMin, protMax),
    porEtapa, gPorEtapa, medidas,
    agua: ok(medidas) ? medidas * P.ml : null,
    gDia,
    latasMes: ok(gDia) ? (gDia * 30) / P.lata : null,
    po: f?.po !== false,
  };
}

export function planoParaEnviar(p: Crianca, formulas: Formula[], data: string): PlanoEnviado {
  const r = calcularFormula(p, formulas);
  return {
    data, formula: r.formula?.nome ?? p.plano.formula, etapas: p.plano.etapas, porEt: r.porEtapa,
    med: r.medidas, agua: r.agua, latas: r.latasMes, po: r.po, orient: p.plano.orient,
  };
}

export function planoMudou(p: Crianca, formulas: Formula[]): boolean {
  const e = p.enviado;
  if (!e) return true;
  const r = calcularFormula(p, formulas);
  return e.formula !== (r.formula?.nome ?? p.plano.formula) || e.etapas !== p.plano.etapas ||
    Math.round(e.porEt ?? 0) !== Math.round(r.porEtapa ?? 0) || e.med !== r.medidas || e.orient !== p.plano.orient;
}
