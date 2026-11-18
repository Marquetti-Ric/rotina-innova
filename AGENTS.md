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
- Três níveis por idade (1: 3–5, 2: 6–8, 3: 9+) mudam granularidade dos passos,
  tom do texto, estrutura (trilha guiada x lista livre) e intensidade da
  recompensa. Cada tarefa de fábrica tem três versões de texto.
- Quatro momentos: `manha`, `clinica`, `noite`, `fds`.
- Tarefas têm `horario`, `duracao` e `dias` como parâmetros.
- Armazenamento sempre por `src/armazenamento.js`. **Nunca** `localStorage`
  direto no `App.jsx`, nem `window.storage` (era API do protótipo).
- Sem analytics, sem rastreamento, sem conta de usuário. Só duas consultas de
  rede: validade da licença e verificação de versão.

### Textos
Português do Brasil. Nada de infantilizar o nível 3 — criança de 11 anos
percebe e abandona.

## Como validar antes de dizer que terminou

```bash
npm run build     # tem de passar sem avisos
npm run teste     # 372 verificações, em dez suítes
```

As suítes, se precisar rodar uma só: `teste:fluxo` (ativação → níveis → rotina →
atualização), `teste:portao` (a tela de código: colar, erros e contraste),
`teste:contatos`, `teste:apoio` (a derivação dos ajustes),
`teste:identificacao` (da tela ao app aplicando o perfil), `teste:modulos`
(prancha e sentimentos), `teste:notas` (o caderno e o resumo),
`teste:pausas` (as quatro cenas do corpo), `teste:ajuste` (o assistente e o
check-in da criança) e `teste:contraste` (a paleta).

As nove primeiras são testes de renderização de verdade, com jsdom: o projeto
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
src/notas.js          → caderno de observação e montagem do resumo
src/Notas.jsx         → "O que eu noto"
src/Relatorio.jsx     → o resumo para levar na consulta
src/voz.js            → narração pelo sintetizador do aparelho
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
```
