"use client";

import Link from "next/link";
import { Topo } from "@/components/Topo";
import { useApp } from "@/lib/data/store";
import { classeAvatar, subtitulo } from "@/lib/domain/paciente";
import { useHoje } from "@/components/ui";

export default function EscolherPaciente() {
  const { s, pronto } = useApp();
  const hoje = useHoje();
  return (
    <>
      <Topo papel="paciente" />
      <main className="entrada" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 34 }}>Área da paciente</h1>
        <p className="sample">Na versão com banco, cada paciente entra direto na própria área pelo link enviado no WhatsApp. Nesta demonstração, escolha quem você quer ver.</p>
        {pronto && (
          <ul className="lista panel" style={{ padding: "4px 18px" }}>
            {s.pacientes.map((p) => (
              <li key={p.id}>
                <Link href={`/paciente/${p.id}`}>
                  <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className={`av ${classeAvatar(p)}`}>{p.nome[0]}</span>
                    <span><b>{p.nome}</b><small>{p.tipo === "crianca" ? `${p.resp}, ` : ""}{subtitulo(p, hoje)}</small></span>
                  </span>
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
