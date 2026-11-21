"use client";

import type { Crianca, NAF } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { necessidadesCrianca } from "@/lib/domain/necessidades";
import { MICRO_CRIANCA } from "@/lib/domain/referencias";
import { dataBR } from "@/lib/domain/datas";
import { fmt, ok } from "@/lib/format";
import { Figura, NumCampo } from "../../ui";

export const NAFS: NAF[] = ["Sedentário", "Pouco ativo", "Ativo", "Muito ativo"];

export function AbaNecessidades({ p }: { p: Crianca }) {
  const { s, despachar } = useApp();
  const n = necessidadesCrianca(p, s.config.crit);
  if (!n) return <div className="panel"><p>Registre ao menos uma consulta após o nascimento, com peso e altura, para calcular as necessidades.</p></div>;
  const alt = (campos: Record<string, unknown>) => despachar({ t: "paciente/alterar", id: p.id, campos });
  const v = n.volume, P = p.plano;
  const soma = ((n.macros[0].pctVet ?? 0) + (n.macros[1].pctVet ?? 0) + (n.macros[2].pctVet ?? 0)) * 100;
  return (
    <>
      <p className="sample">Calculado com a última consulta ({dataBR(n.base.data)}): {n.m} meses completos, {fmt(n.peso, 3)} kg, {fmt(n.altura)} cm. Grupo etário: {n.grupoNome}.</p>
      <div className="figs">
        <Figura valor={fmt(n.eer, 0)} rotulo="kcal/dia (EER)" />
        <Figura valor={fmt(ok(n.eer) ? n.eer / n.peso : null, 0)} rotulo="kcal/kg/dia" />
        <Figura valor={`${fmt(n.macros[0].meta, 1)} g`} rotulo="proteína/dia" />
        <Figura valor={`${fmt(n.hollidaySegar, 0)} mL`} rotulo="água (Holliday-Segar)" />
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="ph">
            <h3>Gasto energético estimado</h3>
            <label style={{ minWidth: 180 }}>Nível de atividade (a partir de 3 anos)
              <select value={p.naf} disabled={n.m < 36} onChange={(e) => alt({ naf: e.target.value })}>
                {NAFS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
          {n.coef ? (
            <p className="eq">
              EER = {fmt(n.coef[0], 2)} + ({fmt(n.coef[1], 2)} × {fmt(n.idadeAnos, 2)} anos) + ({fmt(n.coef[2], 2)} × {fmt(n.altura)} cm) + ({fmt(n.coef[3], 2)} × {fmt(n.peso, 2)} kg) + {n.coef[4]} = <b>{fmt(n.eer, 1)} kcal/dia</b>
            </p>
          ) : <p>Idade fora das equações da tabela.</p>}
          <p className="note">DRI/NASEM 2023. Faixa da equação: {n.faixaEER}{n.m >= 36 ? `, ${p.naf}` : ""}. A última parcela é a energia de deposição para crescimento.</p>
        </div>
        <div className="panel">
          <h3>Água</h3>
          <p style={{ margin: "8px 0 4px" }}><b>{fmt(n.hollidaySegar, 0)} mL/dia</b> por Holliday-Segar ({fmt((n.hollidaySegar ?? 0) / n.peso, 0)} mL/kg/dia)</p>
          {n.aguaTotalL && <p style={{ margin: 0 }}><b>{fmt(n.aguaTotalL, 1)} L/dia</b> de água total recomendada para {n.grupoNome} (SBP, Tabela 6)</p>}
          <p className="note">Em lactentes, a água vem do leite ou da fórmula: conte o volume de fórmula como parte da oferta hídrica.</p>
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
                  <td><b>{x.nome}</b></td>
                  <td className="n">{x.pMin != null ? fmt(x.pMin * 100, 1) + "%" : "—"}</td>
                  <td className="n">{x.pMax != null ? fmt(x.pMax * 100, 1) + "%" : "—"}</td>
                  <td className="n">{fmt(x.gMin)}</td><td className="n">{fmt(x.gMax)}</td>
                  <td className="n"><b>{fmt(x.meta)}</b></td>
                  <td className="n">{x.pctVet != null ? fmt(x.pctVet * 100, 1) + "%" : "—"}</td>
                  <td className="dim">{x.como}</td>
                </tr>
              ))}
              <tr>
                <td><b>Fibras</b></td><td className="n">—</td><td className="n">—</td><td className="n">—</td><td className="n">{n.fibra ? "25" : "—"}</td>
                <td className="n"><b>{n.fibra ? fmt(n.fibra, 0) : "—"}</b></td><td className="n">—</td>
                <td className="dim">Idade em anos + 5 g, máx. 25 g. A partir dos 2 anos.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">Energia coberta pelas metas de proteína, lipídios e carboidratos: <b>{fmt(soma, 0)}%</b> do VET. Em lactentes (AI) a soma pode fugir de 100%: são valores de referência de ingestão.</p>
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Micronutrientes</h3>
          {n.grupo <= 2 ? (
            <>
              <div className="scroll">
                <table>
                  <thead><tr><th>Nutriente</th><th>Unidade</th><th className="n">Recomendação</th><th>Tipo</th></tr></thead>
                  <tbody>
                    {MICRO_CRIANCA.map((r, i) => (
                      <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td className="n">{fmt(r[2][n.grupo], r[2][n.grupo] < 1 ? 2 : 0)}</td><td>{r[3][n.grupo]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="note">AI = ingestão adequada; RDA = ingestão diária recomendada. Vitamina D: 1 mcg = 40 UI.</p>
            </>
          ) : <p className="dim">A tabela da planilha cobre 0 a 3 anos. Consultar a DRI correspondente.</p>}
        </div>
        <div className="panel">
          <h3>Volume de fórmula pelo gasto energético</h3>
          {!v ? <p className="dim">Seção aplicável até 3 anos.</p> : (
            <>
              <div className="form" style={{ margin: "10px 0" }}>
                <NumCampo rotulo="% da energia vinda da fórmula" valor={Math.round(P.pct * 100)} unidade="%" onSalvar={(x) => x != null && alt({ plano: { ...P, pct: x / 100 } })} />
                <NumCampo rotulo="kcal por 100 mL" valor={P.kcal100} onSalvar={(x) => x != null && alt({ plano: { ...P, kcal100: x } })} />
              </div>
              <table className="kv">
                <tbody>
                  <tr><td>Energia pela fórmula</td><td className="n"><b>{fmt(v.kcal, 0)} kcal/dia</b></td></tr>
                  <tr><td>Volume diário</td><td className="n"><b>{fmt(v.vol, 0)} mL/dia</b> ({fmt(v.volKg, 0)} mL/kg)</td></tr>
                  <tr><td>Por mamada ({v.tabela[4]} a {v.tabela[5]} mamadas)</td><td className="n">{fmt(v.porMin, 0)} a {fmt(v.porMax, 0)} mL</td></tr>
                  <tr><td>Tabela 5 SBP ({v.tabela[1]})</td><td className="n">{v.tabela[2]} a {v.tabela[3]} mL × {v.tabela[4]} a {v.tabela[5]} = {fmt(v.tabMin, 0)} a {fmt(v.tabMax, 0)} mL/dia</td></tr>
                </tbody>
              </table>
              <p className={`warn ${v.situacao === "dentro" ? "ok" : "at"}`}>
                Volume por energia {v.situacao.toUpperCase()} da faixa da tabela{v.situacao === "acima" ? " (avaliar complementação alimentar)" : ""}.
              </p>
              {n.m >= 12 && <p className="note">A Tabela 5 se refere ao 1º ano. Acima de 12 meses, defina o volume junto com a alimentação complementar.</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
