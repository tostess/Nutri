"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState } from "../types";
import { reduzir, type Evento } from "./eventos";
import { criarRepositorio, type Repositorio } from "./repositorio";
import { estadoExemplo } from "./seed";

interface Ctx {
  s: AppState;
  pronto: boolean;
  repo: Repositorio["nome"];
  despachar: (e: Evento) => void;
  toast: (msg: string, desfazer?: () => void) => void;
  aviso: { msg: string; desfazer?: () => void } | null;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const repoRef = useRef<Repositorio | null>(null);
  const [s, setS] = useState<AppState>(() => estadoExemplo());
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState<Ctx["aviso"]>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estadoRef = useRef(s);
  estadoRef.current = s;

  useEffect(() => {
    const repo = criarRepositorio();
    repoRef.current = repo;
    let parar: (() => void) | undefined;
    repo.carregar().then((salvo) => {
      if (salvo) setS(salvo);
      setPronto(true);
      parar = repo.assinar?.((novo) => setS(novo));
    }).catch(() => setPronto(true));
    return () => parar?.();
  }, []);

  const despachar = useCallback((e: Evento) => {
    const novo = reduzir(estadoRef.current, e);
    estadoRef.current = novo;
    setS(novo);
    repoRef.current?.persistir(e, novo).catch((err) => setAviso({ msg: "Não foi possível salvar: " + String(err?.message ?? err) }));
  }, []);

  const toast = useCallback((msg: string, desfazer?: () => void) => {
    setAviso({ msg, desfazer });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4500);
  }, []);

  const v = useMemo(() => ({ s, pronto, repo: repoRef.current?.nome ?? "local", despachar, toast, aviso }), [s, pronto, despachar, toast, aviso]);
  return (
    <AppCtx.Provider value={v}>
      {children}
      {aviso && (
        <div className="toast" role="status">
          {aviso.msg}
          {aviso.desfazer && (
            <button onClick={() => { aviso.desfazer?.(); setAviso(null); }}>Desfazer</button>
          )}
        </div>
      )}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
}
