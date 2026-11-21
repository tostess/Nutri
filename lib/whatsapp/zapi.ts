// Integração com a Z-API (somente no servidor: os tokens nunca vão para o navegador).
// Docs: https://developer.z-api.io/en/message/send-text

export function zapiConfigurada(): boolean {
  return !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN && process.env.ZAPI_CLIENT_TOKEN);
}

/**
 * Envio pela API exige usuária autenticada. Até o login com Supabase existir, o envio
 * pelo servidor só é liberado com WHATSAPP_ENVIO_SEM_LOGIN=1 (uso pessoal/teste),
 * para que ninguém dispare mensagens pelo número da nutricionista.
 */
export function envioLiberado(): { ok: boolean; motivo?: string } {
  if (!zapiConfigurada()) return { ok: false, motivo: "Z-API não configurada" };
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") return { ok: false, motivo: "Verificação de login pendente na integração com o banco" };
  if (process.env.WHATSAPP_ENVIO_SEM_LOGIN === "1") return { ok: true };
  return { ok: false, motivo: "Envio pelo servidor bloqueado até haver login" };
}

export async function enviarTexto(telefone: string, mensagem: string): Promise<{ ok: true; messageId?: string } | { ok: false; erro: string }> {
  const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": process.env.ZAPI_CLIENT_TOKEN as string },
      body: JSON.stringify({ phone: telefone, message: mensagem }),
      cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, erro: j?.error ?? j?.message ?? `Z-API respondeu ${r.status}` };
    return { ok: true, messageId: j?.messageId };
  } catch (e) {
    return { ok: false, erro: String(e) };
  }
}
