"use client";

import type { Amamentacao, Lactante } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { alertasMae, classeIMC, linhasMae } from "@/lib/domain/maternal";
import { AMAMENTACAO_NOME, IMC_NOME } from "@/lib/domain/referencias";
import { dataBR } from "@/lib/domain/datas";
import { fmt, ok, sinal } from "@/lib/format";
import { GraficoMae } from "../../graficos";
import { Alertas, useHoje } from "../../ui";
import { FormConsultaMae, useExcluirConsulta } from "./Gestacao";

export function AbaPosParto({ p }: { p: Lactante }) {
  const { despachar } = useApp();
  const hoje = useHoje();
  const excluir = useExcluirConsulta(p);
  const rs = linhasMae(p);
  return (
    <>
      <div className="grid2 gs">
        <div className="panel chartp">
          <div className="ph"><h3>Peso desde o parto</h3><span className="dim" style={{ fontSize: 14 }}>Pré-gestacional: {fmt(p.pesoPre)} kg</span></div>
          <GraficoMae p={p} />
          <div className="legend"><b className="dim" style={{ fontWeight: 600 }}>Eixo: semanas desde o parto. Linha tracejada = peso pré-gestacional.</b></div>
        </div>
        <div className="stackp">
          <div className="panel"><h3>Pontos de atenção</h3><Alertas itens={alertasMae(p, hoje)} /></div>
          <div className="panel">
            <label>Amamentação
              <select value={p.amam} onChange={(e) => despachar({ t: "paciente/alterar", id: p.id, campos: { amam: e.target.value as Amamentacao } })}>
                {Object.entries(AMAMENTACAO_NOME).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <p className="note">Muda o custo energético da lactação em Necessidades.</p>
          </div>
          <FormConsultaMae p={p} />
        </div>
      </div>
      <div className="panel">
        <h3>Consultas</h3>
        <div className="scroll">
          <table className="wide">
            <thead><tr><th>Data</th><th>Pós-parto</th><th className="n">Peso (kg)</th><th className="n">Em relação ao pré (kg)</th><th className="n">IMC</th><th>Estado nutricional</th><th>Obs.</th><th></th></tr></thead>
            <tbody>
              {rs.length ? [...rs].reverse().map((r) => (
                <tr key={r.data}>
                  <td>{dataBR(r.data)}</td><td>{Math.floor(r.posParto! / 7)} sem e {r.posParto! % 7} d</td><td className="n">{fmt(r.peso)}</td>
                  <td className="n">{ok(r.dif) ? sinal(r.dif, 1) : "—"}</td><td className="n">{fmt(r.imc)}</td>
                  <td>{ok(r.imc) ? IMC_NOME[classeIMC(r.imc)] : "—"}</td><td className="w">{r.obs}</td>
                  <td><button className="x" aria-label={`Excluir consulta de ${dataBR(r.data)}`} onClick={() => excluir(r.data)}>×</button></td>
                </tr>
              )) : <tr><td colSpan={8} className="dim">Nenhuma consulta após o parto.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="note">Parto em {dataBR(p.parto)}. {AMAMENTACAO_NOME[p.amam]}. Estado nutricional pelo IMC (OMS): abaixo de 18,5 baixo peso; 18,5 a 24,9 eutrofia; 25 a 29,9 sobrepeso; 30 ou mais obesidade.</p>
      </div>
    </>
  );
}
