# iOS — como o build sai, e o que só você pode fazer

## O que já está pronto

- `App/App/PrivacyInfo.xcprivacy` — o manifesto de privacidade. Declara
  **nenhum** rastreamento, **nenhum** dado coletado, e uma única API de motivo
  obrigatório: `UserDefaults` (`CA92.1`), que o Preferences do Capacitor usa
  por baixo do `armazenamento.js`. Obrigatório desde 1º de maio de 2024, e a
  recusa mais comum de envio (ITMS-91053) é exatamente este arquivo faltando
  ou sem a entrada do UserDefaults.
- O manifesto está registrado na fase **Resources** do `project.pbxproj`. Isso
  é o que faz ele entrar no bundle; só estar na pasta não basta, e a Apple lê
  o que está dentro do `.app`.
- `App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` — o esquema
  compartilhado. O Xcode normalmente guarda o esquema em `xcuserdata`, que
  está no `.gitignore`: num clone limpo o `xcodebuild -scheme App` não
  acharia nada. Sem este arquivo, nenhum build automático funciona.
- `Info.plist` corrigido: `arm64` em vez de `armv7` (que é de iPhone de 2012 e
  nem compila mais), região `pt-BR`, e `ITSAppUsesNonExemptEncryption = false`
  — sem essa chave o App Store Connect pergunta sobre criptografia a cada
  envio.
- Ícones gerados por `capacitor-assets`. O de 1024×1024 é RGB sem canal alfa;
  com alfa a loja recusa.
- O projeto usa **SPM**, não CocoaPods. Não existe `pod install` aqui.

## O build automático

`Actions → "Gerar o app de iOS" → Run workflow`, com dois modos.

### `simulador` — é o que funciona hoje

Compila para o simulador, sem assinatura nenhuma. Serve para uma coisa só, e
ela importa: provar que o projeto nativo compila de verdade. Não precisa de
certificado, de perfil, de Team ID nem de conta configurada — **nenhum
segredo**. Sai um `App.app` como artifact, que roda num simulador de Mac.

O que ele **não** faz: não instala no seu iPhone. Build de simulador é x86/arm
de Mac e não roda em aparelho, por desenho da Apple.

### `dispositivo` — para quando você for testar no aparelho

Gera um `.ipa` assinado. Falha de propósito, com a lista do que falta, enquanto
os quatro segredos não existirem.

## Os quatro segredos, que só você cria

Eu não crio, não vejo e não guardo nenhum deles. Tudo abaixo você faz na sua
conta e cola em `Settings → Secrets and variables → Actions → New secret`.

| segredo | o que é |
|---|---|
| `IOS_TIME` | o Team ID, 10 caracteres, em developer.apple.com → Membership |
| `IOS_CERTIFICADO_P12` | seu certificado de assinatura exportado em `.p12`, convertido para base64 |
| `IOS_CERTIFICADO_SENHA` | a senha que você definiu ao exportar o `.p12` |
| `IOS_PERFIL` | o provisioning profile (`.mobileprovision`) em base64 |

Para o certificado e o perfil, no Apple Developer: crie um certificado
*Apple Development* (ou *Distribution*, para TestFlight), e um provisioning
profile para o App ID `br.com.combinado.app` — com o UDID do seu iPhone
incluído, se for de desenvolvimento. Depois, num Mac:

```bash
base64 -i certificado.p12 -o cert.txt      # cole o conteúdo em IOS_CERTIFICADO_P12
base64 -i perfil.mobileprovision -o p.txt  # cole o conteúdo em IOS_PERFIL
```

O workflow monta um chaveiro temporário no runner, importa o `.p12`, assina, e
apaga o chaveiro no fim — inclusive se o build falhar.

## Três caminhos para rodar no seu iPhone, e o custo de cada um

1. **Xcode num Mac, direto.** Abrir `ios/App/App.xcodeproj`, escolher o seu
   iPhone, e rodar. É o mais rápido para testar, e o Xcode cuida da assinatura
   sozinho. Precisa de um Mac.
2. **`.ipa` de desenvolvimento**, pelo modo `dispositivo` acima. Instala no
   aparelho cujo UDID está no perfil, e vale 7 dias a 1 ano dependendo do
   certificado. Precisa dos quatro segredos.
3. **TestFlight.** O caminho para outras pessoas testarem — a clínica, as
   famílias. Precisa de certificado de distribuição, do app criado no App
   Store Connect, e passa por uma revisão leve da Apple. É aqui que o
   manifesto de privacidade e o `ITSAppUsesNonExemptEncryption` começam a ser
   verificados de verdade.

## O que ainda falta antes de qualquer loja

- **Classificação 4+, fora da Kids Category.** Decisão já tomada e registrada
  no `AGENTS.md`: ligar e abrir o WhatsApp são links para fora do app, que a
  categoria infantil só admite atrás de um parental gate, e barreira na frente
  de um pedido de ajuda não faz sentido. Entrar na Kids Category é porta de
  mão única.
- **Ficha de privacidade do App Store Connect.** É um formulário separado do
  manifesto, e tem de dizer a mesma coisa: nada coletado, nada rastreado.
- **Espanhol e inglês não vão para loja nenhuma** antes da análise
  regulatória do país de destino. A página de privacidade cita a LGPD; fora
  do Brasil ela é documento errado.
