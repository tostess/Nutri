"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Amamentacao, Paciente, Sexo, Tipo } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { anamneseVazia } from "@/lib/domain/anamnese";
import { AMAMENTACAO_NOME } from "@/lib/domain/referencias";
import { planoPadrao } from "@/lib/data/seed";
import { num, uid } from "@/lib/format";
import { Opcoes, useHoje } from "@/components/ui";

export default function NovaPaciente() {
  const { despachar, toast } = useApp();
  const router = useRouter();
  const hoje = useHoje();
  const [tipo, setTipo] = useState<Tipo>("gestante");

  function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const F = new FormData(e.currentTarget);
    const g = (k: string) => String(F.get(k) ?? "").trim();
    const id = uid("p");
    const base = {
      id, nome: g("nome"), nasc: g("nasc"), telefone: g("telefone"), naf: "Sedentário" as const, prox: "", proxHora: "", recado: "",
      refeicoes: [], refObs: "", diario: [], evacuacoes: [], mensagens: [], anamnese: anamneseVazia(), intestinal: { roma: {}, data: null, obs: "" },
    };
    let p: Paciente;
    if (tipo === "crianca") {
      p = { ...base, tipo, sexo: g("sexo") as Sexo, diag: g("diag"), resp: g("resp"), consultas: [{ data: g("nasc"), peso: num(g("peso")), alt: num(g("alt")), pc: num(g("pc")), obs: "Nascimento" }], plano: planoPadrao(), enviado: null };
    } else {
      const comuns = { altura: num(g("altura")) ?? 160, pesoPre: num(g("pesoPre")) ?? 60, consultas: num(g("peso")) != null ? [{ data: hoje, peso: num(g("peso")), obs: "" }] : [] };
      p = tipo === "gestante"
        ? { ...base, ...comuns, tipo, dum: g("dum") }
        : { ...base, ...comuns, tipo, parto: g("parto"), amam: g("amam") as Amamentacao };
    }
    despachar({ t: "paciente/criar", paciente: p });
    toast("Paciente cadastrada.");
    router.push(`/nutri/p/${id}`);
  }

  return (
    <form className="panel" style={{ maxWidth: 680 }} onSubmit={salvar}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Nova paciente</h1>
      <div className="campo"><span>Tipo de atendimento</span>
        <Opcoes valor={tipo} opcoes={["gestante", "lactante", "crianca"] as const} rotulos={{ gestante: "Gestante", lactante: "Lactante", crianca: "Bebê ou criança" }} onEscolher={(v) => v && setTipo(v)} />
      </div>
      <div className="form" style={{ marginTop: 14 }} key={tipo}>
        <label className="full">{tipo === "crianca" ? "Nome do bebê" : "Nome"}<input name="nome" required /></label>
        <label>Nascimento<input type="date" name="nasc" required /></label>
        <label>WhatsApp<input name="telefone" type="tel" placeholder="(22) 99999-9999" /></label>
        {tipo === "crianca" ? (
          <>
            <label>Sexo<select name="sexo"><option value="F">Feminino</option><option value="M">Masculino</option></select></label>
            <label>Responsável<input name="resp" placeholder="Nome (mãe)" /></label>
            <label>Diagnóstico médico<input name="diag" /></label>
            <label>Peso ao nascer (kg)<input name="peso" inputMode="decimal" required /></label>
            <label>Comprimento ao nascer (cm)<input name="alt" inputMode="decimal" /></label>
            <label>PC ao nascer (cm)<input name="pc" inputMode="decimal" /></label>
          </>
        ) : (
          <>
            <label>Altura (cm)<input name="altura" inputMode="decimal" required /></label>
            <label>Peso pré-gestacional (kg)<input name="pesoPre" inputMode="decimal" required /></label>
            {tipo === "gestante" ? (
              <label>DUM<input type="date" name="dum" required /></label>
            ) : (
              <>
                <label>Data do parto<input type="date" name="parto" required /></label>
                <label>Amamentação<select name="amam">{Object.entries(AMAMENTACAO_NOME).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              </>
            )}
            <label>Peso hoje (kg)<input name="peso" inputMode="decimal" placeholder="opcional" /></label>
          </>
        )}
        <button className="btn full">Cadastrar</button>
      </div>
    </form>
  );
}
