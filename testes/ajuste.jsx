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

/* A voz é do aparelho: aqui só guardamos o que ela teria falado. */
const falado = [];
dom.window.speechSynthesis = { cancel() {}, speak(u) { falado.push(u.text); }, getVoices() { return []; } };
dom.window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const A = await import('../src/ajuste.js');
const Ajuste = (await import('../src/Ajuste.jsx')).default;
const Atrapalhou = (await import('../src/Atrapalhou.jsx')).default;
const { ARTES_ATRAPALHOU } = await import('../src/Atrapalhou.jsx');
const { APOIO_PADRAO, derivarAjustes } = await import('../src/apoio.js');

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
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

/* ---------------------------------------------------------------- cenário */

const perfil = (extra) => ({ ...APOIO_PADRAO, consentiu: true, ...extra });
const TEA2 = perfil({ condicoes: ['tea'], nivelTEA: 2, sensorial: 'hiper' });
const TDAH = perfil({ condicoes: ['tdah'], sensorial: 'hipo' });
const PRANCHA = perfil({ condicoes: ['tea'], nivelTEA: 3, sensorial: 'misto', comunicacao: 'prancha' });
const LEITURA = perfil({ condicoes: ['dislexia'], visao: 'baixa' });

const DENTES = {
  id: 'dentes', nome: 'Escovar os dentes', horario: '07:15', momento: 'manha', dias: [1, 2, 3, 4, 5, 6, 0],
  n: {
    1: [{ t: 'Pegar a escova' }, { t: 'Escovar' }],
    2: [{ t: 'Molhar a escova' }, { t: 'Pôr a pasta' }, { t: 'Escovar' }],
    3: [{ t: 'Molhar a escova' }, { t: 'Pôr a pasta' }, { t: 'Escovar os dentes' }, { t: 'Bochechar e cuspir' }],
  },
};
const CAFE = { id: 'cafe', nome: 'Tomar café', horario: '07:50', momento: 'manha', dias: [1, 2, 3, 4, 5], n: { 1: [], 2: [], 3: [] } };
const BANHO = { id: 'banho', nome: 'Tomar banho', horario: '19:10', momento: 'noite', dias: [1, 2, 3, 4, 5], n: { 1: [], 2: [], 3: [] } };
const TAREFAS = [DENTES, CAFE, BANHO];
const ctx = (apoio, extra = {}) =>
  A.contextoDe({ tarefa: DENTES, nivel: 3, apoio, tarefas: TAREFAS, ...extra });

/* ============================================================
   1. o vocabulário é de comportamento, não de sintoma
   ============================================================ */
console.log('\n— vocabulário —');

/* A mesma trava do caderno: se uma pergunta ou uma proposta parecer nome de
   sintoma ou de condição, ela não entra. O app descreve o que foi visto e
   muda o que ele próprio faz; não nomeia o que a criança tem. */
const PROIBIDAS = ['autis', 'tea ', 'tdah', 'hipersens', 'hiposens', 'déficit', 'deficit',
  'transtorno', 'sintoma', 'disfun', 'estereotip', 'crise sensorial', 'birra',
  'diagnóstic', 'terapia', 'tratament', 'desregul', 'comportamento disruptiv'];

/* O texto que a criança e o responsável leem. As justificativas "pelo perfil"
   ficam de fora porque elas citam o perfil de propósito — é o que explica ao
   responsável por que a pergunta mudou. */
const textoVisivel = [
  ...A.PONTOS.flatMap((p) => [p.rotulo, p.sub]),
  ...A.SONDAS.flatMap((s) => [s.pergunta, s.dica || '', ...(s.opcoes || []).map((o) => o.rotulo)]),
  ...Object.values(A.PROPOSTAS).flatMap((p) => [p.titulo, p.porque]),
  ...A.ATRAPALHOU.map((o) => o.rotulo),
].filter(Boolean);

const suspeitas = textoVisivel.filter((t) => PROIBIDAS.some((p) => t.toLowerCase().includes(p)));
ok('1.1 nada nomeia condição ou sintoma   ', suspeitas.length === 0, suspeitas.join(' | '));

/* Pergunta que começa com "por que" pede justificativa, e de uma criança que
   falha na mesma tarefa todo dia isso é acusação. */
ok('1.2 a criança não é perguntada "por quê"',
  !A.ATRAPALHOU.some((o) => /por que|porque/i.test(o.rotulo)));
ok('1.3 toda proposta muda o app          ',
  Object.values(A.PROPOSTAS).every((p) => p.alvo === 'tarefa' || p.alvo === 'perfil'),
  Object.entries(A.PROPOSTAS).filter(([, p]) => !['tarefa', 'perfil'].includes(p.alvo)).map(([k]) => k).join(' '));

/* ============================================================
   2. o perfil escolhe as perguntas
   ============================================================ */
console.log('\n— especialização —');

const ids = (apoio, ponto) => A.sondasDe(ponto, apoio).map((s) => s.id);

ok('2.1 hiper-reativo é perguntado do estímulo',
  ids(TEA2, 'paraNoMeio').includes('sensorialEvita'));
ok('2.2 e quem não é, não é               ',
  !ids(LEITURA, 'paraNoMeio').includes('sensorialEvita'));
ok('2.3 TDAH é perguntado do tempo        ',
  ids(TDAH, 'paraNoMeio').includes('quantoAguenta'));
ok('2.4 quem usa prancha é perguntado do aviso',
  ids(PRANCHA, 'paraNoMeio').includes('comoPede'));
/* Para quem não fala, saber se o pedido de ajuda chega vem antes de qualquer
   sensorial: sem isso todo o resto é adivinhação. */
ok('2.5 e esse aviso vem antes do sensorial',
  ids(PRANCHA, 'paraNoMeio').indexOf('comoPede')
  < ids(PRANCHA, 'paraNoMeio').indexOf('sensorialEvita'));
ok('2.6 apoio à leitura muda a pergunta   ',
  ids(LEITURA, 'paraNoMeio').includes('entendeOPasso'));
ok('2.7 no máximo três perguntas          ',
  [TEA2, TDAH, PRANCHA, LEITURA].every((p) =>
    A.PONTOS.every((pt) => A.sondasDe(pt.id, p).length <= A.MAX_SONDAS)));
ok('2.8 todo ponto tem ao menos uma pergunta',
  A.PONTOS.every((pt) => A.sondasDe(pt.id, APOIO_PADRAO).length >= 1),
  A.PONTOS.filter((pt) => !A.sondasDe(pt.id, APOIO_PADRAO).length).map((p) => p.id).join(' '));

/* As opções do "em qual passo" saem da tarefa de verdade, não de lista fixa. */
const qual = A.SONDAS.find((s) => s.id === 'qualPasso');
const opcoesPasso = A.opcoesDa(qual, ctx(TEA2));
ok('2.9 os passos vêm da tarefa           ',
  opcoesPasso.some((o) => o.rotulo === 'Bochechar e cuspir'), opcoesPasso.map((o) => o.rotulo).join('|'));

/* ============================================================
   3. as propostas
   ============================================================ */
console.log('\n— propostas —');

const resp = (...rs) => rs;
const p1 = A.propostasDe(resp({ id: 'p2', propoe: ['passosFinos', 'reforcoDenso'] }), ctx(TEA2));
ok('3.1 propõe quebrar os passos          ', p1.some((p) => p.id === 'passosFinos'));
ok('3.2 e diz quantos passos vira         ',
  (p1.find((p) => p.id === 'passosFinos') || {}).efeito === 'Escovar os dentes: de 4 para 3 passos',
  (p1.find((p) => p.id === 'passosFinos') || {}).efeito);

/* Propor o que já está ligado faz o assistente parecer que não olhou. */
const jaDenso = { ...TEA2, manual: { reforcoDenso: true } };
ok('3.3 não propõe o que já está ligado   ',
  !A.propostasDe(resp({ id: 'x', propoe: ['reforcoDenso'] }), ctx(jaDenso)).some((p) => p.id === 'reforcoDenso'));

/* No nível 1 não existe quebra menor para emprestar. */
ok('3.4 sem nível abaixo, não propõe quebrar',
  !A.propostasDe(resp({ id: 'x', propoe: ['passosFinos'] }),
    A.contextoDe({ tarefa: DENTES, nivel: 1, apoio: TEA2, tarefas: TAREFAS })).length);

ok('3.5 mover encosta na vizinha do mesmo momento',
  (A.propostasDe(resp({ id: 'x', propoe: ['moverHorario'] }), ctx(TEA2))[0] || {}).valor === '07:50',
  JSON.stringify(A.propostasDe(resp({ id: 'x', propoe: ['moverHorario'] }), ctx(TEA2))[0]));
/* Fora do momento não é ajuste, é outra rotina: o app chegou a propor mover
   "se arrumar" das 07:00 para as 21:30, junto da hora de dormir. */
ok('3.6 e nunca para outro momento do dia',
  A.vizinhaDe(DENTES, [DENTES, BANHO]) === null);
ok('3.7 sem outra tarefa, não propõe mover',
  !A.propostasDe(resp({ id: 'x', propoe: ['moverHorario'] }),
    A.contextoDe({ tarefa: DENTES, nivel: 3, apoio: TEA2, tarefas: [DENTES] })).length);
/* Encostar numa tarefa do mesmo minuto não muda nada. */
ok('3.8 nem numa tarefa colada no horário',
  A.vizinhaDe(DENTES, [DENTES, { ...CAFE, horario: '07:20' }]) === null);

/* TEA2 e TDAH ja derivam blocos de foco, e o motor corretamente nao propoe
   o que ja esta ligado - por isso este caso usa um perfil que nao deriva. */
const SEMNADA = perfil({});
ok('3.9 o tempo da resposta vira o bloco  ',
  (A.propostasDe(resp({ id: 'tres', minutos: 3, propoe: ['blocos'] }), ctx(SEMNADA, { respostas: [{ minutos: 3 }] }))[0] || {}).valor === 3);
ok('3.10 quem já tem blocos não recebe    ',
  !A.propostasDe(resp({ id: 'tres', minutos: 3, propoe: ['blocos'] }), ctx(TDAH, { respostas: [{ minutos: 3 }] })).length);

ok('3.11 no máximo quatro propostas       ',
  A.propostasDe(resp({ id: 'x', propoe: Object.keys(A.PROPOSTAS) }), ctx(TEA2)).length <= A.MAX_PROPOSTAS);

ok('3.12 sem cronômetro, não propõe tirar ',
  !A.propostasDe(resp({ id: 'x', propoe: ['tirarCronometro'] }), ctx(TEA2)).length);
ok('3.13 com cronômetro, propõe           ',
  A.propostasDe(resp({ id: 'x', propoe: ['tirarCronometro'] }),
    A.contextoDe({ tarefa: { ...DENTES, duracao: 3 }, nivel: 3, apoio: TEA2, tarefas: TAREFAS })).length === 1);

/* ============================================================
   4. aplicar cai no lugar certo
   ============================================================ */
console.log('\n— aplicar —');

const d0 = { ajustes: {}, custom: [] };
const propTarefa = A.propostasDe(resp({ id: 'p2', propoe: ['passosFinos'] }), ctx(TEA2))[0];
const r1 = A.aplicar(propTarefa, { d: d0, apoio: TEA2, tarefa: DENTES });
ok('4.1 ajuste de tarefa cai em d.ajustes ', r1.d.ajustes.dentes.passosNivel === 2,
  JSON.stringify(r1.d.ajustes));
ok('4.2 e não toca no perfil              ', r1.apoio === TEA2);

/* TEA2 ja deriva antecipacao, entao aqui vale o perfil que nao deriva: o que
   se testa e onde a mudanca cai, nao a derivacao. */
const propPerfil = A.propostasDe(resp({ id: 'x', propoe: ['antecipacao'] }), ctx(SEMNADA))[0];
const r2 = A.aplicar(propPerfil, { d: d0, apoio: SEMNADA, tarefa: DENTES });
/* A escolha do adulto vence a derivação, hoje e depois de qualquer edição do
   perfil: é por isso que ela vai para `manual`, nunca para o corpo do perfil. */
ok('4.3 ajuste de perfil vai para manual  ', r2.apoio.manual.antecipacao === true);
ok('4.4 e governa a interface             ', derivarAjustes(r2.apoio).antecipacao === true);
ok('4.5 sem mexer no estado recebido      ', Object.keys(d0.ajustes).length === 0 && !SEMNADA.manual.antecipacao);

const r3 = A.aplicarTodas([propTarefa, propPerfil], { d: d0, apoio: SEMNADA, tarefa: DENTES });
ok('4.6 aplicar várias de uma vez         ',
  r3.d.ajustes.dentes.passosNivel === 2 && r3.apoio.manual.antecipacao === true);

/* ============================================================
   5. o caderno
   ============================================================ */
console.log('\n— caderno —');

const ponto = A.PONTOS.find((p) => p.id === 'paraNoMeio');
const frase = A.fraseDoAjuste(ponto,
  [{ id: 'p2', rotulo: 'Escovar os dentes', propoe: ['x'] }, { id: 'luz', rotulo: 'A luz do lugar', propoe: ['y'] }],
  DENTES);
ok('5.1 vira frase, não lista solta       ',
  frase === 'Escovar os dentes: começa e para no meio, no passo "escovar os dentes". A luz do lugar.', frase);

const nc = A.notaDaCrianca(['barulho', 'longo'], DENTES);
ok('5.2 a fala dela é atribuída a ela     ', nc.fonte === 'crianca' && nc.texto.startsWith('Ela disse:'), nc.texto);
ok('5.3 e fica presa à tarefa             ', nc.tarefa === 'dentes');
/* No resumo da consulta a terapeuta precisa saber quem falou: a fala da
   criança nunca entra como se fosse observação do adulto. */
ok('5.4 sem total, média nem tendência    ', !/\d+\s*(vezes|%|média)/i.test(nc.texto));

/* ============================================================
   6. o que atrapalhou — a tela da criança
   ============================================================ */
console.log('\n— a tela da criança —');

ok('6.1 quem busca movimento não é perguntado de barulho',
  !A.atrapalhouDe(TDAH).some((o) => o.id === 'barulho'));
ok('6.2 quem evita estímulo é             ', A.atrapalhouDe(TEA2).some((o) => o.id === 'barulho'));
ok('6.3 "não sei" existe sempre           ',
  [TEA2, TDAH, PRANCHA, LEITURA].every((p) => A.atrapalhouDe(p).some((o) => o.id === 'naoSei')));
ok('6.4 e não propõe nada                 ',
  A.ATRAPALHOU.find((o) => o.id === 'naoSei').propoe.length === 0);
/* Parte de quem usa esta tela não lê: cada opção precisa do próprio desenho. */
ok('6.5 toda opção tem desenho            ',
  A.ATRAPALHOU.every((o) => ARTES_ATRAPALHOU[o.id]),
  A.ATRAPALHOU.filter((o) => !ARTES_ATRAPALHOU[o.id]).map((o) => o.id).join(' '));

const root = createRoot(document.getElementById('root'));
let respondeu = null;
let pulou = false;
await act(async () => {
  root.render(React.createElement(Atrapalhou, {
    apoio: TEA2, tarefa: DENTES, voz: false,
    aoResponder: (e) => { respondeu = e; }, aoPular: () => { pulou = true; },
  }));
});
ok('6.6 pergunta o que atrapalhou         ', txt().includes('O que atrapalhou?'));
ok('6.7 e nunca "por que você não fez"    ', !/por que/i.test(txt()));
ok('6.8 mostra as opções do perfil        ', todos('.atrap-op').length === A.atrapalhouDe(TEA2).length);

/* Sem escolher nada, a saída é "não quero dizer" — resposta inteira. */
ok('6.9 sem escolha, o botão é de dispensa', porTexto('.atrap-pronto', 'Não quero dizer'));
await clicarTexto('.atrap-pronto', 'Não quero dizer');
ok('6.10 e dispensar não grava escolha    ', pulou && respondeu === null);

await act(async () => {
  root.render(React.createElement(Atrapalhou, {
    apoio: TEA2, tarefa: DENTES, voz: false,
    aoResponder: (e) => { respondeu = e; }, aoPular: () => { pulou = true; },
  }));
});
falado.length = 0;
await clicar(todos('.atrap-op')[0]);
/* A voz lê o que ela tocou: numa tela de opções desenhadas é isso que
   substitui a leitura, e vale mesmo com a narração automática desligada. */
ok('6.11 a voz lê a opção tocada          ', falado.length === 1, falado.join('|'));
ok('6.12 com escolha, o botão vira Pronto ', Boolean(porTexto('.atrap-pronto', 'Pronto')));
await clicarTexto('.atrap-pronto', 'Pronto');
ok('6.13 e devolve o que ela marcou       ', Array.isArray(respondeu) && respondeu.length === 1, JSON.stringify(respondeu));
await act(async () => { root.unmount(); });

/* ============================================================
   7. o assistente — a tela do adulto
   ============================================================ */
console.log('\n— a tela do adulto —');

let gravado = null;
/* Raiz nova a cada abertura: re-renderizar o mesmo componente mantém o estado
   interno dele, e a segunda abertura começaria na tela de "Pronto". */
let raizAj = null;
const abrir = async (props = {}) => {
  if (raizAj) await act(async () => { raizAj.unmount(); });
  const alvo = document.createElement('div');
  document.body.appendChild(alvo);
  raizAj = createRoot(alvo);
  await act(async () => {
    raizAj.render(React.createElement(Ajuste, {
      d: d0, apoio: TEA2, tarefa: DENTES, nivel: 3, tarefas: TAREFAS, inicio: [],
      aoGravar: (x) => { gravado = x; }, voltar: () => {}, ...props,
    }));
  });
};

await abrir();
ok('7.1 começa perguntando onde trava     ', txt().includes('Escovar os dentes: onde trava?'));
ok('7.2 com os cinco pontos               ', todos('.aj-op').length === A.PONTOS.length);

await clicarTexto('.aj-op', 'Começa e para no meio');
ok('7.3 depois pergunta o passo           ', txt().includes('Em qual passo ela para?'));
await clicarTexto('.aj-op', 'Escovar os dentes');
ok('7.4 e aí a pergunta do perfil         ', txt().includes('que ela evita'));
/* O selo existe para o responsável ver que o app está usando o que ele já
   informou, em vez de perguntar tudo de novo. */
ok('7.5 marcada como vinda do perfil      ', txt().includes('pelo perfil'));
await clicarTexto('.aj-op', 'A luz do lugar');

ok('7.6 chega nas propostas               ', txt().includes('O que eu proponho mudar'));
ok('7.7 nada muda até ligar               ', txt().includes('Nada muda até você ligar'));
ok('7.8 e dá para só registrar            ', Boolean(porTexto('.btn-plano', 'Só registrar no caderno')));

await clicar(todos('.aj-lig')[0]);
ok('7.9 ligar muda o botão                ', Boolean(porTexto('.btn-plano', 'Aplicar o ajuste')));
await clicarTexto('.btn-plano', 'Aplicar o ajuste');
ok('7.10 grava estado e nota              ', gravado && gravado.nota && gravado.d && gravado.apoio);
ok('7.11 a nota é do adulto               ', gravado.nota.fonte === 'adulto', String(gravado.nota.fonte));
ok('7.12 e conta o que foi ajustado       ', gravado.nota.texto.includes('Ajustes:'), gravado.nota.texto);
ok('7.13 e confirma na tela               ', txt().includes('Pronto.'));

/* O que a criança disse chega como ponto de partida — e só. */
gravado = null;
await abrir({ inicio: ['barulho'] });
ok('7.14 o recado da criança aparece      ', txt().includes('Ela já contou'), txt().slice(0, 120));
await clicarTexto('.aj-op', 'Começa e para no meio');
await clicarTexto('.aj-op', 'Escovar os dentes');
await clicarTexto('.aj-op', 'Nada disso');
/* "Nada disso" não propõe nada sozinho, mas o barulho que ela relatou sim:
   é assim que a fala dela entra sem nunca ligar ajuste por conta própria. */
ok('7.15 e influencia as propostas        ', todos('.aj-prop h4').length > 0,
  todos('.aj-prop h4').map((e) => e.textContent).join('|'));
ok('7.16 sem ligar nada, nada é aplicado  ', Boolean(porTexto('.btn-plano', 'Só registrar no caderno')));
await clicarTexto('.btn-plano', 'Só registrar no caderno');
ok('7.17 e mesmo assim registra           ',
  gravado && Object.keys(gravado.d.ajustes || {}).length === 0 && gravado.nota.texto.length > 0);

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
