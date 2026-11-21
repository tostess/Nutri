// Dados de exemplo. Medidas da "Helena" vêm da planilha da nutricionista, com nome trocado.
import type {
  AppState, ConsultaCrianca, Crianca, Evacuacao, Formula, Gestante, Lactante, PlanoFormula, Refeicao,
} from "../types";
import { anamneseVazia } from "../domain/anamnese";
import { TEMPLATES_PADRAO } from "../domain/mensagens";
import { planoParaEnviar } from "../domain/formula";

const F = (id: string, nome: string, kcal: number | null, prot: number | null, origem: string, extra: Partial<Formula> = {}): Formula =>
  ({ id, nome, kcal, prot, cho: null, lip: null, osm: null, po: true, origem, ...extra });

export const FORMULAS_PADRAO = (): Formula[] => [
  F("leite-humano", "Leite humano pasteurizado (doadoras)", null, null, "preencher", { po: false }),
  F("aptamil-0-6", "Aptamil Pro Futura Gold 0-6 meses", 67, 1.3, "imagem enviada"),
  F("nan-comfort-0-6", "NAN Comfort 0-6 meses", 68, 1.2, "imagem enviada"),
  F("nan-comfort-6-12", "NAN Comfort 6-12 meses", null, null, "preencher"),
  F("nanlac-comfort-1-3", "NANLAC Comfort 1-3 anos", null, null, "preencher"),
  F("nan-supreme-0-6", "NAN Supreme Pro 0-6 meses", null, null, "preencher"),
  F("nan-supreme-6-12", "NAN Supreme Pro 6-12 meses", null, null, "preencher"),
  F("nan-supreme-1-3", "NAN Supreme Pro 1-3 anos", null, null, "preencher"),
  F("nestogeno-0-6", "Nestogeno 0-6 meses", null, null, "preencher"),
  F("alfamino", "Alfamino", 70, 1.8, "Quadro 10", { cho: 7.9, lip: 3.4, osm: 300 }),
  F("neocate-lcp", "Neocate LCP", 67, 1.8, "Quadro 10", { cho: 7.3, lip: 3.4, osm: 310 }),
  F("novamil-rice", "NOVAMIL RICE", 506, 13, "conferir: valores parecem por 100 g de pó", { cho: 55, lip: 26 }),
];

export const ORIENTACAO_PADRAO =
  "Lave bem as mãos e os utensílios. Coloque primeiro a água, depois o pó, usando a medida rasa da própria lata. O que sobrar da mamada vai fora.";

export const planoPadrao = (o: Partial<PlanoFormula> = {}): PlanoFormula => ({
  pct: 1, kcal100: 67, formula: "nan-comfort-0-6", kcal: [90, 100], prot: [1.5, 2], vol: null,
  etapas: 8, ml: 30, g: 5, lata: 400, orient: ORIENTACAO_PADRAO, ...o,
});

const C = (data: string, peso: number | null, alt: number | null, pc: number | null, obs = ""): ConsultaCrianca => ({ data, peso, alt, pc, obs });
const M = (h: string, n: string, d: string): Refeicao => ({ h, n, d });
const base = {
  naf: "Sedentário" as const, prox: "", proxHora: "", recado: "", refeicoes: [] as Refeicao[], refObs: "",
  diario: [], evacuacoes: [] as Evacuacao[], mensagens: [], intestinal: { roma: {}, data: null, obs: "" },
};
const ev = (id: string, data: string, hora: string, escala: "bristol" | "lactente", tipo: number, cor: Evacuacao["cor"], o: Partial<Evacuacao> = {}): Evacuacao =>
  ({ id, data, hora, escala, tipo, cor, quantidade: "media", dor: false, esforco: false, sangue: false, muco: false, obs: "", autor: "paciente", lido: true, ...o });

export function estadoExemplo(): AppState {
  const formulas = FORMULAS_PADRAO();
  const camila: Gestante = {
    ...base, id: "camila", tipo: "gestante", nome: "Camila Duarte", nasc: "1994-03-15", telefone: "(22) 90000-0001",
    altura: 164, pesoPre: 62, dum: "2026-05-04", naf: "Pouco ativo", prox: "2026-12-14", proxHora: "14:00",
    recado: "Camila, o ganho de peso subiu um pouco mais rápido no último mês. Vamos caprichar nos lanches com fruta e manter a caminhada.",
    consultas: [
      { data: "2026-06-22", peso: 61.6, obs: "Náuseas matinais" }, { data: "2026-08-03", peso: 62.3, obs: "" },
      { data: "2026-09-14", peso: 64.1, obs: "" }, { data: "2026-10-19", peso: 66.0, obs: "" },
      { data: "2026-11-16", peso: 68.9, obs: "Relata mais fome à noite" },
    ],
    refeicoes: [
      M("07:00", "Café da manhã", "1 fatia de pão integral com ovo mexido, 1 fatia de mamão, café com leite"),
      M("10:00", "Lanche", "1 iogurte natural com 1 colher de aveia"),
      M("12:30", "Almoço", "Arroz, feijão, 1 filé de frango grelhado, salada de folhas e legumes à vontade, 1 laranja"),
      M("16:00", "Lanche", "1 fruta e 3 castanhas"),
      M("19:30", "Jantar", "Igual ao almoço ou sopa de legumes com carne"),
      M("21:30", "Ceia", "1 copo de leite"),
    ],
    diario: [{ id: "d11", data: "2026-11-18", pesoKg: null, sint: ["Azia"], relato: "Azia depois do jantar. Comi mais tarde que o normal.", autor: "paciente", lido: false }],
    evacuacoes: [
      ev("e1", "2026-11-14", "08:10", "bristol", 2, "marrom", { esforco: true }),
      ev("e2", "2026-11-16", "07:40", "bristol", 3, "marrom"),
      ev("e3", "2026-11-18", "09:00", "bristol", 2, "marrom", { esforco: true }),
      ev("e4", "2026-11-20", "08:30", "bristol", 4, "marrom"),
    ],
    anamnese: {
      ...anamneseVazia(),
      respostas: { obs_gestacoes: 1, obs_partos: 0, obs_abortos: 0, obs_tipo: "Única", obs_intercorrencias: ["Nenhuma"], cli_suplementos: ["Ácido fólico", "Ferro"], hab_atividade: "1 a 2 vezes por semana", hab_agua: 1.5, ali_sint: ["Azia", "Constipação"], int_freq: "Dia sim, dia não" },
      exames: [{ data: "2026-10-10", exame: "Hemoglobina", valor: "11,4", unidade: "g/dL" }, { data: "2026-10-10", exame: "Glicemia de jejum", valor: "84", unidade: "mg/dL" }],
      atualizadaEm: "2026-10-19", atualizadaPor: "nutri",
    },
  };
  const juliana: Lactante = {
    ...base, id: "juliana", tipo: "lactante", nome: "Juliana Rocha", nasc: "1995-06-20", telefone: "(22) 90000-0002",
    altura: 168, pesoPre: 64, parto: "2026-08-12", amam: "parcial", bebeId: "davi", prox: "2026-12-12", proxHora: "09:30",
    consultas: [{ data: "2026-09-10", peso: 70.5, obs: "" }, { data: "2026-10-15", peso: 68.2, obs: "" }, { data: "2026-11-14", peso: 66.9, obs: "" }],
    refeicoes: [
      M("07:00", "Café da manhã", "Pão integral com queijo branco, 1 fruta, café com leite"),
      M("10:00", "Lanche", "Vitamina de banana com aveia"),
      M("12:30", "Almoço", "Arroz, feijão, carne magra, legumes refogados, salada"),
      M("16:00", "Lanche", "Tapioca com ovo e 1 fruta"),
      M("19:30", "Jantar", "Arroz, feijão, peixe ou frango, legumes"),
      M("22:00", "Ceia", "1 copo de leite ou iogurte"),
    ],
    anamnese: anamneseVazia(),
  };
  const helena: Crianca = {
    ...base, id: "helena", tipo: "crianca", nome: "Helena Moraes", nasc: "2026-02-25", sexo: "F", diag: "APLV",
    resp: "Mariana (mãe)", telefone: "(22) 90000-0003", prox: "2026-12-07", proxHora: "10:00",
    recado: "Mariana, siga com o plano de mamadas e registre aqui como foram os dias. Nos vemos na próxima consulta.",
    consultas: [
      C("2026-02-25", 3.45, 45, 37), C("2026-03-23", 3.91, 53, 32), C("2026-04-13", 4.2, 56, 38), C("2026-05-04", 4.48, 58.5, 39.5),
      C("2026-07-02", 5.69, 63, 41.5), C("2026-08-03", 6.006, 64.5, 42), C("2026-08-07", 5.9, 64.5, 42.5), C("2026-08-25", 6.18, 65.5, 43),
      C("2026-11-09", 6.64, 68.5, 44.5),
    ],
    plano: planoPadrao(), enviado: null,
    refeicoes: [
      M("07:00", "Mamada", "Conforme o plano de fórmula"),
      M("10:00", "Fruta", "Fruta amassada ou raspada, na colher"),
      M("12:00", "Almoço", "Papa salgada: cereal ou tubérculo, feijão, carne e legume, amassados com garfo"),
      M("16:00", "Fruta", "Fruta amassada"),
      M("18:30", "Jantar", "Papa salgada, como no almoço"),
    ],
    diario: [
      { id: "d1", data: "2026-11-12", pesoKg: 6.68, sint: ["Regurgitação"], relato: "Mamou 7 vezes. Aceitou papinha de abóbora no almoço. Golfou um pouco depois da mamada da tarde.", autor: "paciente", lido: true },
      { id: "d2", data: "2026-11-16", pesoKg: 6.74, sint: [], relato: "Dia tranquilo, 8 mamadas. Fezes normais.", autor: "paciente", lido: false },
      { id: "d3", data: "2026-11-18", pesoKg: null, sint: ["Cólica"], relato: "Chorou bastante à noite, parecia cólica. Ofereci todas as mamadas.", autor: "paciente", lido: false },
    ],
    evacuacoes: [
      ev("h1", "2026-11-12", "09:20", "lactente", 2, "amarela"),
      ev("h2", "2026-11-13", "15:00", "lactente", 3, "verde"),
      ev("h3", "2026-11-15", "08:45", "lactente", 3, "amarela"),
      ev("h4", "2026-11-17", "11:10", "lactente", 4, "marrom", { dor: true, esforco: true }),
      ev("h5", "2026-11-19", "10:30", "lactente", 4, "marrom", { esforco: true, lido: false }),
    ],
    anamnese: {
      ...anamneseVazia(),
      respostas: { nas_ig: 39, nas_parto: "Cesárea", nas_uti: false, ale_atual: "Só fórmula", ale_inicio_formula: 1, com_inicio: 6, com_consistencia: "Amassada", com_aceitacao: "Boa", sau_alergias: ["APLV"], sau_suplementos: ["Vitamina D"], int_freq: "Dia sim, dia não", int_consist: "Endurecida, em bolinhas" },
      atualizadaEm: "2026-11-09", atualizadaPor: "nutri",
    },
  };
  const davi: Crianca = {
    ...base, id: "davi", tipo: "crianca", maeId: "juliana", nome: "Davi Rocha", nasc: "2026-08-12", sexo: "M", diag: "Refluxo fisiológico",
    resp: "Juliana (mãe)", telefone: "(22) 90000-0002", prox: "2026-12-12", proxHora: "09:30",
    consultas: [C("2026-08-12", 3.2, 49, 34.5), C("2026-09-10", 4.15, 53.5, 37), C("2026-10-15", 5.2, 57, 39), C("2026-11-14", 5.95, 60, 40.5)],
    plano: planoPadrao({ formula: "aptamil-0-6", pct: 0.5, etapas: 6 }), enviado: null, anamnese: anamneseVazia(),
  };
  const laura: Crianca = {
    ...base, id: "laura", tipo: "crianca", nome: "Laura Teixeira", nasc: "2024-07-03", sexo: "F", diag: "Seletividade alimentar",
    resp: "Patrícia (mãe)", telefone: "(22) 90000-0004", naf: "Pouco ativo", prox: "2027-02-10", proxHora: "15:00",
    consultas: [C("2024-07-03", 3.05, 48, 34), C("2026-05-10", 11.2, 85, 47), C("2026-08-12", 11.6, 87, 47.3), C("2026-11-11", 11.9, 88.5, 47.5)],
    plano: planoPadrao({ formula: "nanlac-comfort-1-3", pct: 0.3, etapas: 2 }), enviado: null,
    refeicoes: [
      M("07:30", "Café da manhã", "Leite com fruta picada e pão com manteiga"), M("10:00", "Lanche", "1 fruta em pedaços"),
      M("12:00", "Almoço", "Arroz, feijão, carne desfiada, 2 legumes diferentes"), M("15:30", "Lanche", "Iogurte natural com fruta"),
      M("19:00", "Jantar", "Como no almoço"), M("21:00", "Ceia", "1 copo de leite"),
    ],
    anamnese: anamneseVazia(),
  };
  for (const c of [helena, davi, laura]) c.enviado = planoParaEnviar(c, formulas, c.consultas[c.consultas.length - 1].data);
  return {
    versao: 3,
    config: {
      nutricionista: { nome: "a nutricionista", telefone: "", crn: "" },
      crit: { ab: 0.7, at: 0.9, ac: 1.2, dias: 30 },
      formulas,
      templates: { ...TEMPLATES_PADRAO },
    },
    pacientes: [camila, juliana, helena, davi, laura],
    mamadas: {},
  };
}
