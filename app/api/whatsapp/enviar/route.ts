import { NextResponse, type NextRequest } from "next/server";
import { normalizarTelefone } from "@/lib/domain/mensagens";
import { enviarTexto, envioLiberado } from "@/lib/whatsapp/zapi";

export async function POST(req: NextRequest) {
  const l = envioLiberado();
  if (!l.ok) return NextResponse.json({ erro: l.motivo }, { status: 503 });
  const corpo = await req.json().catch(() => null);
  const tel = normalizarTelefone(String(corpo?.telefone ?? ""));
  const texto = String(corpo?.texto ?? "").trim();
  if (!tel) return NextResponse.json({ erro: "Telefone inválido" }, { status: 400 });
  if (!texto || texto.length > 4000) return NextResponse.json({ erro: "Mensagem vazia ou longa demais" }, { status: 400 });
  const r = await enviarTexto(tel, texto);
  return r.ok ? NextResponse.json(r) : NextResponse.json({ erro: r.erro }, { status: 502 });
}
