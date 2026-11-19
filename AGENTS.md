# Contexto do projeto — leia antes de alterar qualquer coisa

Plataforma de rotinas diárias para crianças com TEA, vendida a clínicas e escolas,
que sobem a própria identidade visual. O Instituto Innova é a primeira clínica cliente,
não a marca do produto.

## O que este app é

Um organizador visual de rotina. **Não** é ferramenta terapêutica, não faz
diagnóstico e não indica tratamento. Essa distinção é exigência das lojas de
aplicativos e deve aparecer na linguagem de qualquer texto novo.

## Regras que NÃO devem ser alteradas sem pedido explícito

### Identidade visual
- **O símbolo é um nó: dois anéis que se cruzam de verdade.** Um passa por
  cima num cruzamento e por baixo no outro. Ele não é desenhado à mão: sai de
  `scripts/marca.mjs`, que escreve os dois SVG e os cinco PNG de `assets/`.
  Mexeu na marca? `npm run marca` e **olhe o resultado** — em 20px, em uma cor
  só e invertido no musgo. Três coisas que a geometria resolve e que uma
  reescrita costuma perder:
  - **Os vãos ficam sobre os pontos de cruzamento**, não nos lados de dentro.
    Nos lados de dentro os dois traços se fundem e sai um oito deitado.
  - **Nada de `mask` nem de arco por cima.** Máscara quebra em favicon, em
    ícone nativo e em renderizador antigo; arco por cima some quando a marca
    é impressa em uma cor só.
  - **Os anéis ficam na diagonal (−28°).** Lado a lado o desenho lê como
    aliança de casamento.
- Paleta do app: musgo `#2F6B62`, damasco `#F2A65A`, folha `#78BE9B`,
  coral `#E8879B`, lilás `#8E82D4`, névoa `#E8F0EE`, tinta `#24403C`.
- Paleta da marca: creme `#F0EEDF`, ouro `#ECB70D`, oliva `#6B633E`.
  As duas primeiras só aparecem nas superfícies institucionais (abertura,
  assinatura, área dos responsáveis). O oliva era `#7E7347` e foi escurecido:
  ele só existe como texto, e a `#7E7347` dava 4,06:1 sobre o creme.
- **Damasco, folha, coral e lilás são cores de superfície, não de texto.**
  Como texto elas somem (damasco dá 2,0:1 no branco); com branco por cima
  elas somem igual (2,2:1 no folha, 2,5:1 no coral). Por isso existem
  `--damasco-txt`, `--coral-txt` e `--tinta-forte`, e **nenhuma superfície
  pode aparecer num `color:`** — `teste:contraste` varre e quebra.
  Branco só sobre musgo, que dá 6,2:1.
- **Contraste se mede, não se estima.** `node scripts/auditar-contraste.mjs`
  abre o app num Chrome sem janela, caminha pelas telas e mede a cor
  calculada contra o fundo efetivo. Foi assim que apareceram 27 pares
  reprovando, de 1,73:1 a 4,06:1 — quase todos vindos de seis cores, não de
  seis telas. Quem impede a volta é `teste:contraste`, que lê os tokens do
  fonte e roda sem navegador, junto com os outros testes.
- Fontes: Baloo 2 (títulos), Nunito (texto), Source Sans 3 (apenas o logotipo).
  Vêm de `@fontsource`, empacotadas. **Nunca** voltar a buscar no Google Fonts:
  app infantil não deve mandar dados a terceiros. **Isso vale para o `docs/`
  também** — era justamente a página de privacidade que mandava o IP de quem
  a abria para um CDN de terceiro. `node scripts/fontes-site.mjs` copia os
  woff2 para `docs/fontes/` e escreve o `docs/fontes.css`.
- As 52 ilustrações são SVG escritas à mão dentro do `App.jsx`, no estilo
  "feltro recortado". Não substituir por emoji, bibliotecas de ícones ou imagens.
  Para uma tarefa nova, desenhar no mesmo estilo e registrar em `ARTES`.
- Figura humana: cabeça pequena e pernas longas. A primeira versão das pausas
  do corpo tinha cabeça grande e corpo curto, e saía um bebê — o nível 3 é
  criança de 9 anos para cima e percebe.
- **Desenho novo se confere olhando.** `npm run ver:pausas` monta uma página
  com as cenas animadas. A primeira versão das pausas passou no build e nos
  testes com duas cenas idênticas, setas ao contrário e mãos que não
  encostavam na parede. Nada disso aparece lendo o SVG.

### Acessibilidade sensorial — isto é requisito, não enfeite
- Nenhuma animação piscante ou estroboscópica. Nenhum som alto ou súbito.
- Todo movimento é multiplicado pela variável CSS `--t`. O "modo calmo" zera
  `--t` e desliga confete e faíscas. `prefers-reduced-motion` também é respeitado.
- Uma coisa por tela nos níveis 1 e 2. Frases curtas e literais.
- O app **nunca** bloqueia no meio de uma tarefa, nem por licença vencida.

### Perfil de apoio e identificação — três invariantes

O responsável pode informar atipicidade, perfil sensorial, comunicação e visão.
Isso é **informação de saúde de criança** e sustenta três regras:

1. **O rótulo nunca governa a tela.** Quem manda na interface é o objeto `ajustes`
   devolvido por `derivarAjustes`. Nenhuma tela consulta a lista de condições.
   O diagnóstico só pré-preenche os ajustes.
2. **Chave de armazenamento própria.** `combinado_apoio_v1` para o perfil e
   `combinado_contatos_v1` para os telefones, separadas de `combinado_v1`.
   Apagar tem de ser uma operação só. Nada disso sobe ao servidor de licenças
   nem a painel de clínica.
3. **A escolha manual do adulto vence a derivada**, hoje e depois de qualquer
   edição do perfil. É o campo `manual` do perfil.

Consequência da regra 1, e há teste travando: **apagar a identificação não
desmonta o app para a criança.** O que a derivação produzira é promovido a
escolha manual, então ela abre amanhã e encontra o mesmo app.

O consentimento vem antes da lista, em destaque. Sem aceite, a lista não abre.
A criança nunca vê nenhuma dessas telas nem o nome de nenhuma condição.

### "O que eu noto" não é triagem, e a distinção é o enquadramento

O caderno de observação do responsável e o resumo que ele gera existem porque a
família chega na consulta sem conseguir descrever o que vê. Eles **não**
rastreiam, não pontuam, não comparam com norma e não concluem. Três regras:

1. **Vocabulário de comportamento observável, nunca de sintoma.** "Som alto
   incomodou" é o que o responsável viu; "hipersensibilidade auditiva" é
   conclusão. Se uma etiqueta nova parecer nome de sintoma ou de condição, ela
   não entra — há teste varrendo a lista.
2. **O resumo não afirma a condição da criança**, mesmo com o perfil de apoio
   preenchido. Ele diz o que o app está fazendo e o que a família observou; o
   diagnóstico, quem conta é a família, com as palavras dela.
3. **Sem total, média ou tendência.** Número que sobe sugere conclusão.

Pela RDC 657/2022, software é dispositivo médico quando tem finalidade de
prevenção, diagnóstico, tratamento ou reabilitação; fica de fora o que processa
dados sem qualquer finalidade clínica diagnóstica. É nessa saída que o produto
vive. Um teste de triagem dentro do app — ainda que com aviso de que só o
especialista diagnostica — muda a finalidade e leva a registro, responsável
técnico e custo. Não acrescentar sem decisão explícita e parecer.

### O assistente de ajuste — quatro invariantes

O perfil era preenchido uma vez, na identificação, e nunca mais usado para
resolver um problema concreto. O assistente é a conversa que liga "esta tarefa
está travando" a "então mude isto", e tem duas portas: `Ajuste.jsx` para o
responsável e `Atrapalhou.jsx` para a criança.

1. **A saída é mudança no app, nunca conselho sobre a criança.** Toda proposta
   cai em `d.ajustes[tarefa]` ou em `apoio.manual`, que já existiam. "Quebrar o
   passo em dois" é configuração de organizador de rotina; "ela parece
   desregulada à noite" seria leitura clínica, e é a mesma fronteira da RDC 657
   que vale para o caderno.
2. **A criança não liga ajuste nenhum.** O que ela escolhe em `Atrapalhou`
   chega ao assistente do adulto como ponto de partida, e quem decide é ele.
   É a invariante do `apoio.js` de novo: a escolha manual vence a derivada.
3. **A pergunta dela é "o que atrapalhou", nunca "por que você não fez".** A
   primeira põe o problema fora dela; a segunda é acusação, e para quem falha
   na mesma tarefa todo dia a diferença não é de estilo. É oferecido uma vez
   por tarefa por dia, "não quero dizer" é resposta inteira, e há teste
   varrendo o vocabulário como no caderno.
4. **Nada sai do aparelho.** Árvore de decisão, sem rede e sem modelo de
   linguagem. Nenhum consentimento novo, nenhum custo por família, e a página
   de privacidade continua verdadeira.

Três coisas aprendidas construindo, que não se descobrem lendo o código:

- **"Passos menores" não é conteúdo novo.** Toda tarefa de fábrica já traz as
  três quebras (`n.1`, `n.2`, `n.3`). A proposta empresta a do nível abaixo só
  naquela tarefa, por `passosNivel` — texto já escrito e já no tom certo.
- **Mover o horário só vale dentro do mesmo momento do dia.** A primeira versão
  escolhia a tarefa mais distante no relógio, e o app propôs mover "se arrumar"
  das 07:00 para as 21:30, junto da hora de dormir. Fora do momento não é
  ajuste, é outra rotina.
- **Não propor o que já está ligado.** `derivarAjustes` já entrega muita coisa
  por perfil; sugerir o que a pessoa já tem faz o assistente parecer que não
  olhou.

### O nível 4 — cinco invariantes

Os níveis 1 a 3 variam o tamanho do passo. O nível 4 varia outra coisa:
**quem é o dono da rotina.** Nos três primeiros o adulto monta e a criança
executa; para um adolescente essa relação é o problema, porque a tarefa da
idade é deixar de ser executor.

**Três papéis, e confundi-los desmonta o nível:**

| papel | quem é | o que decide |
|---|---|---|
| titular da licença | a clínica, ou quem comprou na loja | paga, recebe aviso de vencimento, **habilita** o nível 4 |
| responsável | quem administra no dia a dia | executa a passagem |
| dono da rotina | níveis 1–3: o responsável; nível 4: o jovem | cria tarefas, decide o que é partilhado |

A licença define quem **responde**, nunca quem é dono. É o que permite ao
nível 4 mover a propriedade sem mover a responsabilidade — e é o que torna o
modelo defensável para a clínica que paga.

1. **Retirar o app de volta é possível, nunca silencioso.** `retomar` grava
   `retomadoEm`, e o aviso aparece antes de qualquer outra tela. Autonomia
   revogável em segredo é pior que autonomia nenhuma: ensina que o controle
   era da boca para fora.
2. **O número conta o ambiente, nunca a pessoa.** "Esqueci — 2" é fato sobre
   a manhã; "você cumpriu 62%" é veredito. Sem nota, sem porcentagem e sem
   sequência — quebrar uma sequência transformaria o pior dia dele numa
   punição visível. `teste:nivel4` varre a tela atrás de número de
   desempenho e varre o módulo atrás de função de placar.
3. **A recompensa é menos app.** Quando a rotina se sustenta por seis
   semanas, o app oferece parar de lembrar. Uma falha não zera nada: adia.
   Um organizador que funciona deveria ser necessário cada vez menos, e
   perseguir uso diário empurraria o produto a fabricar dependência.
4. **As anotações dele não têm interruptor.** Rotina e travamentos ele
   partilha se quiser; para as anotações não existe botão — nem na tela nem
   no código: `virarPartilha(d, 'notas')` devolve o estado intacto.
5. **A partilha não é configurável pela clínica.** O `marca.js` já separou
   moldura de miolo: a clínica veste logotipo, cor e nome, e o miolo é fixo
   porque é onde mora a acessibilidade. Partilha é miolo. A clínica liga ou
   não liga o nível 4 — decisão clínica legítima — mas não liga **e**
   continua vendo tudo.

Três coisas que caem dos dois canais de venda (clínica white-label, e pessoa
física que baixa da loja):

- **No canal direto pode não haver adulto nenhum.** Um adolescente, ou um
  adulto autista, que compra para si é titular, responsável e dono ao mesmo
  tempo. Aí não há passagem: o app já começa no nível 4 e a ação é convidar,
  não receber. **Isto ainda não está implementado** — hoje a passagem
  pressupõe alguém que entrega.
- **Aviso de vencimento vai para o titular.** A família não renova licença de
  clínica; mandá-la renovar é mandar fazer o que ela não pode.
- **A marca da clínica não entra na tela diária dele.** Fica na ativação, na
  área do adulto e no resumo da consulta.

O jovem no nível 3 tem um **"quero este app para mim"**, que chega como
pedido na área dos responsáveis. Quem decide continua sendo o adulto — mas
sem isso ele não tem nem como levantar o assunto, e pedir já é o exercício
que o nível inteiro existe para sustentar.

### Idioma — interface, conteúdo e o guarda

O app vai ser multilíngue (espanhol e inglês a caminho). Três regras:

1. **Interface e conteúdo são coisas diferentes.** Texto de tela — botões,
   títulos, erros — é interface e mora em `src/textos/<id>.js`, com chave
   `tela.coisa`. As 18 tarefas de fábrica com seus **144 passos** e o
   vocabulário-núcleo da prancha são **conteúdo clínico-pedagógico**: vão
   para arquivos próprios, que uma terapeuta edita sem tocar em código.
   Misturar os dois é o que torna tradução cara para sempre.
2. **A função é `tx()`, nunca `t()`.** Neste código `t` é a convenção para
   *tarefa* (`lista.find((t) => ...)`) e há oito variáveis locais com esse
   nome. Importar `t` sombreia em silêncio — aconteceu no Portão, e o erro
   virou a mensagem errada na tela.
3. **Traduzir não localiza.** Um idioma só entra em `COMPLETOS` — e só então
   aparece no seletor — quando tem, além da interface: vocabulário-núcleo
   próprio (a lista de palavras muda de língua para língua, não é tradução
   palavra a palavra), regras de silabação da língua, revisão de tom por
   quem fala o idioma, varredura de vocabulário de sintoma na língua, e a
   **análise regulatória do país de destino**. A RDC 657 da ANVISA é o que
   mantém o produto fora do registro de dispositivo médico aqui; lá fora é
   MDR ou FDA, e a página de privacidade citando a LGPD vira documento
   errado. Meio app em espanhol é pior que app em português.

**O guarda, e por que ele tem linha de base.** São centenas de cadeias ainda cruas,
e migrar leva semanas. Um teste que só passa quando tudo estiver migrado é
inútil nesse meio-tempo: ninguém roda um teste que sempre falha, e aí toda
tela nova nasce com português embutido. Então `teste:idioma` registra quanto
texto cru cada arquivo tem em `i18n-base.json` e **falha quando o número
sobe**. `--fixar` só aceita baixar.

```bash
npm run teste:idioma              # confere
node scripts/idioma.mjs --ver     # lista o que falta, por arquivo
node scripts/idioma.mjs --fixar   # grava a base nova, depois de migrar
```

**O que falta migrar, já classificado.** `node scripts/idioma.mjs --ver`
dá os números do dia; esta lista diz *para onde* cada coisa vai, que é a
parte que não se descobre olhando:

| vai para | arquivos |
|---|---|
| `src/textos/` (interface, três idiomas) | `App.jsx` (a moldura), `Identificacao.jsx`, `Passagem.jsx`, `Ajuste.jsx`, `Notas.jsx`, `Relatorio.jsx`, `licenca.js`, `nivel4.js`, `pausas.jsx`, `contatos.js`, `marca.js`, `notificacoes.js`, e os botões do `Prancha.jsx` |
| `src/conteudo/` (conteúdo, um arquivo por idioma, escrito por quem cuida do mercado) | as perguntas e propostas de `ajuste.js`, os rótulos de condição e ajuste de `apoio.js`, as etiquetas de `notas.js`, as emoções de `Sentimentos.jsx`, e o vocabulário-núcleo do `Prancha.jsx` |

A segunda coluna é o que **não se traduz**: as etiquetas do caderno são
justamente o que a regra do vocabulário observável protege, e a varredura
que impede nome de sintoma de entrar só funciona na língua em que foi
escrita. Mandar isso para um tradutor devolve a regra quebrada em silêncio.

Já migrados e em zero: `Portao.jsx`, `Jovem.jsx`, `Atrapalhou.jsx`,
`Adultos.jsx`. As tarefas de fábrica já estão em
`src/conteudo/tarefas/pt-BR.js` — 174 cadeias que saíram do `App.jsx`.

**Datas e números pelo `Intl`, nunca na mão.** A primeira casa do nível 4
escrevia "quarta, 18 de novembro" com os meses num array — idioma embutido
num lugar onde ninguém procura.

**Sem o pacote de voz, o adulto é avisado.** `voz.js` deixou de ter `pt-BR`
fixo. Num aparelho sem a voz do idioma a narração simplesmente não sai, e
para a criança que usa a voz como caminho de leitura isso é regressão de
acessibilidade — não defeito do app. `faltaVoz()` existe para a área dos
responsáveis dizer isso.

O Portão está migrado por inteiro e serve de padrão; `teste:portao` o
renderiza nos três idiomas e confere que não sobra português na tela.

### Mais cinco coisas que não se mexem

- **A prancha fala sempre**, mesmo com a narração automática desligada no perfil
  sensorial. Nos outros lugares a voz é o app lendo para a criança; na prancha a
  voz é dela. Desligar seria tirar a fala de quem não tem outra.
- **Na lista livre a voz não narra sozinha** — seriam sete frases de uma vez.
  Cada passo tem o seu alto-falante e a criança escolhe quando ouvir.
- **O alto contraste vence a cor de destaque da clínica.** Acessibilidade não
  cede para marca.
- **A demonstração da pausa do corpo não congela no modo calmo.** Em todo o
  resto do app o movimento é enfeite e `--t: 0` o desliga. Nas quatro cenas de
  `pausas.jsx` o movimento é a instrução: quem precisa mexer o corpo muitas
  vezes não está em condição de ler, e às vezes ainda não lê. Então ela fica
  mais lenta (2,8s → 4,6s), não parada. Com `prefers-reduced-motion` ela para
  de verdade — aí é o sistema falando pelo usuário — e por isso toda cena
  carrega setas estáticas que seguram o sentido, com a pose de repouso sempre
  legível.
- **Na tela de código, o botão nunca fica mudo.** Botão desabilitado não
  dispara evento: a pessoa toca, nada acontece, e ela não sabe se o app travou
  ou se ela errou. "Liberar o app" sempre responde e diz o que falta. Pela
  mesma razão a máscara do campo usa `X` e tem cor própria e clara — sem isso
  ela herda o padrão do WebView e o campo parece já preenchido.
  `teste:portao` trava o contraste desta tela: se alguém clarear a paleta de
  novo, o teste quebra.
- **Pedir ajuda não tem barreira.** Ligar e abrir o WhatsApp são links para fora
  do app, que a categoria infantil da App Store só admite atrás de um parental
  gate. Barreira na frente de um pedido de ajuda não faz sentido, então o app é
  classificado 4+ e fica **fora** da Kids Category. Essa porta é de mão única:
  depois de entrar na categoria, as regras continuam valendo mesmo se ela for
  desmarcada. Ligação usa `ACTION_DIAL`, nunca `ACTION_CALL` — por isso nada de
  `CALL_PHONE`.

### Estrutura
- Quatro níveis (1: 3–5, 2: 6–8, 3: 9+, 4: 13+). Os três primeiros mudam granularidade dos passos,
  tom do texto, estrutura (trilha guiada x lista livre) e intensidade da
  recompensa. Cada tarefa de fábrica tem três versões de texto.
- Quatro momentos: `manha`, `clinica`, `noite`, `fds`.
- Tarefas têm `horario`, `duracao` e `dias` como parâmetros.
- Armazenamento sempre por `src/armazenamento.js`. **Nunca** `localStorage`
  direto no `App.jsx`, nem `window.storage` (era API do protótipo).
- Sem analytics, sem rastreamento, sem conta de usuário. Só duas consultas de
  rede: validade da licença e verificação de versão.

### Textos
Português do Brasil é a base, e toda chave nasce nele. Nada de infantilizar o nível 3 — criança de 11 anos
percebe e abandona.

## Como validar antes de dizer que terminou

```bash
npm run build     # tem de passar sem avisos
npm run teste     # 445 verificações, em doze suítes
```

As suítes, se precisar rodar uma só: `teste:fluxo` (ativação → níveis → rotina →
atualização), `teste:portao` (a tela de código: colar, erros e contraste),
`teste:contatos`, `teste:apoio` (a derivação dos ajustes),
`teste:identificacao` (da tela ao app aplicando o perfil), `teste:modulos`
(prancha e sentimentos), `teste:notas` (o caderno e o resumo),
`teste:pausas` (as quatro cenas do corpo), `teste:ajuste` (o assistente e o
check-in da criança), `teste:nivel4` (propriedade, partilha e padrão),
`teste:idioma` (o guarda do texto cru) e `teste:contraste` (a paleta).

As dez primeiras são testes de renderização de verdade, com jsdom: o projeto
já teve um erro de inicialização que passou pela checagem de sintaxe e só
apareceu na tela. A nona lê o CSS do fonte e faz a conta da WCAG.

Se mexeu na interface, rode `npm run dev` e confira em 390×844 (tamanho de
celular) que nada corta na horizontal. Se mexeu em cor, rode também
`npm run build && node scripts/auditar-contraste.mjs` — leva uns treze
minutos e é a única coisa que enxerga o que a tela realmente pinta.

## Arquitetura resumida

```
src/main.jsx          → fontes + monta o Portão
src/Portao.jsx        → ativação, carência, bloqueio, aviso de versão
src/App.jsx           → casa, rotinas, tarefa, editor, área dos responsáveis
src/apoio.js          → perfil de apoio: derivarAjustes, explicarAjustes, apagar
src/Identificacao.jsx → as três etapas da identificação
src/contatos.js       → telefones, wa.me, discador, visibilidade
src/Adultos.jsx       → "Meus adultos": a tela de pedir ajuda
src/Prancha.jsx       → prancha de CAA, com o vocabulário-núcleo
src/Sentimentos.jsx   → check-in de emoções e respiração
src/pausas.jsx        → as quatro pausas do corpo, desenhadas e animadas
src/ajuste.js         → o assistente: pontos, sondas, propostas e aplicação
src/Ajuste.jsx        → "Vamos ajustar juntos" (responsável)
src/Atrapalhou.jsx    → "O que atrapalhou?" (criança), com os nove desenhos
src/nivel4.js         → propriedade, partilha, padrão e a oferta de menos app
src/Passagem.jsx      → a entrega do app, os dois lados, e o aviso da retomada
src/Jovem.jsx         → a casa do nível 4: hoje, o que segurou, ajustes
src/notas.js          → caderno de observação e montagem do resumo
src/Notas.jsx         → "O que eu noto"
src/Relatorio.jsx     → o resumo para levar na consulta
src/voz.js            → narração pelo sintetizador, no idioma ativo
src/idioma.js         → idiomas, tx(), Intl para datas; só pt-BR em COMPLETOS
src/textos/           → interface por idioma (pt-BR, es, en)
src/conteudo/         → conteúdo por idioma; hoje as 18 tarefas de fábrica
src/avatar.jsx        → personagens da criança e carinhas dos adultos
src/armazenamento.js  → Preferences do Capacitor, com queda para o navegador
src/notificacoes.js   → avisos locais nos horários das tarefas
src/licenca.js        → validação do código de acesso
src/atualizacao.js    → comparação de versão
src/marca.js          → tema da clínica (nome, logo, destaque, telefone)
src/servidor.js       → endereço do GitHub Pages (um lugar só)
docs/                 → site: download, privacidade, latest.json, licencas.json
scripts/licenca.mjs   → gerador de códigos (roda no GitHub Actions)
scripts/marca.mjs     → geometria do símbolo; gera os SVG e os PNG nativos
scripts/contraste.mjs → trava a paleta (roda com os testes, sem navegador)
scripts/auditar-contraste.mjs → mede o app num Chrome de verdade
scripts/fontes-site.mjs → leva as fontes do app para o docs/
scripts/idioma.mjs    → o guarda do i18n, com linha de base que só encolhe
```
