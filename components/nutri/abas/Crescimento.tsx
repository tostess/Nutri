"use client";

import { useState } from "react";
import type { Crianca } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { alertasCrescimento, linhasCrescimento } from "@/lib/domain/crescimento";
import { dataBR } from "@/lib/domain/datas";
import { fmt, num } from "@/lib/format";
import { GraficoCrescimento, type Serie } from "../../graficos";
import { Alertas, Chip, useHoje } from "../../ui";

export function AbaCrescimento({ p }: { p: Crianca }) {
  const { s, despachar, toast } = useApp();
  const hoje = useHoje();
  const [serie, setSerie] = useState<Serie>("peso");
  const crit = s.config.crit;
  const rs = linhasCrescimento(p, crit);
  const pct = (x: number) => fmt(x * 100, 0);

  function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const F = new FormData(e.currentTarget);
    const data = String(F.get("data") || "");
    if (!data) return;
    despachar({ t: "consulta/salvar", pid: p.id, consulta: { data, peso: num(F.get("peso")), alt: num(F.get("alt")), pc: num(F.get("pc")), obs: String(F.get("obs") || "") } });
    e.currentTarget.reset();
    toast("Consulta registrada.");
  }
  function excluir(data: string) {
    const c = p.consultas.find((x) => x.data === data);
    if (!c) return;
    despachar({ t: "consulta/excluir", pid: p.id, data });
    toast(`Consulta de ${dataBR(data)} excluída.`, () => despachar({ t: "consulta/salvar", pid: p.id, consulta: c }));
  }

  return (
    <>
      <div className="grid2 gs">
        <div className="panel chartp">
          <div className="ph">
            <h3>Evolução {({ peso: "do peso", alt: "do comprimento", pc: "do perímetro cefálico" } as const)[serie]}</h3>
            <div className="seg">
              {([["peso", "Peso"], ["alt", "Comprimento"], ["pc", "PC"]] as const).map(([k, t]) => (
                <button key={k} aria-pressed={serie === k} onClick={() => setSerie(k)}>{t}</button>
              ))}
            </div>
          </div>
          <GraficoCrescimento p={p} crit={crit} serie={serie} />
          <div className="legend">
            <b className="dim" style={{ fontWeight: 600 }}>Eixo: idade em meses. Cor do ponto = classificação SBP do ganho até aquela consulta:</b>
            <span className="lg-ab">Abaixo</span><span className="lg-at">Atenção</span><span className="lg-ok">Adequado</span><span className="lg-ac">Acima</span>
          </div>
        </div>
        <div className="stackp">
          <div className="panel"><h3>Pontos de atenção</h3><Alertas itens={alertasCrescimento(p, crit)} /></div>
          <form className="panel" onSubmit={registrar}>
            <h3 style={{ marginBottom: 10 }}>Nova consulta</h3>
            <div className="form">
              <label className="full">Data<input type="date" name="data" defaultValue={hoje} required /></label>
              <label>Peso (kg)<input name="peso" inputMode="decimal" placeholder="6,640" /></label>
              <label>Altura (cm)<input name="alt" inputMode="decimal" placeholder="68,5" /></label>
              <label>PC (cm)<input name="pc" inputMode="decimal" placeholder="44,5" /></label>
              <label className="full">Observações<input name="obs" /></label>
              <button className="btn full">Registrar consulta</button>
            </div>
          </form>
        </div>
      </div>
      <div className="panel">
        <h3>Consultas e ganhos calculados</h3>
        <div className="scroll">
          <table className="wide">
            <thead>
              <tr>
                <th>Consulta</th><th>Data</th><th className="n">Idade (m)</th><th className="n">Peso (kg)</th><th className="n">Altura (cm)</th><th className="n">PC (cm)</th>
                <th className="n">Interv. (d)</th><th className="n">g/dia</th><th className="n">g/mês</th><th className="n">Estatura cm/mês</th><th className="n">PC cm/mês</th>
                <th>Faixa</th><th>Peso SBP</th><th>Estatura SBP</th><th>PC SBP</th><th className="n">OMS −1 a +1 DP</th><th>Peso OMS</th><th>Obs.</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rs.map((r, i) => (
                <tr key={r.data}>
                  <td>{r.nascimento ? "Nascimento" : `${r.i + (rs[0].nascimento ? 0 : 1)}ª`}</td>
                  <td>{dataBR(r.data)}</td><td className="n">{r.idade}</td><td className="n">{fmt(r.peso, 3)}</td><td className="n">{fmt(r.alt)}</td><td className="n">{fmt(r.pc)}</td>
                  <td className="n">{r.intervalo ?? "—"}</td><td className="n">{fmt(r.gDia)}</td><td className="n">{fmt(r.gMes, 0)}</td><td className="n">{fmt(r.estMes, 2)}</td><td className="n">{fmt(r.pcMes, 2)}</td>
                  <td>{r.faixa ?? "—"}</td><td><Chip c={r.cPeso} /></td><td><Chip c={r.cEst} /></td><td><Chip c={r.cPc} /></td>
                  <td className="n">{r.oms ? `${fmt(r.oms[0])} a ${fmt(r.oms[2])}` : "—"}</td><td><Chip c={r.cOms} /></td>
                  <td className="w">{r.obs}</td>
                  <td>{i > 0 && <button className="x" onClick={() => excluir(r.data)} aria-label={`Excluir consulta de ${dataBR(r.data)}`}>×</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          SBP (Strufaldi 2013 / Tratado de Pediatria 2017): abaixo de {pct(crit.ab)}% do mínimo = Abaixo; abaixo de {pct(crit.at)}% = Atenção; até {pct(crit.ac)}% do máximo = Adequado.
          OMS 2006 aplicada de 0 a 5 meses completos. Mês = {crit.dias} dias. Critérios editáveis em Ajustes.
        </p>
      </div>
    </>
  );
}
