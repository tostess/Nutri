"use client";

import type { Formula, TemplateId } from "@/lib/types";
import { useApp } from "@/lib/data/store";
import { estadoExemplo } from "@/lib/data/seed";
import { REF_GANHO } from "@/lib/domain/referencias";
import { TEMPLATES_PADRAO, TEMPLATE_NOME } from "@/lib/domain/mensagens";
import { useStatusWhatsApp } from "@/lib/whatsapp/cliente";
import { fmt, num, uid } from "@/lib/format";
import { NumCampo, TextoCampo } from "@/components/ui";

export default function Ajustes() {
  const { s, despachar, toast, repo } = useApp();
  const status = useStatusWhatsApp();
  const cfg = s.config;
  const setCfg = (campos: Partial<typeof cfg>) => despachar({ t: "config/alterar", campos });
  const setF = (f: Formula, campo: keyof Formula, v: string) =>
    despachar({ t: "formula/salvar", formula: { ...f, [campo]: campo === "nome" ? v : num(v), origem: campo !== "nome" && f.origem === "preencher" ? "editado" : f.origem } });

  return (
    <>
      <h1 style={{ marginBottom: 18 }}>Ajustes</h1>
      <div className="grid2">
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Nutricionista</h3>
          <div className="form">
            <TextoCampo className="full" rotulo="Nome como aparece nas mensagens" valor={cfg.nutricionista.nome} onSalvar={(v) => setCfg({ nutricionista: { ...cfg.nutricionista, nome: v } })} />
            <TextoCampo rotulo="CRN" valor={cfg.nutricionista.crn} onSalvar={(v) => setCfg({ nutricionista: { ...cfg.nutricionista, crn: v } })} />
            <TextoCampo tipo="tel" rotulo="WhatsApp do consultório" valor={cfg.nutricionista.telefone} onSalvar={(v) => setCfg({ nutricionista: { ...cfg.nutricionista, telefone: v } })} />
          </div>
        </div>
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Critérios de classificação do ganho (SBP)</h3>
          <div className="form">
            <NumCampo rotulo="Abaixo: ganho < % do mínimo" unidade="%" valor={Math.round(cfg.crit.ab * 100)} onSalvar={(v) => v != null && setCfg({ crit: { ...cfg.crit, ab: v / 100 } })} />
            <NumCampo rotulo="Atenção: ganho < % do mínimo" unidade="%" valor={Math.round(cfg.crit.at * 100)} onSalvar={(v) => v != null && setCfg({ crit: { ...cfg.crit, at: v / 100 } })} />
            <NumCampo rotulo="Acima: ganho > % do máximo" unidade="%" valor={Math.round(cfg.crit.ac * 100)} onSalvar={(v) => v != null && setCfg({ crit: { ...cfg.crit, ac: v / 100 } })} />
            <NumCampo rotulo="Dias por mês" valor={cfg.crit.dias} onSalvar={(v) => v && setCfg({ crit: { ...cfg.crit, dias: v } })} />
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph">
          <h3>Mensagens de WhatsApp</h3>
          {status && <span className={`selo ${status.automatico ? "ok" : "in"}`}>{status.automatico ? "Envio automático ativo (Z-API)" : "Envio pelo seu WhatsApp"}</span>}
        </div>
        <p className="note" style={{ marginTop: 0 }}>Variáveis: {"{contato}"}, {"{paciente}"}, {"{nutricionista}"}, {"{consulta}"}, {"{data}"}, {"{hora}"}, {"{plano}"}, {"{resumo}"}, {"{recado}"}, {"{link}"}.</p>
        <div className="grade-campos">
          {(Object.keys(TEMPLATE_NOME) as TemplateId[]).map((id) => (
            <div key={id} className="campo">
              <TextoCampo longo rotulo={TEMPLATE_NOME[id]} valor={cfg.templates[id]} onSalvar={(v) => setCfg({ templates: { ...cfg.templates, [id]: v || TEMPLATES_PADRAO[id] } })} />
            </div>
          ))}
        </div>
        {!status?.automatico && (
          <p className="note">Para o envio automático e os lembretes da véspera, configure as variáveis ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN na Vercel (ver CLAUDE.md). {status?.motivo ? `Situação: ${status.motivo}.` : ""}</p>
        )}
      </div>
      <div className="panel">
        <h3>Fórmulas infantis (por 100 mL na diluição padrão)</h3>
        <div className="scroll">
          <table className="wide">
            <thead><tr><th>Fórmula</th><th className="n">kcal</th><th className="n">Proteína g</th><th className="n">Carboidrato g</th><th className="n">Lipídio g</th><th className="n">mOsm/L</th><th>Origem do dado</th></tr></thead>
            <tbody>
              {cfg.formulas.map((f) => (
                <tr key={f.id}>
                  <td><input defaultValue={f.nome} style={{ minWidth: 230 }} onBlur={(e) => e.target.value !== f.nome && setF(f, "nome", e.target.value)} /></td>
                  {(["kcal", "prot", "cho", "lip", "osm"] as const).map((k) => (
                    <td key={k}><input inputMode="decimal" defaultValue={f[k] == null ? "" : String(f[k]).replace(".", ",")} style={{ width: 90 }} onBlur={(e) => num(e.target.value) !== f[k] && setF(f, k, e.target.value)} /></td>
                  ))}
                  <td className={f.origem === "preencher" ? "dim" : ""}>{f.origem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => despachar({ t: "formula/salvar", formula: { id: uid("f"), nome: "Nova fórmula", kcal: null, prot: null, cho: null, lip: null, osm: null, po: true, origem: "preencher" } })}>+ Adicionar fórmula</button>
      </div>
      <div className="panel">
        <details>
          <summary>Tabela de ganho esperado usada nos cálculos</summary>
          <div className="scroll">
            <table className="wide">
              <thead><tr><th>Faixa</th><th className="n">Peso g/dia mín</th><th className="n">máx</th><th className="n">Estatura cm/mês</th><th className="n">PC cm/mês</th></tr></thead>
              <tbody>{REF_GANHO.map((r) => <tr key={r.faixa}><td>{r.faixa}</td><td className="n">{r.pMin ?? "s/ ref."}</td><td className="n">{r.pMax ?? "s/ ref."}</td><td className="n">{fmt(r.est, 2)}</td><td className="n">{fmt(r.pc, 2)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="note">Também embutidas: OMS 2006 incremento de peso 0 a 5 meses; DRI/NASEM 2023 (crianças, mulheres, gestação e lactação); AMDR; RDA de proteína; micronutrientes; Tabela 5 SBP; curvas brasileiras de ganho de peso gestacional.</p>
        </details>
      </div>
      <div className="panel">
        <h3>Dados</h3>
        <p className="note" style={{ marginTop: 0 }}>Fonte atual: {repo === "local" ? "este navegador (sem banco)" : "Supabase"}.</p>
        <button className="btn sm ghost" onClick={() => { despachar({ t: "estado/restaurar", estado: estadoExemplo() }); toast("Dados de exemplo restaurados."); }}>Restaurar dados de exemplo</button>
      </div>
    </>
  );
}
