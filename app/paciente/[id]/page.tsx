"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Topo } from "@/components/Topo";
import { useApp } from "@/lib/data/store";
import { InicioPaciente, DiarioPaciente, IntestinoPaciente, FichaPaciente } from "@/components/paciente/Area";

const ABAS = [
  ["inicio", "Início", "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  ["diario", "Diário", "M5 4h11l3 3v13H5zM8 10h8M8 14h8M8 18h5"],
  ["intestino", "Intestino", "M12 3c-4 0-7 3-7 6 0 2 1 3 3 4-2 1-3 2-3 4 0 2 3 4 7 4s7-2 7-4c0-2-1-3-3-4 2-1 3-2 3-4 0-3-3-6-7-6z"],
  ["ficha", "Ficha", "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3"],
] as const;

function Area() {
  const { s, pronto } = useApp();
  const { id } = useParams<{ id: string }>();
  const aba = useSearchParams().get("aba") ?? "inicio";
  const p = s.pacientes.find((x) => x.id === id);
  if (!pronto) return <p className="carregando">Carregando…</p>;
  if (!p) return <div className="fam"><p className="carregando">Não encontramos este acompanhamento. <Link href="/paciente">Voltar</Link></p></div>;
  return (
    <div className="fam">
      {aba === "diario" ? <DiarioPaciente p={p} /> : aba === "intestino" ? <IntestinoPaciente p={p} /> : aba === "ficha" ? <FichaPaciente p={p} /> : <InicioPaciente p={p} />}
      <nav className="tabbar" aria-label="Seções">
        {ABAS.map(([k, t, d]) => (
          <Link key={k} href={`/paciente/${p.id}${k === "inicio" ? "" : `?aba=${k}`}`} aria-current={aba === k ? "page" : undefined} scroll>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
            {t}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Pagina() {
  return (
    <>
      <Topo papel="paciente" />
      <Suspense fallback={<p className="carregando">Carregando…</p>}><Area /></Suspense>
    </>
  );
}
