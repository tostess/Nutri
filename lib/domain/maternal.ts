import type { Classe, Mae } from "../types";
import { ok, fmt, sinal } from "../format";
import { anos, dias, igTexto, meses, pd, somaDias } from "./datas";
import type { Alerta } from "./crescimento";
import {
  DEPOSICAO_GESTACAO, EER_GESTACAO, EER_MULHER, GANHO_GESTACIONAL, IMC_NOME, LACTACAO, type ClasseIMC,
} from "./referencias";

export const imc = (kg: number | null | undefined, cm: number | null | undefined) =>
  ok(kg) && ok(cm) && cm > 0 ? kg / (cm / 100) ** 2 : null;
export const classeIMC = (v: number): ClasseIMC => (v < 18.5 ? "bp" : v < 25 ? "eu" : v < 30 ? "sp" : "ob");
export const dpp = (dum: string) => somaDias(dum, 280);

/** Faixa de ganho esperado (kg) na semana, interpolada entre os marcos 0, 13, 27 e 40. */
export function faixaGanho(k: ClasseIMC, semana: number): [number, number] {
  const pts: [number, number, number][] = [[0, 0, 0], ...GANHO_GESTACIONAL[k]];
  if (semana >= 40) return [pts[3][1], pts[3][2]];
  for (let i = 1; i < pts.length; i++) {
    if (semana <= pts[i][0]) {
      const a = pts[i - 1], b = pts[i], t = (semana - a[0]) / (b[0] - a[0]);
      return [a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
    }
  }
  return [pts[3][1], pts[3][2]];
}

export interface LinhaMae {
  data: string;
  peso: number | null;
  obs: string;
  imc: number | null;
  dif: number | null; // kg em relação ao pré-gestacional
  ig?: number; // dias de gestação
  semana?: number;
  faixa?: [number, number];
  classe?: Classe | null;
  posParto?: number; // dias
}

export function linhasMae(p: Mae): LinhaMae[] {
  const k = classeIMC(imc(p.pesoPre, p.altura) ?? 22);
  return [...p.consultas]
    .sort((a, b) => pd(a.data) - pd(b.data))
    .map((q) => {
      const r: LinhaMae = { ...q, imc: imc(q.peso, p.altura), dif: ok(q.peso) ? q.peso - p.pesoPre : null };
      if (p.tipo === "gestante") {
        r.ig = dias(p.dum, q.data);
        r.semana = r.ig / 7;
        r.faixa = faixaGanho(k, r.semana);
        r.classe = !ok(r.dif) ? null : r.dif < r.faixa[0] - 1e-9 ? "Abaixo" : r.dif > r.faixa[1] + 1e-9 ? "Acima" : "Adequado";
      } else {
        r.posParto = dias(p.parto, q.data);
      }
      return r;
    });
}

export interface MacroMae {
  nome: string;
  pMin: number;
  pMax: number;
  kcalG: number;
  gMin: number;
  gMax: number;
  meta: number;
  pctVet: number;
  como: string;
}

export interface NecessidadesMae {
  base?: LinhaMae;
  data: string;
  peso: number;
  altura: number;
  idade: number;
  classe: ClasseIMC;
  eer: number;
  equacao: string;
  explicacao: string;
  macros: MacroMae[];
  gestante: boolean;
  adolescente: boolean;
  fibra: number;
  aguaL: number;
  semanas?: number;
  trimestre?: number;
  mesesPosParto?: number;
}

export function necessidadesMae(p: Mae, hojeISO: string): NecessidadesMae {
  const rs = linhasMae(p).filter((r) => ok(r.peso));
  const L = rs[rs.length - 1];
  const d = L ? L.data : hojeISO;
  const w = L ? (L.peso as number) : p.pesoPre;
  const h = p.altura;
  const idade = anos(p.nasc, d);
  const k = classeIMC(imc(p.pesoPre, h) ?? 22);
  const G = p.tipo === "gestante";
  let c: number[];
  let extras: [number, string][] = [];
  let explicacao: string;
  let semanas: number | undefined, trimestre: number | undefined, mesesPP: number | undefined;
  if (G) {
    semanas = Math.floor(dias(p.dum, d) / 7);
    trimestre = semanas < 14 ? 1 : semanas < 28 ? 2 : 3;
    if (trimestre === 1) {
      c = EER_MULHER[p.naf];
      explicacao = `1º trimestre: equação de mulher não gestante (${p.naf}), sem termo de deposição.`;
    } else {
      c = EER_GESTACAO[p.naf];
      const dep = DEPOSICAO_GESTACAO[k];
      extras = [[9.16 * semanas, `9,16 × ${semanas} sem`], [dep, "deposição"]];
      explicacao = `${trimestre}º trimestre: equação de gestação (${p.naf}) + 9,16 × semanas + deposição de energia pelo IMC pré-gestacional (${IMC_NOME[k]}: ${dep > 0 ? "+" : ""}${dep} kcal).`;
    }
  } else {
    c = EER_MULHER[p.naf];
    mesesPP = meses(p.parto, d);
    if (p.amam === "exclusiva" && mesesPP < 6) {
      extras = [[LACTACAO.leite06, "leite"], [-LACTACAO.mobilizacao06, "mobilização"]];
      explicacao = "Lactação 0 a 6 meses, amamentação exclusiva: + 540 kcal da produção de leite − 140 kcal de mobilização de reservas.";
    } else if (p.amam !== "nao" && mesesPP < 12) {
      extras = [[LACTACAO.leite712, "leite"]];
      explicacao = mesesPP < 6
        ? "Amamentação mista antes de 6 meses: a DRI não traz valor próprio; o app usa o de amamentação parcial (+ 380 kcal)."
        : "Lactação 7 a 12 meses: + 380 kcal da produção de leite.";
    } else {
      explicacao = p.amam === "nao" ? "Não amamenta: equação de mulher não gestante." : "Mais de 12 meses pós-parto: equação de mulher não gestante.";
    }
  }
  const eer = c[0] + c[1] * idade + c[2] * h + c[3] * w + extras.reduce((a, x) => a + x[0], 0);
  const equacao =
    `${fmt(c[0], 2)} ${sinal(c[1])} × ${idade} anos ${sinal(c[2])} × ${fmt(h, 0)} cm ${sinal(c[3])} × ${fmt(w, 1)} kg` +
    extras.map((x) => ` ${sinal(x[0], Number.isInteger(x[0]) ? 0 : 1)} (${x[1]})`).join("");

  const gkg = G ? 1.1 : 1.3;
  const am: [string, number, number, number][] = [
    ["Proteína", 0.1, 0.35, 4], ["Lipídios", 0.2, 0.35, 9], ["Carboidratos", 0.45, 0.65, 4],
    ["Ácido graxo ω-6 (linoleico)", 0.05, 0.1, 9], ["Ácido graxo ω-3 (linolênico)", 0.006, 0.012, 9],
    ["Açúcar de adição (ideal 5%, limite 10%)", 0.05, 0.1, 4],
  ];
  const macros: MacroMae[] = am.map((a) => ({
    nome: a[0], pMin: a[1], pMax: a[2], kcalG: a[3], gMin: (eer * a[1]) / a[3], gMax: (eer * a[2]) / a[3], meta: 0, pctVet: 0, como: "",
  }));
  macros[0].meta = gkg * w;
  macros[0].como = `RDA ${G ? "gestação" : "lactação"}: ${fmt(gkg, 1)} g/kg/dia × peso atual.`;
  macros[1].meta = (macros[1].gMin + macros[1].gMax) / 2;
  macros[1].como = "Ponto médio da faixa aceitável (AMDR 20 a 35%).";
  macros[2].meta = (eer - macros[0].meta * 4 - macros[1].meta * 9) / 4;
  macros[2].como = `Energia restante. RDA mínima: ${G ? 175 : 210} g/dia.`;
  macros[3].meta = (macros[3].gMin + macros[3].gMax) / 2;
  macros[3].como = "Ponto médio da faixa (5 a 10% do VET).";
  macros[4].meta = (macros[4].gMin + macros[4].gMax) / 2;
  macros[4].como = "Ponto médio da faixa (0,6 a 1,2% do VET).";
  macros[5].meta = macros[5].gMin;
  macros[5].como = "Mín = ideal (5%); máx = limite OMS (10%).";
  macros.forEach((x) => (x.pctVet = (x.meta * x.kcalG) / eer));

  return {
    base: L, data: d, peso: w, altura: h, idade, classe: k, eer, equacao, explicacao, macros,
    gestante: G, adolescente: idade < 19, fibra: G ? 28 : 29, aguaL: G ? 3 : 3.8,
    semanas, trimestre, mesesPosParto: mesesPP,
  };
}

export function alertasMae(p: Mae, hojeISO: string): Alerta[] {
  const out: Alerta[] = [];
  const rs = linhasMae(p).filter((r) => ok(r.peso));
  const L = rs[rs.length - 1];
  if (p.tipo === "gestante" && L?.classe && L.classe !== "Adequado" && L.faixa) {
    out.push([L.classe === "Acima" ? "at" : "ab",
      `Ganho de ${fmt(L.dif)} kg com ${igTexto(L.ig!)}: ${L.classe === "Acima" ? "acima" : "abaixo"} da faixa esperada (${fmt(L.faixa[0])} a ${fmt(L.faixa[1])} kg).`]);
  }
  if (p.tipo === "gestante" && rs.length > 1) {
    const a = rs[rs.length - 2];
    const sem = (L.ig! - a.ig!) / 7;
    if (sem > 0) out.push(["in", `Ritmo recente: ${fmt((((L.peso as number) - (a.peso as number)) / sem) * 1000, 0)} g por semana.`]);
  }
  if (anos(p.nasc, hojeISO) < 19) out.push(["at", "Paciente adolescente: as equações de energia usadas aqui são para 19 anos ou mais."]);
  return out;
}
