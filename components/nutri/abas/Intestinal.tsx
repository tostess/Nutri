"use client";

import { useEffect, useState } from "react";
import type { Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import {
  CORES, ROMA, SINAIS_ALARME_LACTENTE, avaliarRoma, escalaPadrao, grupoRoma, nomeTipo, resumoIntestinal,
} from "@/lib/domain/intestinal";
import { dataBR, diaSemana, pd } from "@/lib/domain/datas";
import { fmt } from "@/lib/format";
import { FormEvacuacao } from "../../FormEvacuacao";
import { Alertas, Figura, useHoje } from "../../ui";

export function AbaIntestinal({ p }: { p: Paciente }) {
  const { despachar, toast } = useApp();
  const hoje = useHoje();
  const [janela, setJanela] = useState(14);
  const escala = escalaPadrao(p, hoje);
  const r = resumoIntestinal(p.evacuacoes, escala, hoje, janela);
  const g = grupoRoma(p, hoje);
  const roma = avaliarRoma(g, p.intestinal.roma);
  const maxDia = Math.max(1, ...r.porDiaSerie.map((d) => d.n));
  const maxTipo = Math.max(1, ...r.distribuicao.map((d) => d.n));
  const evs = [...p.evacuacoes].sort((a, b) => pd(b.data) - pd(a.data) || b.hora.localeCompare(a.hora));
  const pendentes = p.evacuacoes.filter((e) => e.autor === "paciente" && !e.lido).length;
  useEffect(() => {
    if (pendentes) despachar({ t: "registros/marcarLidos", pid: p.id });
  }, [pendentes, p.id, despachar]);
  const marcarRoma = (id: string) =>
    despachar({ t: "paciente/alterar", id: p.id, campos: { intestinal: { ...p.intestinal, roma: { ...p.intestinal.roma, [id]: !p.intestinal.roma[id] }, data: hoje } } });

  return (
    <>
      <div className="ph">
        <p className="sample" style={{ margin: 0 }}>Resumo dos registros de evacuação feitos pela paciente e no consultório.</p>
        <div className="seg">
          {[7, 14, 30].map((d) => <button key={d} aria-pressed={janela === d} onClick={() => setJanela(d)}>{d} dias</button>)}
        </div>
      </div>
      <div className="figs">
        <Figura valor={fmt(r.porDia, 1)} rotulo="evacuações por dia" />
        <Figura valor={r.diasSemEvacuar ?? "—"} rotulo="dias desde a última" />
        <Figura valor={`${fmt(r.pctDuras * 100, 0)}%`} rotulo="endurecidas" />
        <Figura valor={`${fmt(r.pctLiquidas * 100, 0)}%`} rotulo={escala === "bristol" ? "pastosas ou aquosas" : "aquosas"} />
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>{escala === "bristol" ? "Formato (escala de Bristol)" : "Consistência (bebê de fralda)"}</h3>
          <div className="barras" style={{ marginTop: 10 }}>
            {r.distribuicao.map((d) => (
              <div key={d.tipo} className={`b ${d.grupo}`}>
                <span>{escala === "bristol" ? `${d.tipo}. ${d.nome}` : d.nome}</span>
                <div><i style={{ width: `${(d.n / maxTipo) * 100}%` }} /></div>
                <span>{d.n}</span>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 18 }}>Evacuações por dia</h3>
          <div className="dias14" style={{ gridTemplateColumns: `repeat(${janela},minmax(0,1fr))` }}>
            {r.porDiaSerie.map((d) => <div key={d.data} className={d.n ? "" : "zero"} style={{ height: `${Math.max(3, (d.n / maxDia) * 100)}%` }} title={`${dataBR(d.data)}: ${d.n}`} />)}
          </div>
          <div className="dias14l" style={{ gridTemplateColumns: `repeat(${janela},minmax(0,1fr))` }}>
            {r.porDiaSerie.map((d, i) => <span key={d.data}>{i === 0 || i === janela - 1 || (janela <= 14 && i % 3 === 0) ? d.data.slice(8) : ""}</span>)}
          </div>
          <p className="note">Verde: formato habitual. Amarelo: endurecidas. Azul: {escala === "bristol" ? "pastosas ou aquosas" : "aquosas"}. Em bebês amamentados, fezes amarelas e moles são comuns.</p>
        </div>
        <div className="stackp">
          <div className="panel"><h3>Pontos de atenção</h3><Alertas itens={r.alertas} vazio="Nada a destacar no período." /></div>
          {g === "ate4" && (
            <details className="panel">
              <summary>Sinais de alarme para encaminhar ao médico</summary>
              <ul>{SINAIS_ALARME_LACTENTE.map((x) => <li key={x}>{x}</li>)}</ul>
            </details>
          )}
        </div>
      </div>
      <div className="grid2">
        <div className="panel">
          <h3 style={{ marginBottom: 8 }}>Registros</h3>
          {evs.length ? (
            <div className="scroll">
              <table className="stack">
                <thead><tr><th>Quando</th><th>Tipo</th><th>Cor</th><th>Sinais</th><th>Quem</th><th></th></tr></thead>
                <tbody>
                  {evs.map((e) => {
                    const c = CORES.find((x) => x.cor === e.cor);
                    const sinais = [e.dor && "dor", e.esforco && "esforço", e.sangue && "sangue", e.muco && "muco"].filter(Boolean).join(", ");
                    return (
                      <tr key={e.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{diaSemana(e.data).slice(0, 3)} {dataBR(e.data).slice(0, 5)} {e.hora}</td>
                        <td>{e.escala === "bristol" ? `Bristol ${e.tipo}` : nomeTipo(e.escala, e.tipo)}</td>
                        <td>{c ? <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><i style={{ width: 14, height: 14, borderRadius: 7, background: c.hex, display: "inline-block" }} />{c.nome}</span> : "—"}</td>
                        <td>{sinais ? <span className={`chip ${e.sangue ? "ab" : "at"}`}>{sinais}</span> : "—"}</td>
                        <td>{e.autor === "paciente" ? <span className="chip in">Paciente</span> : "Consultório"}</td>
                        <td><button className="x" aria-label="Excluir registro" onClick={() => { despachar({ t: "evacuacao/excluir", pid: p.id, id: e.id }); toast("Registro excluído.", () => despachar({ t: "evacuacao/adicionar", pid: p.id, evacuacao: e })); }}>×</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="dim">Nenhum registro ainda. A paciente registra pelo app, na aba Intestino.</p>}
        </div>
        <div className="stackp">
          <div className="panel">
            <h3>Critérios de Roma IV para constipação</h3>
            <p className="note" style={{ marginTop: 4 }}>{ROMA[g].titulo}. {ROMA[g].regra}</p>
            <div className="opts roma" style={{ flexDirection: "column", alignItems: "stretch" }}>
              {ROMA[g].itens.map((i) => (
                <button key={i.id} type="button" className="opt" aria-pressed={!!p.intestinal.roma[i.id]} onClick={() => marcarRoma(i.id)}>
                  {i.texto}
                </button>
              ))}
            </div>
            <p className={`warn ${roma.compativel ? "at" : "ok"}`}>{roma.texto}</p>
            {p.intestinal.data && <p className="note">Atualizado em {dataBR(p.intestinal.data)}.</p>}
          </div>
        </div>
      </div>
      <div className="grid2">
        <div className="panel">
          <h3 style={{ marginBottom: 8 }}>Registrar no consultório</h3>
          <FormEvacuacao p={p} autor="nutri" />
        </div>
        <div className="panel">
        <label>Observações da avaliação intestinal
          <textarea defaultValue={p.intestinal.obs} onBlur={(e) => e.target.value !== p.intestinal.obs && despachar({ t: "paciente/alterar", id: p.id, campos: { intestinal: { ...p.intestinal, obs: e.target.value } } })} />
        </label>
        <p className="note">Escala de Bristol (Lewis e Heaton, 1997). Para bebês de fralda, categorias de consistência da Amsterdam Infant Stool Scale. Cores de alerta conforme a escala de cor das fezes da Caderneta da Criança. Critérios de Roma IV (Benninga et al., 2016; Hyams et al., 2016): apoio à triagem, o diagnóstico é médico.</p>
        </div>
      </div>
    </>
  );
}
