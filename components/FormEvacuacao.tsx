"use client";

import { useState } from "react";
import type { Autor, CorFezes, EscalaFezes, Evacuacao, Paciente } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { CORES, escalaDe, escalaPadrao } from "@/lib/domain/intestinal";
import { uid } from "@/lib/format";
import { IconeFezes } from "./graficos";
import { Opcoes, useHoje } from "./ui";

const agora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function FormEvacuacao({ p, autor, aoSalvar }: { p: Paciente; autor: Autor; aoSalvar?: () => void }) {
  const { despachar, toast } = useApp();
  const hoje = useHoje();
  const [escala, setEscala] = useState<EscalaFezes>(() => escalaPadrao(p, hoje));
  const [tipo, setTipo] = useState<number | null>(null);
  const [cor, setCor] = useState<CorFezes | null>(null);
  const [qtd, setQtd] = useState<Evacuacao["quantidade"]>(null);
  const [flags, setFlags] = useState({ dor: false, esforco: false, sangue: false, muco: false });
  const [erro, setErro] = useState("");
  const alertaCor = CORES.find((c) => c.cor === cor)?.alerta;

  function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tipo == null) return setErro("Escolha o tipo das fezes.");
    const F = new FormData(e.currentTarget);
    despachar({
      t: "evacuacao/adicionar", pid: p.id,
      evacuacao: {
        id: uid("ev"), data: String(F.get("data") || hoje), hora: String(F.get("hora") || ""), escala, tipo, cor, quantidade: qtd, ...flags,
        sangue: flags.sangue || cor === "vermelha", obs: String(F.get("obs") || ""), autor, lido: autor === "nutri",
      },
    });
    setTipo(null); setCor(null); setQtd(null); setFlags({ dor: false, esforco: false, sangue: false, muco: false }); setErro("");
    e.currentTarget.reset();
    toast(autor === "paciente" ? "Registro enviado para a nutricionista." : "Evacuação registrada.");
    aoSalvar?.();
  }

  return (
    <form onSubmit={salvar}>
      <div className="form">
        <label>Data<input type="date" name="data" defaultValue={hoje} /></label>
        <label>Hora<input type="time" name="hora" defaultValue={agora()} /></label>
      </div>
      <div className="ph" style={{ margin: "14px 0 6px" }}>
        <b>Como estavam as fezes?</b>
        {p.tipo === "crianca" && (
          <div className="seg">
            <button type="button" aria-pressed={escala === "lactente"} onClick={() => { setEscala("lactente"); setTipo(null); }}>Bebê de fralda</button>
            <button type="button" aria-pressed={escala === "bristol"} onClick={() => { setEscala("bristol"); setTipo(null); }}>Bristol</button>
          </div>
        )}
      </div>
      <div className="bristol" role="group" aria-label="Tipo das fezes">
        {escalaDe(escala).map((x) => (
          <button type="button" key={x.tipo} aria-pressed={tipo === x.tipo} onClick={() => { setTipo(x.tipo); setErro(""); }}>
            <IconeFezes escala={escala} tipo={x.tipo} />
            <span><b>{escala === "bristol" ? `Tipo ${x.tipo}` : x.nome}</b>{escala === "bristol" && <small>{x.nome}</small>}</span>
          </button>
        ))}
      </div>
      {erro && <p className="warn ab">{erro}</p>}
      <p style={{ margin: "14px 0 6px", fontWeight: 700 }}>Cor</p>
      <div className="cores" role="group" aria-label="Cor das fezes">
        {CORES.map((c) => (
          <button type="button" key={c.cor} aria-pressed={cor === c.cor} onClick={() => setCor(cor === c.cor ? null : c.cor)}>
            <i style={{ background: c.hex }} />{c.nome}
          </button>
        ))}
      </div>
      {alertaCor && <p className="warn ab">{alertaCor}</p>}
      <p style={{ margin: "14px 0 0", fontWeight: 700 }}>Quantidade</p>
      <Opcoes valor={qtd} opcoes={["pouca", "media", "muita"] as const} rotulos={{ pouca: "Pouca", media: "Média", muita: "Muita" }} onEscolher={setQtd} />
      <p style={{ margin: "14px 0 0", fontWeight: 700 }}>Teve também</p>
      <div className="opts">
        {([["dor", p.tipo === "crianca" ? "Dor ou choro" : "Dor"], ["esforco", "Esforço"], ["sangue", "Sangue"], ["muco", "Muco"]] as const).map(([k, t]) => (
          <button type="button" key={k} className="opt" aria-pressed={flags[k]} onClick={() => setFlags({ ...flags, [k]: !flags[k] })}>{t}</button>
        ))}
      </div>
      <label style={{ marginTop: 12 }}>Observação<input name="obs" placeholder="opcional" /></label>
      <button className="btn" style={{ width: "100%", marginTop: 12 }}>{autor === "paciente" ? "Enviar registro" : "Registrar evacuação"}</button>
    </form>
  );
}
