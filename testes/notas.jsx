import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle'])
  global[k] = dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, 'crypto', { value: globalThis.crypto, configurable: true });
dom.window.speechSynthesis = { cancel() {}, speak() {}, getVoices() { return []; } };
dom.window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };

/* Área de transferência de mentira: guarda o que o app mandaria copiar. */
const copiado = [];
Object.defineProperty(dom.window.navigator, 'clipboard', {
  value: { writeText: async (t) => { copiado.push(t); } }, configurable: true,
});

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const N = await import('../src/notas.js');
const Notas = (await import('../src/Notas.jsx')).default;
const Relatorio = (await import('../src/Relatorio.jsx')).default;

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const todos = (sel) => [...document.querySelectorAll(sel)];
const porTexto = (sel, t) => todos(sel).find((e) => e.textContent.includes(t));
const clicar = async (el) => {
  if (!el) throw new Error('sem elemento para clicar');
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};
const clicarTexto = async (sel, t) => clicar(porTexto(sel, t));
const escrever = async (sel, v) => {
  await act(async () => {
    const el = document.querySelector(sel);
    const proto = el.tagName === 'TEXTAREA'
      ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
};

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

const dia = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

/* ============================================================
   1. o vocabulário é de comportamento, não de sintoma
   ============================================================ */
console.log('\n— vocabulário —');
const todasEtiquetas = Object.values(N.ETIQUETAS).flat();
/* Se uma etiqueta nova parecer nome de sintoma ou de condição, ela não entra:
   o app descreve o que foi visto, não nomeia o que a criança tem. */
const proibidas = ['autis', 'tea ', 'tdah', 'hipersens', 'hiposens', 'déficit', 'deficit',
  'transtorno', 'sintoma', 'disfun', 'atraso', 'estereotip', 'crise sensorial', 'birra'];
const suspeitas = todasEtiquetas.filter((e) => proibidas.some((p) => e.toLowerCase().includes(p)));
ok('1.1 nenhuma etiqueta nomeia condição  ', suspeitas.length === 0, suspeitas.join(' | '));
ok('1.2 os quatro tipos têm etiquetas     ',
  N.TIPOS.every((t) => (N.ETIQUETAS[t.id] || []).length >= 6),
  N.TIPOS.map((t) => `${t.id}:${(N.ETIQUETAS[t.id] || []).length}`).join(' '));
ok('1.3 há um tipo para o que deu certo   ', N.TIPOS.some((t) => t.id === 'conquista'));

/* ============================================================
   2. a nota
   ============================================================ */
console.log('\n— a nota —');
const vazia = N.novaNota();
ok('2.1 nota em branco não vale gravar    ', !N.temConteudo(vazia));
ok('2.2 só etiqueta já vale               ', N.temConteudo({ ...vazia, etiquetas: ['som alto'] }));
ok('2.3 só texto já vale                  ', N.temConteudo({ ...vazia, texto: 'foi tranquilo' }));
ok('2.4 espaço em branco não vale         ', !N.temConteudo({ ...vazia, texto: '   ' }));
ok('2.5 texto longo é cortado             ',
  N.limparNota({ ...vazia, texto: 'x'.repeat(900) }).texto.length === 400);
ok('2.6 nasce com a data de hoje          ', vazia.dia === dia(0), vazia.dia);

/* ============================================================
   3. o relatório
   ============================================================ */
console.log('\n— o relatório —');
const estado = {
  nome: 'Léo',
  feitos: { dentes: 12, banho: 5 },
  autonomia: { dentes: { sozinho: 9, total: 12 } },
  diario: [
    { e: 'medo', dia: dia(2) }, { e: 'medo', dia: dia(5) }, { e: 'feliz', dia: dia(3) },
    { e: 'triste', dia: dia(70) },
  ],
};
const tarefas = [{ id: 'dentes', nome: 'Escovar os dentes' }, { id: 'banho', nome: 'Tomar banho' },
  { id: 'cama', nome: 'Arrumar a cama' }];
const notas = {
  lista: [
    { id: 'a', tipo: 'sensorial', dia: dia(1), etiquetas: ['som alto'], texto: 'liquidificador' },
    { id: 'b', tipo: 'dificil', dia: dia(4), etiquetas: ['mudança de plano'], texto: '' },
    { id: 'c', tipo: 'conquista', dia: dia(20), etiquetas: ['pediu com palavras'], texto: '' },
    { id: 'd', tipo: 'rotina', dia: dia(50), etiquetas: ['travou no mesmo passo'], texto: 'antigo' },
  ],
};

const r30 = N.montarRelatorio({ estado, notas, emocoes: [{ id: 'medo', nome: 'com medo' }, { id: 'feliz', nome: 'feliz' }, { id: 'triste', nome: 'triste' }], tarefas, dias: 30 });
ok('3.1 pega só as notas do período       ', r30.totalNotas === 3, String(r30.totalNotas));
ok('3.2 agrupa por tipo, sem tipo vazio   ',
  r30.porTipo.length === 3 && r30.porTipo.every((t) => t.notas.length > 0),
  r30.porTipo.map((t) => t.id).join(','));
ok('3.3 a mais recente vem primeiro       ',
  r30.porTipo.every((t) => t.notas.every((n, i) => i === 0 || t.notas[i - 1].dia >= n.dia)));
ok('3.4 conta as emoções do período       ',
  r30.contagem.find((c) => c.nome === 'com medo')?.n === 2
  && !r30.contagem.some((c) => c.nome === 'triste'),
  JSON.stringify(r30.contagem));
ok('3.5 rotina nunca feita fica de fora   ',
  r30.rotinas.length === 2 && !r30.rotinas.some((x) => x.nome === 'Arrumar a cama'),
  r30.rotinas.map((x) => x.nome).join(','));
ok('3.6 mais concluída vem primeiro       ', r30.rotinas[0].nome === 'Escovar os dentes');
ok('3.7 autonomia vira percentual         ', r30.rotinas[0].semAjuda === 75, String(r30.rotinas[0].semAjuda));
ok('3.8 sem autonomia registrada, nulo    ', r30.rotinas[1].semAjuda === null);

const r7 = N.montarRelatorio({ estado, notas, emocoes: [], tarefas, dias: 7 });
ok('3.9 período menor pega menos          ', r7.totalNotas === 2 && r7.porTipo.length === 2,
  String(r7.totalNotas));
const r90 = N.montarRelatorio({ estado, notas, emocoes: [], tarefas, dias: 90 });
ok('3.10 período maior alcança a antiga   ', r90.totalNotas === 4, String(r90.totalNotas));

/* O relatório não carrega a lista de condições: a família conta isso com as
   palavras dela, e documento gerado por app que afirma condição é outra coisa. */
const texto = N.comoTexto(r90);
ok('3.11 o texto não afirma condição      ',
  !/autis|TEA|TDAH|diagn[óo]stic|transtorno/i.test(texto),
  texto.slice(0, 120));
ok('3.12 diz o que é e o que não é        ',
  texto.includes('Não é avaliação') && texto.includes('não conclui nada'), texto.slice(0, 200));
ok('3.13 diz quem interpreta              ', texto.includes('Quem interpreta isto é o profissional'));
ok('3.14 separa acumulado de período      ',
  texto.includes('desde o início do uso'), texto.slice(0, 400));
ok('3.15 traz as notas com data           ', texto.includes('liquidificador') && /\d\d\/\d\d:/.test(texto));
ok('3.16 sem nada, ainda se explica       ', (() => {
  const t = N.comoTexto(N.montarRelatorio({ estado: {}, notas: { lista: [] }, tarefas: [], dias: 30 }));
  return t.includes('Ainda não há nada registrado') && t.includes('Não é avaliação');
})());

/* ============================================================
   4. a tela do caderno
   ============================================================ */
console.log('\n— a tela —');
const root = createRoot(document.getElementById('root'));
let guardado = { lista: [] };
let foiAoRelatorio = 0;
const montar = async (n) => {
  await act(async () => {
    root.render(React.createElement(Notas, {
      notas: n, aoSalvar: (x) => { guardado = x; }, voltar: () => {},
      verRelatorio: () => { foiAoRelatorio++; },
    }));
  });
  await pausa(100);
};

await montar({ lista: [] });
ok('4.1 explica que é caderno, não teste  ', txt().includes('Um caderno, não um teste'));
ok('4.2 lista vazia convida a começar     ', txt().includes('Ainda sem anotações'));
ok('4.3 sem notas, não oferece o resumo   ', !porTexto('.btn-plano', 'Ver o resumo'));

await clicarTexto('.btn-plano', 'Anotar uma coisa');
await pausa(80);
ok('4.4 abre a ficha com os quatro tipos  ', todos('.tipo').length >= 4, String(todos('.tipo').length));
ok('4.5 salvar começa travado             ', porTexto('.btn-plano', 'Salvar')?.disabled === true);

await clicarTexto('.tipo', 'Som, luz, textura');
await pausa(60);
ok('4.6 trocar o tipo troca a pergunta    ', txt().includes('O que incomodou'));
ok('4.7 e troca as etiquetas              ', !!porTexto('.etiqueta', 'som alto'));

await clicarTexto('.etiqueta', 'som alto');
await pausa(60);
ok('4.8 etiqueta marcada libera salvar    ', porTexto('.btn-plano', 'Salvar')?.disabled === false);

await escrever('.campo.area', 'o liquidificador da cozinha');
await pausa(60);
await clicarTexto('.btn-plano', 'Salvar');
await pausa(80);
ok('4.9 grava a nota inteira              ',
  guardado.lista.length === 1 && guardado.lista[0].tipo === 'sensorial'
  && guardado.lista[0].etiquetas[0] === 'som alto'
  && guardado.lista[0].texto === 'o liquidificador da cozinha',
  JSON.stringify(guardado.lista[0]));
ok('4.10 e fecha a ficha                  ', !document.querySelector('.folha'));

await montar(guardado);
ok('4.11 a nota aparece na lista          ', todos('.nota').length === 1);
ok('4.12 com tipo, data e etiqueta        ',
  txt().includes('Som, luz, textura') && txt().includes('som alto'));
ok('4.13 agora oferece o resumo           ', !!porTexto('.btn-plano', 'Ver o resumo'));
await clicarTexto('.btn-plano', 'Ver o resumo');
ok('4.14 e o botão leva para lá           ', foiAoRelatorio === 1);

/* Tocar numa nota abre para editar, com opção de apagar. */
await clicar(document.querySelector('.nota'));
await pausa(80);
ok('4.15 tocar na nota abre para editar   ', !!document.querySelector('.folha')
  && !!porTexto('.btn-plano', 'Apagar esta anotação'));
await clicarTexto('.btn-plano', 'Apagar esta anotação');
await pausa(80);
ok('4.16 e dá para apagar                 ', guardado.lista.length === 0);

/* ============================================================
   5. a tela do relatório
   ============================================================ */
console.log('\n— a tela do resumo —');
await act(async () => { root.unmount(); });
const root2 = createRoot(document.getElementById('root'));
await act(async () => {
  root2.render(React.createElement(Relatorio, {
    estado, notas, tarefas, voltar: () => {},
  }));
});
await pausa(120);

ok('5.1 avisa que não é avaliação         ',
  txt().includes('Não é avaliação') && txt().includes('não conclui nada'));
ok('5.2 diz quem interpreta               ', txt().includes('quem interpreta é o profissional'));
ok('5.3 rotula o acumulado como acumulado ', txt().includes('desde o início do uso'));
ok('5.4 mostra as rotinas e a autonomia   ',
  txt().includes('Escovar os dentes') && txt().includes('75% das vezes sem ajuda'));
ok('5.5 mostra as notas do período        ', txt().includes('liquidificador'));
ok('5.6 oferece três períodos             ', todos('.seg').length === 3);

await clicarTexto('.seg', '7 dias');
await pausa(80);
ok('5.7 trocar o período refaz o resumo   ', !txt().includes('pediu com palavras'), txt().slice(-150));
await clicarTexto('.seg', '3 meses');
await pausa(80);
ok('5.8 três meses alcança a nota antiga  ', txt().includes('antigo'));

copiado.length = 0;
await clicarTexto('.btn-plano', 'Copiar o resumo');
await pausa(120);
ok('5.9 copiar manda o texto inteiro      ',
  copiado.length === 1 && copiado[0].includes('Observações sobre Léo')
  && copiado[0].includes('liquidificador'), String(copiado[0]).slice(0, 80));
ok('5.10 e avisa que copiou               ', txt().includes('Copiado'));

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
