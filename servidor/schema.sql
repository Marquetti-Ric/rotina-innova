-- Combinado — servidor de licenças
--
-- Princípio: a rotina da criança nunca chega aqui. Este banco guarda
-- organizações, licenças, aparelhos vinculados e temas. Nenhuma tarefa,
-- nenhum horário, nenhum nome de criança.
--
-- Rodar uma vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- organizações
create table if not exists organizacoes (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nome        text not null,
  tipo        text not null default 'clinica'
              check (tipo in ('clinica', 'escola', 'familia')),
  contato     text,
  criada_em   timestamptz not null default now()
);

-- -------------------------------------------------------------------- temas
-- O que a clínica personaliza. O miolo do app (ilustrações, paleta das
-- tarefas, tempos de animação) não está aqui de propósito: é onde mora o
-- trabalho de acessibilidade sensorial.
create table if not exists temas (
  org_id        uuid primary key references organizacoes(id) on delete cascade,
  logo_url      text,
  destaque      text,          -- hex; o app valida contraste e descarta se reprovar
  nome_exibido  text,
  assinatura    text,
  rodape        text,
  atualizado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------- licenças
-- Só o hash do código é guardado. De posse deste banco ninguém deriva um
-- código válido: são ~59 bits de entropia por código.
create table if not exists licencas (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizacoes(id) on delete cascade,
  codigo_hash  text unique not null,
  apelido      text,
  assentos     int  not null default 1 check (assentos between 1 and 5000),
  validade     date,
  ativa        boolean not null default true,
  criada_em    timestamptz not null default now(),
  revogada_em  timestamptz
);

create index if not exists licencas_org on licencas(org_id);

-- --------------------------------------------------------------- aparelhos
-- O vínculo que impede o código de circular entre famílias. device_id é um
-- número aleatório gerado pelo próprio aparelho na primeira abertura — não
-- vem de IMEI, de conta nem de pessoa.
create table if not exists aparelhos (
  id            uuid primary key default gen_random_uuid(),
  licenca_id    uuid not null references licencas(id) on delete cascade,
  device_id     text not null,
  apelido       text,
  primeiro_uso  timestamptz not null default now(),
  ultimo_uso    timestamptz not null default now(),
  unique (licenca_id, device_id)
);

create index if not exists aparelhos_licenca on aparelhos(licenca_id);

-- --------------------------------------------------------------------- RLS
-- Tudo fechado. Só as Edge Functions, que usam a service role key, entram.
-- Sem isto, a chave anônima do Supabase leria a tabela inteira.
alter table organizacoes enable row level security;
alter table temas        enable row level security;
alter table licencas     enable row level security;
alter table aparelhos    enable row level security;

-- ------------------------------------------------------------------- vistas
-- Quantos assentos cada licença já consumiu.
create or replace view licencas_uso as
select l.id,
       l.org_id,
       o.nome as organizacao,
       l.apelido,
       l.assentos,
       l.validade,
       l.ativa,
       count(a.id)::int as aparelhos_ativos,
       l.assentos - count(a.id)::int as assentos_livres
from licencas l
join organizacoes o on o.id = l.org_id
left join aparelhos a on a.licenca_id = l.id
group by l.id, o.nome;
