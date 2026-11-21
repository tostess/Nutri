import type { Config, Paciente } from "../types";
import { alertasCrescimento, type Alerta } from "./crescimento";
import { alertasMae } from "./maternal";
import { escalaPadrao, resumoIntestinal } from "./intestinal";
import { dias, idadeTexto, igTexto } from "./datas";

export const primeiroNome = (p: Paciente) => p.nome.split(" ")[0];

export function subtitulo(p: Paciente, hojeISO: string): string {
  if (p.tipo === "gestante") return igTexto(dias(p.dum, hojeISO));
  if (p.tipo === "lactante") return idadeTexto(p.parto, hojeISO) + " pós-parto";
  return idadeTexto(p.nasc, hojeISO);
}

export const classeAvatar = (p: Paciente) => (p.tipo === "crianca" ? p.sexo : p.tipo === "gestante" ? "G" : "L");

export function alertasPaciente(p: Paciente, cfg: Config, hojeISO: string): Alerta[] {
  const base = p.tipo === "crianca" ? alertasCrescimento(p, cfg.crit) : alertasMae(p, hojeISO);
  const intest = resumoIntestinal(p.evacuacoes, escalaPadrao(p, hojeISO), hojeISO).alertas.filter((a) => a[0] === "ab");
  return [...base, ...intest];
}

export const ABAS = {
  crianca: [["crescimento", "Crescimento"], ["necessidades", "Necessidades"], ["formula", "Fórmula"], ["plano", "Plano alimentar"], ["anamnese", "Anamnese"], ["intestinal", "Intestinal"], ["diario", "Diário"], ["whatsapp", "WhatsApp"], ["cadastro", "Cadastro"]],
  gestante: [["gestacao", "Ganho de peso"], ["necessidades", "Necessidades"], ["plano", "Plano alimentar"], ["anamnese", "Anamnese"], ["intestinal", "Intestinal"], ["diario", "Diário"], ["whatsapp", "WhatsApp"], ["cadastro", "Cadastro e parto"]],
  lactante: [["posparto", "Peso pós-parto"], ["necessidades", "Necessidades"], ["plano", "Plano alimentar"], ["anamnese", "Anamnese"], ["intestinal", "Intestinal"], ["diario", "Diário"], ["whatsapp", "WhatsApp"], ["cadastro", "Cadastro"]],
} as const;
