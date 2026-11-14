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
- Paleta do app: musgo `#2F6B62`, damasco `#F2A65A`, folha `#78BE9B`,
  coral `#E8879B`, lilás `#8E82D4`, névoa `#E8F0EE`, tinta `#24403C`.
- Paleta da marca: creme `#F0EEDF`, ouro `#ECB70D`, oliva `#7E7347`.
  Essas três vêm medidas do logo original e só aparecem nas superfícies
  institucionais (abertura, assinatura, área dos responsáveis).
- Fontes: Baloo 2 (títulos), Nunito (texto), Source Sans 3 (apenas o logotipo).
  Vêm de `@fontsource`, empacotadas. **Nunca** voltar a buscar no Google Fonts:
  app infantil não deve mandar dados a terceiros.
- As 52 ilustrações são SVG escritas à mão dentro do `App.jsx`, no estilo
  "feltro recortado". Não substituir por emoji, bibliotecas de ícones ou imagens.
  Para uma tarefa nova, desenhar no mesmo estilo e registrar em `ARTES`.

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

### Mais quatro coisas que não se mexem

- **A prancha fala sempre**, mesmo com a narração automática desligada no perfil
  sensorial. Nos outros lugares a voz é o app lendo para a criança; na prancha a
  voz é dela. Desligar seria tirar a fala de quem não tem outra.
- **Na lista livre a voz não narra sozinha** — seriam sete frases de uma vez.
  Cada passo tem o seu alto-falante e a criança escolhe quando ouvir.
- **O alto contraste vence a cor de destaque da clínica.** Acessibilidade não
  cede para marca.
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
npm run teste     # 174 verificações, em cinco suítes
```

As suítes, se precisar rodar uma só: `teste:fluxo` (ativação → níveis → rotina →
atualização), `teste:contatos`, `teste:apoio` (a derivação dos ajustes),
`teste:identificacao` (da tela ao app aplicando o perfil) e `teste:modulos`
(prancha e sentimentos). São testes de renderização de verdade, com jsdom: o
projeto já teve um erro de inicialização que passou pela checagem de sintaxe e
só apareceu na tela.

Se mexeu na interface, rode `npm run dev` e confira em 390×844 (tamanho de
celular) que nada corta na horizontal.

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
```
