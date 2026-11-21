// Toda alteração de dados passa por um evento. O reducer aplica no estado local e o
// repositório decide como gravar (localStorage hoje; tabelas do Supabase na integração).
import type {
  Amamentacao, Anamnese, AppState, Config, ConsultaAdulta, ConsultaCrianca, Crianca, Evacuacao, Formula,
  Lactante, Mensagem, Paciente, RegistroDiario, Sexo,
} from "../types";
import { anamneseVazia } from "../domain/anamnese";
import { planoParaEnviar } from "../domain/formula";
import { planoPadrao } from "./seed";

export type Evento =
  | { t: "estado/restaurar"; estado: AppState }
  | { t: "config/alterar"; campos: Partial<Config> }
  | { t: "formula/salvar"; formula: Formula }
  | { t: "paciente/criar"; paciente: Paciente }
  | { t: "paciente/alterar"; id: string; campos: Record<string, unknown> }
  | { t: "paciente/parto"; maeId: string; data: string; amam: Amamentacao; bebe: { id: string; nome: string; sexo: Sexo; peso: number | null; alt: number | null; pc: number | null } }
  | { t: "consulta/salvar"; pid: string; consulta: ConsultaCrianca | ConsultaAdulta }
  | { t: "consulta/excluir"; pid: string; data: string }
  | { t: "diario/adicionar"; pid: string; registro: RegistroDiario }
  | { t: "evacuacao/adicionar"; pid: string; evacuacao: Evacuacao }
  | { t: "evacuacao/excluir"; pid: string; id: string }
  | { t: "registros/marcarLidos"; pid: string }
  | { t: "anamnese/salvar"; pid: string; anamnese: Anamnese }
  | { t: "plano/enviar"; pid: string; data: string }
  | { t: "mensagem/registrar"; pid: string; mensagem: Mensagem }
  | { t: "mamada/alternar"; pid: string; data: string; i: number };

const achar = (s: AppState, id: string) => {
  const p = s.pacientes.find((x) => x.id === id);
  if (!p) throw new Error(`Paciente ${id} não encontrado`);
  return p;
};

export function reduzir(atual: AppState, e: Evento): AppState {
  if (e.t === "estado/restaurar") return structuredClone(e.estado);
  const s = structuredClone(atual);
  switch (e.t) {
    case "config/alterar":
      Object.assign(s.config, e.campos);
      break;
    case "formula/salvar": {
      const i = s.config.formulas.findIndex((f) => f.id === e.formula.id);
      if (i >= 0) s.config.formulas[i] = e.formula;
      else s.config.formulas.push(e.formula);
      break;
    }
    case "paciente/criar":
      s.pacientes.push(e.paciente);
      break;
    case "paciente/alterar":
      Object.assign(achar(s, e.id), e.campos);
      break;
    case "paciente/parto": {
      const mae = achar(s, e.maeId);
      if (mae.tipo !== "gestante") break;
      const b = e.bebe;
      const bebe: Crianca = {
        id: b.id, tipo: "crianca", nome: b.nome, nasc: e.data, sexo: b.sexo, diag: "", resp: `${mae.nome.split(" ")[0]} (mãe)`,
        maeId: mae.id, telefone: mae.telefone, naf: "Sedentário", prox: "", proxHora: "", recado: "", refeicoes: [], refObs: "",
        consultas: [{ data: e.data, peso: b.peso, alt: b.alt, pc: b.pc, obs: "Nascimento" }],
        plano: planoPadrao(), enviado: null, diario: [], evacuacoes: [], mensagens: [], anamnese: anamneseVazia(),
        intestinal: { roma: {}, data: null, obs: "" },
      };
      const { dum, consultas, ...resto } = mae;
      const lact: Lactante = { ...resto, tipo: "lactante", parto: e.data, amam: e.amam, bebeId: b.id, consultas: [], gestacao: { dum, consultas } };
      s.pacientes = s.pacientes.map((p) => (p.id === mae.id ? lact : p));
      s.pacientes.push(bebe);
      break;
    }
    case "consulta/salvar": {
      const p = achar(s, e.pid);
      const lista = p.consultas as (ConsultaCrianca | ConsultaAdulta)[];
      const i = lista.findIndex((c) => c.data === e.consulta.data);
      if (i >= 0) lista[i] = e.consulta;
      else lista.push(e.consulta);
      break;
    }
    case "consulta/excluir": {
      const p = achar(s, e.pid);
      (p as { consultas: { data: string }[] }).consultas = p.consultas.filter((c) => c.data !== e.data);
      break;
    }
    case "diario/adicionar":
      achar(s, e.pid).diario.push(e.registro);
      break;
    case "evacuacao/adicionar":
      achar(s, e.pid).evacuacoes.push(e.evacuacao);
      break;
    case "evacuacao/excluir": {
      const p = achar(s, e.pid);
      p.evacuacoes = p.evacuacoes.filter((x) => x.id !== e.id);
      break;
    }
    case "registros/marcarLidos": {
      const p = achar(s, e.pid);
      p.diario.forEach((d) => (d.lido = true));
      p.evacuacoes.forEach((d) => (d.lido = true));
      break;
    }
    case "anamnese/salvar":
      achar(s, e.pid).anamnese = e.anamnese;
      break;
    case "plano/enviar": {
      const p = achar(s, e.pid);
      if (p.tipo === "crianca") p.enviado = planoParaEnviar(p, s.config.formulas, e.data);
      break;
    }
    case "mensagem/registrar":
      achar(s, e.pid).mensagens.push(e.mensagem);
      break;
    case "mamada/alternar": {
      const porDia = (s.mamadas[e.pid] ??= {});
      const arr = (porDia[e.data] ??= []);
      arr[e.i] = !arr[e.i];
      break;
    }
  }
  return s;
}

export const naoLidos = (p: Paciente) =>
  p.diario.filter((d) => d.autor === "paciente" && !d.lido).length + p.evacuacoes.filter((d) => d.autor === "paciente" && !d.lido).length;
