import type { AppState } from "../types";
import type { Evento } from "./eventos";

/**
 * Ponto único de integração com o banco. A tela só fala com o repositório por eventos.
 * - LocalRepo: guarda tudo no navegador (modo atual, sem banco).
 * - SupabaseRepo: grava cada evento nas tabelas de supabase/migrations (a implementar).
 */
export interface Repositorio {
  nome: "local" | "supabase";
  carregar(): Promise<AppState | null>;
  /** Grava o efeito do evento. Recebe também o estado já atualizado. */
  persistir(evento: Evento, estado: AppState): Promise<void>;
  /** Avisa quando outra aba ou outro aparelho mudou os dados. */
  assinar?(cb: (estado: AppState) => void): () => void;
}

const CHAVE = "colo-app-v3";

export class LocalRepo implements Repositorio {
  nome = "local" as const;

  async carregar() {
    try {
      const j = JSON.parse(localStorage.getItem(CHAVE) || "null");
      return j && j.versao === 3 ? (j as AppState) : null;
    } catch {
      return null;
    }
  }

  async persistir(_e: Evento, estado: AppState) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      /* armazenamento cheio ou bloqueado: segue só em memória */
    }
  }

  assinar(cb: (estado: AppState) => void) {
    const f = (ev: StorageEvent) => {
      if (ev.key !== CHAVE || !ev.newValue) return;
      try {
        cb(JSON.parse(ev.newValue));
      } catch {
        /* ignora */
      }
    };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }
}

/**
 * Esqueleto da integração. Cada evento vira uma escrita nas tabelas
 * (ver supabase/migrations/0001_inicial.sql e CLAUDE.md, seção "Integração com o banco").
 */
export class SupabaseRepo implements Repositorio {
  nome = "supabase" as const;

  async carregar(): Promise<AppState | null> {
    throw new Error("SupabaseRepo.carregar ainda não implementado. Use NEXT_PUBLIC_DATA_SOURCE=local.");
  }

  async persistir(e: Evento): Promise<void> {
    // Mapa de eventos para tabelas (implementar com @supabase/supabase-js):
    // paciente/criar, paciente/alterar  -> upsert em pacientes (campos jsonb: plano, enviado, refeicoes, anamnese, intestinal)
    // paciente/parto                    -> rpc registrar_parto (transação: cria bebê, muda mãe para lactante)
    // consulta/salvar, consulta/excluir -> consultas (upsert por paciente_id + data / delete)
    // diario/adicionar                  -> registros_diario
    // evacuacao/adicionar|excluir       -> evacuacoes
    // registros/marcarLidos             -> update lido=true em registros_diario e evacuacoes
    // anamnese/salvar                   -> update pacientes.anamnese
    // plano/enviar                      -> update pacientes.enviado
    // mensagem/registrar                -> mensagens
    // mamada/alternar                   -> mamadas (paciente_id, data, indice)
    // config/alterar, formula/salvar    -> organizacoes.config, formulas
    throw new Error(`SupabaseRepo.persistir(${e.t}) ainda não implementado.`);
  }
}

export function criarRepositorio(): Repositorio {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? new SupabaseRepo() : new LocalRepo();
}
