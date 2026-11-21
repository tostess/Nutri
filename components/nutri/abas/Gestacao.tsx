"use client";

import type { Gestante, Lactante } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { alertasMae, classeIMC, dpp, imc, linhasMae } from "@/lib/domain/maternal";
import { GANHO_GESTACIONAL, IMC_NOME } from "@/lib/domain/referencias";
import { dataBR, igTexto } from "@/lib/domain/datas";
import { fmt, num, ok, sinal } from "@/lib/format";
import { GraficoMae } from "../../graficos";
import { Alertas, Chip, useHoje } from "../../ui";

export function FormConsultaMae({ p }: { p: Gestante | Lactante }) {
  const { despachar, toast } = useApp();
  const hoje = useHoje();
  return (
    <form className="panel" onSubmit={(e) => {
      e.preventDefault();
      const F = new FormData(e.currentTarget);
      const data = String(F.get("data") || "");
      const peso = num(F.get("peso"));
      if (!data || peso == null) return;
      despachar({ t: "consulta/salvar", pid: p.id, consulta: { data, peso, obs: String(F.get("obs") || "") } });
      e.currentTarget.reset();
      toast("Consulta registrada.");
    }}>
      <h3 style={{ marginBottom: 10 }}>Nova consulta</h3>
      <div className="form">
        <label>Data<input type="date" name="data" defaultValue={hoje} required /></label>
        <label>Peso (kg)<input name="peso" inputMode="decimal" placeholder="68,9" required /></label>
        <label className="full">Observações<input name="obs" /></label>
        <button className="btn full">Registrar consulta</button>
      </div>
    </form>
  );
}

export function useExcluirConsulta(p: Gestante | Lactante) {
  const { despachar, toast } = useApp();
  return (data: string) => {
    const c = p.consultas.find((x) => x.data === data);
    if (!c) return;
    despachar({ t: "consulta/excluir", pid: p.id, data });
    toast(`Consulta de ${dataBR(data)} excluída.`, () => despachar({ t: "consulta/salvar", pid: p.id, consulta: c }));
  };
}

export function AbaGestacao({ p }: { p: Gestante }) {
  const hoje = useHoje();
  const excluir = useExcluirConsulta(p);
  const rs = linhasMae(p);
  const i0 = imc(p.pesoPre, p.altura), k = classeIMC(i0 ?? 22), fim = GANHO_GESTACIONAL[k][2];
  return (
    <>
      <div className="grid2 gs">
        <div className="panel chartp">
          <div className="ph">
            <h3>Ganho de peso gestacional</h3>
            <span className="dim" style={{ fontSize: 14 }}>{IMC_NOME[k]}: {fmt(fim[1])} a {fmt(fim[2])} kg até 40 semanas</span>
          </div>
          <GraficoMae p={p} />
          <div className="legend">
            <b className="dim" style={{ fontWeight: 600 }}>Faixa verde = ganho recomendado para o IMC pré-gestacional. Ponto:</b>
            <span className="lg-ab">abaixo</span><span className="lg-ok">dentro</span><span className="lg-ac">acima</span>
          </div>
        </div>
        <div className="stackp">
          <div className="panel"><h3>Pontos de atenção</h3><Alertas itens={alertasMae(p, hoje)} /></div>
          <FormConsultaMae p={p} />
        </div>
      </div>
      <div className="panel">
        <h3>Consultas</h3>
        <div className="scroll">
          <table className="wide">
            <thead><tr><th>Data</th><th>Idade gestacional</th><th className="n">Peso (kg)</th><th className="n">Ganho (kg)</th><th className="n">Faixa esperada (kg)</th><th>Situação</th><th className="n">IMC</th><th>Obs.</th><th></th></tr></thead>
            <tbody>
              {rs.length ? [...rs].reverse().map((r) => (
                <tr key={r.data}>
                  <td>{dataBR(r.data)}</td><td>{igTexto(r.ig!)}</td><td className="n">{fmt(r.peso)}</td>
                  <td className="n">{ok(r.dif) ? sinal(r.dif, 1) : "—"}</td><td className="n">{fmt(r.faixa![0])} a {fmt(r.faixa![1])}</td>
                  <td><Chip c={r.classe} /></td><td className="n">{fmt(r.imc)}</td><td className="w">{r.obs}</td>
                  <td><button className="x" aria-label={`Excluir consulta de ${dataBR(r.data)}`} onClick={() => excluir(r.data)}>×</button></td>
                </tr>
              )) : <tr><td colSpan={9} className="dim">Nenhuma consulta.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="note">
          Peso pré-gestacional {fmt(p.pesoPre)} kg, altura {p.altura} cm, IMC {fmt(i0)} kg/m². DUM {dataBR(p.dum)}, data provável do parto {dataBR(dpp(p.dum))}.
          Faixas das curvas brasileiras de ganho de peso gestacional (Kac et al., 2021), adotadas pelo Ministério da Saúde em 2022: marcos de 13, 27 e 40 semanas;
          entre eles o app interpola em linha reta. Em casos limítrofes, confira na curva oficial.
        </p>
      </div>
    </>
  );
}
