"use client";

import Link from "next/link";
import type { Crianca, PlanoFormula } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { calcularFormula, planoMudou, type SituacaoMeta } from "@/lib/domain/formula";
import { dataBR } from "@/lib/domain/datas";
import { fmt, ok } from "@/lib/format";
import { Mamadeira } from "../../graficos";
import { NumCampo, TextoCampo, useHoje } from "../../ui";

const css = (s: SituacaoMeta | null) => (s === "Dentro da meta" ? "ok" : s === "Abaixo da meta" ? "ab" : "ac");

export function AbaFormula({ p }: { p: Crianca }) {
  const { s, despachar, toast } = useApp();
  const hoje = useHoje();
  const P = p.plano;
  const r = calcularFormula(p, s.config.formulas);
  const f = r.formula;
  const set = (o: Partial<PlanoFormula>) => despachar({ t: "paciente/alterar", id: p.id, campos: { plano: { ...P, ...o } } });
  const mudou = planoMudou(p, s.config.formulas);
  const linha = (t: string, val: number | null, a: number | null, b: number | null, un: string, sit: SituacaoMeta | null) => (
    <tr>
      <td>{t}</td><td className="n"><b>{fmt(val, 1)}</b></td><td className="n">{fmt(a, 1)} a {fmt(b, 1)}</td>
      <td className="n">{ok(val) && ok(a) ? fmt((val / a) * 100, 0) + "%" : "—"}</td>
      <td className="n">{ok(val) && r.peso ? `${fmt(val / r.peso.kg, 1)} ${un}` : "—"}</td>
      <td>{sit ? <span className={`chip ${css(sit)}`}>{sit}</span> : "—"}</td>
    </tr>
  );
  return (
    <>
      <div className="grid2 rev">
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Prescrição</h3>
          <div className="form">
            <label className="full">Fórmula infantil
              <select value={P.formula} onChange={(e) => set({ formula: e.target.value })}>
                {s.config.formulas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
              </select>
            </label>
            <NumCampo rotulo="Meta kcal/kg mín" valor={P.kcal[0]} onSalvar={(v) => v != null && set({ kcal: [v, P.kcal[1]] })} />
            <NumCampo rotulo="Meta kcal/kg máx" valor={P.kcal[1]} onSalvar={(v) => v != null && set({ kcal: [P.kcal[0], v] })} />
            <NumCampo rotulo="Proteína g/kg mín" valor={P.prot[0]} onSalvar={(v) => v != null && set({ prot: [v, P.prot[1]] })} />
            <NumCampo rotulo="Proteína g/kg máx" valor={P.prot[1]} onSalvar={(v) => v != null && set({ prot: [P.prot[0], v] })} />
            <NumCampo className="full" rotulo="Volume fixo, deixe vazio para calcular pela meta calórica mínima" unidade="mL/dia" valor={P.vol} placeholder="automático" onSalvar={(v) => set({ vol: v })} />
            <NumCampo rotulo="Mamadas por dia" valor={P.etapas} onSalvar={(v) => v && set({ etapas: Math.round(v) })} />
            <NumCampo rotulo="Água por medida" unidade="mL" valor={P.ml} onSalvar={(v) => v && set({ ml: v })} />
            <NumCampo rotulo="Pó por medida" unidade="g" valor={P.g} onSalvar={(v) => v && set({ g: v })} />
            <NumCampo rotulo="Peso da lata" unidade="g" valor={P.lata} onSalvar={(v) => v && set({ lata: v })} />
            <TextoCampo className="full" longo rotulo="Orientações de preparo para a família" valor={P.orient} onSalvar={(v) => set({ orient: v })} />
          </div>
          {!ok(f?.kcal) && <p className="warn at">Composição de &quot;{f?.nome}&quot; não preenchida. Complete em Ajustes.</p>}
          {f && /100 g/.test(f.origem) && <p className="warn at">{f.nome}: {f.origem}.</p>}
        </div>
        <div className="stackp">
          <div className="recipe">
            <Mamadeira ml={r.porEtapa} />
            <div>
              <p>Por mamada</p>
              <div className="big">{fmt(r.porEtapa, 0)} mL</div>
              {r.po && ok(r.medidas) && <><p><b>{r.medidas} medidas rasas</b> em {fmt(r.agua, 0)} mL de água</p><p>{fmt(r.gPorEtapa, 1)} g de pó por mamada</p></>}
              <p>{P.etapas} mamadas, {fmt(r.vol, 0)} mL/dia</p>
              {r.po && ok(r.latasMes) && <p>{fmt(r.gDia, 0)} g/dia, <b>{fmt(r.latasMes, 1)} latas</b> de {P.lata} g por mês</p>}
            </div>
          </div>
          <div className="panel">
            <p style={{ margin: "0 0 10px" }}>
              {p.enviado ? `Plano enviado à família em ${dataBR(p.enviado.data)}.` : "Plano ainda não enviado."} {p.enviado && mudou && <b>Há alterações não enviadas.</b>}
            </p>
            <button className="btn" style={{ width: "100%" }} onClick={() => { despachar({ t: "plano/enviar", pid: p.id, data: hoje }); toast("Plano enviado. A família já vê no app."); }}>
              Enviar plano para a família
            </button>
            <p className="note">Para avisar por WhatsApp, use a mensagem &quot;Plano atualizado&quot; na aba <Link href={`/nutri/p/${p.id}?aba=whatsapp`}>WhatsApp</Link>.</p>
          </div>
        </div>
      </div>
      <div className="panel">
        <h3>Oferta × necessidade</h3>
        <p className="sample">Peso usado: {fmt(r.peso?.kg, 3)} kg ({r.peso ? `${r.peso.origem} de ${dataBR(r.peso.data)}` : "—"}). Pesagens feitas em casa aparecem no diário, mas não entram no cálculo.</p>
        <div className="scroll">
          <table className="stack">
            <thead><tr><th>Oferta</th><th className="n">Valor ofertado</th><th className="n">Meta</th><th className="n">% da meta inferior</th><th className="n">Por kg</th><th>Situação</th></tr></thead>
            <tbody>
              {linha("Calorias (kcal/dia)", r.ofertaKcal, r.kcalMin, r.kcalMax, "kcal/kg", r.situacaoKcal)}
              {linha("Proteína (g/dia)", r.ofertaProt, r.protMin, r.protMax, "g/kg", r.situacaoProt)}
            </tbody>
          </table>
        </div>
        <p className="note">Composição por 100 mL: {fmt(f?.kcal, 0)} kcal, {fmt(f?.prot, 1)} g proteína, {fmt(f?.cho, 1)} g carboidrato, {fmt(f?.lip, 1)} g lipídio, {fmt(f?.osm, 0)} mOsm/L. Medidas por mamada arredondadas para cima.</p>
      </div>
    </>
  );
}
