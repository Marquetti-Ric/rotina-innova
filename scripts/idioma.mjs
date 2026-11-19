/* O guarda do i18n: impede que texto novo nasça cru no código.
 *
 *   npm run teste:idioma          confere
 *   node scripts/idioma.mjs --ver lista o que falta, arquivo por arquivo
 *   node scripts/idioma.mjs --fixar  grava a linha de base nova
 *
 * O problema que ele resolve: são ~450 cadeias para migrar, e isso leva
 * semanas. Um teste que só passa quando TUDO estiver migrado é inútil nesse
 * meio-tempo — ninguém roda um teste que sempre falha, e aí toda tela nova
 * volta a nascer com português embutido.
 *
 * Então a linha de base registra quanto texto cru cada arquivo ainda tem, e
 * o teste falha quando o número SOBE. A migração acontece aos poucos; a
 * regressão não acontece nunca. `--fixar` só aceita baixar o número.
 *
 * O que ele NÃO conta, de propósito:
 *   - comentários, que são em português e devem continuar sendo;
 *   - o CSS, que não tem texto de tela;
 *   - `src/textos/`, que é o destino e não a origem;
 *   - chaves de tradução e identificadores.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = resolve(RAIZ, 'i18n-base.json');

/* Tira comentários e os blocos de CSS, para não contar o que não é tela. */
function limpar(fonte) {
  let s = fonte;
  /* CSS: template literal inteiro de `const CSS = ...`. */
  s = s.replace(/const CSS = `[\s\S]*?`;/g, 'const CSS = ``;');
  /* Comentários de bloco e de linha. Cuidado com http:// dentro de texto. */
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
  return s;
}

/* Marcas de português: acento, ou palavra comum da língua. Uma cadeia só
 * conta se parecer frase para humano — identificador e chave não contam. */
const ACENTO = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const PALAVRAS = /\b(de|da|do|para|que|com|não|você|uma|sem|ela|ele|seu|sua|aqui|agora|quando|mais|pelo|pela|isso|este|esta|dele|dela|quem|tudo|nada|cada|até|mas|como)\b/i;
const CHAVE = /^[\w.-]+$/;            /* 'portao.titulo' é chave, não frase */
const SO_SIMBOLO = /^[\s\p{P}\p{S}\d]+$/u;

const pareceTexto = (s) => {
  const v = s.trim();
  if (v.length < 4) return false;
  if (CHAVE.test(v)) return false;
  if (SO_SIMBOLO.test(v)) return false;
  return ACENTO.test(v) || PALAVRAS.test(v);
};

/* As cadeias de um arquivo que ainda estão cruas. */
export function cruasDe(fonte) {
  const s = limpar(fonte);
  const achadas = [];
  /* Literais entre aspas simples, duplas e crases sem interpolação. */
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`$\\\n]*)`/g)) {
    const v = m[1] ?? m[2] ?? m[3] ?? '';
    if (pareceTexto(v)) achadas.push(v.trim());
  }
  /* Texto solto entre tags JSX: <p>Alguma frase</p> */
  for (const m of s.matchAll(/>([^<>{}]+)</g)) {
    if (pareceTexto(m[1])) achadas.push(m[1].trim().replace(/\s+/g, ' '));
  }
  return achadas;
}

function arquivos() {
  const saida = [];
  const andar = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, e.name);
      if (e.isDirectory()) {
        /* `textos/` e `conteudo/` são o destino da migração, não a origem:
           ali o português é o conteúdo em português, e é para ficar. Um
           idioma novo escreve o arquivo dele ao lado. */
        if (e.name !== 'textos' && e.name !== 'conteudo') andar(p);
      } else if (/\.(jsx?|mjs)$/.test(e.name)) {
        /* `idioma.js` guarda os nomes das línguas, e nome de língua se
           escreve na própria língua: "Español" não vira "Espanhol". */
        if (e.name !== 'idioma.js') saida.push(p);
      }
    }
  };
  andar(resolve(RAIZ, 'src'));
  return saida.sort();
}

export function medir() {
  const conta = {};
  const detalhe = {};
  for (const p of arquivos()) {
    const nome = relative(RAIZ, p);
    const cruas = cruasDe(readFileSync(p, 'utf8'));
    if (cruas.length) { conta[nome] = cruas.length; detalhe[nome] = cruas; }
  }
  return { conta, detalhe };
}

const lerBase = () => {
  try { return JSON.parse(readFileSync(BASE, 'utf8')); } catch { return {}; }
};

/* ------------------------------------------------------------------ cli */

const arg = process.argv.slice(2);
const { conta, detalhe } = medir();
const base = lerBase();
const total = Object.values(conta).reduce((a, b) => a + b, 0);
const totalBase = Object.values(base).reduce((a, b) => a + b, 0);

if (arg.includes('--ver')) {
  for (const [nome, n] of Object.entries(conta).sort((a, b) => b[1] - a[1])) {
    console.log(`\n${nome}  (${n})`);
    for (const c of detalhe[nome].slice(0, 8)) console.log(`   ${c.slice(0, 76)}`);
    if (detalhe[nome].length > 8) console.log(`   … e mais ${detalhe[nome].length - 8}`);
  }
  console.log(`\nTotal: ${total} cadeias ainda cruas.`);
  process.exit(0);
}

if (arg.includes('--fixar')) {
  /* A linha de base só encolhe: fixar um número maior esconderia a
     regressão que este script existe para pegar. A primeira gravação é a
     exceção — é ela que estabelece o ponto de partida. */
  const primeira = Object.keys(base).length === 0;
  const subiu = primeira ? [] : Object.entries(conta).filter(([n, v]) => v > (base[n] ?? 0));
  if (subiu.length) {
    console.error('A linha de base só pode encolher. Subiram:');
    for (const [n, v] of subiu) console.error(`  ${n}: ${base[n] ?? 0} → ${v}`);
    process.exit(1);
  }
  writeFileSync(BASE, JSON.stringify(conta, null, 2) + '\n');
  console.log(`Linha de base fixada: ${total} cadeias (eram ${totalBase}).`);
  process.exit(0);
}

let falhas = 0;
for (const [nome, n] of Object.entries(conta)) {
  const limite = base[nome];
  if (limite === undefined) {
    console.log(`${nome} ✗ arquivo novo com ${n} cadeia(s) crua(s) — use t() de src/idioma.js`);
    falhas++;
  } else if (n > limite) {
    console.log(`${nome} ✗ subiu de ${limite} para ${n}`);
    falhas++;
  }
}
for (const [nome, limite] of Object.entries(base)) {
  const n = conta[nome] ?? 0;
  if (n < limite) console.log(`${nome} ✓ baixou de ${limite} para ${n} — rode --fixar`);
}

if (!falhas) {
  const pct = totalBase ? Math.round(((totalBase - total) / totalBase) * 100) : 0;
  console.log(`\nTexto cru: ${total} (linha de base ${totalBase}${pct ? `, ${pct}% migrado` : ''}).`);
  console.log('Nenhuma regressão.');
}
console.log(falhas ? `\n${falhas} arquivo(s) com texto cru novo.` : '');
process.exit(falhas ? 1 : 0);
