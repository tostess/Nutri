# Status

## 2026-11-21 — versão funcional sem banco

Feito:
- Protótipo HTML movido para `prototipo/` (GitHub Pages continua no mesmo link).
- App Next.js com todas as telas do protótipo: crescimento, necessidades, fórmula, gestação, pós-parto, plano alimentar, diário.
- Novas áreas: anamnese por tipo de paciente (com recordatório 24 h e exames), avaliação intestinal
  (Bristol, escala do lactente, cores de alerta, resumo, Roma IV) e WhatsApp (modelos, envio por Z-API ou wa.me, histórico).
- Área da paciente com abas Início, Diário, Intestino e Ficha antes da consulta.
- Parto registrado cria o bebê ligado à mãe e arquiva a gestação.
- Camada de dados por eventos, LocalRepo no navegador, esqueleto do SupabaseRepo e migration com RLS.
- Rotas de WhatsApp (status, enviar, webhook) e cron de lembretes da véspera.
- 18 testes do motor de cálculo batendo com a planilha. Build ok.

Próximo:
- Deploy na Vercel (modo local) para a nutricionista testar a versão funcional.
- Integração com o Supabase seguindo o roteiro do CLAUDE.md.
- Configurar a Z-API e testar envio, webhook e lembretes.
