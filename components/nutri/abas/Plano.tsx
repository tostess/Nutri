"use client";

import type { Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { EditorRefeicoes, ListaRefeicoes } from "../../Refeicoes";
import { TextoCampo } from "../../ui";

export function AbaPlano({ p }: { p: Paciente }) {
  const { despachar } = useApp();
  const alt = (campos: Record<string, unknown>) => despachar({ t: "paciente/alterar", id: p.id, campos });
  return (
    <div className="grid2">
      <div className="panel">
        <h3 style={{ marginBottom: 8 }}>Plano alimentar</h3>
        {/* key força remontar quando a lista muda de tamanho, mantendo os campos em sincronia */}
        <EditorRefeicoes key={p.refeicoes.length} itens={p.refeicoes} novo={{ h: "12:00", n: "Nova refeição", d: "" }} onMudar={(v) => alt({ refeicoes: v })} />
        <TextoCampo className="full" longo rotulo="Observações gerais" valor={p.refObs} onSalvar={(v) => alt({ refObs: v })} />
      </div>
      <div className="panel">
        <h3 style={{ marginBottom: 6 }}>Como a paciente vê</h3>
        <ListaRefeicoes itens={p.refeicoes} obs={p.refObs} />
        <p className="note">Aparece no app da paciente assim que você altera.</p>
      </div>
    </div>
  );
}
