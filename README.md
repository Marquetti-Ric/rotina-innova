# Combinado

Organizador visual de rotinas diárias para crianças. Plataforma de marca branca:
cada clínica sobe o próprio logotipo e a própria cor.
React + Capacitor, distribuído como APK pela página do Instituto.

> Este aplicativo organiza e estimula a rotina. Não substitui o acompanhamento
> de profissionais de saúde e educação.

---

## Ligar tudo pela primeira vez

Faça uma vez só, no Mac. Depois disso, a operação inteira é pelo celular.

### 1. Subir para o GitHub
Crie em github.com/Marquetti-Ric um repositório **público** chamado
`combinado`, sem README. No GitHub Desktop: *Add Local Repository* → aponte
para esta pasta → *Publish repository* (desmarque "Keep this code private").

Público é necessário para o GitHub Pages gratuito. Não enfraquece nada: a chave
de assinatura fica em *secrets* e a lista de licenças guarda só hashes.

### 2. Gerar a chave de assinatura

```bash
./criar-keystore.sh
```

O script gera a chave e imprime os quatro valores para os secrets. Guarde o
arquivo `combinado.keystore` e a senha no cofre do Instituto, com cópia.

### 3. Cadastrar os secrets
Settings → Secrets and variables → Actions → New repository secret:

`ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

### 4. Permissões e site
- Settings → Actions → General → Workflow permissions → **Read and write**
- Settings → Pages → Source: *Deploy from a branch* → `main` / **`/docs`**

O site fica em `marquetti-ric.github.io/combinado`.

### 5. Primeira versão
No GitHub Desktop ou pelo site: crie a tag `v1.0.0` e publique um Release.
Em ~6 minutos o APK está pronto e a página de download já aponta para ele.

---

## Depois disso, tudo pelo celular

| O que | Onde |
|---|---|
| Publicar versão nova | Releases → nova tag `v1.0.1` → Publish |
| Liberar acesso a alguém | Actions → *Licenças de uso* → `liberar` |
| Revogar, renovar, listar | Actions → *Licenças de uso* → a ação desejada |
| Mudar textos ou rotinas | Editar o arquivo no app do GitHub → commit → nova tag |

Detalhes em [DISTRIBUICAO.md](DISTRIBUICAO.md).

---

## Desenvolvimento

```bash
npm install
npm run dev            # navegador, com localStorage no lugar do Preferences
npm run build
npx cap sync android
npx cap open android   # Android Studio
```

Para testar contra um servidor local de licenças em vez do GitHub Pages:

```bash
VITE_SITE=http://localhost:4173 npm run build
```

### Testes

```bash
npx esbuild testes/fluxo.jsx --bundle --platform=node --outfile=testes/f.mjs \
  --format=esm --loader:.jsx=jsx --external:jsdom --external:react --external:react-dom \
  --define:import.meta.env='{"VITE_SITE":"http://localhost:4173"}'
node testes/f.mjs
```

Cobre: tela de ativação, código inválido, código válido, escolha de nível,
carregamento da rotina e aviso de nova versão.

---

## Antes de mexer no código

Leia o [AGENTS.md](AGENTS.md). Há decisões de acessibilidade sensorial e de
identidade visual que parecem erros para quem não conhece o contexto, e que
não devem ser "corrigidas".

---

## Estrutura

```
src/App.jsx          o app inteiro: 52 ilustrações SVG, rotinas, editor
src/Portao.jsx       ativação, carência e aviso de atualização
src/licenca.js       validação do código de acesso
src/atualizacao.js   comparação de versão
src/notificacoes.js  avisos locais nos horários
src/armazenamento.js Preferences do Capacitor
src/servidor.js      endereço do GitHub Pages
docs/                site público (download, privacidade, manifestos)
scripts/licenca.mjs  gerador de códigos, roda no Actions
.github/workflows/   build do APK e gestão de licenças
```
