import type { Config, Formula, Paciente, TemplateId } from "../types";
import { fmt, ok } from "../format";
import { dataBR, diaSemana } from "./datas";
import { calcularFormula } from "./formula";

export const TEMPLATES_PADRAO: Record<TemplateId, string> = {
  lembrete: "Olá, {contato}! Lembrete: {consulta} com {nutricionista} é {data}, às {hora}. Se precisar remarcar, é só responder aqui.",
  plano: "Olá, {contato}! Atualizei {plano} no app: {resumo}. Os detalhes estão aqui: {link}",
  recado: "{contato}, recado de {nutricionista}: {recado}",
  diario: "Oi, {contato}! Como estão os dias? Quando puder, registre no app as refeições, os sintomas e as evacuações: {link}",
  acesso: "Olá, {contato}! Este é o seu acesso ao acompanhamento nutricional com {nutricionista}: {link}",
};

export const TEMPLATE_NOME: Record<TemplateId, string> = {
  lembrete: "Lembrete de consulta",
  plano: "Plano atualizado",
  recado: "Recado",
  diario: "Pedido de registro no diário",
  acesso: "Link de acesso ao app",
};

/** Deixa só dígitos e põe o 55 do Brasil. Retorna null se não parecer um celular válido. */
export function normalizarTelefone(t: string): string | null {
  const d = (t || "").replace(/\D/g, "");
  if (d.length === 12 || d.length === 13) return d.startsWith("55") ? d : null;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return null;
}

export const linkWhatsApp = (telefone: string, texto: string) =>
  `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;

export function contato(p: Paciente): string {
  if (p.tipo === "crianca") return (p.resp || p.nome).split(/[\s(]/)[0];
  return p.nome.split(" ")[0];
}

export function variaveis(p: Paciente, cfg: Config, appUrl: string): Record<string, string> {
  const primeiro = p.nome.split(" ")[0];
  const crianca = p.tipo === "crianca";
  let resumo = "o seu plano alimentar";
  if (crianca) {
    const r = calcularFormula(p, cfg.formulas);
    resumo = ok(r.porEtapa)
      ? `${p.plano.etapas} mamadas de ${fmt(r.porEtapa, 0)} mL` + (r.po && ok(r.medidas) ? ` (${r.medidas} medidas rasas em ${fmt(r.agua, 0)} mL de água)` : "")
      : `o plano alimentar de ${primeiro}`;
  }
  return {
    contato: contato(p),
    paciente: primeiro,
    nutricionista: cfg.nutricionista.nome,
    consulta: crianca ? `a consulta de ${primeiro}` : "sua consulta",
    data: p.prox ? `${diaSemana(p.prox).toLowerCase()}, ${dataBR(p.prox).slice(0, 5)}` : "(sem data marcada)",
    hora: p.proxHora || "(horário a combinar)",
    plano: crianca ? `o plano de ${primeiro}` : "o seu plano",
    resumo,
    recado: p.recado || "",
    link: `${appUrl.replace(/\/$/, "")}/paciente/${p.id}`,
  };
}

export function preencher(modelo: string, vars: Record<string, string>): string {
  return modelo.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function montarMensagem(id: TemplateId, p: Paciente, cfg: Config, appUrl: string): string {
  return preencher(cfg.templates[id] ?? TEMPLATES_PADRAO[id], variaveis(p, cfg, appUrl));
}

export interface Lembrete {
  pacienteId: string;
  telefone: string;
  texto: string;
}

/** Lembretes para as consultas marcadas na data-alvo (usado pelo cron diário). */
export function lembretesDoDia(pacientes: Paciente[], cfg: Config, dataAlvo: string, appUrl: string): Lembrete[] {
  return pacientes
    .filter((p) => p.prox === dataAlvo)
    .map((p) => ({ p, tel: normalizarTelefone(p.telefone) }))
    .filter((x): x is { p: Paciente; tel: string } => !!x.tel)
    .map(({ p, tel }) => ({ pacienteId: p.id, telefone: tel, texto: montarMensagem("lembrete", p, cfg, appUrl) }));
}

export type { Formula };
