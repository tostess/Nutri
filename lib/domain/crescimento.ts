import type { Classe, Crianca, Criterios } from "../types";
import { ok, fmt } from "../format";
import { dataBR, dias, meses, pd } from "./datas";
import { OMS_INCREMENTO, REF_GANHO } from "./referencias";

export interface LinhaCrescimento {
  data: string;
  peso: number | null;
  alt: number | null;
  pc: number | null;
  obs: string;
  i: number;
  nascimento: boolean;
  idade: number; // meses completos
  intervalo?: number;
  gDia?: number;
  gMes?: number;
  estMes?: number;
  pcMes?: number;
  faixa?: string;
  cPeso?: Classe | null;
  cEst?: Classe | null;
  cPc?: Classe | null;
  oms?: [number, number, number];
  cOms?: Classe | null;
}

export function faixaIndice(m: number): number {
  let i = 0;
  REF_GANHO.forEach((r, k) => {
    if (m >= r.min) i = k;
  });
  return i;
}

/** Classificação SBP: abaixo de ab×mín = Abaixo; abaixo de at×mín = Atenção; até ac×máx = Adequado. */
export function classificar(v: number | undefined, min: number | null, max: number | null, c: Criterios): Classe | null {
  if (!ok(v) || min == null || max == null) return null;
  if (v < c.ab * min) return "Abaixo";
  if (v < c.at * min) return "Atenção";
  if (v <= c.ac * max) return "Adequado";
  return "Acima";
}

export function linhasCrescimento(p: Crianca, c: Criterios): LinhaCrescimento[] {
  const cs = [...p.consultas].sort((a, b) => pd(a.data) - pd(b.data));
  return cs.map((q, i) => {
    const r: LinhaCrescimento = { ...q, i, nascimento: q.data === p.nasc, idade: meses(p.nasc, q.data) };
    if (!i) return r;
    const pr = cs[i - 1];
    const g = dias(pr.data, q.data);
    r.intervalo = g;
    if (g > 0) {
      if (ok(q.peso) && ok(pr.peso)) {
        r.gDia = ((q.peso - pr.peso) * 1000) / g;
        r.gMes = r.gDia * c.dias;
      }
      if (ok(q.alt) && ok(pr.alt)) r.estMes = ((q.alt - pr.alt) / g) * c.dias;
      if (ok(q.pc) && ok(pr.pc)) r.pcMes = ((q.pc - pr.pc) / g) * c.dias;
    }
    const R = REF_GANHO[faixaIndice(r.idade)];
    r.faixa = R.faixa;
    r.cPeso = classificar(r.gDia, R.pMin, R.pMax, c);
    r.cEst = classificar(r.estMes, R.est, R.est, c);
    r.cPc = classificar(r.pcMes, R.pc, R.pc, c);
    if (ok(r.gDia) && r.idade <= 5 && r.idade >= 0) {
      const o = OMS_INCREMENTO[p.sexo][r.idade];
      r.oms = o;
      r.cOms = r.gDia < o[0] ? "Abaixo" : r.gDia <= o[2] ? "Adequado" : "Acima";
    }
    return r;
  });
}

export type NivelAlerta = "ab" | "at" | "in";
export type Alerta = [NivelAlerta, string];

export function alertasCrescimento(p: Crianca, c: Criterios): Alerta[] {
  const out: Alerta[] = [];
  const rs = linhasCrescimento(p, c);
  rs.forEach((r, i) => {
    if (!i) return;
    const pr = rs[i - 1];
    if (ok(r.pc) && ok(pr.pc) && r.pc < pr.pc)
      out.push(["ab", `PC caiu de ${fmt(pr.pc)} para ${fmt(r.pc)} cm em ${dataBR(r.data)}. Conferir a aferição.`]);
    if (ok(r.alt) && ok(pr.alt) && r.alt < pr.alt)
      out.push(["ab", `Comprimento caiu de ${fmt(pr.alt)} para ${fmt(r.alt)} cm em ${dataBR(r.data)}.`]);
    if (ok(r.peso) && ok(pr.peso) && r.peso < pr.peso)
      out.push(["at", `Perda de ${fmt((pr.peso - r.peso) * 1000, 0)} g entre ${dataBR(pr.data)} e ${dataBR(r.data)}.`]);
  });
  const L = rs[rs.length - 1];
  if (L?.cPeso === "Abaixo") out.push(["ab", `Ganho de peso abaixo do esperado na última consulta: ${fmt(L.gDia)} g/dia (faixa ${L.faixa}).`]);
  if (L?.cPeso === "Atenção") out.push(["at", `Ganho de peso em atenção na última consulta: ${fmt(L.gDia)} g/dia.`]);
  return out;
}
