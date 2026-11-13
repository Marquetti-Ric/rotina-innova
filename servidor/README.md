# Servidor de licenças

O que controla quem pode usar o Combinado. Roda no Supabase; o plano gratuito
cobre folgadamente a fase inicial.

**O que este servidor guarda:** organizações, licenças (só o hash do código),
aparelhos vinculados e temas. **O que ele nunca vê:** a rotina da criança, os
horários, as tarefas, o nome dela. Isso fica no aparelho, e é o que mantém a
resposta "nenhum dado da criança é coletado" nas duas lojas.

---

## Implantar (uma vez, ~20 minutos)

### 1. Criar o projeto

Em supabase.com, novo projeto. Região **South America (São Paulo)** — latência
menor e os dados ficam no Brasil, o que simplifica a conversa de LGPD.

### 2. Criar as tabelas

SQL Editor → cole `schema.sql` → Run.

### 3. Gerar o par de chaves

```bash
node servidor/gerar-chaves.mjs
```

Ele imprime duas coisas:

- **a chave privada** → Project Settings → Edge Functions → Secrets →
  novo secret `CHAVE_PRIVADA`. Guarde uma cópia no cofre do Instituto: sem
  ela, nenhum token novo é emitido e todos os aparelhos caem na carência.
- **a chave pública** → cole em `src/servidor.js`, em `CHAVE_PUBLICA`. Essa
  pode ser versionada; com ela só se verifica, não se assina.

### 4. Publicar as funções

```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU_REF
supabase functions deploy ativar   --no-verify-jwt
supabase functions deploy conferir --no-verify-jwt
```

`--no-verify-jwt` porque quem chama é o app, antes de qualquer login — a
autorização é o próprio código de licença.

### 5. Apontar o app

Em `src/servidor.js`, preencha `SUPABASE` (a URL das functions) e
`SUPABASE_ANON` (Project Settings → API → anon key). Com esses três campos
preenchidos, o app passa do modo lista para o modo servidor sozinho.

---

## Como funciona

```
primeira abertura   o app sorteia um id de aparelho e guarda
ativação            código + id  →  servidor confere, vincula, devolve token
abertura seguinte   o app verifica a assinatura do token sozinho, sem internet
perto de vencer     pede um token novo, se houver rede
revogada/vencida    7 dias de carência, aviso só para o adulto
fim da carência     pede um código novo; os dados seguem no aparelho
```

**O token é assinado em ECDSA P-256.** O app carrega só a chave pública, então
verifica sozinho e funciona no modo avião. Testado contra assinatura
adulterada, validade esticada à mão e token assinado por outra chave — os três
são rejeitados.

**Assentos** limitam quantos aparelhos uma licença ativa. Família compra 1 ou
2; clínica compra 25, 50 ou 100. Um aparelho já vinculado reativa sem consumir
outro assento.

---

## Operação

Criar organização e licença, pelo SQL Editor:

```sql
-- 1. a clínica
insert into organizacoes (slug, nome, tipo, contato)
values ('clinica-exemplo', 'Clínica Exemplo', 'clinica', 'contato@exemplo.com.br')
returning id;

-- 2. a identidade visual dela
insert into temas (org_id, logo_url, destaque, nome_exibido, assinatura)
values ('<id acima>', 'https://.../logo.png', '#2F6B62',
        'Clínica Exemplo', 'Rotinas do dia a dia');

-- 3. a licença — o hash vem de scripts/licenca.mjs, que gera o código
insert into licencas (org_id, codigo_hash, apelido, assentos, validade)
values ('<id acima>', '<hash>', 'Pacote 2027', 25, '2027-12-31');
```

Ver o consumo de assentos:

```sql
select * from licencas_uso order by organizacao;
```

Revogar:

```sql
update licencas set ativa = false, revogada_em = now() where id = '<id>';
```

O painel web da clínica, que troca esses comandos por uma tela, é o próximo
passo — enquanto houver poucas clínicas, o SQL Editor resolve.

---

## Custo

O plano gratuito do Supabase dá 500 MB de banco e 500 mil invocações de função
por mês. Uma licença ocupa menos de 1 KB, e cada aparelho chama o servidor
umas duas vezes por mês. Isso comporta alguns milhares de famílias antes de
qualquer upgrade.
