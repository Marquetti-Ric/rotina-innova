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

const falado = [];
dom.window.speechSynthesis = {
  cancel() {}, speak(u) { falado.push(u.text); }, getVoices() { return []; },
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
const Prancha = (await import('../src/Prancha.jsx')).default;
const Sentimentos = (await import('../src/Sentimentos.jsx')).default;

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const todos = (sel) => [...document.querySelectorAll(sel)];
const porTexto = (sel, t) => todos(sel).find((e) => e.textContent.includes(t));
const clicar = async (el) => {
  if (!el) throw new Error('sem elemento para clicar');
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};
const clicarTexto = async (sel, t) => clicar(porTexto(sel, t));
const celula = (p) => todos('.cel').find((c) => c.querySelector('.cel-nome')?.textContent === p);

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

/* ============================================================
   1. a prancha
   ============================================================ */
console.log('\n— prancha de comunicação —');
let chamou = null;
const root = createRoot(document.getElementById('root'));
await act(async () => {
  root.render(React.createElement(Prancha, {
    temAdultos: true, voltar: () => {}, aoChamar: (t) => { chamou = t; },
  }));
});
await pausa(120);

ok('1.1 as dezesseis palavras-núcleo      ', todos('.cel').length === 16, String(todos('.cel').length));
ok('1.2 cada símbolo é desenhado, não emoji',
  todos('.cel').every((c) => !!c.querySelector('.cel-arte svg')));
ok('1.3 tem pedido, recusa, ajuda e estado',
  ['quero', 'não', 'ajuda', 'dói', 'banheiro', 'parar'].every((p) => !!celula(p)));
ok('1.4 a tira começa explicando          ', txt().includes('Toque nos símbolos'));
ok('1.5 falar está travado sem frase      ', document.querySelector('.btn-falar').disabled === true);

falado.length = 0;
await clicar(celula('eu'));
await clicar(celula('quero'));
await clicar(celula('beber'));
await pausa(80);
ok('1.6 cada toque fala a palavra         ',
  falado.join('|') === 'eu|quero|beber', falado.join('|'));
ok('1.7 e monta a frase na tira           ',
  todos('.ficha').map((f) => f.textContent).join(' ') === 'eu quero beber',
  todos('.ficha').map((f) => f.textContent).join(' '));

falado.length = 0;
await clicar(document.querySelector('.btn-falar'));
await pausa(60);
ok('1.8 falar a frase diz tudo junto      ', falado[0] === 'eu quero beber', falado[0]);

await clicar(todos('.btn-mini-pr')[0]);
await pausa(60);
ok('1.9 voltar tira a última palavra      ', todos('.ficha').length === 2, String(todos('.ficha').length));
await clicar(todos('.btn-mini-pr')[1]);
await pausa(60);
ok('1.10 limpar apaga a frase             ', todos('.ficha').length === 0);
ok('1.11 e volta a travar o falar         ', document.querySelector('.btn-falar').disabled === true);

/* A frase montada vira o recado que vai para o adulto. */
await clicar(celula('eu'));
await clicar(celula('dói'));
await pausa(60);
ok('1.12 com frase, oferece levar ao adulto', !!porTexto('.btn-levar', 'Mostrar isso'));
await clicarTexto('.btn-levar', 'Mostrar isso');
await pausa(60);
ok('1.13 leva as palavras dela            ', chamou === 'eu dói', String(chamou));

/* O símbolo "meu adulto" é um atalho direto. */
chamou = null;
await clicar(celula('meu adulto'));
await pausa(60);
ok('1.14 o símbolo do adulto também chama ', chamou !== null, String(chamou));

/* Sem adulto cadastrado o símbolo não leva a lugar nenhum: entra na frase. */
await act(async () => { root.unmount(); });
const root2 = createRoot(document.getElementById('root'));
chamou = null;
await act(async () => {
  root2.render(React.createElement(Prancha, {
    temAdultos: false, voltar: () => {}, aoChamar: (t) => { chamou = t; },
  }));
});
await pausa(100);
await clicar(celula('meu adulto'));
await pausa(60);
ok('1.15 sem contato, o símbolo só fala   ', chamou === null && todos('.ficha').length === 1);
ok('1.16 e não oferece levar ao adulto    ', !porTexto('.btn-levar', 'Mostrar isso'));

/* ============================================================
   2. sentimentos
   ============================================================ */
console.log('\n— como eu estou —');
await act(async () => { root2.unmount(); });
const root3 = createRoot(document.getElementById('root'));
const registrado = [];
chamou = null;
await act(async () => {
  root3.render(React.createElement(Sentimentos, {
    nivel: 2, voz: false, temAdultos: true, voltar: () => {},
    aoRegistrar: (id) => registrado.push(id),
    aoChamar: (t) => { chamou = t; },
  }));
});
await pausa(120);

ok('2.1 as seis carinhas                  ', todos('.emo').length === 6, String(todos('.emo').length));
ok('2.2 desenhadas, não emoji             ', todos('.emo').every((e) => !!e.querySelector('.emo-arte svg')));
ok('2.3 nada escolhido, nada proposto     ', !document.querySelector('.resposta'));

await clicarTexto('.emo', 'triste');
await pausa(80);
ok('2.4 marcar registra a emoção          ', registrado.join(',') === 'triste', registrado.join(','));
ok('2.5 emoção pesada valida o sentimento ', txt().includes('Sentir isso é normal'), txt().slice(-120));
ok('2.6 oferece respirar                  ', !!porTexto('.btn-sim', 'Respirar agora'));
ok('2.7 e oferece contar para um adulto   ', !!porTexto('.btn-nao', 'Contar para um adulto'));

await clicarTexto('.btn-nao', 'Contar para um adulto');
await pausa(60);
ok('2.8 o recado sai com o que ela sente  ', chamou === 'estou triste', String(chamou));

await clicarTexto('.emo', 'feliz');
await pausa(80);
ok('2.9 emoção leve não chama adulto      ', !porTexto('.btn-nao', 'Contar para um adulto'));
ok('2.10 mas ainda oferece respirar       ', !!porTexto('.btn-sim', 'Respirar agora'));

/* A respiração: gesto concreto para os pequenos, instrução direta para os grandes. */
await clicarTexto('.btn-sim', 'Respirar agora');
await pausa(120);
ok('2.11 nível 2 respira com a flor       ', txt().includes('Cheire a flor'), txt().slice(0, 90));
ok('2.12 mostra a contagem e a rodada     ',
  !!document.querySelector('.ar-conta') && txt().includes('Rodada 1 de 3'));
ok('2.13 a bola acompanha o ar            ', document.querySelector('.bola-ar').dataset.cheia === '1');

await pausa(4400);
ok('2.14 depois de 4 s, muda de fase      ', txt().includes('Sopre a vela'), txt().slice(0, 90));
ok('2.15 e a bola esvazia                 ', document.querySelector('.bola-ar').dataset.cheia === '0');

await clicarTexto('.btn-plano', 'Terminei');
await pausa(80);
ok('2.16 terminar volta para as carinhas  ', todos('.emo').length === 6);

/* Nível 3 não recebe linguagem de criança pequena. */
await act(async () => { root3.unmount(); });
const root4 = createRoot(document.getElementById('root'));
await act(async () => {
  root4.render(React.createElement(Sentimentos, {
    nivel: 3, voz: false, temAdultos: false, voltar: () => {},
    aoRegistrar: () => {}, aoChamar: () => {},
  }));
});
await pausa(100);
await clicarTexto('.emo', 'bravo');
await pausa(60);
ok('2.17 nível 3 fala de regulação        ', txt().includes('corpo desacelera'), txt().slice(-120));
await clicarTexto('.btn-sim', 'Respirar agora');
await pausa(120);
ok('2.18 e respira sem flor nem vela      ', txt().includes('Puxe o ar') && !txt().includes('Cheire'),
  txt().slice(0, 90));
await act(async () => { root4.unmount(); });

/* ============================================================
   3. o app liga os módulos pelo perfil
   ============================================================ */
console.log('\n— ligados pelo perfil —');
const hoje = new Date().toISOString().slice(0, 10);
const semear = (apoio, extra = {}) => {
  window.localStorage.setItem('licenca_v2', JSON.stringify({
    h: H, modo: 'lista', validade: '2027-12-31', ultimaConferencia: hoje, gracia: 7, primeiroAviso: null,
  }));
  window.localStorage.setItem('combinado_v1', JSON.stringify({
    nome: 'Léo', avatar: 'a', nivel: 2, estrelas: 0, feitos: {}, autonomia: {},
    hoje: [], dia: hoje, som: false, ajustes: {}, custom: [], prova: false, diario: [], ...extra,
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

semear(A.APOIO_PADRAO);
await montar();
ok('3.1 sem perfil, nenhum módulo na casa ',
  !document.querySelector('.prancha-btn') && !document.querySelector('.btn-sentir'));
await desmontar();

semear({ ...A.APOIO_PADRAO, consentiu: true, comunicacao: 'mista' });
await montar();
ok('3.2 fala em construção põe a prancha  ', !!document.querySelector('.prancha-btn'));
await clicar(document.querySelector('.prancha-btn'));
await pausa(120);
ok('3.3 o botão abre a prancha            ', txt().includes('Minha prancha') && todos('.cel').length === 16);

/* A prancha fala mesmo com a narração automática desligada: aqui a voz é dela. */
falado.length = 0;
await clicar(celula('ajuda'));
await pausa(60);
ok('3.4 fala mesmo sem narração ligada    ', falado.join('|') === 'ajuda', falado.join('|'));
await desmontar();

semear({ ...A.APOIO_PADRAO, consentiu: true, condicoes: ['ansiedade'] });
await montar();
ok('3.5 ansiedade põe "como eu estou"     ', !!document.querySelector('.btn-sentir'));
await clicar(document.querySelector('.btn-sentir'));
await pausa(120);
ok('3.6 o atalho abre as carinhas         ', todos('.emo').length === 6);
await clicarTexto('.emo', 'com medo');
await pausa(100);
const guardado = JSON.parse(window.localStorage.getItem('combinado_v1')).diario || [];
ok('3.7 o registro fica no aparelho       ', guardado.length === 1 && guardado[0].e === 'medo',
  JSON.stringify(guardado));
await desmontar();

/* O responsável liga os módulos à mão, sem informar condição nenhuma. */
semear({ ...A.APOIO_PADRAO, manual: { prancha: true, sentimentos: true } });
await montar();
ok('3.8 o adulto liga os dois à mão       ',
  !!document.querySelector('.prancha-btn') && !!document.querySelector('.btn-sentir'));
await desmontar();

/* A contagem emocional na área dos responsáveis é contagem, não avaliação. */
semear(
  { ...A.APOIO_PADRAO, consentiu: true, condicoes: ['ansiedade'] },
  { diario: [{ e: 'medo', dia: hoje }, { e: 'medo', dia: hoje }, { e: 'feliz', dia: hoje }] },
);
await montar();
await act(async () => {
  /* A porta dos responsáveis exige toque contínuo; o teste entra pelo estado. */
  const casa = document.querySelector('.rt');
  if (casa) casa.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});
ok('3.9 o diário sobreviveu à gravação    ',
  (JSON.parse(window.localStorage.getItem('combinado_v1')).diario || []).length === 3);
await desmontar();

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
