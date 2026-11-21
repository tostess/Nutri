"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Fragment, useEffect, useRef } from "react";
import { Topo } from "@/components/Topo";
import { useApp } from "@/lib/data/store";
import { naoLidos } from "@/lib/data/eventos";
import { alertasPaciente, classeAvatar, subtitulo } from "@/lib/domain/paciente";
import { useHoje } from "@/components/ui";

const GRUPOS = [["gestante", "Gestantes"], ["lactante", "Lactantes"], ["crianca", "Bebês e crianças"]] as const;

export default function NutriLayout({ children }: { children: React.ReactNode }) {
  const { s, pronto } = useApp();
  const { id } = useParams<{ id?: string }>();
  const path = usePathname();
  const hoje = useHoje();
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = railRef.current, el = box?.querySelector<HTMLElement>("[aria-current=true]");
    if (box && el && box.scrollWidth > box.clientWidth)
      box.scrollLeft += el.getBoundingClientRect().left - box.getBoundingClientRect().left - box.clientWidth / 2 + el.offsetWidth / 2;
  }, [id, pronto]);

  return (
    <>
      <Topo papel="nutri" />
      <div className="nut">
        <aside className="rail" ref={railRef}>
          <div className="rail-h">
            <h2>Pacientes</h2>
            <Link className="btn sm ghost" href="/nutri/nova">+ Nova</Link>
          </div>
          {GRUPOS.map(([t, rotulo]) => {
            const ps = s.pacientes.filter((q) => q.tipo === t);
            if (!ps.length) return null;
            return (
              <Fragment key={t}>
                <p className="rg">{rotulo}</p>
                {ps.map((q) => {
                  const n = alertasPaciente(q, s.config, hoje).filter((a) => a[0] !== "in").length + naoLidos(q);
                  return (
                    <Link key={q.id} className="pc" href={`/nutri/p/${q.id}`} aria-current={q.id === id}>
                      <span className={`av ${classeAvatar(q)}`}>{q.nome[0]}</span>
                      <span><b>{q.nome.split(" ")[0]}</b><small>{subtitulo(q, hoje)}</small></span>
                      {n > 0 && <span className="dot" title="Alertas e registros novos">{n}</span>}
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}
          <nav className="rail-nav" aria-label="Seções">
            <Link href="/nutri" aria-current={path === "/nutri" ? "page" : undefined}>Início</Link>
            <Link href="/nutri/ajustes" aria-current={path === "/nutri/ajustes" ? "page" : undefined}>Ajustes</Link>
          </nav>
        </aside>
        <section className="rec">{pronto ? children : <p className="carregando">Carregando…</p>}</section>
      </div>
    </>
  );
}
