// Tabelas de referência. As de criança vêm da planilha "Avaliação antropométrica"
// da nutricionista; as de gestante e lactante, das fontes citadas em cada bloco.
import type { NAF } from "../types";

/** Ganho esperado por faixa etária (SBP: Strufaldi 2013 / Tratado de Pediatria 2017). */
export const REF_GANHO = [
  { faixa: "0 a 3 meses", min: 0, pMin: 25, pMax: 30, est: 3.5, pc: 2 },
  { faixa: "4 a 6 meses", min: 4, pMin: 20, pMax: 20, est: 2, pc: 1 },
  { faixa: "7 a 9 meses", min: 7, pMin: 15, pMax: 15, est: 1.5, pc: 0.5 },
  { faixa: "10 a 12 meses", min: 10, pMin: 10, pMax: 10, est: 1, pc: 0.25 },
  { faixa: "1 a 3 anos", min: 12, pMin: 8, pMax: 8, est: 1, pc: 0.25 },
  { faixa: "4 a 9 anos", min: 48, pMin: 6, pMax: 6, est: 4 / 12, pc: 1 / 12 },
  { faixa: "10 anos ou mais", min: 120, pMin: null, pMax: null, est: null, pc: null },
] as const;

/** OMS 2006, incremento de peso em g/dia por mês completo (0-5): [-1DP, mediana, +1DP]. */
export const OMS_INCREMENTO: Record<"F" | "M", [number, number, number][]> = {
  M: [[24.5, 36.5, 44], [30, 40, 50.5], [19.5, 27, 35.5], [14, 20.5, 28], [10.5, 17.5, 25], [7.5, 14, 21]],
  F: [[22, 33.5, 41.5], [25, 33.5, 45], [17, 24, 31.5], [13, 20, 26.5], [10, 20, 26.5], [7, 13.5, 20]],
};

/** DRI/NASEM 2023, crianças 0-2,99 anos: [constante, idade(anos), altura(cm), peso(kg)]. */
export const EER_LACTENTE: Record<"F" | "M", number[]> = {
  M: [-716.45, -1, 17.82, 15.06],
  F: [-69.15, 80, 2.65, 54.15],
};
/** Energia de deposição por faixa: 0-2,99m, 3-5,99m, 6-11,99m, 1-2,99a. */
export const EER_LACTENTE_DEP: Record<"F" | "M", number[]> = { M: [200, 50, 20, 20], F: [180, 60, 20, 15] };

/** DRI/NASEM 2023, 3-18 anos, por nível de atividade. */
export const EER_NAF: Record<"F" | "M", Record<NAF, readonly number[]>> = {
  M: {
    "Sedentário": [-447.51, 3.68, 13.01, 13.15],
    "Pouco ativo": [19.12, 3.68, 8.62, 20.28],
    "Ativo": [-388.19, 3.68, 12.66, 20.46],
    "Muito ativo": [-671.75, 3.68, 15.38, 23.25],
  },
  F: {
    "Sedentário": [55.59, -22.25, 8.43, 17.07],
    "Pouco ativo": [-297.54, -22.25, 12.77, 14.73],
    "Ativo": [-189.55, -22.25, 11.74, 18.34],
    "Muito ativo": [-709.59, -22.25, 18.22, 14.25],
  },
};
/** Deposição: 3-3,99a, 4-8,99a, 9-13,99a, 14-18,99a. */
export const EER_NAF_DEP: Record<"F" | "M", number[]> = { M: [20, 15, 25, 20], F: [15, 15, 30, 20] };
export const FAIXAS_EER = ["0-2,99 meses", "3-5,99 meses", "6-11,99 meses", "1-2,99 anos", "3-3,99 anos", "4-8,99 anos", "9-13,99 anos", "14-18,99 anos"];

export const GRUPOS = ["0-6 meses", "7-12 meses", "1-3 anos", "4-18 anos", "≥19 anos"];

/** AMDR: nome, %min 1-3a, %max 1-3a, %min 4-18a, %max 4-18a, kcal/g. */
export const AMDR_CRIANCA: [string, number, number, number, number, number][] = [
  ["Proteína", 0.05, 0.2, 0.1, 0.3, 4],
  ["Lipídios", 0.3, 0.4, 0.25, 0.3, 9],
  ["Carboidratos", 0.45, 0.65, 0.45, 0.65, 4],
  ["Ácido graxo ω-6 (linoleico)", 0.05, 0.1, 0.05, 0.1, 9],
  ["Ácido graxo ω-3 (linolênico)", 0.006, 0.012, 0.006, 0.012, 9],
  ["Açúcar de adição (ideal 5%, limite 10%)", 0.05, 0.1, 0.05, 0.1, 4],
];

/** RDA/AI de proteína em g/kg/dia a partir de cada idade em meses (Anexo 10). */
export const PROT_KG: [number, number][] = [[0, 1.52], [6, 1.2], [12, 1.05], [48, 0.95], [108, 0.95], [168, 0.85]];

/** Micronutrientes 0-6m, 7-12m, 1-3a. */
export const MICRO_CRIANCA: [string, string, [number, number, number], [string, string, string]][] = [
  ["Vitamina A", "mcg RAE/dia", [400, 500, 300], ["AI", "AI", "RDA"]],
  ["Vitamina D", "mcg/dia", [10, 10, 15], ["AI", "AI", "RDA"]],
  ["Vitamina D", "UI/dia", [400, 400, 600], ["AI", "AI", "RDA"]],
  ["Vitamina E", "mg/dia", [4, 5, 6], ["AI", "AI", "RDA"]],
  ["Vitamina C", "mg/dia", [40, 50, 15], ["AI", "AI", "RDA"]],
  ["Vitamina B12", "mcg/dia", [0.4, 0.5, 0.9], ["AI", "AI", "RDA"]],
  ["Ferro", "mg/dia", [0.27, 11, 7], ["AI", "RDA", "RDA"]],
  ["Zinco", "mg/dia", [2, 3, 3], ["AI", "RDA", "RDA"]],
];
export const AGUA_TOTAL_L = [0.7, 0.8, 1.3];

/** SBP Tabela 5, refeições lácteas: [dias mín, faixa, vol mín, vol máx, refeições mín, máx]. */
export const TABELA5: [number, string, number, number, number, number][] = [
  [0, "Nascimento até 30 dias", 60, 120, 6, 8],
  [30, "30 a 60 dias", 120, 150, 6, 8],
  [60, "2 a 3 meses", 150, 180, 5, 6],
  [90, "3 a 4 meses", 180, 200, 5, 6],
  [120, "> 4 meses", 180, 200, 2, 3],
];

// ---------- Gestação e lactação ----------

export type ClasseIMC = "bp" | "eu" | "sp" | "ob";
export const IMC_NOME: Record<ClasseIMC, string> = { bp: "Baixo peso", eu: "Eutrofia", sp: "Sobrepeso", ob: "Obesidade" };

/**
 * Curvas brasileiras de ganho de peso gestacional (Kac et al., 2021; Ministério da Saúde, 2022).
 * Ganho acumulado (kg) em 13, 27 e 40 semanas: [semana, mín, máx].
 */
export const GANHO_GESTACIONAL: Record<ClasseIMC, [number, number, number][]> = {
  bp: [[13, 0.2, 1.2], [27, 5.6, 7.2], [40, 9.7, 12.2]],
  eu: [[13, -1.8, 0.7], [27, 3.1, 6.3], [40, 8, 12]],
  sp: [[13, -1.6, -0.05], [27, 2.3, 3.7], [40, 7, 9]],
  ob: [[13, -1.6, -0.05], [27, 1.1, 2.7], [40, 5, 7.2]],
};

/** DRI/NASEM 2023, mulher ≥19 anos não gestante: [constante, idade, altura, peso]. */
export const EER_MULHER: Record<NAF, number[]> = {
  "Sedentário": [584.9, -7.01, 5.72, 11.71],
  "Pouco ativo": [575.77, -7.01, 6.6, 12.14],
  "Ativo": [710.25, -7.01, 6.54, 12.34],
  "Muito ativo": [511.83, -7.01, 9.07, 12.56],
};
/** DRI/NASEM 2023, gestação 2º e 3º trimestres (+ 9,16 × semanas + deposição). */
export const EER_GESTACAO: Record<NAF, number[]> = {
  "Sedentário": [1131.2, -2.04, 0.34, 12.15],
  "Pouco ativo": [693.35, -2.04, 5.73, 10.2],
  "Ativo": [-223.84, -2.04, 13.23, 8.15],
  "Muito ativo": [-779.72, -2.04, 18.45, 8.73],
};
export const DEPOSICAO_GESTACAO: Record<ClasseIMC, number> = { bp: 300, eu: 200, sp: 150, ob: -50 };
export const LACTACAO = { leite06: 540, leite712: 380, mobilizacao06: 140 };

export const AMAMENTACAO_NOME = { exclusiva: "Amamentação exclusiva", parcial: "Amamentação mista", nao: "Não amamenta" } as const;

/** DRI/IOM mulheres 19-50 anos: nutriente, unidade, gestante, lactante, tipo. */
export const MICRO_MULHER: [string, string, number, number, string][] = [
  ["Vitamina A", "mcg RAE/dia", 770, 1300, "RDA"],
  ["Vitamina D", "mcg/dia (600 UI)", 15, 15, "RDA"],
  ["Vitamina C", "mg/dia", 85, 120, "RDA"],
  ["Vitamina B12", "mcg/dia", 2.6, 2.8, "RDA"],
  ["Folato", "mcg DFE/dia", 600, 500, "RDA"],
  ["Ferro", "mg/dia", 27, 9, "RDA"],
  ["Zinco", "mg/dia", 11, 12, "RDA"],
  ["Cálcio", "mg/dia", 1000, 1000, "RDA"],
  ["Iodo", "mcg/dia", 220, 290, "RDA"],
  ["Colina", "mg/dia", 450, 550, "AI"],
];
