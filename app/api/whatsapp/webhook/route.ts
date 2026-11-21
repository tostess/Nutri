import { NextResponse, type NextRequest } from "next/server";

// Webhook "ao receber" da Z-API. Configure no painel da Z-API:
//   https://SEU_APP/api/whatsapp/webhook?secret=WHATSAPP_WEBHOOK_SECRET
// Na integração com o banco: localizar a paciente pelo telefone e gravar em mensagens (direcao = 'entrada').
export async function POST(req: NextRequest) {
  const segredo = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!segredo || req.nextUrl.searchParams.get("secret") !== segredo) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const corpo = await req.json().catch(() => null);
  if (!corpo || corpo.fromMe || corpo.isGroup) return NextResponse.json({ ignorado: true });
  const recebida = { telefone: String(corpo.phone ?? ""), texto: String(corpo.text?.message ?? ""), em: new Date().toISOString() };
  // TODO(banco): gravar `recebida` na tabela mensagens.
  return NextResponse.json({ recebido: true, armazenado: false, telefone: recebida.telefone });
}
