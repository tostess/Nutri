"use client";

import Link from "next/link";
import type { Crianca, Mae, Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { linhasCrescimento } from "@/lib/domain/crescimento";
import { dpp, linhasMae } from "@/lib/domain/maternal";
import { CORES, escalaPadrao, nomeTipo, resumoIntestinal } from "@/lib/domain/intestinal";
import { primeiroNome } from "@/lib/domain/paciente";
import { dataBR, dias, diaSemana, idadeTexto, igTexto, pd } from "@/lib/domain/datas";
import { fmt, num, ok, sinal, uid } from "@/lib/format";
import { Faisca, Mamadeira } from "../graficos";
import { ListaRefeicoes } from "../Refeicoes";
import { FormEvacuacao } from "../FormEvacuacao";
import { FormAnamnese } from "../FormAnamnese";
import { cm, kg, useHoje } from "../ui";
import { progressoAnamnese } from "@/lib/domain/anamnese";

const SINT_CRIANCA = ["Cólica", "Regurgitação", "Vômito", "Assadura", "Recusa alimentar", "Febre"];
const SINT_GESTANTE = ["Náusea", "Vômito", "Azia", "Constipação", "Inchaço", "Muita fome", "Sono ruim"];
const SINT_LACTANTE = ["Dor nas mamas", "Pouco leite", "Cansaço", "Muita fome", "Sono ruim", "Constipação"];

function Recado({ p }: { p: Paciente }) {
  if (!p.recado && !p.prox) return null;
  return (
    <div className="card apri">
      {p.recado && <><h2>Recado da nutricionista</h2><p style={{ margin: 0 }}>{p.recado}</p></>}
      {p.prox && <p style={{ margin: p.recado ? "12px 0 0" : 0 }}><b>Próxima consulta: {diaSemana(p.prox)}, {dataBR(p.prox)}{p.proxHora ? `, às ${p.proxHora}` : ""}</b></p>}
    </div>
  );
}

function LigacaoFamilia({ p }: { p: Paciente }) {
  const { s } = useApp();
  const outroId = p.tipo === "crianca" ? p.maeId : p.tipo === "lactante" ? p.bebeId : undefined;
  const outro = s.pacientes.find((x) => x.id === outroId);
  if (!outro) return null;
  return <Link className="btn ghost" href={`/paciente/${outro.id}`} style={{ textAlign: "center" }}>Ver o acompanhamento de {primeiroNome(outro)}</Link>;
}

function FichaPendente({ p }: { p: Paciente }) {
  const pr = progressoAnamnese(p.tipo, p.anamnese);
  if (pr.feitos / pr.total > 0.6) return null;
  return (
    <Link href={`/paciente/${p.id}?aba=ficha`} className="card" style={{ color: "inherit", textDecoration: "none", display: "block" }}>
      <h2>Ficha antes da consulta</h2>
      <p style={{ margin: 0 }}>{pr.feitos} de {pr.total} perguntas respondidas. Leva uns 5 minutos e adianta a consulta.</p>
      <div className="prog"><i style={{ width: `${(pr.feitos / pr.total) * 100}%` }} /></div>
    </Link>
  );
}

function InicioCrianca({ p }: { p: Crianca }) {
  const { s, despachar } = useApp();
  const hoje = useHoje();
  const rs = linhasCrescimento(p, s.config.crit), L = rs[rs.length - 1], e = p.enviado;
  const mam = s.mamadas[p.id]?.[hoje] ?? [];
  const feitas = mam.filter(Boolean).length;
  return (
    <>
      <section className="fhero">
        <p>Olá, {p.resp.split(/[\s(]/)[0] || "família"}</p>
        <h1>{primeiroNome(p)}</h1>
        <p>{idadeTexto(p.nasc, hoje)}</p>
        <div className="ftiles">
          <div><b>{kg(L?.peso)}</b><span>peso</span></div>
          <div><b>{cm(L?.alt)}</b><span>comprimento</span></div>
          <div><b>{cm(L?.pc)}</b><span>cabeça (PC)</span></div>
        </div>
        <Faisca pontos={rs.filter((r) => ok(r.peso)).map((r) => ({ x: dias(p.nasc, r.data), y: r.peso as number }))} />
        <p style={{ fontSize: 13 }}>Peso desde o nascimento, medido em {dataBR(L?.data)}</p>
      </section>
      <div className="fcards">
        <Recado p={p} />
        <FichaPendente p={p} />
        {e ? (
          <div className="card">
            <h2>Plano de mamadas</h2>
            <div className="recipe" style={{ background: "none", padding: 0 }}>
              <Mamadeira ml={e.porEt} />
              <div>
                <p style={{ color: "var(--ink)" }}>{e.formula}</p>
                <div className="big" style={{ color: "var(--berry)" }}>{fmt(e.porEt, 0)} mL</div>
                <p style={{ color: "var(--ink)" }}>por mamada, <b>{e.etapas} vezes ao dia</b></p>
                {e.po && ok(e.med) && <p style={{ color: "var(--ink)" }}>Preparo: <b>{e.med} medidas rasas</b> em <b>{fmt(e.agua, 0)} mL</b> de água</p>}
              </div>
            </div>
            {e.orient && <p className="note" style={{ fontSize: 14 }}>{e.orient}</p>}
            {e.po && ok(e.latas) && <p className="note">Cerca de {Math.ceil(e.latas)} latas por mês.</p>}
            <h3 style={{ marginTop: 14 }}>Mamadas de hoje: {feitas} de {e.etapas}</h3>
            <div className="mams">
              {Array.from({ length: e.etapas }, (_, i) => (
                <button key={i} className="mam" aria-pressed={!!mam[i]} aria-label={`Mamada ${i + 1}`} onClick={() => despachar({ t: "mamada/alternar", pid: p.id, data: hoje, i })}>
                  {mam[i] ? "✓" : i + 1}
                </button>
              ))}
            </div>
            <p className="note">Plano enviado em {dataBR(e.data)}.</p>
          </div>
        ) : null}
        {p.refeicoes.length > 0 && <div className="card"><h2>Rotina de alimentação</h2><ListaRefeicoes itens={p.refeicoes} obs={p.refObs} /></div>}
        <div className="card">
          <h2>Consultas</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Data</th><th className="n">Peso</th><th className="n">Comp.</th><th className="n">PC</th></tr></thead>
              <tbody>{[...rs].reverse().map((r) => <tr key={r.data}><td>{r.nascimento ? "Nascimento" : dataBR(r.data)}</td><td className="n">{kg(r.peso)}</td><td className="n">{cm(r.alt)}</td><td className="n">{cm(r.pc)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="note">A avaliação do crescimento é feita pela nutricionista na consulta.</p>
        </div>
        <LigacaoFamilia p={p} />
        <div className="card">
          <details>
            <summary>Como o bebê é medido</summary>
            <p><b>Peso:</b> despido, em balança plana e estável. Até 2 anos, balança pediátrica, deitado ou sentado; depois, em pé no centro da balança.</p>
            <p><b>Comprimento:</b> até 2 anos, deitado no infantômetro, cabeça alinhada, joelhos estendidos e pés a 90° encostados no cursor. Depois, em pé.</p>
            <p><b>Perímetro cefálico:</b> fita que não estica, passando acima das sobrancelhas e pela parte mais saliente de trás da cabeça.</p>
          </details>
        </div>
      </div>
    </>
  );
}

function InicioMae({ p }: { p: Mae }) {
  const hoje = useHoje();
  const G = p.tipo === "gestante";
  const rs = linhasMae(p).filter((r) => ok(r.peso)), L = rs[rs.length - 1];
  const ig = G ? dias(p.dum, hoje) : 0;
  return (
    <>
      <section className="fhero">
        <p>Olá, {primeiroNome(p)}</p>
        <h1>{G ? `${Math.floor(ig / 7)} semanas` : idadeTexto(p.parto, hoje)}</h1>
        <p>{G ? `e ${ig % 7} dias de gestação. Data provável do parto: ${dataBR(dpp(p.dum))}` : "desde o parto"}</p>
        {G && <div className="gbar" aria-hidden="true"><i style={{ width: `${Math.min(100, (ig / 280) * 100)}%` }} /></div>}
        <div className="ftiles">
          <div><b>{L ? `${fmt(L.peso)} kg` : "—"}</b><span>peso atual</span></div>
          <div><b>{L ? `${sinal(L.dif!, 1)} kg` : "—"}</b><span>{G ? "na gestação" : "desde antes da gestação"}</span></div>
          <div><b>{G ? (ig < 98 ? "1º" : ig < 196 ? "2º" : "3º") + " tri" : { exclusiva: "Exclusiva", parcial: "Mista", nao: "Não" }[(p as { amam: "exclusiva" | "parcial" | "nao" }).amam]}</b><span>{G ? "trimestre" : "amamentação"}</span></div>
        </div>
        <Faisca pontos={rs.map((r) => ({ x: pd(r.data), y: r.peso as number }))} />
        {rs.length > 1 && <p style={{ fontSize: 13 }}>Seu peso nas consultas, até {dataBR(L.data)}</p>}
      </section>
      <div className="fcards">
        <Recado p={p} />
        <FichaPendente p={p} />
        <div className="card"><h2>Plano alimentar</h2><ListaRefeicoes itens={p.refeicoes} obs={p.refObs} /></div>
        <div className="card">
          <h2>Consultas</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Data</th><th>{G ? "Semanas" : "Pós-parto"}</th><th className="n">Peso</th></tr></thead>
              <tbody>
                {rs.length ? [...rs].reverse().map((r) => <tr key={r.data}><td>{dataBR(r.data)}</td><td>{G ? igTexto(r.ig!) : `${Math.floor(r.posParto! / 7)} sem`}</td><td className="n">{fmt(r.peso)} kg</td></tr>)
                  : <tr><td colSpan={3} className="dim">Nenhuma consulta ainda.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="note">A avaliação do ganho de peso é feita pela nutricionista na consulta.</p>
        </div>
        <LigacaoFamilia p={p} />
      </div>
    </>
  );
}

export function InicioPaciente({ p }: { p: Paciente }) {
  return p.tipo === "crianca" ? <InicioCrianca p={p} /> : <InicioMae p={p} />;
}

function Titulo({ titulo, sub }: { titulo: string; sub: string }) {
  return <section className="fhero" style={{ paddingBottom: 18 }}><p>{sub}</p><h1 style={{ fontSize: 34 }}>{titulo}</h1></section>;
}

export function DiarioPaciente({ p }: { p: Paciente }) {
  const { despachar, toast } = useApp();
  const hoje = useHoje();
  const C = p.tipo === "crianca";
  const sint = C ? SINT_CRIANCA : p.tipo === "gestante" ? SINT_GESTANTE : SINT_LACTANTE;
  const ds = [...p.diario].sort((a, b) => pd(b.data) - pd(a.data));
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const F = new FormData(e.currentTarget);
    const w = num(F.get("peso"));
    despachar({
      t: "diario/adicionar", pid: p.id,
      registro: { id: uid("d"), data: String(F.get("data") || hoje), pesoKg: w == null ? null : C ? w / 1000 : w, sint: F.getAll("sint").map(String), relato: String(F.get("relato") || ""), autor: "paciente", lido: false },
    });
    e.currentTarget.reset();
    toast("Enviado para a nutricionista.");
  }
  return (
    <>
      <Titulo sub={primeiroNome(p)} titulo="Diário" />
      <div className="fcards">
        <form className="card" onSubmit={enviar}>
          <h2>{C ? "Como foi o dia?" : "Como você está?"}</h2>
          <div className="form">
            <label>Data<input type="date" name="data" defaultValue={hoje} /></label>
            <label>{C ? "Peso em casa (g)" : "Peso (kg)"}<input name="peso" inputMode="decimal" placeholder="opcional" /></label>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 14, fontWeight: 600, color: "var(--mute)" }}>{C ? "Aconteceu algo?" : "Sentiu algo?"}</p>
          <div className="chks">{sint.map((x) => <label key={x}><input type="checkbox" name="sint" value={x} />{x}</label>)}</div>
          <label style={{ marginTop: 8 }}>{C ? "Conte como foi (mamadas, papinhas, sono)" : "Conte como foi a alimentação e o dia"}<textarea name="relato" /></label>
          <button className="btn" style={{ width: "100%", marginTop: 10 }}>Enviar para a nutricionista</button>
        </form>
        <div className="card">
          <h2>Registros</h2>
          {ds.length ? ds.map((d) => (
            <div className="entry" key={d.id}>
              <b>{diaSemana(d.data)}, {dataBR(d.data)}</b>{ok(d.pesoKg) ? `, ${C ? fmt(d.pesoKg * 1000, 0) + " g" : fmt(d.pesoKg) + " kg"}` : ""} {d.autor === "nutri" && <span className="chip in">consultório</span>}
              <div>{d.sint.map((x) => <span key={x} className="chip at" style={{ marginRight: 4 }}>{x}</span>)}</div>
              {d.relato && <p>{d.relato}</p>}
            </div>
          )) : <p className="dim">Seus registros aparecem aqui.</p>}
        </div>
      </div>
    </>
  );
}

export function IntestinoPaciente({ p }: { p: Paciente }) {
  const hoje = useHoje();
  const r = resumoIntestinal(p.evacuacoes, escalaPadrao(p, hoje), hoje, 7);
  const evs = [...p.evacuacoes].sort((a, b) => pd(b.data) - pd(a.data) || b.hora.localeCompare(a.hora)).slice(0, 10);
  return (
    <>
      <Titulo sub={p.tipo === "crianca" ? `Evacuações de ${primeiroNome(p)}` : "Suas evacuações"} titulo="Intestino" />
      <div className="fcards">
        <div className="card">
          <h2>Registrar evacuação</h2>
          <p className="note" style={{ marginTop: 0 }}>Registre cada vez, se puder. Isso ajuda a nutricionista a ajustar a alimentação.</p>
          <FormEvacuacao p={p} autor="paciente" />
        </div>
        <div className="card">
          <h2>Últimos 7 dias</h2>
          <p style={{ margin: 0 }}><b>{r.total}</b> {r.total === 1 ? "evacuação registrada" : "evacuações registradas"}{r.diasSemEvacuar != null ? `. Última há ${r.diasSemEvacuar === 0 ? "menos de 1 dia" : r.diasSemEvacuar + (r.diasSemEvacuar === 1 ? " dia" : " dias")}.` : "."}</p>
          {evs.map((e) => {
            const c = CORES.find((x) => x.cor === e.cor);
            return (
              <div className="entry" key={e.id}>
                <b>{diaSemana(e.data)}, {dataBR(e.data).slice(0, 5)}</b> {e.hora}
                <p>{e.escala === "bristol" ? `Tipo ${e.tipo}: ${nomeTipo(e.escala, e.tipo).toLowerCase()}` : nomeTipo(e.escala, e.tipo)}{c ? `, ${c.nome.toLowerCase()}` : ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function FichaPaciente({ p }: { p: Paciente }) {
  return (
    <>
      <Titulo sub={p.tipo === "crianca" ? `Sobre ${primeiroNome(p)}` : "Sobre você"} titulo="Ficha antes da consulta" />
      <div className="fcards">
        <p className="note" style={{ margin: 0 }}>Responda o que souber. A nutricionista revisa tudo com você na consulta.</p>
        <FormAnamnese p={p} autor="paciente" />
      </div>
    </>
  );
}
