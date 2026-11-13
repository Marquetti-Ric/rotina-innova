# Distribuição, atualização e licenças — Combinado

Quatro peças, todas dentro do GitHub:

| Peça | Como funciona |
|---|---|
| **APK assinado** | GitHub Actions compila a cada tag `v*` e anexa ao Release |
| **Página de download** | GitHub Pages em `/docs`, lê o `latest.json` e sempre mostra a versão atual |
| **Aviso de atualização** | O app compara seu `versionCode` com o do `latest.json` e oferece baixar |
| **Controle de acesso** | Código de ativação por usuário, liberado e revogado por um workflow |

Depois da montagem inicial, **tudo é operável do celular** pelo app do GitHub.

---

## Parte 1 — Montagem (uma vez só, no Mac, ~40 min)

### 1.1 Repositório
Crie `combinado` **público** na conta `Marquetti-Ric`. Público é necessário para o GitHub Pages gratuito — e o código-fonte aberto não enfraquece nada aqui: a chave de assinatura fica em *secrets*, e a lista de licenças guarda apenas hashes.

### 1.2 Copie o pacote
Descompacte este pacote na raiz do projeto Capacitor que o runbook montou:

```
.github/workflows/release.yml     ← compila e publica
.github/workflows/licenca.yml     ← gestão de acesso
scripts/licenca.mjs               ← gerador de códigos
docs/index.html                   ← página de download
docs/privacidade.html             ← política de privacidade
docs/latest.json                  ← manifesto de versão
docs/licencas.json                ← licenças (só hashes)
docs/logo-combinado.svg
src/main.jsx                      ← substitui o atual
src/Portao.jsx                     ← ativação + avisos
src/licenca.js
src/atualizacao.js
src/servidor.js                   ← ajuste o endereço aqui
```

Em `src/servidor.js`, corrija a primeira linha se a organização tiver outro nome:

```js
export const SITE = 'https://marquetti-ric.github.io/combinado';
```

Instale a dependência que falta:

```bash
npm install @capacitor/browser
```

Copie também `docs/logo-combinado.svg` para `public/logo-combinado.svg` — o Portão usa.

### 1.3 Chave de assinatura

```bash
keytool -genkey -v -keystore combinado.keystore \
  -alias rotina -keyalg RSA -keysize 2048 -validity 10000

base64 -i combinado.keystore | pbcopy   # já vai para a área de transferência
```

> **Guarde `combinado.keystore` e a senha no cofre do Instituto, com cópia em outro lugar.** Sem ela, nenhuma atualização futura instala por cima — os usuários teriam que desinstalar e perder os dados.

### 1.4 Secrets
Repositório → Settings → Secrets and variables → Actions → **New repository secret**:

| Nome | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | o texto que você copiou |
| `ANDROID_STORE_PASSWORD` | senha do keystore |
| `ANDROID_KEY_ALIAS` | `rotina` |
| `ANDROID_KEY_PASSWORD` | senha da chave |

### 1.5 Assinatura no Gradle
Em `android/app/build.gradle`, antes de `android {`:

```gradle
def keystoreProperties = new Properties()
def f = rootProject.file('key.properties')
if (f.exists()) keystoreProperties.load(new FileInputStream(f))
```

E dentro de `android { }`:

```gradle
signingConfigs {
    release {
        storeFile file(keystoreProperties['storeFile'] ?: 'combinado.keystore')
        storePassword keystoreProperties['storePassword']
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
    }
}
buildTypes {
    release { signingConfig signingConfigs.release }
}
```

### 1.6 Permissões e Pages
- Settings → **Actions** → General → Workflow permissions → **Read and write permissions**
- Settings → **Pages** → Source: *Deploy from a branch* → `main` / **`/docs`**

A página fica em `https://marquetti-ric.github.io/combinado/`.

### 1.7 Primeira publicação
Commit, push, e crie a tag:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Em ~6 minutos: Release criado, APK anexado, `latest.json` atualizado e página no ar.

---

## Parte 2 — O dia a dia, direto do celular

### Publicar uma versão nova
App do GitHub → **Releases** → *Draft a new release* → *Choose a tag* → digite `v1.0.1` → *Create new tag* → **Publish release**.

Pronto. O Actions compila, a página passa a oferecer a versão nova, e todo app instalado mostra a faixa "Nova versão 1.0.1 · Atualizar" na abertura seguinte.

### Liberar o acesso de alguém
App do GitHub → **Actions** → *Licenças de uso* → **Run workflow**:

- ação: `liberar`
- apelido: como você vai reconhecer esse usuário
- validade: `2027-12-31` (ou vazio, sem prazo)

O código aparece no resumo da execução, no formato `CMB-7K3M-QX2P-9TWD`. Copie e entregue ao responsável — **ele não é recuperável depois**, porque só o hash fica guardado.

### Revogar, renovar, listar
Mesmo workflow, mudando a ação. `listar` devolve uma tabela com apelido, data e situação de todas as licenças.

### Mudar textos ou rotinas
Abra o arquivo no app do GitHub, edite, *Commit changes*. Depois publique uma tag nova para gerar o APK.

---

## Parte 3 — Como o acesso se comporta

```
Primeira abertura  →  pede o código  →  confere online  →  libera
Depois             →  reconfere a cada 24h, em silêncio
Sem internet       →  continua funcionando normalmente
Revogado/vencido   →  7 dias de carência com aviso só para o adulto
Fim da carência    →  tela pedindo um novo código (dados preservados)
```

**A carência existe de propósito.** Cortar o acesso no meio do dia quebraria justamente a previsibilidade que o app constrói. O aviso aparece como uma faixa discreta no rodapé, não interrompe nenhuma tarefa, e a criança não vê nada diferente.

Se um novo código for inserido depois do bloqueio, tudo volta: rotina, estrelas, figurinhas e histórico continuam no aparelho.

---

## Parte 4 — Quando quiser cobrar

O que já está pronto cobre o modelo que uma clínica usa na prática:

1. A família paga (Pix, maquininha, o que for).
2. Você roda `liberar` com validade de 12 meses.
3. Perto do vencimento, `renovar` ou deixa vencer.
4. Se cancelarem, `revogar`.

A cobrança em si fica fora do app, e isso é bom por dois motivos: a Apple exige comissão de 15–30% sobre compras feitas dentro do app, e assinatura in-app para serviço de saúde gera atrito de revisão. Cobrar por fora, como o Instituto já cobra as consultas, evita os dois.

### Limites honestos deste modelo

- **O código pode ser repassado.** Nada impede uma família de dar o código a outra. Sem servidor não há como vincular ao aparelho. Para uma clínica, onde cada código tem nome e rosto, isso costuma bastar.
- **A lista é pública** — mas só com hashes SHA-256 de códigos de ~59 bits de entropia. Não dá para derivar um código válido a partir dela.
- **Use apelidos, não nomes de crianças**, no campo do workflow: o arquivo é público.
- **Quando passar de ~200 licenças ou quiser cobrança automática**, migre para um backend de verdade (Supabase ou Cloudflare Workers, ambos com plano gratuito generoso). O app muda pouco: só a URL em `servidor.js` e o formato da resposta.

---

## Parte 5 — iOS

Nada disso vale para iPhone. A Apple não permite download direto de aplicativos, então o caminho é a App Store, com as contas e prazos do runbook. Quando o app estiver lá, o aviso de atualização pode ser desligado (a loja cuida disso) e o código de acesso continua funcionando igual.

---

## Verificação antes de soltar para as famílias

- [ ] Tag `v1.0.0` gerou Release com APK anexado
- [ ] Página abre e o botão baixa o arquivo certo
- [ ] APK instala num Android real
- [ ] Código válido libera; código errado mostra o erro
- [ ] Modo avião: app abre e funciona normalmente
- [ ] Publique `v1.0.1` e confirme que a faixa de atualização aparece
- [ ] Revogue um código de teste e veja a faixa de carência
- [ ] Teste o fluxo inteiro **pelo celular**, sem tocar no computador
