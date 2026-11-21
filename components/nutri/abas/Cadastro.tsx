"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Amamentacao, Paciente, Sexo } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { dpp } from "@/lib/domain/maternal";
import { AMAMENTACAO_NOME } from "@/lib/domain/referencias";
import { dataBR, dias, igTexto } from "@/lib/domain/datas";
import { num, uid } from "@/lib/format";
import { NumCampo, TextoCampo, useHoje } from "../../ui";

export function AbaCadastro({ p }: { p: Paciente }) {
  const { despachar, toast } = useApp();
  const router = useRouter();
  const hoje = useHoje();
  const alt = (campos: Record<string, unknown>) => despachar({ t: "paciente/alterar", id: p.id, campos });
  const G = p.tipo === "gestante";

  function parto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const F = new FormData(e.currentTarget);
    const id = uid("p");
    despachar({
      t: "paciente/parto", maeId: p.id, data: String(F.get("data")), amam: F.get("amam") as Amamentacao,
      bebe: { id, nome: String(F.get("nome")), sexo: F.get("sexo") as Sexo, peso: num(F.get("peso")), alt: num(F.get("alt")), pc: num(F.get("pc")) },
    });
    toast("Parto registrado. Bebê cadastrado e ligado à mãe.");
    router.push(`/nutri/p/${p.id}`);
  }

  return (
    <div className="grid2">
      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Dados da paciente</h3>
        <div className="form">
          <TextoCampo className="full" rotulo="Nome" valor={p.nome} onSalvar={(v) => v.trim() && alt({ nome: v.trim() })} />
          <TextoCampo tipo="date" rotulo="Nascimento" valor={p.nasc} onSalvar={(v) => v && alt({ nasc: v })} />
          <TextoCampo tipo="tel" rotulo="WhatsApp" valor={p.telefone} placeholder="(22) 99999-9999" onSalvar={(v) => alt({ telefone: v })} />
          {p.tipo === "crianca" ? (
            <>
              <label>Sexo
                <select value={p.sexo} onChange={(e) => alt({ sexo: e.target.value })}>
                  <option value="F">Feminino</option><option value="M">Masculino</option>
                </select>
              </label>
              <TextoCampo rotulo="Diagnóstico médico" valor={p.diag} onSalvar={(v) => alt({ diag: v })} />
              <TextoCampo rotulo="Responsável" valor={p.resp} onSalvar={(v) => alt({ resp: v })} />
            </>
          ) : (
            <>
              <NumCampo rotulo="Altura" unidade="cm" valor={p.altura} onSalvar={(v) => v && alt({ altura: v })} />
              <NumCampo rotulo="Peso pré-gestacional" unidade="kg" valor={p.pesoPre} onSalvar={(v) => v && alt({ pesoPre: v })} />
              {p.tipo === "gestante" ? (
                <TextoCampo tipo="date" rotulo="DUM" valor={p.dum} onSalvar={(v) => v && alt({ dum: v })} />
              ) : (
                <>
                  <TextoCampo tipo="date" rotulo="Data do parto" valor={p.parto} onSalvar={(v) => v && alt({ parto: v })} />
                  <label>Amamentação
                    <select value={p.amam} onChange={(e) => alt({ amam: e.target.value })}>
                      {Object.entries(AMAMENTACAO_NOME).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                </>
              )}
            </>
          )}
        </div>
        {p.tipo === "gestante" && <p className="note">Hoje: {igTexto(dias(p.dum, hoje))}. Data provável do parto: {dataBR(dpp(p.dum))}.</p>}
        {p.tipo === "crianca" && <p className="note">Ao mudar a data de nascimento, ajuste também a linha de nascimento nas consultas.</p>}
        <p style={{ marginTop: 14 }}><Link className="btn sm ghost" href={`/paciente/${p.id}`}>Abrir a área da paciente</Link></p>
      </div>
      {G ? (
        <form className="panel" onSubmit={parto}>
          <h3 style={{ marginBottom: 6 }}>Registrar parto</h3>
          <p className="note" style={{ margin: "0 0 10px" }}>Cria o cadastro do bebê ligado à mãe e passa {p.nome.split(" ")[0]} para lactante. As consultas da gestação ficam arquivadas.</p>
          <div className="form">
            <label>Data do parto<input type="date" name="data" defaultValue={hoje} required /></label>
            <label>Amamentação
              <select name="amam" defaultValue="exclusiva">{Object.entries(AMAMENTACAO_NOME).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            <label className="full">Nome do bebê<input name="nome" required /></label>
            <label>Sexo<select name="sexo"><option value="F">Feminino</option><option value="M">Masculino</option></select></label>
            <label>Peso ao nascer (kg)<input name="peso" inputMode="decimal" required /></label>
            <label>Comprimento (cm)<input name="alt" inputMode="decimal" /></label>
            <label>PC (cm)<input name="pc" inputMode="decimal" /></label>
            <button className="btn full">Registrar parto</button>
          </div>
        </form>
      ) : <div />}
    </div>
  );
}
