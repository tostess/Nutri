"use client";

import type { Anamnese, Autor, Exame, Paciente, ValorAnamnese } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { progressoAnamnese, secoesAnamnese, type Campo } from "@/lib/domain/anamnese";
import { dataBR } from "@/lib/domain/datas";
import { EditorRefeicoes } from "./Refeicoes";
import { Multi, NumCampo, Opcoes, TextoCampo, useHoje } from "./ui";

function CampoAnamnese({ c, v, onSalvar }: { c: Campo; v: ValorAnamnese | undefined; onSalvar: (v: ValorAnamnese) => void }) {
  const cls = c.largo ? "largo" : "";
  switch (c.tipo) {
    case "texto":
    case "textoLongo":
      return <TextoCampo className={cls} rotulo={c.rotulo} longo={c.tipo === "textoLongo"} valor={(v as string) ?? ""} onSalvar={onSalvar} />;
    case "numero":
      return <NumCampo className={cls} rotulo={c.rotulo} unidade={c.unidade} valor={(v as number) ?? null} onSalvar={onSalvar} />;
    case "simnao":
      return (
        <div className={`campo ${cls}`}>
          <span>{c.rotulo}</span>
          <Opcoes valor={v === true ? "Sim" : v === false ? "Não" : null} opcoes={["Sim", "Não"] as const} onEscolher={(x) => onSalvar(x == null ? null : x === "Sim")} />
        </div>
      );
    case "opcao":
      return (
        <div className={`campo ${c.opcoes!.length > 4 ? "largo" : cls}`}>
          <span>{c.rotulo}</span>
          <Opcoes valor={(v as string) ?? null} opcoes={c.opcoes!} onEscolher={onSalvar} />
        </div>
      );
    case "multi":
      return (
        <div className="campo largo">
          <span>{c.rotulo}</span>
          <Multi valor={(v as string[]) ?? []} opcoes={c.opcoes!} onMudar={onSalvar} />
        </div>
      );
  }
}

export function FormAnamnese({ p, autor }: { p: Paciente; autor: Autor }) {
  const { despachar } = useApp();
  const hoje = useHoje();
  const a = p.anamnese;
  const salvar = (novo: Partial<Anamnese>) =>
    despachar({ t: "anamnese/salvar", pid: p.id, anamnese: { ...a, ...novo, atualizadaEm: hoje, atualizadaPor: autor } });
  const resp = (id: string, v: ValorAnamnese) => salvar({ respostas: { ...a.respostas, [id]: v } });
  const secoes = secoesAnamnese(p.tipo);
  const pr = progressoAnamnese(p.tipo, a);
  const feitos = (ids: string[]) => ids.filter((id) => {
    const v = a.respostas[id];
    return v != null && v !== "" && !(Array.isArray(v) && !v.length);
  }).length;

  return (
    <>
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph" style={{ marginBottom: 0 }}>
          <span><b>{pr.feitos} de {pr.total}</b> perguntas respondidas</span>
          <span className="dim" style={{ fontSize: 14 }}>
            {a.atualizadaEm ? `Atualizada em ${dataBR(a.atualizadaEm)} ${a.atualizadaPor === "paciente" ? "pela paciente" : "no consultório"}` : "Ainda não preenchida"}
          </span>
        </div>
        <div className="prog"><i style={{ width: `${(pr.feitos / pr.total) * 100}%` }} /></div>
        <p className="note">Cada resposta é salva assim que você sai do campo ou toca na opção.</p>
      </div>
      <div className="secoes">
        {secoes.map((s, i) => (
          <details key={s.id} open={i === 0}>
            <summary>{s.titulo}<small>{feitos(s.campos.map((c) => c.id))} de {s.campos.length}</small></summary>
            <div className="grade-campos">
              {s.campos.map((c) => <CampoAnamnese key={c.id} c={c} v={a.respostas[c.id]} onSalvar={(v) => resp(c.id, v)} />)}
            </div>
          </details>
        ))}
        <details>
          <summary>Recordatório de 24 horas<small>{a.r24.length} refeições</small></summary>
          <p className="note" style={{ marginTop: 0 }}>O que {p.tipo === "crianca" ? "o bebê comeu e mamou" : "você comeu e bebeu"} ontem, com horário e quantidade aproximada.</p>
          <EditorRefeicoes key={a.r24.length} itens={a.r24} rotuloDescricao="Alimentos e quantidades" novo={{ h: "07:00", n: "Refeição", d: "" }} onMudar={(v) => salvar({ r24: v })} />
        </details>
        <details>
          <summary>Exames<small>{a.exames.length} registrados</small></summary>
          <Exames itens={a.exames} onMudar={(v) => salvar({ exames: v })} hoje={hoje} />
        </details>
      </div>
    </>
  );
}

function Exames({ itens, onMudar, hoje }: { itens: Exame[]; onMudar: (v: Exame[]) => void; hoje: string }) {
  return (
    <>
      {itens.length > 0 && (
        <div className="scroll">
          <table className="stack">
            <thead><tr><th>Data</th><th>Exame</th><th className="n">Resultado</th><th>Unidade</th><th></th></tr></thead>
            <tbody>
              {itens.map((x, i) => (
                <tr key={i}>
                  <td>{dataBR(x.data)}</td><td>{x.exame}</td><td className="n">{x.valor}</td><td>{x.unidade}</td>
                  <td><button className="btn sm ghost" onClick={() => onMudar(itens.filter((_, k) => k !== i))}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="form" style={{ marginTop: 10 }} onSubmit={(e) => {
        e.preventDefault();
        const F = new FormData(e.currentTarget);
        const exame = String(F.get("exame") || "").trim();
        if (!exame) return;
        onMudar([...itens, { data: String(F.get("data") || hoje), exame, valor: String(F.get("valor") || ""), unidade: String(F.get("unidade") || "") }]);
        e.currentTarget.reset();
      }}>
        <label>Data<input type="date" name="data" defaultValue={hoje} /></label>
        <label>Exame<input name="exame" placeholder="Hemoglobina" list="exames-comuns" /></label>
        <label>Resultado<input name="valor" inputMode="decimal" /></label>
        <label>Unidade<input name="unidade" placeholder="g/dL" /></label>
        <datalist id="exames-comuns">
          {["Hemoglobina", "Ferritina", "Glicemia de jejum", "TOTG 75 g", "Hemoglobina glicada", "Vitamina D (25-OH)", "Vitamina B12", "TSH", "Colesterol total", "Triglicerídeos"].map((x) => <option key={x} value={x} />)}
        </datalist>
        <button className="btn sm">Adicionar exame</button>
      </form>
    </>
  );
}
