"use client";

import { useEffect, useState } from "react";
import type { Paciente, TemplateId } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { TEMPLATE_NOME, contato, linkWhatsApp, montarMensagem, normalizarTelefone } from "@/lib/domain/mensagens";
import { appUrl, enviarPelaApi, useStatusWhatsApp } from "@/lib/whatsapp/cliente";
import { uid } from "@/lib/format";
import { TextoCampo } from "../../ui";

const IDS = Object.keys(TEMPLATE_NOME) as TemplateId[];

export function AbaWhatsApp({ p }: { p: Paciente }) {
  const { s, despachar, toast } = useApp();
  const status = useStatusWhatsApp();
  const [tpl, setTpl] = useState<TemplateId>("lembrete");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const tel = normalizarTelefone(p.telefone);

  useEffect(() => setTexto(montarMensagem(tpl, p, s.config, appUrl())), [tpl, p, s.config]);

  const registrar = (via: "zapi" | "link", ok: boolean, erro?: string) =>
    despachar({ t: "mensagem/registrar", pid: p.id, mensagem: { id: uid("m"), em: new Date().toISOString(), template: tpl, texto, via, status: ok ? (via === "zapi" ? "enviada" : "aberta") : "erro", erro } });

  async function enviarAuto() {
    if (!tel) return;
    setEnviando(true);
    const r = await enviarPelaApi(tel, texto);
    setEnviando(false);
    registrar("zapi", r.ok, r.erro);
    toast(r.ok ? "Mensagem enviada pelo WhatsApp." : `Não foi enviada: ${r.erro}`);
  }

  const historico = [...p.mensagens].sort((a, b) => b.em.localeCompare(a.em));
  return (
    <div className="grid2">
      <div className="stackp">
        <div className="panel">
          <div className="ph">
            <h3>Nova mensagem para {contato(p)}</h3>
            {status && (
              <span className={`selo ${status.automatico ? "ok" : "in"}`}>
                {status.automatico ? "Envio automático (Z-API)" : "Envio pelo seu WhatsApp"}
              </span>
            )}
          </div>
          <TextoCampo rotulo="WhatsApp da paciente ou responsável" valor={p.telefone} placeholder="(22) 99999-9999"
            onSalvar={(v) => despachar({ t: "paciente/alterar", id: p.id, campos: { telefone: v } })}
            dica={p.telefone && !tel ? "Número incompleto: use DDD + número." : tel ? `Será enviado para +${tel}` : undefined} />
          <p style={{ margin: "14px 0 0", fontWeight: 700 }}>Modelo</p>
          <div className="opts">
            {IDS.map((id) => <button key={id} type="button" className="opt" aria-pressed={tpl === id} onClick={() => setTpl(id)}>{TEMPLATE_NOME[id]}</button>)}
          </div>
          <label style={{ marginTop: 12 }}>Mensagem
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} style={{ minHeight: 140 }} />
          </label>
          {tpl === "lembrete" && !p.prox && <p className="warn at">Sem próxima consulta marcada. Defina a data na aba Diário.</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {status?.automatico ? (
              <button className="btn zap" disabled={!tel || enviando} onClick={enviarAuto}>{enviando ? "Enviando…" : "Enviar agora"}</button>
            ) : tel ? (
              <a className="btn zap" href={linkWhatsApp(tel, texto)} target="_blank" rel="noreferrer" onClick={() => registrar("link", true)}>Abrir no WhatsApp</a>
            ) : (
              <button className="btn zap" disabled>Cadastre o telefone</button>
            )}
          </div>
          <p className="note">
            {status?.automatico
              ? "As mensagens saem do número conectado na Z-API. Lembretes de consulta vão automaticamente às 8h do dia anterior."
              : "Sem a Z-API configurada, o botão abre o WhatsApp com a mensagem pronta; você só toca em enviar. Com a Z-API e o banco ativos, o envio e os lembretes da véspera ficam automáticos."}
          </p>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Histórico</h3>
        {historico.length ? (
          <div className="msgs">
            {historico.map((m) => (
              <div className="msg" key={m.id}>
                <small>
                  {new Date(m.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}, {m.template === "livre" ? "Mensagem" : TEMPLATE_NOME[m.template]},{" "}
                  {m.status === "erro" ? <b style={{ color: "var(--ab)" }}>erro: {m.erro}</b> : m.via === "zapi" ? "enviada" : "aberta no WhatsApp"}
                </small>
                <p>{m.texto}</p>
              </div>
            ))}
          </div>
        ) : <p className="dim">Nenhuma mensagem ainda.</p>}
      </div>
    </div>
  );
}
