"use client";

import Link from "next/link";
import { useApp } from "@/lib/data/store";
import { naoLidos } from "@/lib/data/eventos";
import { alertasPaciente, primeiroNome, subtitulo } from "@/lib/domain/paciente";
import { dataBR, dias, diaSemana, pd } from "@/lib/domain/datas";
import { useHoje } from "@/components/ui";

export default function InicioNutri() {
  const { s } = useApp();
  const hoje = useHoje();
  const agenda = s.pacientes
    .filter((p) => p.prox && dias(hoje, p.prox) >= 0)
    .sort((a, b) => pd(a.prox) - pd(b.prox) || a.proxHora.localeCompare(b.proxHora));
  const novos = s.pacientes.map((p) => ({ p, n: naoLidos(p) })).filter((x) => x.n > 0);
  const alertas = s.pacientes.flatMap((p) => alertasPaciente(p, s.config, hoje).filter((a) => a[0] === "ab").map((a) => ({ p, a })));
  const quando = (d: string) => {
    const n = dias(hoje, d);
    return n === 0 ? "Hoje" : n === 1 ? "Amanhã" : `${diaSemana(d).slice(0, 3)}, ${dataBR(d).slice(0, 5)}`;
  };
  return (
    <>
      <h1 style={{ marginBottom: 18 }}>Início</h1>
      <div className="inicio">
        <div className="panel">
          <h3>Próximas consultas</h3>
          {agenda.length ? (
            <ul className="lista">
              {agenda.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/nutri/p/${p.id}`}>
                    <span><b>{p.nome}</b><small>{subtitulo(p, hoje)}</small></span>
                    <span className="quando">{quando(p.prox)}<small style={{ display: "block", fontSize: 14 }}>{p.proxHora}</small></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="dim">Nenhuma consulta marcada.</p>}
        </div>
        <div className="stackp">
          <div className="panel">
            <h3>Registros novos das pacientes</h3>
            {novos.length ? (
              <ul className="lista">
                {novos.map(({ p, n }) => (
                  <li key={p.id}>
                    <Link href={`/nutri/p/${p.id}?aba=diario`}>
                      <span><b>{primeiroNome(p)}</b><small>diário e evacuações</small></span>
                      <span className="chip in">{n} {n > 1 ? "novos" : "novo"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="dim">Tudo lido.</p>}
          </div>
          <div className="panel">
            <h3>Alertas importantes</h3>
            {alertas.length ? (
              <ul className="alerts" style={{ marginTop: 10 }}>
                {alertas.map(({ p, a }, i) => (
                  <li key={i} className={a[0]}><Link href={`/nutri/p/${p.id}`} style={{ color: "inherit" }}><b>{primeiroNome(p)}:</b> {a[1]}</Link></li>
                ))}
              </ul>
            ) : <p className="dim">Nenhum alerta.</p>}
          </div>
        </div>
      </div>
      <p className="note" style={{ marginTop: 18 }}>
        Dados salvos neste navegador. Ao integrar o banco, a mesma tela passa a mostrar os dados de todas as pacientes em qualquer aparelho.
      </p>
    </>
  );
}
