// Tipos de domínio do Colo. Datas sempre em ISO "AAAA-MM-DD" (sem fuso).

export type Sexo = "F" | "M";
export type Tipo = "crianca" | "gestante" | "lactante";
export type NAF = "Sedentário" | "Pouco ativo" | "Ativo" | "Muito ativo";
export type Amamentacao = "exclusiva" | "parcial" | "nao";
export type Autor = "paciente" | "nutri";
export type Classe = "Abaixo" | "Atenção" | "Adequado" | "Acima";

export interface ConsultaCrianca {
  data: string;
  peso: number | null; // kg
  alt: number | null; // cm
  pc: number | null; // cm
  obs: string;
}

export interface ConsultaAdulta {
  data: string;
  peso: number | null; // kg
  obs: string;
}

export interface PlanoFormula {
  pct: number; // fração da energia vinda da fórmula (0 a 1)
  kcal100: number; // kcal por 100 mL usada na seção de volume pelo EER
  formula: string; // id da fórmula
  kcal: [number, number]; // meta kcal/kg
  prot: [number, number]; // meta g/kg
  vol: number | null; // volume fixo mL/dia; null = calcula pela meta mínima
  etapas: number;
  ml: number; // mL de água por medida
  g: number; // g de pó por medida
  lata: number; // g por lata
  orient: string;
}

export interface PlanoEnviado {
  data: string;
  formula: string;
  etapas: number;
  porEt: number | null;
  med: number | null;
  agua: number | null;
  latas: number | null;
  po: boolean;
  orient: string;
}

export interface Refeicao {
  h: string;
  n: string;
  d: string;
}

export interface RegistroDiario {
  id: string;
  data: string;
  pesoKg: number | null;
  comp?: number | null;
  pc?: number | null;
  pt?: number | null;
  sint: string[];
  relato: string;
  autor: Autor;
  lido: boolean;
}

export type CorFezes = "amarela" | "verde" | "marrom" | "preta" | "vermelha" | "clara";
export type EscalaFezes = "bristol" | "lactente";

export interface Evacuacao {
  id: string;
  data: string;
  hora: string;
  escala: EscalaFezes;
  tipo: number; // Bristol 1-7 ou escala do lactente 1-4
  cor: CorFezes | null;
  quantidade: "pouca" | "media" | "muita" | null;
  dor: boolean;
  esforco: boolean;
  sangue: boolean;
  muco: boolean;
  obs: string;
  autor: Autor;
  lido: boolean;
}

export type ValorAnamnese = string | string[] | number | boolean | null;

export interface Exame {
  data: string;
  exame: string;
  valor: string;
  unidade: string;
}

export interface Anamnese {
  respostas: Record<string, ValorAnamnese>;
  r24: Refeicao[];
  exames: Exame[];
  atualizadaEm: string | null;
  atualizadaPor: Autor | null;
}

export interface AvaliacaoIntestinal {
  roma: Record<string, boolean>;
  data: string | null;
  obs: string;
}

export type TemplateId = "lembrete" | "plano" | "recado" | "diario" | "acesso";

export interface Mensagem {
  id: string;
  em: string; // ISO datetime
  template: TemplateId | "livre";
  texto: string;
  via: "zapi" | "link";
  status: "enviada" | "aberta" | "erro";
  erro?: string;
}

interface PacienteBase {
  id: string;
  tipo: Tipo;
  nome: string;
  nasc: string;
  telefone: string;
  naf: NAF;
  prox: string;
  proxHora: string;
  recado: string;
  refeicoes: Refeicao[];
  refObs: string;
  diario: RegistroDiario[];
  evacuacoes: Evacuacao[];
  anamnese: Anamnese;
  intestinal: AvaliacaoIntestinal;
  mensagens: Mensagem[];
}

export interface Crianca extends PacienteBase {
  tipo: "crianca";
  sexo: Sexo;
  diag: string;
  resp: string;
  maeId?: string;
  consultas: ConsultaCrianca[];
  plano: PlanoFormula;
  enviado: PlanoEnviado | null;
}

export interface Gestante extends PacienteBase {
  tipo: "gestante";
  altura: number;
  pesoPre: number;
  dum: string;
  consultas: ConsultaAdulta[];
}

export interface Lactante extends PacienteBase {
  tipo: "lactante";
  altura: number;
  pesoPre: number;
  parto: string;
  amam: Amamentacao;
  bebeId?: string;
  consultas: ConsultaAdulta[];
  gestacao?: { dum: string; consultas: ConsultaAdulta[] };
}

export type Paciente = Crianca | Gestante | Lactante;
export type Mae = Gestante | Lactante;

export interface Formula {
  id: string;
  nome: string;
  kcal: number | null;
  prot: number | null;
  cho: number | null;
  lip: number | null;
  osm: number | null;
  po: boolean;
  origem: string;
}

export interface Criterios {
  ab: number;
  at: number;
  ac: number;
  dias: number;
}

export interface Config {
  nutricionista: { nome: string; telefone: string; crn: string };
  crit: Criterios;
  formulas: Formula[];
  templates: Record<TemplateId, string>;
}

export interface AppState {
  versao: 3;
  config: Config;
  pacientes: Paciente[];
  mamadas: Record<string, Record<string, boolean[]>>;
}
