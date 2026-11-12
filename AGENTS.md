# Contexto do projeto — leia antes de alterar qualquer coisa

Aplicativo de rotinas diárias para crianças com TEA, do **Instituto Innova**.
Usado por famílias e pela equipe da clínica.

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
npm run build                 # tem de passar sem avisos
node testes/f.mjs             # fluxo: ativação → níveis → rotina → atualização
```

Se mexeu na interface, rode `npm run dev` e confira em 390×844 (tamanho de
celular) que nada corta na horizontal.

## Arquitetura resumida

```
src/main.jsx         → fontes + monta o Portão
src/Portao.jsx       → ativação, carência, bloqueio, aviso de versão
src/App.jsx          → o app inteiro (ilustrações, rotinas, editor)
src/armazenamento.js → Preferences do Capacitor, com queda para o navegador
src/notificacoes.js  → avisos locais nos horários das tarefas
src/licenca.js       → validação do código de acesso
src/atualizacao.js   → comparação de versão
src/servidor.js      → endereço do GitHub Pages (um lugar só)
docs/                → site: download, privacidade, latest.json, licencas.json
scripts/licenca.mjs  → gerador de códigos (roda no GitHub Actions)
```
