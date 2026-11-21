# Colo — nutrição materno-infantil

App de atendimento de uma nutricionista materno-infantil. Ela atende **gestantes, lactantes e bebês/crianças**;
a paciente (ou a família) acompanha pelo app: plano de mamadas e alimentar, diário, evacuações e ficha antes da consulta.
Origem: a planilha "Avaliação antropométrica" da nutricionista. O protótipo validado com ela está em `prototipo/index.html`
(servido pelo GitHub Pages; `index.html` da raiz só redireciona para lá).

## Stack e comandos

- Next.js 16 (App Router) + React 19 + TypeScript estrito. CSS puro em `app/globals.css` (sem Tailwind).
- Vitest para o motor de cálculo. Supabase (Postgres + Auth + RLS) na próxima etapa. Deploy na Vercel. WhatsApp via Z-API.
- `npm run dev` · `npm test` · `npm run typecheck` · `npm run build`

## Estrutura

```
lib/types.ts              tipos de domínio (datas ISO "AAAA-MM-DD")
lib/domain/               regras puras, sem React, todas testadas em dominio.test.ts
  crescimento.ts          ganhos e classificação SBP/OMS (bate com a planilha)
  necessidades.ts         EER DRI 2023, macros, micros, água, volume de fórmula (criança)
  formula.ts              diluição, oferta × meta, plano enviado à família
  maternal.ts             gestante/lactante: IMC, curvas brasileiras de ganho, EER gestação/lactação
  intestinal.ts           Bristol, escala do lactente, cores de alerta, resumo, Roma IV
  anamnese.ts             esquema da anamnese por tipo de paciente
  mensagens.ts            modelos de WhatsApp, telefone, lembretes do dia
  referencias.ts          todas as tabelas de referência com fonte
lib/data/
  eventos.ts              TODA alteração é um Evento; reduzir() aplica no estado
  repositorio.ts          LocalRepo (navegador) e SupabaseRepo (esqueleto da integração)
  store.tsx               contexto React: useApp() → { s, despachar, toast }
  seed.ts                 dados de exemplo (Helena = medidas reais da planilha com nome trocado)
lib/whatsapp/             zapi.ts (servidor) e cliente.ts (navegador)
app/nutri/...             área da nutricionista; prontuário em /nutri/p/[id]?aba=...
app/paciente/[id]         área da paciente (abas Início, Diário, Intestino, Ficha)
app/api/whatsapp/*        status, enviar, webhook
app/api/cron/lembretes    lembrete da véspera (vercel.json, 11:00 UTC = 8h em Brasília)
supabase/migrations/      esquema com RLS, pronto para aplicar
```

## Regras do projeto

- Uma funcionalidade por sessão. Ao terminar, atualizar `STATUS.md`.
- Commits em português, no imperativo ("Adiciona…", "Corrige…").
- Interface toda em português do Brasil, números com vírgula (`fmt`), datas `dd/mm/aaaa`.
- Regra de cálculo nova vai para `lib/domain/` com teste. Componentes não calculam nada além de formatação.
- Toda escrita de dados passa por `despachar(evento)`. Não mutar estado direto nem chamar o banco de dentro de componente.
- Pesos: criança em kg nas consultas; diário guarda `pesoKg` (a tela da criança pede gramas e converte).
- Pesagem feita em casa nunca entra no cálculo da fórmula (só consultas e pesagens do consultório).
- Classificações clínicas aparecem só para a nutricionista. A paciente vê medidas, plano e recados.
- Alertas de cor de fezes (clara, preta, com sangue) aparecem também para a paciente, com orientação de procurar o médico.

## Integração com o banco (próxima etapa)

Usar os MCPs do Supabase e da Vercel conectados ao Claude Code (Supabase com `read_only=true` até aplicar migrations;
projeto de desenvolvimento, nunca produção com dados reais nos testes).

1. Criar o projeto no Supabase e aplicar `supabase/migrations/0001_inicial.sql`.
2. `npm i @supabase/supabase-js @supabase/ssr`; criar `lib/supabase/{cliente,servidor}.ts`.
3. Login: nutricionista por e-mail; paciente por link mágico enviado no WhatsApp (template "acesso"). Vincular em `paciente_acessos`.
4. Implementar `SupabaseRepo.carregar()` (organização + pacientes + tabelas filhas) e `persistir(evento)` conforme o mapa de
   eventos comentado em `lib/data/repositorio.ts`. `paciente/parto` usa a função `registrar_parto` (transação).
5. Trocar `NEXT_PUBLIC_DATA_SOURCE=supabase`. Assinar mudanças com Realtime em `assinar()`.
6. `/api/whatsapp/enviar`: validar a sessão Supabase e remover a dependência de `WHATSAPP_ENVIO_SEM_LOGIN`.
7. `/api/cron/lembretes` e `/api/whatsapp/webhook`: implementar `carregarDoBanco()` e gravar em `mensagens`.
8. Importador opcional da planilha da nutricionista para consultas antigas.

## WhatsApp (Z-API)

- Variáveis: `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN` (header `Client-Token`). Endpoint `POST /send-text` com `{ phone, message }`.
- Sem Z-API, a tela abre `wa.me` com a mensagem pronta (funciona hoje, sem servidor).
- Segurança: o envio pelo servidor fica bloqueado até existir login (exceto com `WHATSAPP_ENVIO_SEM_LOGIN=1`, só para teste pessoal).
- Webhook: `https://APP/api/whatsapp/webhook?secret=WHATSAPP_WEBHOOK_SECRET`. Cron exige `CRON_SECRET` (a Vercel envia o Bearer sozinha).

## Deploy na Vercel

Importar o repositório `tostess/nutri`, framework Next.js, sem variáveis obrigatórias (modo local). Definir
`NEXT_PUBLIC_APP_URL` com o domínio final para os links das mensagens. Ver `.env.example`.

## Pendências de validação com a nutricionista

- Faixa de eutrofia no 1º trimestre (−1,8 a 0,7 kg) e interpolação linear entre 13, 27 e 40 semanas.
- Amamentação mista antes de 6 meses: o app usa +380 kcal (DRI não tem valor próprio).
- Proteína 1,1 g/kg (gestação) e 1,3 g/kg (lactação); adolescentes usam equações de adulta, com aviso.
- NOVAMIL RICE parece cadastrado por 100 g de pó; OMS meninas 4-5 meses repete valores de 3-4 meses na planilha.
- Perguntas da anamnese e escala do lactente para fezes (categorias da Amsterdam Infant Stool Scale).
