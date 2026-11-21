"use client";

import type { Refeicao } from "@/lib/types";

export function ListaRefeicoes({ itens, obs, vazio = "Ainda sem plano alimentar." }: { itens: Refeicao[]; obs?: string; vazio?: string }) {
  if (!itens.length) return <p className="dim">{vazio}</p>;
  return (
    <>
      <ol className="meals">
        {[...itens].sort((a, b) => a.h.localeCompare(b.h)).map((r, i) => (
          <li key={i}><time>{r.h}</time><div><b>{r.n}</b><p>{r.d}</p></div></li>
        ))}
      </ol>
      {obs && <p className="note">{obs}</p>}
    </>
  );
}

/** Editor de lista horário + refeição + descrição (plano alimentar e recordatório 24 h). */
export function EditorRefeicoes({ itens, onMudar, rotuloDescricao = "O que comer", novo }: {
  itens: Refeicao[]; onMudar: (v: Refeicao[]) => void; rotuloDescricao?: string; novo: Refeicao;
}) {
  const alterar = (i: number, campo: keyof Refeicao, v: string) => onMudar(itens.map((r, k) => (k === i ? { ...r, [campo]: v } : r)));
  return (
    <>
      {itens.map((r, i) => (
        <div className="refrow" key={i}>
          <input type="time" aria-label="Horário" defaultValue={r.h} onBlur={(e) => e.target.value !== r.h && alterar(i, "h", e.target.value)} />
          <input aria-label="Refeição" defaultValue={r.n} onBlur={(e) => e.target.value !== r.n && alterar(i, "n", e.target.value)} />
          <textarea aria-label={rotuloDescricao} defaultValue={r.d} onBlur={(e) => e.target.value !== r.d && alterar(i, "d", e.target.value)} />
          <button type="button" className="btn sm ghost" onClick={() => onMudar(itens.filter((_, k) => k !== i))} aria-label={`Remover ${r.n}`}>Remover</button>
        </div>
      ))}
      <button type="button" className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => onMudar([...itens, novo])}>+ Adicionar</button>
    </>
  );
}
