# iOS — como o build sai, e o que só você pode fazer

## O que já está pronto no repositório

- `App/App/PrivacyInfo.xcprivacy` — o manifesto de privacidade. Declara
  **nenhum** rastreamento, **nenhum** dado coletado, e uma única API de motivo
  obrigatório: `UserDefaults` (`CA92.1`), que o Preferences do Capacitor usa
  por baixo do `armazenamento.js`. Obrigatório desde 1º de maio de 2024, e a
  recusa mais comum de envio (ITMS-91053) é exatamente este arquivo faltando
  ou sem a entrada do UserDefaults. Está registrado na fase **Resources**, que
  é o que faz ele entrar no bundle — só estar na pasta não basta, porque a
  Apple lê o que está dentro do `.app`.
- `App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` — o esquema
  compartilhado. O Xcode guarda o esquema em `xcuserdata`, que está no
  `.gitignore`: num clone limpo o `xcodebuild -scheme App` não acharia nada.
- `Info.plist` com `arm64`, região `pt-BR`, e
  `ITSAppUsesNonExemptEncryption = false` — essa última é o que faz o App
  Store Connect **parar de perguntar sobre criptografia a cada envio**.
- Ícones gerados por `capacitor-assets`. O de 1024×1024 é RGB sem canal alfa;
  com alfa a loja recusa.
- O projeto usa **SPM**, não CocoaPods. Não existe `pod install` aqui.

## Com um Mac: o caminho curto para o primeiro TestFlight

Se você tem Mac, **o primeiro envio não precisa de segredo nenhum.** O Xcode
assina sozinho, e no caminho ele cria o certificado e o perfil que o workflow
vai querer depois — então fazer este primeiro envio à mão deixa o CI mais
fácil, não mais difícil.

O que precisa existir antes: o **App ID** e o **registro no App Store
Connect** (passos 1 e 2 abaixo). Esses dois não têm atalho.

```bash
git clone https://github.com/Marquetti-Ric/rotina-innova.git
cd rotina-innova
npm ci
npm run build
npx cap sync ios
npm run ios:versao        # grava a versão e o número de build
open ios/App/App.xcodeproj
```

No Xcode:

1. Selecione o alvo **App** → aba **Signing & Capabilities**.
2. Marque **Automatically manage signing** e escolha seu **Team**. O Xcode
   cria o certificado e o perfil sozinho.
3. No seletor de destino, no topo, escolha **Any iOS Device (arm64)** — não um
   simulador. Com simulador selecionado, o menu de arquivar fica cinza, e é
   isso que confunde na primeira vez.
4. **Product → Archive.** Leva alguns minutos.
5. Quando o Organizer abrir: **Distribute App → TestFlight & App Store →
   Upload.**

Deixe o Xcode cuidar de tudo que ele oferecer para cuidar. Export compliance
ele não vai perguntar, porque o `Info.plist` já responde.

**Não comite o `project.pbxproj` depois disso.** O `npm run ios:versao` mexe
nele, e o Xcode também, quando assina. Rode `git checkout
ios/App/App.xcodeproj/project.pbxproj` ao terminar.

### Por que o número de build é o que é

O App Store Connect recusa build repetido, e reenviar a mesma versão é rotina
em teste. Só que há **dois** lugares que enviam: o seu Mac e o workflow. Se
cada um contasse do seu jeito, um envio do Mac com número menor que o último
do CI seria recusado — e você descobriria isso depois de uma rodada inteira.

Então os dois chamam o mesmo `npm run ios:versao`, que conta minutos desde
2020 em UTC. Sobe sozinho, nunca repete, e vale dos dois lados. A versão de
marketing continua vindo do `docs/latest.json`.

## Os três modos do workflow

`Actions → "Gerar o app de iOS" → Run workflow`.

| modo | o que faz | precisa de segredo |
|---|---|---|
| `simulador` | compila sem assinatura; prova que o projeto nativo compila | **nenhum** |
| `dispositivo` | `.ipa` de desenvolvimento, para um aparelho no perfil | certificado + perfil de dev |
| `testflight` | arquiva, valida e **sobe** para o TestFlight | tudo abaixo |

Build de simulador não roda em aparelho — é desenho da Apple, não limitação
do workflow.

O workflow confere três coisas antes de gastar minuto de macOS: que o runner
tem **Xcode 26 ou mais novo** (a Apple exige isso para compilar app de iOS, e
um runner velho só seria recusado no fim), que o manifesto de privacidade está
completo e na fase certa, e que o perfil que você subiu é mesmo de
`br.com.combinado.app` — perfil trocado é erro que de outro jeito só aparece
no envio.

---

# Preparar a conta Apple — o que só você pode fazer

Eu não crio, não vejo e não guardo nenhuma destas credenciais. Tudo aqui você
faz na sua conta, e cola em
`Settings → Secrets and variables → Actions → New repository secret`.

Os passos **1 e 2** valem para qualquer caminho, inclusive o do Xcode no Mac.
Os passos 3 a 7 são só para o envio automático — sete segredos, feitos uma
vez. Se você já enviou pelo Xcode, o certificado e o perfil **já existem** e o
passo 4 vira só exportar o que está no seu Keychain.

## 1. O App ID

`developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → +`

- **App IDs → App**
- Bundle ID: **explícito**, exatamente `br.com.combinado.app`
- Capabilities: **nenhuma**. O app não usa push, não usa iCloud, não usa
  Sign in with Apple. Marcar o que não se usa só cria exigência depois.

## 2. O registro no App Store Connect

`appstoreconnect.apple.com → Apps → +`

- Plataforma: iOS
- Nome: `Combinado`
- Idioma principal: **Português (Brasil)**
- Bundle ID: o do passo 1
- SKU: qualquer identificador seu, por exemplo `combinado-br`

Sem este registro o envio é recusado, porque não existe app para receber a
build.

## 3. O Team ID → segredo `IOS_TIME`

`developer.apple.com → Membership`. São 10 caracteres.

## 4. O certificado de distribuição → `IOS_CERTIFICADO_P12` e `IOS_CERTIFICADO_SENHA`

**Antes de criar um novo, veja se já existe.** A Apple limita certificados de
distribuição a dois ou três por conta, e eles não se apagam sem revogar. Se já
houver um, exporte o que existe em vez de criar outro. **Se você já enviou
pelo Xcode, existe um** — o Xcode o criou — e aí pule direto para o passo 3 de
"Com um Mac".

### Com um Mac

1. **Keychain Access → Certificate Assistant → Request a Certificate From a
   Certificate Authority.** Salve em disco o `.certSigningRequest`.
2. No portal: **Certificates → + → Apple Distribution**, envie o CSR, baixe o
   `.cer`.
3. Dê dois cliques no `.cer` para instalar. No Keychain Access, em **My
   Certificates**, clique com o botão direito no certificado → **Export** →
   formato `.p12`. **Defina uma senha** — ela vai no segredo
   `IOS_CERTIFICADO_SENHA`.

### Sem Mac, com `openssl`

```bash
# 1. a chave privada e o pedido de certificado
openssl genrsa -out distribuicao.key 2048
openssl req -new -key distribuicao.key -out distribuicao.certSigningRequest \
  -subj "/emailAddress=SEU@EMAIL/CN=Combinado Distribuicao/C=BR"

# 2. envie o .certSigningRequest no portal (Certificates → + → Apple
#    Distribution) e baixe o distribution.cer

# 3. junte os dois num .p12
openssl x509 -inform DER -in distribution.cer -out distribuicao.pem
openssl pkcs12 -export -inkey distribuicao.key -in distribuicao.pem \
  -out distribuicao.p12 -passout pass:ESCOLHA_UMA_SENHA
```

**Guarde o `distribuicao.key`.** Sem ele o certificado é inútil, e a única
saída é revogar e começar de novo — gastando uma das duas vagas.

## 5. O perfil de distribuição → `IOS_PERFIL_APPSTORE`

`Profiles → + → Distribution → App Store Connect`

- App ID: `br.com.combinado.app`
- Certificado: o do passo 4
- Baixe o `.mobileprovision`

O workflow lê o nome e o bundle id de dentro do perfil, então não há nome para
digitar errado.

*(Para o modo `dispositivo` é um perfil separado: `Distribution` → não,
`Development`, com o UDID do seu iPhone marcado. Vai no segredo `IOS_PERFIL`.)*

## 6. A chave da API → `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`

`appstoreconnect.apple.com → Users and Access → Integrations → App Store
Connect API → Team Keys → +`

- Nome: `GitHub Actions`
- Acesso: **App Manager** (precisa disso para subir build)

Da tela saem as três coisas:

- **Issuer ID** — fica no topo da página → `ASC_ISSUER_ID`
- **Key ID** — a coluna da chave → `ASC_KEY_ID`
- O arquivo **`AuthKey_XXXXXX.p8`** → em base64, vai em `ASC_KEY_P8`

> **A `.p8` só pode ser baixada uma vez.** Perdida, revoga-se e cria-se outra.

## 7. Converter para base64

Três arquivos viram texto: o `.p12`, o `.mobileprovision` e a `.p8`.

```bash
# macOS
base64 -i distribuicao.p12 -o p12.txt

# Linux
base64 -w0 distribuicao.p12 > p12.txt
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("distribuicao.p12")) | Set-Clipboard
```

Cole o conteúdo inteiro, numa linha, sem espaço no fim.

## O quadro dos sete

| segredo | de onde vem |
|---|---|
| `IOS_TIME` | Membership, 10 caracteres |
| `IOS_CERTIFICADO_P12` | o `.p12` de distribuição, em base64 |
| `IOS_CERTIFICADO_SENHA` | a senha que você definiu ao exportar |
| `IOS_PERFIL_APPSTORE` | o `.mobileprovision` de App Store, em base64 |
| `ASC_KEY_ID` | Key ID da chave da API |
| `ASC_ISSUER_ID` | Issuer ID da conta |
| `ASC_KEY_P8` | o `AuthKey_*.p8`, em base64 |

---

# Depois que subir

O build aparece no App Store Connect depois do processamento, normalmente de 5
a 30 minutos. Até lá fica como *Processing* e não dá para convidar ninguém.

**Teste interno** — até 100 pessoas da sua equipe do App Store Connect —
libera assim que processar. É o caminho para você e para quem você adicionar
como usuário da conta.

**Teste externo** — qualquer pessoa por e-mail ou link, até 10 mil — passa por
uma revisão da Apple e exige:

- a **ficha de privacidade** (App Privacy) preenchida. É um formulário
  separado do manifesto, e tem de dizer a mesma coisa: nada coletado, nada
  rastreado, nada vinculado à pessoa.
- descrição do que testar e um e-mail de contato.
- **classificação 4+, fora da Kids Category.** Decisão já tomada e registrada
  no `AGENTS.md`: ligar e abrir o WhatsApp são links para fora do app, que a
  categoria infantil só admite atrás de um parental gate, e barreira na frente
  de um pedido de ajuda não faz sentido. Entrar na Kids Category é porta de
  mão única — as regras continuam valendo mesmo se a categoria for desmarcada
  depois.

O número de build sobe sozinho a cada execução (`run_number` do GitHub), e não
o `versionCode` do Android: reenviar a mesma versão é rotina em teste, e o App
Store Connect recusa build repetido. A versão de marketing continua vindo do
`docs/latest.json`, que é a fonte única.

## Antes de pensar em loja

**Espanhol e inglês não vão para loja nenhuma** antes da análise regulatória
do país de destino. A página de privacidade cita a LGPD; fora do Brasil ela é
documento errado, e a RDC 657 da ANVISA — que é o que mantém o produto fora do
registro de dispositivo médico aqui — não vale lá. Por isso os dois idiomas
estão atrás da prévia, rotulados como incompletos.
