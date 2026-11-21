"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Classe } from "@/lib/types";
import type { Alerta } from "@/lib/domain/crescimento";
import { fmt, num } from "@/lib/format";
import { hoje } from "@/lib/domain/datas";

export const CLASSE_CSS: Record<Classe, string> = { Abaixo: "ab", "Atenção": "at", Adequado: "ok", Acima: "ac" };

export function Chip({ c }: { c?: Classe | null }) {
  return c ? <span className={`chip ${CLASSE_CSS[c]}`}>{c}</span> : <span className="dim">—</span>;
}

export function Alertas({ itens, vazio = "Nada a destacar." }: { itens: Alerta[]; vazio?: string }) {
  if (!itens.length) return <p className="dim">{vazio}</p>;
  return (
    <ul className="alerts" style={{ marginTop: 10 }}>
      {itens.map(([t, m], i) => <li key={i} className={t}>{m}</li>)}
    </ul>
  );
}

export function useHoje() {
  const [d, setD] = useState(() => hoje());
  useEffect(() => setD(hoje()), []);
  return d;
}

/** Tamanho real do elemento, para desenhar gráficos em pixels. */
export function useTamanho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setT({ w: el.clientWidth, h: el.clientHeight }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, t] as const;
}

/** Campo numérico que aceita vírgula e só grava ao sair do campo. */
export function NumCampo({ rotulo, valor, onSalvar, unidade, passo, placeholder, className, id }: {
  rotulo: string; valor: number | null | undefined; onSalvar: (v: number | null) => void; unidade?: string; passo?: number; placeholder?: string; className?: string; id?: string;
}) {
  const [txt, setTxt] = useState(valor == null ? "" : String(valor).replace(".", ","));
  useEffect(() => setTxt(valor == null ? "" : String(valor).replace(".", ",")), [valor]);
  const salvar = () => {
    const n = num(txt);
    if (n !== (valor ?? null)) onSalvar(n);
  };
  return (
    <label className={`campo ${className ?? ""}`}>
      <span>{rotulo}</span>
      <span className="un">
        <input id={id} inputMode="decimal" value={txt} placeholder={placeholder} step={passo}
          onChange={(e) => setTxt(e.target.value)} onBlur={salvar} onKeyDown={(e) => e.key === "Enter" && salvar()} />
        {unidade && <em>{unidade}</em>}
      </span>
    </label>
  );
}

/** Texto que grava ao sair do campo. */
export function TextoCampo({ rotulo, valor, onSalvar, longo, placeholder, className, tipo = "text", dica }: {
  rotulo: string; valor: string; onSalvar: (v: string) => void; longo?: boolean; placeholder?: string; className?: string; tipo?: string; dica?: string;
}) {
  const [txt, setTxt] = useState(valor ?? "");
  useEffect(() => setTxt(valor ?? ""), [valor]);
  const salvar = () => txt !== (valor ?? "") && onSalvar(txt);
  return (
    <label className={`campo ${className ?? ""}`}>
      <span>{rotulo}</span>
      {longo ? (
        <textarea value={txt} placeholder={placeholder} onChange={(e) => setTxt(e.target.value)} onBlur={salvar} />
      ) : (
        <input type={tipo} value={txt} placeholder={placeholder} onChange={(e) => { setTxt(e.target.value); if (tipo === "date" || tipo === "time") onSalvar(e.target.value); }} onBlur={salvar} />
      )}
      {dica && <small className="dim" style={{ fontSize: 13 }}>{dica}</small>}
    </label>
  );
}

export function Opcoes<T extends string>({ valor, opcoes, onEscolher, rotulos }: {
  valor: T | null | undefined; opcoes: readonly T[]; onEscolher: (v: T | null) => void; rotulos?: Record<string, string>;
}) {
  return (
    <div className="opts">
      {opcoes.map((o) => (
        <button type="button" key={o} className="opt" aria-pressed={valor === o} onClick={() => onEscolher(valor === o ? null : o)}>
          {rotulos?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

export function Multi({ valor, opcoes, onMudar }: { valor: string[]; opcoes: string[]; onMudar: (v: string[]) => void }) {
  const exclusivos = ["Nenhum", "Nenhuma"];
  return (
    <div className="opts">
      {opcoes.map((o) => {
        const on = valor.includes(o);
        return (
          <button type="button" key={o} className="opt" aria-pressed={on} onClick={() => {
            if (on) return onMudar(valor.filter((x) => x !== o));
            if (exclusivos.includes(o)) return onMudar([o]);
            onMudar([...valor.filter((x) => !exclusivos.includes(x)), o]);
          }}>{o}</button>
        );
      })}
    </div>
  );
}

export function Figura({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return <div className="fg"><b>{valor}</b><span>{rotulo}</span></div>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="dim">{children}</p>;
}

export const kg = (v: number | null | undefined, d = 2) => (v == null ? "—" : `${fmt(v, d)} kg`);
export const cm = (v: number | null | undefined) => (v == null ? "—" : `${fmt(v)} cm`);
