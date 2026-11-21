-- Colo: esquema inicial (multi-tenant por organização, RLS em todas as tabelas)
-- Organização = consultório da nutricionista. Pacientes/familiares entram por paciente_acessos.

create extension if not exists "pgcrypto";

create table organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  config jsonb not null default '{}'::jsonb, -- nutricionista, critérios SBP, templates de mensagem
  criado_em timestamptz not null default now()
);

create table membros (
  org_id uuid not null references organizacoes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'nutricionista' check (papel in ('nutricionista', 'assistente')),
  primary key (org_id, user_id)
);

create table formulas (
  id text not null,
  org_id uuid not null references organizacoes(id) on delete cascade,
  nome text not null,
  kcal numeric, prot numeric, cho numeric, lip numeric, osm numeric,
  po boolean not null default true,
  origem text not null default '',
  primary key (org_id, id)
);

create table pacientes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizacoes(id) on delete cascade,
  tipo text not null check (tipo in ('crianca', 'gestante', 'lactante')),
  nome text not null,
  nasc date not null,
  telefone text not null default '',
  naf text not null default 'Sedentário',
  prox date,
  prox_hora text not null default '',
  recado text not null default '',
  -- criança
  sexo text check (sexo in ('F', 'M')),
  diag text,
  resp text,
  mae_id uuid references pacientes(id) on delete set null,
  plano jsonb,          -- PlanoFormula
  enviado jsonb,        -- PlanoEnviado (o que a família vê)
  -- gestante / lactante
  altura numeric,
  peso_pre numeric,
  dum date,
  parto date,
  amam text check (amam in ('exclusiva', 'parcial', 'nao')),
  bebe_id uuid references pacientes(id) on delete set null,
  gestacao jsonb,       -- consultas da gestação arquivadas no parto
  -- comuns
  refeicoes jsonb not null default '[]'::jsonb,
  ref_obs text not null default '',
  anamnese jsonb not null default '{"respostas":{},"r24":[],"exames":[],"atualizadaEm":null,"atualizadaPor":null}'::jsonb,
  intestinal jsonb not null default '{"roma":{},"data":null,"obs":""}'::jsonb,
  criado_em timestamptz not null default now()
);
create index on pacientes (org_id);

-- Quem é paciente ou familiar e pode abrir a área da paciente
create table paciente_acessos (
  paciente_id uuid not null references pacientes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (paciente_id, user_id)
);

create table consultas (
  paciente_id uuid not null references pacientes(id) on delete cascade,
  data date not null,
  peso numeric,
  alt numeric,
  pc numeric,
  obs text not null default '',
  primary key (paciente_id, data)
);

create table registros_diario (
  id text primary key,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  data date not null,
  peso_kg numeric, comp numeric, pc numeric, pt numeric,
  sint text[] not null default '{}',
  relato text not null default '',
  autor text not null check (autor in ('paciente', 'nutri')),
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index on registros_diario (paciente_id, data);

create table evacuacoes (
  id text primary key,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  data date not null,
  hora text not null default '',
  escala text not null check (escala in ('bristol', 'lactente')),
  tipo smallint not null,
  cor text,
  quantidade text,
  dor boolean not null default false,
  esforco boolean not null default false,
  sangue boolean not null default false,
  muco boolean not null default false,
  obs text not null default '',
  autor text not null check (autor in ('paciente', 'nutri')),
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index on evacuacoes (paciente_id, data);

create table mensagens (
  id text primary key,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  em timestamptz not null default now(),
  template text not null,
  texto text not null,
  via text not null check (via in ('zapi', 'link')),
  status text not null,
  erro text,
  direcao text not null default 'saida' check (direcao in ('saida', 'entrada'))
);
create index on mensagens (paciente_id, em);

create table mamadas (
  paciente_id uuid not null references pacientes(id) on delete cascade,
  data date not null,
  feitas boolean[] not null default '{}',
  primary key (paciente_id, data)
);

-- ---------- Funções de acesso ----------
create or replace function e_membro(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros where org_id = org and user_id = auth.uid());
$$;

create or replace function pode_ver_paciente(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pacientes p where p.id = pid and e_membro(p.org_id))
      or exists (select 1 from paciente_acessos a where a.paciente_id = pid and a.user_id = auth.uid());
$$;

create or replace function e_equipe_do_paciente(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pacientes p where p.id = pid and e_membro(p.org_id));
$$;

-- ---------- RLS ----------
alter table organizacoes enable row level security;
alter table membros enable row level security;
alter table formulas enable row level security;
alter table pacientes enable row level security;
alter table paciente_acessos enable row level security;
alter table consultas enable row level security;
alter table registros_diario enable row level security;
alter table evacuacoes enable row level security;
alter table mensagens enable row level security;
alter table mamadas enable row level security;

create policy org_equipe on organizacoes for all using (e_membro(id)) with check (e_membro(id));
create policy membros_proprios on membros for select using (user_id = auth.uid() or e_membro(org_id));
create policy formulas_equipe on formulas for all using (e_membro(org_id)) with check (e_membro(org_id));

create policy pacientes_equipe on pacientes for all using (e_membro(org_id)) with check (e_membro(org_id));
create policy pacientes_propria on pacientes for select using (pode_ver_paciente(id));
-- A paciente pode preencher a própria anamnese pela área dela (coluna anamnese).
create policy pacientes_anamnese on pacientes for update using (pode_ver_paciente(id)) with check (pode_ver_paciente(id));

create policy acessos_equipe on paciente_acessos for all using (e_equipe_do_paciente(paciente_id)) with check (e_equipe_do_paciente(paciente_id));
create policy acessos_proprios on paciente_acessos for select using (user_id = auth.uid());

create policy consultas_equipe on consultas for all using (e_equipe_do_paciente(paciente_id)) with check (e_equipe_do_paciente(paciente_id));
create policy consultas_leitura on consultas for select using (pode_ver_paciente(paciente_id));

create policy diario_ver on registros_diario for select using (pode_ver_paciente(paciente_id));
create policy diario_inserir on registros_diario for insert with check (pode_ver_paciente(paciente_id));
create policy diario_equipe on registros_diario for update using (e_equipe_do_paciente(paciente_id));

create policy evac_ver on evacuacoes for select using (pode_ver_paciente(paciente_id));
create policy evac_inserir on evacuacoes for insert with check (pode_ver_paciente(paciente_id));
create policy evac_apagar on evacuacoes for delete using (pode_ver_paciente(paciente_id));
create policy evac_equipe on evacuacoes for update using (e_equipe_do_paciente(paciente_id));

create policy mensagens_equipe on mensagens for all using (e_equipe_do_paciente(paciente_id)) with check (e_equipe_do_paciente(paciente_id));

create policy mamadas_ver on mamadas for all using (pode_ver_paciente(paciente_id)) with check (pode_ver_paciente(paciente_id));

-- ---------- Parto: cria o bebê e passa a mãe para lactante numa transação ----------
create or replace function registrar_parto(mae uuid, data_parto date, amamentacao text, bebe_nome text, bebe_sexo text,
                                           peso numeric, alt numeric, pc numeric) returns uuid
language plpgsql security invoker as $$
declare
  m pacientes%rowtype;
  novo uuid;
begin
  select * into m from pacientes where id = mae and tipo = 'gestante' for update;
  if not found then raise exception 'Gestante não encontrada'; end if;
  insert into pacientes (org_id, tipo, nome, nasc, telefone, sexo, resp, mae_id, plano)
  values (m.org_id, 'crianca', bebe_nome, data_parto, m.telefone, bebe_sexo, split_part(m.nome, ' ', 1) || ' (mãe)', m.id, '{}'::jsonb)
  returning id into novo;
  insert into consultas (paciente_id, data, peso, alt, pc, obs) values (novo, data_parto, peso, alt, pc, 'Nascimento');
  update pacientes set tipo = 'lactante', parto = data_parto, amam = amamentacao, bebe_id = novo,
    gestacao = jsonb_build_object('dum', m.dum,
      'consultas', (select coalesce(jsonb_agg(jsonb_build_object('data', data, 'peso', peso, 'obs', obs) order by data), '[]'::jsonb)
                    from consultas where paciente_id = m.id))
  where id = mae;
  delete from consultas where paciente_id = mae;
  return novo;
end;
$$;
