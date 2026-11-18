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

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const N = await import('../src/nivel4.js');
const Jovem = (await import('../src/Jovem.jsx')).default;
const { PassagemAdulto, PassagemJovem, AvisoRetomada } = await import('../src/Passagem.jsx');

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

const dia = (n, base = '2026-11-18') => {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const HOJE = '2026-11-18';

/* ============================================================
   1. a licença decide se o nível 4 existe — e não quem é dono
   ============================================================ */
console.log('\n— licença —');

ok('1.1 licença antiga não libera         ', !N.permiteNivel4({ h: 'x', apelido: 'a' }));
ok('1.2 licença com o campo falso não     ', !N.permiteNivel4({ nivel4: false }));
ok('1.3 licença com o campo verdadeiro sim', N.permiteNivel4({ nivel4: true }));
ok('1.4 sem licença nenhuma, não          ', !N.permiteNivel4(null));

/* A família não renova licença de clínica: mandá-la renovar é mandar fazer
   o que ela não pode. */
ok('1.5 aviso de clínica vai para a clínica', N.avisoDeLicencaPara({ titular: 'clinica' }) === 'clinica');
ok('1.6 aviso de pessoa vai ao responsável ', N.avisoDeLicencaPara({ titular: 'pessoa' }) === 'responsavel');
ok('1.7 licença antiga trata como pessoa   ', N.avisoDeLicencaPara({}) === 'responsavel');

/* A licença define a RESPONSABILIDADE, nunca a propriedade da rotina: um
   app pode ter licença de clínica e dono jovem ao mesmo tempo. */
ok('1.8 licença não decide quem é dono     ',
  N.ehDono(N.passar({ ...N.PADRAO_N4 })) === true && N.ehDono({ ...N.PADRAO_N4 }) === false);

/* ============================================================
   2. a retomada nunca é silenciosa
   ============================================================ */
console.log('\n— a retomada deixa rastro —');

const passado = N.passar({ ...N.PADRAO_N4 });
ok('2.1 passar torna o jovem dono         ', N.ehDono(passado));
ok('2.2 e limpa o pedido                  ', passado.pedido === '');

const devolvido = N.retomar(passado, HOJE);
ok('2.3 retomar devolve ao adulto         ', !N.ehDono(devolvido));
/* Autonomia revogável em segredo é pior que autonomia nenhuma: ensina que o
   controle era da boca para fora. */
ok('2.4 e deixa a data para avisar o jovem', devolvido.retomadoEm === HOJE, devolvido.retomadoEm);
ok('2.5 o aviso some depois de visto      ', N.viuRetomada(devolvido).retomadoEm === '');
ok('2.6 passar de novo limpa o rastro     ', N.passar(devolvido).retomadoEm === '');

/* ============================================================
   3. a partilha: o adulto vê o que o jovem ligou, e nunca as notas
   ============================================================ */
console.log('\n— partilha —');

ok('3.1 fora do nível 4 o adulto vê tudo  ',
  JSON.stringify(N.adultoVe({ ...N.PADRAO_N4 })) === JSON.stringify({ rotina: true, travamentos: true, notas: true }));

const jovem = N.passar({ ...N.PADRAO_N4 });
const vista = N.adultoVe(jovem);
ok('3.2 na passagem ele não vê nada       ', !vista.rotina && !vista.travamentos && !vista.notas);

const comRotina = N.virarPartilha(jovem, 'rotina');
ok('3.3 ligar a rotina mostra a rotina    ', N.adultoVe(comRotina).rotina === true);
ok('3.4 e só ela                          ', N.adultoVe(comRotina).travamentos === false);
ok('3.5 virar de novo desliga             ', N.adultoVe(N.virarPartilha(comRotina, 'rotina')).rotina === false);

/* As anotações não têm interruptor: nem a tela nem o código aceitam ligar. */
const tentou = N.virarPartilha(jovem, 'notas');
ok('3.6 as anotações não ligam nem no código', N.adultoVe(tentou).notas === false);
ok('3.7 e tentar não muda nada            ', tentou === jovem);
ok('3.8 o canal das notas é marcado travado',
  (N.CANAIS.find((c) => c.id === 'notas') || {}).travado === true);

/* ============================================================
   4. o número conta o ambiente, nunca a pessoa
   ============================================================ */
console.log('\n— padrão sem nota —');

const TAREFA = { id: 'remedio', nome: 'Remédio', dias: [0, 1, 2, 3, 4, 5, 6] };
const historico = [
  { dia: dia(1), feitas: ['remedio'] },
  { dia: dia(2), feitas: [] },
  { dia: dia(3), feitas: ['remedio'] },
];
const fita = N.fitaDe({ tarefa: TAREFA, historico, hojeFeitas: ['remedio'], hoje: HOJE, dias: 4 });
ok('4.1 a fita tem um lugar por dia       ', fita.length === 4);
ok('4.2 e lê do mais antigo ao hoje       ',
  fita.map((f) => f.estado).join(' ') === 'feito nao feito feito', fita.map((f) => f.estado).join(' '));
/* Sem isto a tarefa cumprida há dez minutos apareceria como falha: o dia de
   hoje só vai para o histórico na virada. */
ok('4.3 hoje entra antes de ser arquivado ', fita[3].estado === 'feito');

const folgada = N.fitaDe({ tarefa: { ...TAREFA, dias: [1] }, historico: [], hoje: HOJE, dias: 7 });
ok('4.4 dia sem cobrança não vira falha   ',
  folgada.filter((f) => f.estado === 'folga').length === 6, JSON.stringify(folgada.map((f) => f.estado)));

const notas = [
  { tarefa: 'remedio', fonte: 'jovem', dia: dia(1), etiquetas: ['esqueci'] },
  { tarefa: 'remedio', fonte: 'jovem', dia: dia(2), etiquetas: ['esqueci', 'não era hora boa'] },
  { tarefa: 'outra', fonte: 'jovem', dia: dia(1), etiquetas: ['barulho'] },
  { tarefa: 'remedio', fonte: 'adulto', dia: dia(1), etiquetas: ['travou no mesmo passo'] },
];
const marcado = N.marcadoQuandoTravou({ tarefa: TAREFA, notas, hoje: HOJE });
ok('4.5 conta o que ELE marcou            ',
  marcado[0].rotulo === 'esqueci' && marcado[0].vezes === 2, JSON.stringify(marcado));
ok('4.6 e ignora o que o adulto anotou    ',
  !marcado.some((m) => m.rotulo.includes('passo')), JSON.stringify(marcado));
ok('4.7 e ignora outras tarefas           ', !marcado.some((m) => m.rotulo === 'barulho'));

/* O motor não expõe nenhuma contagem de acertos, nem percentual, nem
   sequência: o único número que existe é sobre o ambiente. */
ok('4.8 não existe função de placar       ',
  !Object.keys(N).some((k) => /percent|nota|placar|sequencia|streak|media/i.test(k)),
  Object.keys(N).join(' '));

/* ============================================================
   5. a recompensa é menos app
   ============================================================ */
console.log('\n— menos app —');

const cheio = [];
for (let i = 1; i <= 50; i++) cheio.push({ dia: dia(i), feitas: ['remedio'] });
ok('5.1 seis semanas limpas oferecem parar',
  N.podeOferecerMenos({ tarefa: TAREFA, historico: cheio, hojeFeitas: ['remedio'], hoje: HOJE }));
/* Uma falha não zera nada: ela só adia a oferta. */
const comFalha = cheio.map((r, i) => (i === 10 ? { ...r, feitas: [] } : r));
ok('5.2 uma falha adia a oferta           ',
  !N.podeOferecerMenos({ tarefa: TAREFA, historico: comFalha, hojeFeitas: ['remedio'], hoje: HOJE }));
ok('5.3 histórico curto não oferece       ',
  !N.podeOferecerMenos({ tarefa: TAREFA, historico: [], hojeFeitas: [], hoje: HOJE }));
ok('5.4 quem já calou não é oferecido     ',
  !N.podeOferecerMenos({ tarefa: { ...TAREFA, semLembrete: true }, historico: cheio, hoje: HOJE }));

ok('5.5 calar não apaga a tarefa          ',
  JSON.stringify(N.aplicarMenos('calar')) === JSON.stringify({ semLembrete: true }));
/* "Tirar" é o mesmo `oculta` que o responsável já usa: volta no mesmo lugar,
   e nada é destruído. */
ok('5.6 tirar é ocultar, não apagar       ',
  JSON.stringify(N.aplicarMenos('tirar')) === JSON.stringify({ oculta: true }));
ok('5.7 manter não muda nada              ', Object.keys(N.aplicarMenos('manter')).length === 0);

/* ============================================================
   6. o pedido do jovem
   ============================================================ */
console.log('\n— pedir o app —');

const pediu = N.pedir({ ...N.PADRAO_N4 }, HOJE);
ok('6.1 pedir guarda a data               ', pediu.pedido === HOJE);
ok('6.2 e não torna ninguém dono          ', !N.ehDono(pediu), 'pedir não é passar');
ok('6.3 dispensar limpa o pedido          ', N.limparPedido(pediu).pedido === '');

/* ============================================================
   7. as telas
   ============================================================ */
console.log('\n— as telas —');

const root = createRoot(document.getElementById('root'));
const montar = async (el) => { await act(async () => { root.render(el); }); };

/* --- a passagem, lado do adulto --- */
let passou = false;
await montar(React.createElement(PassagemAdulto, {
  nome: 'Theo', aoPassar: () => { passou = true; }, aoCancelar: () => {},
}));
ok('7.1 diz o que o adulto abre mão       ', txt().includes('decide o que você vê'));
ok('7.2 e avisa que a retomada é contada  ', txt().includes('conta para Theo'));
/* Botão que nunca fica mudo, como na tela de código: ele responde e diz o
   que falta, em vez de parecer quebrado. */
await clicarTexto('.btn-plano', 'Passar o app');
ok('7.3 sem marcar, não passa             ', !passou);
ok('7.4 e diz o que falta                 ', txt().includes('Marque a caixa'));
/* No React a mudança de um checkbox vem do clique, não de um evento
   `change` sintetizado à mão. */
await clicar(document.querySelector('.psg-check input'));
await clicarTexto('.btn-plano', 'Passar o app');
ok('7.5 marcando, passa                   ', passou);

/* --- a passagem, lado do jovem --- */
await montar(React.createElement(PassagemJovem, { nome: 'Theo', deQuem: 'Ana', aoComecar: () => {} }));
ok('7.6 o jovem é recebido pelo nome      ', txt().includes('Theo'));
ok('7.7 e sabe que pode perder o app      ', txt().includes('pegar o app de volta'));
ok('7.8 e que as anotações são dele       ', txt().includes('só suas'));

/* --- o aviso da retomada --- */
await montar(React.createElement(AvisoRetomada, { em: HOJE, aoEntender: () => {} }));
ok('7.9 a retomada é contada a ele        ', txt().includes('voltou para quem cuida de você'));
ok('7.10 sem culpar nem esconder          ', txt().includes('não descobrir sozinho'));

/* --- a casa do jovem --- */
const TAREFAS = [
  { id: 'remedio', nome: 'Remédio', horario: '07:00', dias: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'louca', nome: 'Lavar a louça', horario: '13:30', dias: [0, 1, 2, 3, 4, 5, 6] },
];
const dJovem = { ...N.passar({ ...N.PADRAO_N4 }), hoje: ['remedio'], historico: cheio };
let virou = '';
let devolveu = false;
await montar(React.createElement(Jovem, {
  d: dJovem, tarefas: TAREFAS, hoje: HOJE, notas, deQuem: 'Ana',
  aoAbrir: () => {}, aoNova: () => {}, aoVirarPartilha: (c) => { virou = c; },
  aoNotas: () => {}, aoMenos: () => {}, aoDevolver: () => { devolveu = true; },
}));
ok('7.11 a casa abre no hoje              ', txt().includes('Hoje'));
ok('7.12 com as tarefas do dia            ', todos('.jv-item').length === 2);
ok('7.13 e o que já foi feito marcado     ',
  todos('.jv-item').filter((e) => e.dataset.ok === '1').length === 1);
/* Somem o personagem e a moeda: é o que o nível inteiro significa. */
ok('7.14 sem pontos e sem personagem      ',
  !/ponto|estrela/i.test(txt()) && !document.querySelector('.btn-avatar'), txt().slice(0, 90));
ok('7.15 dá para montar tarefa nova       ', Boolean(porTexto('.jv-nova', 'Nova')));

await clicar(todos('.jv-b')[2]);
ok('7.16 os ajustes mostram a partilha    ', txt().includes('O que Ana vê'));
await clicar(document.querySelector('.jv-toggle'));
ok('7.17 e o interruptor avisa qual canal ', virou === 'rotina', virou);
ok('7.18 as anotações aparecem travadas   ', Boolean(document.querySelector('.jv-cadeado')));
ok('7.19 e não há interruptor para elas   ', todos('.jv-toggle').length === N.CANAIS.length - 1);
await clicarTexto('.btn-plano', 'Devolver');
ok('7.20 ele pode devolver o app          ', devolveu);

await clicar(todos('.jv-b')[1]);
ok('7.21 o padrão mostra a fita           ', todos('.jv-mc').length === N.DIAS_FITA);
ok('7.22 e o que ele marcou               ', txt().includes('Quando travou'));
/* A frase que segura a invariante 2, escrita na tela para o jovem ler. */
ok('7.23 dizendo que o número é do ambiente', txt().includes('conta o ambiente, não você'));
/* O que não pode existir é NÚMERO de desempenho: "62%", "12 dias seguidos".
   A frase que explica a ausência deles pode — e deve — citar as palavras. */
ok('7.24 nenhum número de desempenho      ',
  !/\d+\s*%/.test(txt()) && !/\d+\s*dias seguidos/i.test(txt()), txt().slice(0, 100));
ok('7.25 e oferece parar de lembrar       ', txt().includes('parece resolvido'));

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
