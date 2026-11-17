import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle'])
  global[k] = dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, 'crypto', { value: globalThis.crypto, configurable: true });
dom.window.speechSynthesis = { cancel() {}, speak() {}, getVoices() { return []; } };
dom.window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };

const H = '79df46456e96a09964594cd0d3274a601384f55173c495fc634bde214a03e700';
const licencas = { graciaDias: 7, licencas: [{ h: H, apelido: 'Teste', validade: '2027-12-31', ativa: true }] };
const versao = { versionName: '1.0.0', versionCode: 1, tamanho: '4 MB', apk: 'https://x/a.apk', obrigatoria: false, notas: '' };
global.fetch = async (u) => ({ ok: true, json: async () => (String(u).includes('licencas') ? licencas : versao) });

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const A = await import('../src/apoio.js');
const { PAUSAS_CORPO } = await import('../src/pausas.jsx');
const { AVATARES } = await import('../src/avatar.jsx');

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const todos = (sel) => [...document.querySelectorAll(sel)];
const porTexto = (sel, t) => todos(sel).find((e) => e.textContent.includes(t));
const clicar = async (el) => {
  if (!el) throw new Error('sem elemento para clicar');
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

const marcar = (i, av = AVATARES[0]) => renderToStaticMarkup(
  React.createElement(PAUSAS_CORPO[i].Arte, { pele: av.pele, cabelo: av.cabelo, tipo: av.tipo }),
);

/* ============================================================
   1. as quatro cenas
   ============================================================ */
console.log('\n— as quatro cenas —');
ok('1.1 quatro pausas, cada uma completa  ',
  PAUSAS_CORPO.length === 4
  && PAUSAS_CORPO.every((p) => p.id && p.nome && p.dica && typeof p.Arte === 'function'));
ok('1.2 cada uma é um desenho, não ícone  ',
  PAUSAS_CORPO.every((_, i) => /<svg[^>]*viewBox="0 0 220 160"/.test(marcar(i))));
ok('1.3 nenhuma usa emoji ou imagem       ',
  PAUSAS_CORPO.every((_, i) => !/<image|&#x1F|[\u{1F300}-\u{1FAFF}]/u.test(marcar(i))));

/* ============================================================
   2. parada, a figura ainda explica o movimento
   ============================================================ */
console.log('\n— com o movimento desligado —');
/* prefers-reduced-motion congela tudo. Se o sentido morasse só na animação, a
   criança veria uma figura parada e nada mais. As setas seguram isso. */
PAUSAS_CORPO.forEach((p, i) => {
  const m = marcar(i);
  const setas = (m.match(/stroke-width="3\.6"/g) || []).length;
  ok(`2.${i + 1} ${p.nome.padEnd(18)} tem seta `, setas >= 1, `${setas} setas`);
});

/* ============================================================
   3. as poses se distinguem
   ============================================================ */
console.log('\n— distinguir uma da outra —');
/* Aperto e abraço quase viraram a mesma figura. O que os separa: no aperto as
   mãos se encontram no centro e os olhos ficam abertos; no abraço elas sobem
   para os ombros e os olhos fecham. */
const aperto = marcar(0);
const abraco = marcar(2);
ok('3.1 aperto e abraço não são iguais    ', aperto !== abraco);
ok('3.2 o abraço fecha os olhos           ',
  !/circle cx="104\.5"/.test(abraco) && abraco.includes('stroke-width="2.2"'));
ok('3.3 o aperto mantém os olhos abertos  ', /<circle cx="104\.5"[^>]*r="2\.1"/.test(aperto), '');
ok('3.4 cada cena tem o seu grupo animado ', (() => {
  const classes = PAUSAS_CORPO.map((_, i) => (marcar(i).match(/class="(mx-[\w-]+)"/g) || []).join(','));
  return classes.every((c) => c.length > 0) && new Set(classes).size === 4;
})(), PAUSAS_CORPO.map((_, i) => (marcar(i).match(/class="(mx-[\w-]+)"/g) || []).join(',')).join(' | '));
ok('3.5 a parede não se mexe junto        ', (() => {
  const m = marcar(3);
  const anim = m.indexOf('class="mx-empurra"');
  return m.indexOf('rect x="182"') < anim; // a parede é desenhada antes do grupo animado
})());

/* ============================================================
   4. a figura é a criança
   ============================================================ */
console.log('\n— o personagem escolhido —');
AVATARES.forEach((av) => {
  const m = marcar(2, av);
  ok(`4.${av.id} personagem ${av.id} chega no desenho `,
    m.includes(av.pele) && m.includes(av.cabelo), `${av.pele}/${av.cabelo}`);
});

/* ============================================================
   5. o movimento não para no modo calmo
   ============================================================ */
console.log('\n— a velocidade —');
const css = (await import('node:fs')).readFileSync(
  new URL('../src/App.jsx', import.meta.url), 'utf8');
const formula = css.match(/--mx:\s*([^;]+);/);
ok('5.1 a duração vem de uma fórmula      ', !!formula, String(formula));
/* No resto do app a duração é `Xs * var(--t)`, que vira zero no modo calmo.
   Aqui a demonstração é conteúdo: tem de continuar viva, só mais devagar. */
const conta = (t) => {
  const m = formula[1].match(/([\d.]+)s\s*-\s*([\d.]+)s\s*\*\s*var\(--t\)/);
  return m ? Number(m[1]) - Number(m[2]) * t : null;
};
ok('5.2 normal: ciclo de poucos segundos  ', conta(1) >= 2 && conta(1) <= 4, `${conta(1)}s`);
ok('5.3 modo calmo: mais lento, não parado', conta(0) > conta(1), `${conta(0)}s contra ${conta(1)}s`);
ok('5.4 nunca chega a zero                ', conta(0) > 0 && conta(1) > 0);
ok('5.5 nada pisca: sem keyframe de cor   ',
  !/@keyframes mx-[\w-]+\s*{[^}]*(background|fill|color):/.test(css));

/* ============================================================
   6. a folha da pausa, dentro do app
   ============================================================ */
console.log('\n— na tela —');
const hoje = new Date().toISOString().slice(0, 10);
window.localStorage.setItem('licenca_v2', JSON.stringify({
  h: H, modo: 'lista', validade: '2027-12-31', ultimaConferencia: hoje, gracia: 7, primeiroAviso: null,
}));
window.localStorage.setItem('combinado_v1', JSON.stringify({
  nome: 'Léo', avatar: 'b', nivel: 2, estrelas: 0, feitos: {}, autonomia: {},
  hoje: [], dia: hoje, som: false, ajustes: {}, custom: [], prova: false, diario: [],
}));
window.localStorage.setItem('combinado_apoio_v1',
  JSON.stringify({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['tdah'] }));

const Portao = (await import('../src/Portao.jsx')).default;
const raiz = createRoot(document.getElementById('root'));
await act(async () => { raiz.render(React.createElement(Portao)); });
await pausa(450);

await clicar(document.querySelector('.btn-pausa'));
await pausa(120);
ok('6.1 a pausa abre com a figura         ',
  !!document.querySelector('.mexer svg'), txt().slice(0, 60));
ok('6.2 e com o nome e a dica             ',
  txt().includes('Aperto forte') && txt().includes('conta até dez'));
ok('6.3 usa o personagem da criança       ',
  document.querySelector('.mexer').innerHTML.includes(AVATARES[1].pele), 'avatar b');

await clicar(porTexto('.btn-nao', 'Quero outra'));
await pausa(100);
ok('6.4 "quero outra" troca o desenho     ',
  txt().includes('Cinco pulos') && !!document.querySelector('.mx-pula'));

await clicar(porTexto('.btn-nao', 'Quero outra'));
await pausa(100);
ok('6.5 e segue para a terceira           ',
  txt().includes('Abraço apertado') && !!document.querySelector('.mx-abraca'));

await clicar(porTexto('.btn-nao', 'Quero outra'));
await pausa(100);
ok('6.6 e para a quarta                   ',
  txt().includes('Empurrar a parede') && !!document.querySelector('.mx-empurra'));

await clicar(porTexto('.btn-nao', 'Quero outra'));
await pausa(100);
ok('6.7 depois da última, volta à primeira', txt().includes('Aperto forte'));

await clicar(porTexto('.btn-sim', 'Já fiz'));
await pausa(100);
ok('6.8 "já fiz" fecha a pausa            ', !document.querySelector('.mexer'));

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
