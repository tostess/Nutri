import type { CorFezes, EscalaFezes, Evacuacao, Paciente } from "../types";
import { dias, meses, pd } from "./datas";
import type { Alerta } from "./crescimento";

export type GrupoFezes = "duras" | "normais" | "liquidas";

/** Escala de Bristol (Lewis & Heaton, 1997). */
export const BRISTOL: { tipo: number; nome: string; grupo: GrupoFezes }[] = [
  { tipo: 1, nome: "Caroços duros e separados", grupo: "duras" },
  { tipo: 2, nome: "Formato de salsicha, encaroçada", grupo: "duras" },
  { tipo: 3, nome: "Salsicha com rachaduras", grupo: "normais" },
  { tipo: 4, nome: "Lisa e macia, como uma salsicha", grupo: "normais" },
  { tipo: 5, nome: "Pedaços macios com bordas definidas", grupo: "normais" },
  { tipo: 6, nome: "Pedaços moles, bordas irregulares, pastosa", grupo: "liquidas" },
  { tipo: 7, nome: "Aquosa, sem pedaços sólidos", grupo: "liquidas" },
];

/** Consistência para bebês de fralda (categorias da Amsterdam Infant Stool Scale). */
export const LACTENTE: { tipo: number; nome: string; grupo: GrupoFezes }[] = [
  { tipo: 1, nome: "Aquosa", grupo: "liquidas" },
  { tipo: 2, nome: "Mole ou pastosa", grupo: "normais" },
  { tipo: 3, nome: "Formada", grupo: "normais" },
  { tipo: 4, nome: "Endurecida, em bolinhas", grupo: "duras" },
];

export const escalaDe = (e: EscalaFezes) => (e === "bristol" ? BRISTOL : LACTENTE);
export const nomeTipo = (e: EscalaFezes, t: number) => escalaDe(e).find((x) => x.tipo === t)?.nome ?? "—";

export const CORES: { cor: CorFezes; nome: string; hex: string; alerta?: string }[] = [
  { cor: "amarela", nome: "Amarela", hex: "#e6b422" },
  { cor: "verde", nome: "Verde", hex: "#6b8e23" },
  { cor: "marrom", nome: "Marrom", hex: "#7b4a2a" },
  { cor: "preta", nome: "Preta", hex: "#1d1a19", alerta: "Fezes pretas: pode ser efeito de suplemento de ferro. Se não usa ferro, avisar o médico." },
  { cor: "vermelha", nome: "Com sangue", hex: "#b3261e", alerta: "Sangue nas fezes: avisar o médico." },
  { cor: "clara", nome: "Esbranquiçada ou acinzentada", hex: "#e4ddc8", alerta: "Fezes claras podem indicar problema no fígado: procurar o médico no mesmo dia." },
];

/** Bebês até 3 anos usam a escala do lactente por padrão; acima disso, Bristol. */
export function escalaPadrao(p: Paciente, hojeISO: string): EscalaFezes {
  return p.tipo === "crianca" && meses(p.nasc, hojeISO) < 36 ? "lactente" : "bristol";
}

export interface ResumoIntestinal {
  janela: number;
  total: number;
  porDia: number;
  diasSemEvacuar: number | null;
  distribuicao: { tipo: number; nome: string; n: number; grupo: GrupoFezes }[];
  pctDuras: number;
  pctLiquidas: number;
  pctDorEsforco: number;
  sangue: number;
  muco: number;
  alertas: Alerta[];
  porDiaSerie: { data: string; n: number }[];
}

export function resumoIntestinal(evs: Evacuacao[], escala: EscalaFezes, hojeISO: string, janela = 14): ResumoIntestinal {
  const ini = dias("1970-01-01", hojeISO) - (janela - 1);
  const dentro = evs.filter((e) => {
    const d = dias("1970-01-01", e.data);
    return d >= ini && d <= ini + janela - 1;
  });
  const esc = escalaDe(escala);
  const doTipo = dentro.filter((e) => e.escala === escala);
  const n = (f: (e: Evacuacao) => boolean) => dentro.filter(f).length;
  const grupo = (e: Evacuacao) => escalaDe(e.escala).find((x) => x.tipo === e.tipo)?.grupo;
  const total = dentro.length;
  const ultima = [...evs].sort((a, b) => pd(b.data) - pd(a.data))[0];
  const diasSem = ultima ? dias(ultima.data, hojeISO) : null;
  const serie = Array.from({ length: janela }, (_, i) => {
    const data = new Date((ini + i) * 864e5).toISOString().slice(0, 10);
    return { data, n: dentro.filter((e) => e.data === data).length };
  });
  const pct = (x: number) => (total ? x / total : 0);
  const r: ResumoIntestinal = {
    janela, total, porDia: total / janela, diasSemEvacuar: diasSem,
    distribuicao: esc.map((x) => ({ ...x, n: doTipo.filter((e) => e.tipo === x.tipo).length })),
    pctDuras: pct(n((e) => grupo(e) === "duras")),
    pctLiquidas: pct(n((e) => grupo(e) === "liquidas")),
    pctDorEsforco: pct(n((e) => e.dor || e.esforco)),
    sangue: n((e) => e.sangue || e.cor === "vermelha"),
    muco: n((e) => e.muco),
    alertas: [],
    porDiaSerie: serie,
  };
  const al = r.alertas;
  if (n((e) => e.cor === "clara")) al.push(["ab", "Registro de fezes claras (esbranquiçadas ou acinzentadas). Encaminhar ao médico no mesmo dia."]);
  if (r.sangue) al.push(["ab", `${r.sangue} registro(s) com sangue nas fezes nos últimos ${janela} dias.`]);
  if (n((e) => e.cor === "preta")) al.push(["at", "Fezes pretas registradas. Conferir uso de suplemento de ferro."]);
  if (total >= 3 && r.pctDuras > 0.25) al.push(["at", `${Math.round(r.pctDuras * 100)}% das evacuações endurecidas.`]);
  if (total >= 3 && r.pctLiquidas > 0.25) al.push(["at", `${Math.round(r.pctLiquidas * 100)}% das evacuações aquosas ou pastosas.`]);
  if (total >= 3 && r.pctDorEsforco > 0.25) al.push(["at", `Dor ou esforço em ${Math.round(r.pctDorEsforco * 100)}% das evacuações.`]);
  if (r.muco) al.push(["in", `${r.muco} registro(s) com muco.`]);
  if (diasSem != null && diasSem >= 3 && evs.length) al.push(["at", `${diasSem} dias sem evacuação registrada.`]);
  return r;
}

// ---------- Critérios de Roma IV para constipação funcional ----------

export type GrupoRoma = "ate4" | "crianca4" | "adulto";

export const ROMA: Record<GrupoRoma, { titulo: string; regra: string; itens: { id: string; texto: string; extra?: boolean }[] }> = {
  ate4: {
    titulo: "Lactentes e crianças até 4 anos (Benninga et al., 2016)",
    regra: "Pelo menos 2 critérios durante 1 mês.",
    itens: [
      { id: "freq2", texto: "2 ou menos evacuações por semana" },
      { id: "retencao", texto: "Histórico de retenção excessiva de fezes" },
      { id: "dor", texto: "Histórico de evacuações dolorosas ou endurecidas" },
      { id: "diametro", texto: "Histórico de fezes de grande diâmetro" },
      { id: "massa", texto: "Massa fecal grande no reto (exame médico)" },
      { id: "incont", texto: "Após o desfralde: pelo menos 1 episódio de incontinência por semana", extra: true },
      { id: "obstrui", texto: "Após o desfralde: fezes de grande diâmetro que podem entupir o vaso", extra: true },
    ],
  },
  crianca4: {
    titulo: "Crianças a partir de 4 anos (Hyams et al., 2016)",
    regra: "Pelo menos 2 critérios, ao menos 1 vez por semana, durante 1 mês, sem critérios suficientes para síndrome do intestino irritável.",
    itens: [
      { id: "freq2", texto: "2 ou menos evacuações no vaso por semana" },
      { id: "incont", texto: "Pelo menos 1 episódio de incontinência fecal por semana" },
      { id: "retencao", texto: "Postura de retenção ou retenção voluntária excessiva" },
      { id: "dor", texto: "Evacuações dolorosas ou endurecidas" },
      { id: "massa", texto: "Massa fecal grande no reto (exame médico)" },
      { id: "obstrui", texto: "Fezes de grande diâmetro que podem entupir o vaso" },
    ],
  },
  adulto: {
    titulo: "Adultos (Roma IV)",
    regra: "Pelo menos 2 critérios nos últimos 3 meses, com início há 6 meses ou mais; fezes moles raras sem laxante; critérios insuficientes para síndrome do intestino irritável.",
    itens: [
      { id: "esforco", texto: "Esforço para evacuar em mais de 25% das evacuações" },
      { id: "duras", texto: "Fezes endurecidas ou em caroços (Bristol 1 ou 2) em mais de 25%" },
      { id: "incompleta", texto: "Sensação de evacuação incompleta em mais de 25%" },
      { id: "obstrucao", texto: "Sensação de bloqueio anorretal em mais de 25%" },
      { id: "manobras", texto: "Manobras manuais para facilitar em mais de 25%" },
      { id: "freq3", texto: "Menos de 3 evacuações espontâneas por semana" },
    ],
  },
};

export function grupoRoma(p: Paciente, hojeISO: string): GrupoRoma {
  if (p.tipo !== "crianca") return "adulto";
  return meses(p.nasc, hojeISO) < 48 ? "ate4" : "crianca4";
}

export function avaliarRoma(g: GrupoRoma, marcados: Record<string, boolean>) {
  const n = ROMA[g].itens.filter((i) => marcados[i.id]).length;
  return {
    n,
    compativel: n >= 2,
    texto: n >= 2
      ? `${n} critérios marcados: quadro compatível com constipação funcional por Roma IV, se a duração for atendida. O diagnóstico é médico.`
      : `${n} critério${n === 1 ? "" : "s"} marcado${n === 1 ? "" : "s"}: não atende Roma IV para constipação funcional.`,
  };
}

/** Sinais que pedem avaliação médica em bebês com constipação (Roma IV, sinais de alarme). */
export const SINAIS_ALARME_LACTENTE = [
  "Início da constipação antes de 1 mês de vida",
  "Eliminação de mecônio depois de 48 horas",
  "Sangue nas fezes sem fissura anal",
  "Perda de peso ou ganho insuficiente",
  "Vômitos com bile (esverdeados)",
  "Distensão abdominal importante",
  "Febre",
];
