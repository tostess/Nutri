"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useApp } from "@/lib/data/store";
import { naoLidos } from "@/lib/data/eventos";
import { ABAS } from "@/lib/domain/paciente";
import { Cabecalho } from "@/components/nutri/Cabecalho";
import { AbaCrescimento } from "@/components/nutri/abas/Crescimento";
import { AbaNecessidades } from "@/components/nutri/abas/Necessidades";
import { AbaNecessidadesMae } from "@/components/nutri/abas/NecessidadesMae";
import { AbaFormula } from "@/components/nutri/abas/Formula";
import { AbaGestacao } from "@/components/nutri/abas/Gestacao";
import { AbaPosParto } from "@/components/nutri/abas/PosParto";
import { AbaPlano } from "@/components/nutri/abas/Plano";
import { AbaAnamnese } from "@/components/nutri/abas/Anamnese";
import { AbaIntestinal } from "@/components/nutri/abas/Intestinal";
import { AbaDiario } from "@/components/nutri/abas/Diario";
import { AbaWhatsApp } from "@/components/nutri/abas/WhatsApp";
import { AbaCadastro } from "@/components/nutri/abas/Cadastro";

function Prontuario() {
  const { s } = useApp();
  const { id } = useParams<{ id: string }>();
  const aba = useSearchParams().get("aba");
  const tabsRef = useRef<HTMLDivElement>(null);
  const p = s.pacientes.find((x) => x.id === id);

  useEffect(() => {
    const box = tabsRef.current, el = box?.querySelector<HTMLElement>("[aria-selected=true]");
    if (box && el && box.scrollWidth > box.clientWidth)
      box.scrollLeft += el.getBoundingClientRect().left - box.getBoundingClientRect().left - box.clientWidth / 2 + el.offsetWidth / 2;
  }, [aba, id]);

  if (!p) return <div className="panel"><p>Paciente não encontrada.</p><Link href="/nutri">Voltar ao início</Link></div>;
  const abas = ABAS[p.tipo] as readonly (readonly [string, string])[];
  const atual = abas.some((a) => a[0] === aba) ? aba! : abas[0][0];
  const nv = naoLidos(p);

  let corpo: React.ReactNode = null;
  if (atual === "crescimento" && p.tipo === "crianca") corpo = <AbaCrescimento p={p} />;
  else if (atual === "necessidades") corpo = p.tipo === "crianca" ? <AbaNecessidades p={p} /> : <AbaNecessidadesMae p={p} />;
  else if (atual === "formula" && p.tipo === "crianca") corpo = <AbaFormula p={p} />;
  else if (atual === "gestacao" && p.tipo === "gestante") corpo = <AbaGestacao p={p} />;
  else if (atual === "posparto" && p.tipo === "lactante") corpo = <AbaPosParto p={p} />;
  else if (atual === "plano") corpo = <AbaPlano p={p} />;
  else if (atual === "anamnese") corpo = <AbaAnamnese p={p} />;
  else if (atual === "intestinal") corpo = <AbaIntestinal p={p} />;
  else if (atual === "diario") corpo = <AbaDiario p={p} />;
  else if (atual === "whatsapp") corpo = <AbaWhatsApp p={p} />;
  else if (atual === "cadastro") corpo = <AbaCadastro p={p} />;

  return (
    <>
      <Cabecalho p={p} />
      <div className="tabs" role="tablist" ref={tabsRef}>
        {abas.map(([k, t]) => (
          <Link key={k} className="tab" role="tab" href={`/nutri/p/${p.id}?aba=${k}`} aria-selected={atual === k} scroll={false}>
            {t}{k === "diario" && nv > 0 && <i>{nv}</i>}
          </Link>
        ))}
      </div>
      {corpo}
    </>
  );
}

export default function Pagina() {
  return <Suspense fallback={<p className="carregando">Carregando…</p>}><Prontuario /></Suspense>;
}
