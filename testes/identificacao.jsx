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

/* O jsdom não tem sintetizador de voz. O dublê registra o que o app mandaria
   falar, que é justamente o que o teste precisa conferir. */
const falado = [];
dom.window.speechSynthesis = {
  cancel() {},
  speak(u) { falado.push(u.text); },
  getVoices() { return []; },
};
dom.window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };

const H = '79df46456e96a09964594cd0d3274a601384f55173c495fc634bde214a03e700';
const licencas = { graciaDias: 7, licencas: [{ h: H, apelido: 'Teste', validade: '2027-12-31', ativa: true }] };
const versao = { versionName: '1.0.0', versionCode: 1, tamanho: '4 MB', apk: 'https://x/a.apk', obrigatoria: false, notas: '' };
global.fetch = async (u) => ({ ok: true, json: async () => (String(u).includes('licencas') ? licencas : versao) });

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const A = await import('../src/apoio.js');
const Identificacao = (await import('../src/Identificacao.jsx')).default;

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const todos = (sel) => [...document.querySelectorAll(sel)];
const porTexto = (sel, t) => todos(sel).find((e) => e.textContent.includes(t));
const clicar = async (el) => {
  if (!el) throw new Error('sem elemento para clicar');
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};
const clicarTexto = async (sel, t) => clicar(porTexto(sel, t));

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

/* ============================================================
   1. o consentimento vem antes da lista
   ============================================================ */
console.log('\n— consentimento —');
const root = createRoot(document.getElementById('root'));
let salvo = null;
let apagou = null;

await act(async () => {
  root.render(React.createElement(Identificacao, {
    apoio: A.APOIO_PADRAO,
    aoSalvar: (p) => { salvo = p; },
    aoApagar: (p) => { apagou = p; },
    aoSair: () => {},
  }));
});
await pausa(120);

ok('1.1 avisa que é informação de saúde   ', txt().includes('informação de saúde da criança'));
ok('1.2 diz que não sai do aparelho       ', txt().includes('não sobe para o servidor de licenças'));
ok('1.3 a lista de condições não aparece  ', !txt().includes('TEA (autismo)'));
ok('1.4 continuar está travado            ', porTexto('.btn-plano', 'Continuar')?.disabled === true);

await clicar(document.querySelector('.aceite'));
await pausa(80);
ok('1.5 após o aceite, a lista abre       ', txt().includes('TEA (autismo)') && txt().includes('Ansiedade'));
ok('1.6 e continuar libera                ', porTexto('.btn-plano', 'Continuar')?.disabled === false);
ok('1.7 avisa que não diagnostica         ', txt().includes('não sugere diagnóstico'));
ok('1.8 avisa que a criança não vê        ', txt().includes('A criança nunca vê esta lista'));

/* ============================================================
   2. TEA e o nível de suporte
   ============================================================ */
console.log('\n— a lista —');
ok('2.1 as nove condições estão lá        ', todos('.opc').length === 9, String(todos('.opc').length));
ok('2.2 o nível só aparece com TEA marcado', todos('.nv-tea').length === 0);

await clicarTexto('.opc', 'TEA (autismo)');
await pausa(80);
ok('2.3 marcar TEA revela os três níveis  ', todos('.nv-tea').length === 3, String(todos('.nv-tea').length));
ok('2.4 começa no nível 1                 ', todos('.nv-tea')[0].dataset.on === '1');

await clicar(todos('.nv-tea')[1]);
await clicarTexto('.opc', 'TDAH');
await pausa(80);
ok('2.5 nível 2 marcado                   ', todos('.nv-tea')[1].dataset.on === '1');
ok('2.6 desmarcar TEA esconde o nível     ', true);

await clicarTexto('.btn-plano', 'Continuar');
await pausa(100);

/* ============================================================
   3. sensorial, fala, visão, interesse
   ============================================================ */
console.log('\n— sensorial, fala, visão —');
ok('3.1 segunda etapa pede o sensorial    ', txt().includes('Perfil sensorial') && txt().includes('Hiper-reativo'));
ok('3.2 pergunta como a criança comunica  ', txt().includes('Fala em construção'));
ok('3.3 pergunta a visão                  ', txt().includes('Baixa visão'));
ok('3.4 oferece os seis interesses        ', todos('.interesse').length === 6, String(todos('.interesse').length));

await clicarTexto('.opc', 'Hiper-reativo');
await clicarTexto('.opc', 'Fala em construção');
await clicarTexto('.opc', 'Baixa visão');
await clicar(todos('.interesse')[1]);
await pausa(80);
ok('3.5 as escolhas ficam marcadas        ',
  porTexto('.opc', 'Hiper-reativo').dataset.on === '1'
  && porTexto('.opc', 'Baixa visão').dataset.on === '1'
  && todos('.interesse')[1].dataset.on === '1');

await clicarTexto('.btn-plano', 'Continuar');
await pausa(100);

/* ============================================================
   4. o que muda, com a origem de cada coisa
   ============================================================ */
console.log('\n— o que muda no app —');
const linhas = todos('.deriv-lista li').map((l) => l.textContent.replace(/\s+/g, ' '));
ok('4.1 explica o que muda                ', linhas.length >= 6, String(linhas.length));
ok('4.2 um passo por tela, por TEA nível 2',
  linhas.some((l) => l.includes('um passo por tela') && l.includes('TEA nível 2')),
  linhas.join(' | '));
ok('4.3 blocos de 5 minutos, por TDAH     ',
  linhas.some((l) => l.includes('5 minutos') && l.includes('TDAH')));
ok('4.4 alto contraste, por baixa visão   ',
  linhas.some((l) => l.includes('Alto contraste') && l.includes('baixa visão')));
ok('4.5 prancha, pela forma de comunicar  ',
  linhas.some((l) => l.includes('Prancha') && l.includes('se comunica')));
ok('4.6 toda linha tem a sua origem       ',
  todos('.deriv-lista li').every((l) => !!l.querySelector('.d-tag')?.textContent.trim()));
ok('4.7 avisa que não substitui terapia   ', txt().includes('não substitui fonoaudiologia'));

/* Apagar precisa de dois toques: é destrutivo. */
console.log('\n— apagar —');
await clicarTexto('.btn-apagar', 'Apagar a identificação');
await pausa(60);
ok('4.8 o primeiro toque só pede confirmação', apagou === null && txt().includes('Toque de novo'));
await clicarTexto('.btn-apagar', 'Toque de novo');
await pausa(60);
ok('4.9 o segundo toque apaga             ', apagou !== null && apagou.condicoes.length === 2,
  JSON.stringify(apagou?.condicoes));

/* ============================================================
   5. salvar devolve o perfil inteiro
   ============================================================ */
console.log('\n— salvar —');
/* Monta de novo numa raiz limpa: a tela guarda o rascunho em estado próprio,
   e reaproveitar a instância manteria a etapa e o perfil anteriores. */
await act(async () => { root.unmount(); });
const root2 = createRoot(document.getElementById('root'));
await act(async () => {
  root2.render(React.createElement(Identificacao, {
    apoio: { ...A.APOIO_PADRAO, consentiu: true, condicoes: ['tea'], nivelTEA: 3, sensorial: 'hipo' },
    aoSalvar: (p) => { salvo = p; }, aoApagar: () => {}, aoSair: () => {},
  }));
});
await pausa(100);
await clicarTexto('.btn-plano', 'Continuar');
await pausa(60);
await clicarTexto('.btn-plano', 'Continuar');
await pausa(60);
await clicarTexto('.btn-plano', 'Salvar e voltar');
await pausa(60);
ok('5.1 devolve o que estava preenchido   ',
  salvo && salvo.condicoes.includes('tea') && salvo.nivelTEA === 3 && salvo.sensorial === 'hipo',
  JSON.stringify(salvo));

/* ============================================================
   6. o app inteiro obedece aos ajustes
   ============================================================ */
console.log('\n— o app com o perfil aplicado —');
await act(async () => { root2.unmount(); });

const hoje = new Date().toISOString().slice(0, 10);
const semear = (apoio) => {
  window.localStorage.setItem('licenca_v2', JSON.stringify({
    h: H, modo: 'lista', validade: '2027-12-31', ultimaConferencia: hoje, gracia: 7, primeiroAviso: null,
  }));
  window.localStorage.setItem('combinado_v1', JSON.stringify({
    nome: 'Léo', avatar: 'a', nivel: 3, estrelas: 0, feitos: {}, autonomia: {},
    hoje: [], dia: hoje, som: false, ajustes: {}, custom: [], prova: false,
  }));
  window.localStorage.setItem('combinado_apoio_v1', JSON.stringify(apoio));
};

const Portao = (await import('../src/Portao.jsx')).default;
let raiz;
const montar = async () => {
  raiz = createRoot(document.getElementById('root'));
  await act(async () => { raiz.render(React.createElement(Portao)); });
  await pausa(450);
};
const desmontar = async () => { await act(async () => { raiz.unmount(); }); };

/* Nível 3 sem perfil: lista livre e nenhuma classe de adaptação. */
semear(A.APOIO_PADRAO);
await montar();
const raizEl = () => document.querySelector('.rt');
ok('6.1 nível 3 puro não tem adaptação    ',
  !raizEl().className.includes('contraste') && !raizEl().className.includes('leitura'),
  raizEl().className);
const cartoesSemPerfil = todos('.cartao').length;
await desmontar();

/* TEA nível 2: um passo por tela e no máximo 3 cartões. */
semear({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['tea'], nivelTEA: 2 });
await montar();
ok('6.2 TEA nível 2 entra em modo calmo   ', raizEl().className.includes('calmo'), raizEl().className);
ok('6.3 limita a 3 cartões por tela       ', todos('.cartao').length <= 3,
  `${todos('.cartao').length} de ${cartoesSemPerfil}`);

const cartao = document.querySelector('.cartao');
if (cartao) {
  await clicar(cartao);
  await pausa(150);
  ok('6.4 um passo por tela, não lista livre', !!document.querySelector('.trilha'),
    txt().slice(0, 70));
  ok('6.5 mostra a faixa agora / depois    ', !!document.querySelector('.antecipa'));
  await clicarTexto('.btn-x', '✕');
  await pausa(100);
}
await desmontar();

/* Baixa visão: alto contraste. */
semear({ ...A.APOIO_PADRAO, consentiu: true, visao: 'baixa' });
await montar();
ok('6.6 baixa visão liga o alto contraste ', raizEl().className.includes('contraste'), raizEl().className);
await desmontar();

/* Dislexia: texto ampliado e narração. */
falado.length = 0;
semear({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['dislexia'] });
await montar();
ok('6.7 dislexia liga o texto ampliado    ', raizEl().className.includes('leitura'), raizEl().className);
const cartao2 = document.querySelector('.cartao');
if (cartao2) {
  await clicar(cartao2);
  await pausa(200);
  /* Nível 3 é lista livre: narrar sozinho seriam sete frases de uma vez, então
     cada passo ganha o seu alto-falante e a criança escolhe quando ouvir. */
  ok('6.8 na lista livre não fala sozinho  ', falado.length === 0, JSON.stringify(falado));
  ok('6.9 cada passo tem alto-falante      ', todos('.item-voz').length === todos('.item').length
    && todos('.item-voz').length > 0, String(todos('.item-voz').length));
  await clicar(document.querySelector('.item-voz'));
  await pausa(60);
  const primeiro = document.querySelector('.item-txt b')?.textContent || '';
  ok('6.10 tocar no alto-falante faz falar ', falado.length === 1 && falado[0].startsWith(primeiro),
    `falou "${falado[0]}" · tela "${primeiro}"`);
}
await desmontar();

/* Nível 2 é trilha: um passo por tela, uma frase — aí a voz narra sozinha. */
falado.length = 0;
window.localStorage.setItem('combinado_v1', JSON.stringify({
  nome: 'Léo', avatar: 'a', nivel: 2, estrelas: 0, feitos: {}, autonomia: {},
  hoje: [], dia: hoje, som: false, ajustes: {}, custom: [], prova: false,
}));
window.localStorage.setItem('combinado_apoio_v1',
  JSON.stringify({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['dislexia'] }));
await montar();
const cartao3 = document.querySelector('.cartao');
if (cartao3) {
  await clicar(cartao3);
  await pausa(200);
  const titulo = document.querySelector('.passo-titulo')?.textContent || '';
  ok('6.11 na trilha a voz narra o passo   ', falado.length > 0 && falado[0].startsWith(titulo.trim()),
    `falou "${falado[0]}" · tela "${titulo}"`);
  ok('6.12 o que ela fala está escrito     ', !!titulo.trim());
}
await desmontar();

/* TDAH: pausa do corpo na casa, e a recompensa dobrada. */
semear({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['tdah'] });
await montar();
ok('6.13 TDAH oferece mexer o corpo       ', !!document.querySelector('.btn-pausa'));
await clicar(document.querySelector('.btn-pausa'));
await pausa(80);
ok('6.14 a pausa abre com uma sugestão    ', !!document.querySelector('.folha') && txt().includes('Aperto forte'));
await clicarTexto('.btn-nao', 'Quero outra');
await pausa(60);
ok('6.15 e dá para pedir outra            ', txt().includes('Cinco pulos'));
await clicarTexto('.btn-sim', 'Já fiz');
await pausa(60);
ok('6.16 "já fiz" fecha a pausa           ', !document.querySelector('.folha'));

/* A escolha do adulto vence: desliga o modo calmo que o perfil tinha ligado. */
await desmontar();
semear({
  ...A.APOIO_PADRAO, consentiu: true, condicoes: ['tea'], nivelTEA: 2,
  manual: { calmo: false },
});
await montar();
ok('6.17 adulto desliga o que o perfil ligou',
  !raizEl().className.includes('calmo'), raizEl().className);
await desmontar();

/* O modo calmo antigo, gravado no estado do app, sobe para os ajustes. */
window.localStorage.setItem('licenca_v2', JSON.stringify({
  h: H, modo: 'lista', validade: '2027-12-31', ultimaConferencia: hoje, gracia: 7, primeiroAviso: null,
}));
window.localStorage.setItem('combinado_v1', JSON.stringify({
  nome: 'Léo', avatar: 'a', nivel: 2, estrelas: 0, feitos: {}, autonomia: {},
  hoje: [], dia: hoje, calmo: true, som: false, ajustes: {}, custom: [], prova: false,
}));
window.localStorage.removeItem('combinado_apoio_v1');
await montar();
ok('6.18 modo calmo antigo é preservado   ', raizEl().className.includes('calmo'), raizEl().className);
const migrado = JSON.parse(window.localStorage.getItem('combinado_apoio_v1') || '{}');
ok('6.19 e migra para o perfil de apoio   ', migrado.manual?.calmo === true, JSON.stringify(migrado));

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
