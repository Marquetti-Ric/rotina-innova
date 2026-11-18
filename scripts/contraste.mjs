/* Trava o contraste da paleta. Roda junto com os testes, sem navegador.
 *
 *   npm run teste:contraste
 *
 * Quem DESCOBRE os pares de cor que a tela produz é
 * scripts/auditar-contraste.mjs, que abre o app num Chrome de verdade.
 * Este aqui é o que impede a volta: lê os tokens do CSS no próprio fonte
 * e cobra três regras.
 *
 * 1. Toda cor que serve de TEXTO sobre superfície clara precisa de 4,5:1
 *    contra a mais escura das superfícies claras — não contra a mais
 *    clara, que é onde o erro se esconde.
 * 2. Damasco, folha, coral e lilás são cores de SUPERFÍCIE. Branco por
 *    cima delas some (2,0 a 3,3:1), e elas como texto somem igual. Então
 *    cada uma tem uma tinta declarada, e essa tinta precisa passar.
 * 3. Nenhuma cor de superfície pode aparecer num `color:`. É a regra que
 *    pega o caso novo: alguém escreve `color: var(--damasco)` numa tela
 *    que ainda não existe e o teste quebra antes de chegar no aparelho.
 *
 * A história: a varredura no navegador achou 27 pares reprovando, de
 * 1,73:1 a 4,06:1. Quase todos vinham de seis cores, não de seis telas.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------------------------------------------------------- medida */

const lum = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ----------------------------------------------------------------- fonte */

function cssDe(arquivo) {
  const s = readFileSync(resolve(RAIZ, arquivo), 'utf8');
  const partes = [];
  for (const m of s.matchAll(/const CSS = `([\s\S]*?)`;/g)) partes.push(m[1]);
  return partes.join('\n');
}

const CSS = [cssDe('src/App.jsx'), cssDe('src/Portao.jsx')].join('\n');

/* Os tokens do bloco `.rt` — e só dele. O `.rt.contraste` redefine os
 * mesmos nomes com a paleta de alto contraste (#FFD400 sobre preto), que
 * é correta no lugar dela: ler os dois juntos faria este teste medir o
 * amarelo do modo de alto contraste contra o creme e reprovar à toa. */
const BLOCO_RT = CSS.match(/(^|\n)\.rt\s*\{([\s\S]*?)\n\}/);
if (!BLOCO_RT) throw new Error('não achei o bloco .rt no CSS');
const TOKENS = {};
for (const m of BLOCO_RT[2].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
  TOKENS[m[1]] = m[2].toUpperCase();
}

const cor = (nome) => {
  const v = TOKENS[nome];
  if (!v) throw new Error(`token --${nome} não existe mais no CSS`);
  return v;
};

/* --------------------------------------------------------------- regras */

/* As superfícies claras onde o texto do app realmente cai. A mais escura
   manda: é contra ela que a razão tem de fechar. O #DFEAE7 é o fim do
   gradiente do fundo, onde um texto solto pode parar. */
const CLARAS = [
  '#DFEAE7', '#E3F0ED', '#E4F0ED', '#F0EEDF', '#E8F0EE',
  '#EAF1F0', '#E9F5EF', '#FFF3E4', '#F3FAF8', '#FFFFFF',
];

/* Cor de texto → precisa de 4,5:1 em todas as claras. */
const TEXTO_EM_CLARO = ['tinta', 'tinta-3', 'grafite', 'musgo', 'damasco-txt', 'coral-txt'];

/* Superfície → a tinta declarada para o texto que cai sobre ela. */
const SUPERFICIES = [
  ['folha', 'tinta-forte'],
  ['coral', 'tinta-forte'],
  ['damasco', 'tinta'],
];

/* Superfícies que nunca podem virar cor de texto. */
const SO_SUPERFICIE = ['damasco', 'folha', 'coral', 'lilas'];

/* ---------------------------------------------------------------- saída */

let falhas = 0;
const ok = (rotulo, passou, detalhe = '') => {
  console.log(`${rotulo} ${passou ? '✓' : '✗'}${detalhe ? '  ' + detalhe : ''}`);
  if (!passou) falhas++;
};

console.log('\n— texto sobre superfície clara (4,5:1) —');
for (const nome of TEXTO_EM_CLARO) {
  const c = cor(nome);
  let pior = Infinity;
  let onde = '';
  for (const f of CLARAS) {
    const r = razao(c, f);
    if (r < pior) { pior = r; onde = f; }
  }
  ok(`${('--' + nome).padEnd(14)} ${c}`, pior >= 4.5, `pior ${pior.toFixed(2)}:1 em ${onde}`);
}

console.log('\n— texto sobre superfície saturada (4,5:1) —');
for (const [superficie, tinta] of SUPERFICIES) {
  const s = cor(superficie);
  const t = cor(tinta);
  const r = razao(t, s);
  ok(`--${tinta} sobre --${superficie}`.padEnd(32), r >= 4.5, `${r.toFixed(2)}:1`);
  /* E o branco, que é o erro que se comete sozinho. */
  const branco = razao('#FFFFFF', s);
  ok(`  branco sobre --${superficie} reprova`.padEnd(32), branco < 4.5,
    `${branco.toFixed(2)}:1 — por isso a tinta`);
}

console.log('\n— o musgo é o único que aceita branco —');
ok('branco sobre --musgo'.padEnd(32), razao('#FFFFFF', cor('musgo')) >= 4.5,
  `${razao('#FFFFFF', cor('musgo')).toFixed(2)}:1`);

console.log('\n— borda de controle (3:1) —');
ok('--coral-borda no branco'.padEnd(32), razao(cor('coral-borda'), '#FFFFFF') >= 3,
  `${razao(cor('coral-borda'), '#FFFFFF').toFixed(2)}:1`);
/* Um botão desenhado só por contorno some se a borda não fechar 3:1, e o
   caso que doeu foi o "não quero dizer" do check-in da criança. */
{
  let pior = Infinity;
  let onde = '';
  for (const f of CLARAS) {
    const r = razao(cor('borda-ctrl'), f);
    if (r < pior) { pior = r; onde = f; }
  }
  ok('--borda-ctrl em claro'.padEnd(32), pior >= 3, `pior ${pior.toFixed(2)}:1 em ${onde}`);
}

console.log('\n— cor de superfície não vira cor de texto —');
for (const nome of SO_SUPERFICIE) {
  const usos = [...CSS.matchAll(/(?:^|[^-\w])color:\s*var\(--([\w-]+)\)/g)]
    .map((m) => m[1])
    .filter((x) => x === nome);
  ok(`--${nome} fora de color:`.padEnd(32), usos.length === 0,
    usos.length ? `${usos.length} uso(s) — use --${nome}-txt` : '');
}

/* Branco cru escrito à mão sobre superfície saturada escapa das regras
   acima, então procuramos a forma literal também. */
console.log('\n— branco cru sobre superfície saturada —');
for (const nome of ['folha', 'coral', 'damasco']) {
  const padrao = new RegExp(
    `background:\\s*var\\(--${nome}\\)[^;}]*;?[^}]*?color:\\s*(#fff|#FFF|#ffffff|#FFFFFF|white)\\b`,
    'i',
  );
  ok(`nada de #fff sobre --${nome}`.padEnd(32), !padrao.test(CSS));
}

console.log(falhas ? `\n${falhas} reprovação(ões).` : '\nTodos passaram.');
process.exit(falhas ? 1 : 0);
