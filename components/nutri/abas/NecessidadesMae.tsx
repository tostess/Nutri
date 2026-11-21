"use client";

import type { Mae } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { necessidadesMae } from "@/lib/domain/maternal";
import { MICRO_MULHER } from "@/lib/domain/referencias";
import { dataBR } from "@/lib/domain/datas";
import { fmt } from "@/lib/format";
import { Figura, useHoje } from "../../ui";
import { NAFS } from "./Necessidades";

export function AbaNecessidadesMae({ p }: { p: Mae }) {
  const { despachar } = useApp();
  const hoje = useHoje();
  const n = necessidadesMae(p, hoje);
  const ix = n.gestante ? 2 : 3;
  return (
    <>
      <p className="sample">
        Calculado com {n.base ? `a última consulta (${dataBR(n.base.data)})` : "o peso pré-gestacional, pois não há consulta registrada"}: {n.idade} anos, {fmt(n.peso)} kg, {n.altura} cm
        {n.gestante ? `, ${n.semanas} semanas de gestação` : ""}.
      </p>
      {n.adolescente && <p className="warn at">Paciente adolescente: a DRI tem equações próprias abaixo de 19 anos. Use estes valores só como referência.</p>}
      <div className="figs">
        <Figura valor={fmt(n.eer, 0)} rotulo="kcal/dia (EER)" />
        <Figura valor={`${fmt(n.macros[0].meta, 0)} g`} rotulo="proteína/dia" />
        <Figura valor={`${fmt(n.aguaL, 1)} L`} rotulo="água total/dia" />
        <Figura valor={`${n.fibra} g`} rotulo="fibras/dia" />
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="ph">
            <h3>Gasto energético estimado</h3>
            <label style={{ minWidth: 180 }}>Nível de atividade
              <select value={p.naf} onChange={(e) => despachar({ t: "paciente/alterar", id: p.id, campos: { naf: e.target.value } })}>
                {NAFS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <p className="eq">EER = {n.equacao} = <b>{fmt(n.eer, 0)} kcal/dia</b></p>
          <p className="note">DRI/NASEM 2023. {n.explicacao}</p>
        </div>
        <div className="panel">
          <h3>Micronutrientes</h3>
          <div className="scroll">
            <table>
              <thead><tr><th>Nutriente</th><th>Unidade</th><th className="n">{n.gestante ? "Gestante" : "Lactante"}</th><th>Tipo</th></tr></thead>
              <tbody>
                {MICRO_MULHER.map((r) => (
                  <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td className="n">{fmt(r[ix] as number, (r[ix] as number) % 1 ? 1 : 0)}</td><td>{r[4]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">DRI/IOM para mulheres de 19 a 50 anos. Água total e fibras: ingestão adequada (AI).</p>
        </div>
      </div>
      <div className="panel">
        <h3>Macronutrientes</h3>
        <div className="scroll">
          <table className="stack">
            <thead><tr><th>Nutriente</th><th className="n">% VET mín</th><th className="n">% VET máx</th><th className="n">g/dia mín</th><th className="n">g/dia máx</th><th className="n">Meta g/dia</th><th className="n">% VET da meta</th><th>Como foi calculado</th></tr></thead>
            <tbody>
              {n.macros.map((x) => (
                <tr key={x.nome}>
                  <td><b>{x.nome}</b></td><td className="n">{fmt(x.pMin * 100, 1)}%</td><td className="n">{fmt(x.pMax * 100, 1)}%</td>
                  <td className="n">{fmt(x.gMin)}</td><td className="n">{fmt(x.gMax)}</td><td className="n"><b>{fmt(x.meta)}</b></td>
                  <td className="n">{fmt(x.pctVet * 100, 1)}%</td><td className="dim">{x.como}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">AMDR para adultos: proteína 10 a 35%, lipídios 20 a 35%, carboidratos 45 a 65% do VET.</p>
      </div>
    </>
  );
}
