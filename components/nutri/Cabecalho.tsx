"use client";

import Link from "next/link";
import type { Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { linhasCrescimento } from "@/lib/domain/crescimento";
import { classeIMC, dpp, imc, linhasMae } from "@/lib/domain/maternal";
import { AMAMENTACAO_NOME, IMC_NOME } from "@/lib/domain/referencias";
import { anos, dataBR, dias, idadeTexto } from "@/lib/domain/datas";
import { fmt, ok, sinal } from "@/lib/format";
import { cm, kg, useHoje } from "../ui";

export function Cabecalho({ p }: { p: Paciente }) {
  const { s } = useApp();
  const hoje = useHoje();
  const nome = (id?: string) => s.pacientes.find((x) => x.id === id)?.nome.split(" ")[0];

  if (p.tipo === "crianca") {
    const rs = linhasCrescimento(p, s.config.crit), L = rs[rs.length - 1], mae = nome(p.maeId);
    return (
      <div className="rhead">
        <div>
          <h1>{p.nome}</h1>
          <ul className="meta">
            <li>{idadeTexto(p.nasc, hoje)}</li>
            <li>{p.sexo === "F" ? "Feminino" : "Masculino"}</li>
            {p.diag && <li>{p.diag}</li>}
            <li>{mae ? <Link className="lk" href={`/nutri/p/${p.maeId}`}>Mãe: {mae}</Link> : p.resp}</li>
          </ul>
        </div>
        <div className="kpis">
          <div><b>{kg(L?.peso)}</b><span>peso</span></div>
          <div><b>{cm(L?.alt)}</b><span>comprimento</span></div>
          <div><b>{cm(L?.pc)}</b><span>PC</span></div>
          <small>{L && L.i ? "Última consulta " + dataBR(L.data) : "Só dados de nascimento"}</small>
        </div>
      </div>
    );
  }
  const G = p.tipo === "gestante";
  const rs = linhasMae(p).filter((r) => ok(r.peso)), L = rs[rs.length - 1];
  const i0 = imc(p.pesoPre, p.altura), k = classeIMC(i0 ?? 22);
  const ig = G ? dias(p.dum, hoje) : 0;
  const bebe = p.tipo === "lactante" ? nome(p.bebeId) : undefined;
  return (
    <div className="rhead">
      <div>
        <h1>{p.nome}</h1>
        <ul className="meta">
          <li>{anos(p.nasc, hoje)} anos</li>
          <li>{G ? "Gestante" : "Lactante"}</li>
          <li>IMC pré-gestacional {fmt(i0)} ({IMC_NOME[k].toLowerCase()})</li>
          {p.tipo === "lactante" && <li>{AMAMENTACAO_NOME[p.amam]}</li>}
          {bebe && <li><Link className="lk" href={`/nutri/p/${(p as { bebeId?: string }).bebeId}`}>Bebê: {bebe}</Link></li>}
        </ul>
      </div>
      <div className="kpis">
        {G ? (
          <>
            <div><b>{Math.floor(ig / 7)} sem</b><span>e {ig % 7} dias hoje</span></div>
            <div><b>{L ? sinal(L.dif!, 1) + " kg" : "—"}</b><span>ganho na gestação</span></div>
            <div><b>{dataBR(dpp(p.dum)).slice(0, 5)}</b><span>parto previsto</span></div>
          </>
        ) : (
          <>
            <div><b>{L ? fmt(L.peso) + " kg" : "—"}</b><span>peso atual</span></div>
            <div><b>{L ? sinal(L.dif!, 1) + " kg" : "—"}</b><span>vs. pré-gestação</span></div>
            <div><b>{fmt(L?.imc)}</b><span>IMC atual</span></div>
          </>
        )}
        <small>{L ? "Última consulta " + dataBR(L.data) : "Nenhuma consulta registrada"}</small>
      </div>
    </div>
  );
}
