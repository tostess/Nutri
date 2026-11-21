# Colo · nutrição materno-infantil

App de atendimento nutricional de gestantes, lactantes e crianças, com acompanhamento pela paciente.

- **Nutricionista**: pacientes, consultas, crescimento (SBP/OMS), ganho de peso gestacional (curvas brasileiras),
  necessidades (DRI/NASEM 2023), fórmula e diluição, plano alimentar, anamnese, avaliação intestinal (Bristol, Roma IV),
  diário e mensagens de WhatsApp.
- **Paciente**: plano de mamadas e alimentar, diário, registro de evacuações e ficha antes da consulta.

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # motor de cálculo
```

Sem banco, os dados ficam no navegador (dados de exemplo fictícios). Roteiro de integração com Supabase,
WhatsApp (Z-API) e deploy na Vercel em `CLAUDE.md`.

O protótipo original segue em `prototipo/index.html` (GitHub Pages).
