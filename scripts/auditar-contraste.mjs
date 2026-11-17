/* Auditoria de contraste no app de verdade, num Chrome sem janela.
 *
 * Isto NÃO roda junto com os testes: precisa de navegador e de um build.
 * Ele existe para DESCOBRIR os pares de cor que a tela realmente produz —
 * quem trava o resultado depois é `teste:contraste`, que lê o CSS do fonte
 * e roda em qualquer lugar.
 *
 *   npm run build && node scripts/auditar-contraste.mjs
 *
 * Como ele anda pelo app: em vez de procurar botão por rótulo — que muda e
 * quebra em silêncio — ele caminha pela estrutura. De cada tela lista os
 * controles visíveis, abre um ramo por vez e desce dois níveis dentro dele,
 * recarregando só ao trocar de ramo. Assim nenhuma tela some do relatório
 * porque alguém trocou uma palavra.
 *
 * Em cada tela varre todo nó de texto visível, pega a cor calculada e o
 * fundo efetivo (subindo a árvore até achar quem pinta), e aplica a WCAG:
 * 4,5:1 no texto normal, 3:1 no texto grande, 3:1 na borda de controle.
 */

import { createServer } from 'node:http';
import { appendFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(RAIZ, 'dist');
const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.png': 'image/png',
};

const servidor = createServer(async (req, res) => {
  const caminho = req.url.split('?')[0];
  const arq = resolve(DIST, '.' + (caminho === '/' ? '/index.html' : caminho));
  try {
    const dados = await readFile(arq);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arq)] || 'application/octet-stream' });
    res.end(dados);
  } catch {
    res.writeHead(404).end('nao achei');
  }
});
await new Promise((r) => servidor.listen(0, r));
const PORTA = servidor.address().port;

const HOJE = new Date().toISOString().slice(0, 10);
const LICENCA = JSON.stringify({
  modo: 'lista', h: 'auditoria', apelido: 'Auditoria', validade: '2030-12-31',
  gracia: 7, ultimaConferencia: HOJE, primeiroAviso: null,
});

const MEDIDOR = `(() => {
  const lum = (r, g, b) => {
    const c = [r, g, b].map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const nums = (s) => (s.match(/[\\d.]+/g) || []).map(Number);
  const opaco = (s) => { const n = nums(s); return n.length >= 3 && (n.length < 4 || n[3] > 0.95); };
  const hex = (s) => { const n = nums(s); return '#' + n.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(); };
  const razao = (a, b) => { const [x, y] = [a, b].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const r2 = (cor, fundo) => {
    const f = nums(cor), g = nums(fundo);
    if (f.length < 3 || g.length < 3) return null;
    return razao(lum(f[0], f[1], f[2]), lum(g[0], g[1], g[2]));
  };
  const fundoDe = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (opaco(bg)) return bg;
    }
    return 'rgb(255, 255, 255)';
  };
  const visivel = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.1) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const caminho = (el) => {
    const p = [];
    for (let n = el; n && n.tagName && p.length < 3; n = n.parentElement) {
      const cls = typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\\s+/).join('.') : '';
      p.unshift(n.tagName.toLowerCase() + cls);
    }
    return p.join(' > ');
  };

  const achados = [];
  const guardar = (o) => achados.push(o);

  for (const el of document.querySelectorAll('*')) {
    if (!visivel(el)) continue;
    const s = getComputedStyle(el);

    /* 1. texto próprio do elemento */
    const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length);
    if (proprio) {
      const r = r2(s.color, fundoDe(el));
      const px = parseFloat(s.fontSize);
      const peso = Number(s.fontWeight) || 400;
      const grande = px >= 24 || (px >= 18.66 && peso >= 700);
      const minimo = grande ? 3 : 4.5;
      if (r !== null && r < minimo) {
        guardar({ tipo: 'texto', texto: el.textContent.trim().slice(0, 42), cor: hex(s.color),
          fundo: hex(fundoDe(el)), px: Math.round(px), peso, razao: Math.round(r * 100) / 100,
          minimo, onde: caminho(el) });
      }
    }

    /* 2. borda de controle: um campo ou botão só desenhado por borda precisa
          de 3:1 contra o que estiver atrás dele. */
    const ehControle = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    if (ehControle && s.borderTopWidth !== '0px' && opaco(s.borderTopColor)) {
      const atras = (() => {
        for (let n = el.parentElement; n; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (opaco(bg)) return bg;
        }
        return 'rgb(255, 255, 255)';
      })();
      const r = r2(s.borderTopColor, atras);
      if (r !== null && r < 3) {
        guardar({ tipo: 'borda', texto: el.textContent.trim().slice(0, 42) || '(sem texto)',
          cor: hex(s.borderTopColor), fundo: hex(atras), px: 0, peso: 0,
          razao: Math.round(r * 100) / 100, minimo: 3, onde: caminho(el) });
      }
    }
  }
  return achados;
})()`;

const navegador = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

await pagina.route('**/licencas.json*', (r) => r.fulfill({ json: { graciaDias: 7, licencas: [] } }));
await pagina.route('**/latest.json*', (r) =>
  r.fulfill({ json: { versionName: '1.4.0', versionCode: 23, tamanho: '4.1M', apk: 'x', obrigatoria: false, notas: '' } }));
await pagina.addInitScript((lic) => localStorage.setItem('licenca_v2', lic), LICENCA);

/* Os controles que vale a pena abrir. `cartao` e `opc` aparecem em lista
   longa: abrir o primeiro de cada já mostra as cores da família toda. */
const CLASSES = ['nivel', 'aba', 'cartao', 'btn-rodape', 'btn-avatar', 'bt', 'botao', 'opc', 'chamar', 'voltar'];

const controles = () =>
  pagina.evaluate((cls) => {
    const vis = (e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 1 && r.height > 1;
    };
    const lista = [...document.querySelectorAll('button,[role=button]')].filter(vis);
    const por = new Map();
    lista.forEach((e, i) => {
      const c = [...e.classList].find((x) => cls.includes(x)) || 'outro';
      if (!por.has(c)) por.set(c, []);
      por.get(c).push({ i, rotulo: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 28) });
    });
    /* no máximo dois de cada família: o resto repete as mesmas cores */
    return [...por.entries()].flatMap(([c, xs]) => xs.slice(0, 2).map((x) => ({ ...x, classe: c })));
  }, CLASSES);

const clicarIndice = async (i) => {
  await pagina.evaluate((n) => {
    const vis = (e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 1 && r.height > 1;
    };
    const el = [...document.querySelectorAll('button,[role=button]')].filter(vis)[n];
    if (el) el.click();
  }, i);
  await pagina.waitForTimeout(420);
};

const vistos = new Map();
const problemas = [];
let telasVisitadas = 0;

/* Relatório parcial: a varredura é longa e já foi interrompida por tempo. */
const PARCIAL = resolve(RAIZ, 'contraste-parcial.txt');
writeFileSync(PARCIAL, '');

const linha = (p) =>
  `  ${String(p.razao).padStart(5)}:1  (mín ${p.minimo})  ${p.cor} sobre ${p.fundo}`
  + (p.tipo === 'borda' ? '  [borda]' : `  ${p.px}px/${p.peso}`)
  + `\n          "${p.texto}"\n          ${p.onde}  [${p.tela}]\n`;

async function medir(nome) {
  telasVisitadas++;
  const achados = await pagina.evaluate(MEDIDOR);
  for (const a of achados) {
    const chave = `${a.tipo}|${a.cor}|${a.fundo}|${a.px}|${a.peso}`;
    if (vistos.has(chave)) continue;
    vistos.set(chave, true);
    const p = { ...a, tela: nome };
    problemas.push(p);
    /* escreve na hora: se a varredura for interrompida, o que já se achou
       não se perde */
    appendFileSync(PARCIAL, linha(p) + '\n');
  }
}

/* Refaz um caminho desde o zero: recarrega, escolhe o nível e repete os
   cliques. Caro, mas é o que garante que cada ramo começa limpo. */
async function irPara(nivel, cliques) {
  await pagina.goto(`http://127.0.0.1:${PORTA}/`);
  await pagina.evaluate(() => localStorage.removeItem('combinado_v1'));
  await pagina.reload();
  await pagina.waitForTimeout(1500);
  const niveis = await pagina.locator('.nivel').count();
  if (!niveis) return false;
  await pagina.locator('.nivel').nth(nivel).click();
  await pagina.waitForTimeout(900);
  for (const i of cliques) await clicarIndice(i);
  return true;
}

await pagina.goto(`http://127.0.0.1:${PORTA}/`);
await pagina.waitForTimeout(1700);
await medir('abertura e escolha de nível');

for (const nivel of [0, 1, 2]) {
  const nomeNivel = `nível ${nivel + 1}`;
  if (!(await irPara(nivel, []))) break;
  await medir(`${nomeNivel} — casa`);
  const raiz = await controles();
  process.stdout.write(`${nomeNivel}: ${raiz.length} ramos `);

  for (const ramo of raiz) {
    if (!(await irPara(nivel, [ramo.i]))) continue;
    await medir(`${nomeNivel} › ${ramo.rotulo || ramo.classe}`);
    process.stdout.write('.');

    /* um nível a mais dentro do ramo, sem recarregar: a própria tela costuma
       trazer o "voltar", então a sequência de cliques continua válida */
    const dentro = await controles();
    for (const filho of dentro.slice(0, 6)) {
      await clicarIndice(filho.i);
      await medir(`${nomeNivel} › ${ramo.rotulo || ramo.classe} › ${filho.rotulo || filho.classe}`);
      /* volta para a tela do ramo antes do próximo filho */
      if (!(await irPara(nivel, [ramo.i]))) break;
    }
  }
  process.stdout.write('\n');
}

await navegador.close();
servidor.close();

problemas.sort((a, b) => a.razao - b.razao);
console.log(`\n${telasVisitadas} telas visitadas.\n`);
if (!problemas.length) {
  console.log('Nenhuma reprovação.');
} else {
  console.log(`${problemas.length} pares reprovam:\n`);
  for (const p of problemas) {
    console.log(
      `  ${String(p.razao).padStart(5)}:1  (mín ${p.minimo})  ${p.cor} sobre ${p.fundo}`
      + (p.tipo === 'borda' ? '  [borda]' : `  ${p.px}px/${p.peso}`)
      + `\n          "${p.texto}"\n          ${p.onde}  [${p.tela}]\n`,
    );
  }
}
