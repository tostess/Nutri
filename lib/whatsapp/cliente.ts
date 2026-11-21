"use client";

import { useEffect, useState } from "react";

export interface StatusWhatsApp {
  automatico: boolean; // Z-API configurada e envio liberado no servidor
  motivo?: string;
}

let cache: Promise<StatusWhatsApp> | null = null;

function buscarStatus(): Promise<StatusWhatsApp> {
  cache ??= fetch("/api/whatsapp/status")
    .then((r) => (r.ok ? r.json() : { automatico: false, motivo: "Servidor indisponível" }))
    .catch(() => ({ automatico: false, motivo: "Sem servidor (página estática)" }));
  return cache;
}

export function useStatusWhatsApp() {
  const [s, setS] = useState<StatusWhatsApp | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarStatus().then((x) => vivo && setS(x));
    return () => { vivo = false; };
  }, []);
  return s;
}

export async function enviarPelaApi(telefone: string, texto: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const r = await fetch("/api/whatsapp/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone, texto }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true } : { ok: false, erro: j.erro ?? `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, erro: String(e) };
  }
}

export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_APP_URL
    : typeof window !== "undefined" ? window.location.origin : "";
