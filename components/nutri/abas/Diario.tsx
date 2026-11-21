"use client";

import { useEffect } from "react";
import type { Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { naoLidos } from "@/lib/data/eventos";
import { dataBR, dias, diaSemana, pd } from "@/lib/domain/datas";
import { fmt, num, ok, uid } from "@/lib/format";
import { TextoCampo, useHoje } from "../../ui";

export function PainelRecado({ p }: { p: Paciente }) {
  const { despachar } = useApp();
  const alt = (campos: Record<string, unknown>) => despachar({ t: "paciente/alterar", id: p.id, campos });
  return (
    <div className="panel">
      <h3 style={{ marginBottom: 8 }}>Recado e próxima consulta</h3>
      <TextoCampo longo rotulo="Recado (aparece no início do app da paciente)" valor={p.recado} onSalvar={(v) => alt({ recado: v })} />
      <div className="form" style={{ marginTop: 10 }}>
        <TextoCampo tipo="date" rotulo="Próxima consulta" valor={p.prox} onSalvar={(v) => alt({ prox: v })} />
        <TextoCampo tipo="time" rotulo="Horário" valor={p.proxHora} onSalvar={(v) => alt({ proxHora: v })} />
      </div>
    </div>
  );
}

export function AbaDiario({ p }: { p: Paciente }) {
  const { despachar, toast } = useApp();
  const hoje = useHoje();
  const crianca = p.tipo === "crianca";
  const pendentes = naoLidos(p);
  useEffect(() => {
    if (pendentes) despachar({ t: "registros/marcarLidos", pid: p.id });
  }, [pendentes, p.id, despachar]);

  const ds = [...p.diario].sort((a, b) => pd(a.data) - pd(b.data));
  let prev: (typeof ds)[number] | null = null;
  const linhas = ds.map((d) => {
    let g: number | null = null;
    if (ok(d.pesoKg) && prev && ok(prev.pesoKg)) {
      const dd = dias(prev.data, d.data);
      if (dd > 0) g = ((d.pesoKg - prev.pesoKg) * 1000) / dd;
    }
    if (ok(d.pesoKg)) prev = d;
    return { ...d, g };
  });
  const gs = linhas.filter((x) => ok(x.g));
  const media = gs.length ? gs.reduce((a, x) => a + (x.g as number), 0) / gs.length : null;

  function lancar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const F = new FormData(e.currentTarget);
    const peso = num(F.get("peso"));
    despachar({
      t: "diario/adicionar", pid: p.id,
      registro: {
        id: uid("d"), data: String(F.get("data") || hoje), pesoKg: peso == null ? null : crianca ? peso / 1000 : peso,
        comp: num(F.get("comp")), pc: num(F.get("pc")), pt: num(F.get("pt")), sint: [], relato: String(F.get("relato") || ""), autor: "nutri", lido: true,
      },
    });
    e.currentTarget.reset();
    toast("Registro lançado.");
  }

  return (
    <div className="grid2">
      <div className="panel">
        <div className="ph">
          <h3>Registros e pesagens</h3>
          {crianca && <span className="dim" style={{ fontSize: 14 }}>Ganho médio entre pesagens: <b>{fmt(media)} g/dia</b></span>}
        </div>
        {linhas.length ? (
          <div className="scroll">
            <table className="stack">
              <thead>
                <tr><th>Data</th><th>Quem</th><th className="n">Peso</th>{crianca && <><th className="n">Ganho g/dia</th><th className="n">Comp.</th><th className="n">PC</th><th className="n">PT</th></>}<th>Sintomas</th><th>Relato</th></tr>
              </thead>
              <tbody>
                {[...linhas].reverse().map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{diaSemana(d.data).slice(0, 3)} {dataBR(d.data).slice(0, 5)}</td>
                    <td>{d.autor === "paciente" ? <span className="chip in">Paciente</span> : "Consultório"}</td>
                    <td className="n">{ok(d.pesoKg) ? (crianca ? `${fmt(d.pesoKg * 1000, 0)} g` : `${fmt(d.pesoKg)} kg`) : "—"}</td>
                    {crianca && <><td className="n">{fmt(d.g)}</td><td className="n">{fmt(d.comp)}</td><td className="n">{fmt(d.pc)}</td><td className="n">{fmt(d.pt)}</td></>}
                    <td>{d.sint.length ? d.sint.map((x) => <span key={x} className={`chip ${/Sangue/.test(x) ? "ab" : "at"}`} style={{ marginRight: 4 }}>{x}</span>) : "—"}</td>
                    <td>{d.relato}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dim">Nenhum registro ainda. A paciente registra pelo app.</p>}
        {crianca && <p className="note">Ganho = diferença entre pesagens ÷ dias entre elas. Pesagens de casa usam balanças diferentes: use como tendência.</p>}
      </div>
      <div className="stackp">
        <form className="panel" onSubmit={lancar}>
          <h3 style={{ marginBottom: 10 }}>{crianca ? "Pesagem semanal" : "Registro do consultório"}</h3>
          <div className="form">
            <label>Data<input type="date" name="data" defaultValue={hoje} /></label>
            <label>Peso ({crianca ? "g" : "kg"})<input name="peso" inputMode="decimal" /></label>
            {crianca && <><label>Comp. (cm)<input name="comp" inputMode="decimal" /></label><label>PC (cm)<input name="pc" inputMode="decimal" /></label><label>PT (cm)<input name="pt" inputMode="decimal" /></label></>}
            <label className="full">Relato nutricional<textarea name="relato" /></label>
            <button className="btn full">Lançar</button>
          </div>
        </form>
        <PainelRecado p={p} />
      </div>
    </div>
  );
}
