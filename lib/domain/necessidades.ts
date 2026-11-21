import type { Crianca, Criterios } from "../types";
import { ok } from "../format";
import { dias } from "./datas";
import { linhasCrescimento, type LinhaCrescimento } from "./crescimento";
import {
  AGUA_TOTAL_L, AMDR_CRIANCA, EER_LACTENTE, EER_LACTENTE_DEP, EER_NAF, EER_NAF_DEP,
  FAIXAS_EER, GRUPOS, PROT_KG, TABELA5,
} from "./referencias";

export interface Macro {
  nome: string;
  kcalG: number;
  pMin?: number;
  pMax?: number;
  gMin: number | null;
  gMax: number | null;
  meta: number | null;
  pctVet: number | null;
  como: string;
}

export interface VolumeFormula {
  kcal: number;
  vol: number;
  volKg: number;
  tabela: (typeof TABELA5)[number];
  porMin: number;
  porMax: number;
  tabMin: number;
  tabMax: number;
  situacao: "abaixo" | "dentro" | "acima";
}

export interface NecessidadesCrianca {
  base: LinhaCrescimento;
  m: number;
  diasVida: number;
  idadeAnos: number;
  peso: number;
  altura: number;
  faixaEER: string;
  coef: number[] | null;
  eer: number | null;
  grupo: number;
  grupoNome: string;
  macros: Macro[];
  fibra: number | null;
  hollidaySegar: number | null;
  aguaTotalL: number | null;
  volume: VolumeFormula | null;
}

export const hollidaySegar = (w: number) => (w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20));

/** Necessidades pela última consulta (exceto a linha de nascimento), como na planilha. */
export function necessidadesCrianca(p: Crianca, c: Criterios): NecessidadesCrianca | null {
  const rs = linhasCrescimento(p, c).filter((r) => !r.nascimento && r.i > 0);
  const L = rs[rs.length - 1];
  if (!L || !ok(L.peso) || !ok(L.alt)) return null;
  const m = L.idade;
  const dd = dias(p.nasc, L.data);
  const anosDec = dd / 365.25;
  const w = L.peso;
  const h = L.alt;
  const k = m < 3 ? 0 : m < 6 ? 1 : m < 12 ? 2 : m < 36 ? 3 : m < 48 ? 4 : m < 108 ? 5 : m < 168 ? 6 : m < 228 ? 7 : -1;
  let coef: number[] | null = null;
  if (k >= 0) coef = k <= 3 ? [...EER_LACTENTE[p.sexo], EER_LACTENTE_DEP[p.sexo][k]] : [...EER_NAF[p.sexo][p.naf], EER_NAF_DEP[p.sexo][k - 4]];
  const eer = coef ? coef[0] + coef[1] * anosDec + coef[2] * h + coef[3] * w + coef[4] : null;

  const g = m < 6 ? 0 : m < 12 ? 1 : m < 48 ? 2 : m < 228 ? 3 : 4;
  const faixas = g === 2 ? AMDR_CRIANCA.map((a) => [a[1], a[2]]) : g === 3 ? AMDR_CRIANCA.map((a) => [a[3], a[4]]) : null;
  const protKg = PROT_KG.reduce((a, r) => (m >= r[0] ? r[1] : a), PROT_KG[0][1]);
  const macros: Macro[] = AMDR_CRIANCA.map((a, i) => {
    const r = faixas?.[i];
    return {
      nome: a[0], kcalG: a[5], pMin: r?.[0], pMax: r?.[1],
      gMin: r && ok(eer) ? (eer * r[0]) / a[5] : null,
      gMax: r && ok(eer) ? (eer * r[1]) / a[5] : null,
      meta: null, pctVet: null, como: "",
    };
  });
  const meio = (x: Macro) => (ok(x.gMin) && ok(x.gMax) ? (x.gMin + x.gMax) / 2 : null);
  const fmt2 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (ok(eer)) {
    macros[0].meta = protKg * w;
    macros[0].como = g < 2 ? `Ingestão adequada (AI, IOM 2005): ${fmt2(protKg)} g/kg/dia × peso` : `RDA: ${fmt2(protKg)} g/kg/dia × peso (Anexo 10). Faixa % = AMDR.`;
    macros[1].meta = g < 2 ? [31, 30][g] : meio(macros[1]);
    macros[1].como = g < 2 ? "Ingestão adequada (AI, IOM 2005)" : "Meta = ponto médio da faixa aceitável (AMDR).";
    const p0 = macros[0].meta, l0 = macros[1].meta;
    macros[2].meta = g < 2 ? [60, 95][g] : ok(l0) ? (eer - p0 * 4 - l0 * 9) / 4 : null;
    macros[2].como = g < 2 ? "Ingestão adequada (AI, IOM 2005)" : "Meta = energia restante após proteína e lipídios. RDA mínima: 130 g.";
    macros[3].meta = meio(macros[3]);
    macros[3].como = macros[3].meta != null ? "Ponto médio da faixa (5 a 10% do VET); 1 g = 9 kcal." : "";
    macros[4].meta = meio(macros[4]);
    macros[4].como = macros[4].meta != null ? "Ponto médio da faixa (0,6 a 1,2% do VET); até 10% como EPA/DHA." : "";
    macros[5].meta = macros[5].gMin;
    macros[5].como = macros[5].meta != null ? "Mín = ideal (5% do VET); máx = limite OMS (10%). SBP: evitar antes dos 2 anos." : "";
    macros.forEach((x) => (x.pctVet = ok(x.meta) ? (x.meta * x.kcalG) / eer : null));
  }

  let volume: VolumeFormula | null = null;
  if (m < 36 && ok(eer)) {
    const kcal = eer * p.plano.pct;
    const vol = kcal / (p.plano.kcal100 / 100);
    const t = TABELA5.reduce((a, r) => (dd >= r[0] ? r : a), TABELA5[0]);
    const tabMin = t[2] * t[4], tabMax = t[3] * t[5];
    volume = {
      kcal, vol, volKg: vol / w, tabela: t, porMin: vol / t[5], porMax: vol / t[4], tabMin, tabMax,
      situacao: vol < tabMin ? "abaixo" : vol > tabMax ? "acima" : "dentro",
    };
  }

  return {
    base: L, m, diasVida: dd, idadeAnos: anosDec, peso: w, altura: h,
    faixaEER: FAIXAS_EER[k] ?? "fora da tabela", coef, eer, grupo: g, grupoNome: GRUPOS[g], macros,
    fibra: m >= 24 ? Math.min(Math.floor(m / 12) + 5, 25) : null,
    hollidaySegar: hollidaySegar(w),
    aguaTotalL: AGUA_TOTAL_L[g] ?? null,
    volume,
  };
}
