import { NextResponse, type NextRequest } from "next/server";
import { lembretesDoDia } from "@/lib/domain/mensagens";
import { somaDias } from "@/lib/domain/datas";
import { enviarTexto, zapiConfigurada } from "@/lib/whatsapp/zapi";
import type { AppState } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Data de hoje no fuso de São Paulo. */
function hojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Carrega pacientes e configuração do banco. Retorna null enquanto o banco não estiver integrado. */
async function carregarDoBanco(): Promise<Pick<AppState, "pacientes" | "config"> | null> {
  // TODO(banco): buscar com a service role (SUPABASE_SERVICE_ROLE_KEY) os pacientes com prox = amanhã.
  return null;
}

// Agendado em vercel.json para 11:00 UTC (8h em Brasília): lembra as consultas de amanhã.
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!zapiConfigurada()) return NextResponse.json({ pulado: "Z-API não configurada" });
  const dados = await carregarDoBanco();
  if (!dados) return NextResponse.json({ pulado: "banco ainda não integrado" });
  const amanha = somaDias(hojeSP(), 1);
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const lista = lembretesDoDia(dados.pacientes, dados.config, amanha, url);
  const resultados = [];
  for (const l of lista) resultados.push({ paciente: l.pacienteId, ...(await enviarTexto(l.telefone, l.texto)) });
  // TODO(banco): gravar cada envio em mensagens.
  return NextResponse.json({ data: amanha, enviados: resultados.filter((r) => r.ok).length, resultados });
}
