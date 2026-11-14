/* A derivação dos ajustes é a peça que governa todas as telas. Se ela errar,
   o erro aparece como "o app está estranho", que é o pior tipo de bug de
   acessibilidade: ninguém sabe dizer o que mudou. */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });

const A = await import('../src/apoio.js');

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

const perfil = (x) => ({ ...A.APOIO_PADRAO, ...x });
const aj = (x) => A.derivarAjustes(perfil(x));

/* ============================================================
   1. sem nada informado, nada muda
   ============================================================ */
console.log('\n— perfil vazio —');
const vazio = aj({});
ok('1.1 nenhum ajuste ligado por padrão   ',
  !vazio.passoUnico && !vazio.literal && !vazio.calmo && !vazio.voz && !vazio.contraste
  && !vazio.prancha && vazio.minutosFoco === 0 && vazio.cartoes === 0);
ok('1.2 não considera identificado        ', !A.temIdentificacao(A.APOIO_PADRAO));
ok('1.3 explicação vem vazia              ', A.explicarAjustes(A.APOIO_PADRAO).length === 0,
  String(A.explicarAjustes(A.APOIO_PADRAO).length));

/* ============================================================
   2. TEA e o nível de suporte
   ============================================================ */
console.log('\n— TEA —');
const tea1 = aj({ condicoes: ['tea'], nivelTEA: 1 });
ok('2.1 nível 1: literal e antecipação    ', tea1.literal && tea1.antecipacao);
ok('2.2 nível 1 não força um passo por tela', !tea1.passoUnico);
ok('2.3 nível 1 não limita os cartões     ', tea1.cartoes === 0, String(tea1.cartoes));

const tea2 = aj({ condicoes: ['tea'], nivelTEA: 2 });
ok('2.4 nível 2: um passo por tela        ', tea2.passoUnico);
ok('2.5 nível 2: no máximo 3 cartões      ', tea2.cartoes === 3, String(tea2.cartoes));
ok('2.6 nível 2 já entra em modo calmo    ', tea2.calmo);

const tea3 = aj({ condicoes: ['tea'], nivelTEA: 3 });
ok('2.7 nível 3: no máximo 2 cartões      ', tea3.cartoes === 2, String(tea3.cartoes));

/* Nível só conta se o TEA estiver marcado — senão um nível esquecido de uma
   edição anterior continuaria mandando na tela. */
const soNivel = aj({ condicoes: ['tdah'], nivelTEA: 3 });
ok('2.8 nível sem TEA não vale nada       ', soNivel.cartoes === 0 && !soNivel.passoUnico,
  String(soNivel.cartoes));

/* ============================================================
   3. TDAH
   ============================================================ */
console.log('\n— TDAH —');
const tdah = aj({ condicoes: ['tdah'] });
ok('3.1 blocos de 5 minutos               ', tdah.minutosFoco === 5, String(tdah.minutosFoco));
ok('3.2 reforço denso e pausa do corpo    ', tdah.reforcoDenso && tdah.pausaCorpo);
ok('3.3 não mexe na granularidade         ', !tdah.passoUnico && !tdah.literal);

/* ============================================================
   4. sensorial manda no som e na animação
   ============================================================ */
console.log('\n— sensorial —');
const hiper = aj({ sensorial: 'hiper' });
ok('4.1 hiper-reativo entra em modo calmo ', hiper.calmo);
ok('4.2 hiper-reativo não liga a voz      ', !hiper.voz);

const lendo = aj({ condicoes: ['dislexia'] });
ok('4.3 dislexia liga voz e leitura       ', lendo.voz && lendo.leitura);

const conflito = aj({ condicoes: ['dislexia'], sensorial: 'hiper' });
ok('4.4 hiper vence a voz da dislexia     ', !conflito.voz && conflito.leitura);

const hipo = aj({ sensorial: 'hipo' });
ok('4.5 hipo-reativo pede pausa do corpo  ', hipo.pausaCorpo && !hipo.calmo);

/* ============================================================
   5. comunicação e visão
   ============================================================ */
console.log('\n— comunicação e visão —');
const mista = aj({ comunicacao: 'mista' });
ok('5.1 fala em construção abre a prancha ', mista.prancha);
ok('5.2 e ainda aceita fala oral          ', !mista.semExigenciaOral);

const prancha = aj({ comunicacao: 'prancha' });
ok('5.3 prancha: nada cobra fala          ', prancha.prancha && prancha.semExigenciaOral);

const baixa = aj({ visao: 'baixa' });
ok('5.4 baixa visão liga o alto contraste ', baixa.contraste);
ok('5.5 visão típica não liga             ', !aj({}).contraste);

/* ============================================================
   6. a escolha do adulto vence
   ============================================================ */
console.log('\n— a última palavra é do adulto —');
const forcado = aj({ sensorial: 'hiper', manual: { calmo: false, voz: true } });
ok('6.1 adulto desliga o modo calmo       ', !forcado.calmo);
ok('6.2 adulto religa a voz               ', forcado.voz);

const limitado = aj({ condicoes: ['tea'], nivelTEA: 3, manual: { cartoes: 4 } });
ok('6.3 adulto afrouxa o limite de cartões', limitado.cartoes === 4, String(limitado.cartoes));

const expl = A.explicarAjustes(perfil({ sensorial: 'hiper', manual: { calmo: false, contraste: true } }));
const contraste = expl.find((l) => l.texto.startsWith('Alto contraste'));
ok('6.4 explicação marca o que foi manual ', !!contraste && contraste.manual
  && contraste.origem === 'você escolheu', JSON.stringify(contraste));
ok('6.5 o que o adulto desligou sai da lista', !expl.some((l) => l.texto.includes('Modo calmo')));

/* ============================================================
   7. a origem de cada ajuste
   ============================================================ */
console.log('\n— de onde veio cada ajuste —');
const caso = perfil({
  condicoes: ['tea', 'tdah'], nivelTEA: 2, sensorial: 'hiper', comunicacao: 'mista',
});
const linhas = A.explicarAjustes(caso);
const achar = (t) => linhas.find((l) => l.texto.includes(t));
ok('7.1 um passo por tela ← TEA nível 2   ', achar('um passo por tela')?.origem === 'TEA nível 2',
  achar('um passo por tela')?.origem);
ok('7.2 blocos de 5 min ← TDAH            ', achar('5 minutos')?.origem === 'TDAH',
  achar('5 minutos')?.origem);
ok('7.3 voz desligada ← hiper-reativo     ', achar('Voz automática desligada')?.origem === 'hiper-reativo',
  achar('Voz automática desligada')?.origem);
ok('7.4 prancha ← como a criança comunica ',
  achar('Prancha de comunicação')?.origem === 'como a criança se comunica');
ok('7.5 nenhuma linha fica sem origem     ', linhas.every((l) => l.origem && l.texto),
  JSON.stringify(linhas.filter((l) => !l.origem)));
ok('7.6 resumo nomeia as condições        ',
  A.resumoApoio(caso) === 'TEA (autismo) — nível 2 + TDAH', A.resumoApoio(caso));

/* ============================================================
   8. apagar a identificação não desmonta o app
   ============================================================ */
console.log('\n— apagar —');
const antes = A.derivarAjustes(caso);
const depois = await A.apagarIdentificacao(caso);
const ajDepois = A.derivarAjustes(depois);

ok('8.1 a informação de saúde sai         ',
  depois.condicoes.length === 0 && depois.sensorial === 'nenhum'
  && depois.comunicacao === 'oral' && depois.visao === 'tipica' && !depois.consentiu,
  JSON.stringify({ c: depois.condicoes, s: depois.sensorial, k: depois.comunicacao }));

const iguais = ['passoUnico', 'literal', 'antecipacao', 'cartoes', 'calmo', 'voz', 'leitura',
  'minutosFoco', 'pausaCorpo', 'reforcoDenso', 'silabar', 'tracadoSimples', 'prancha',
  'semExigenciaOral', 'contraste'].every((k) => antes[k] === ajDepois[k]);
ok('8.2 a criança não perde nada do app   ', iguais,
  JSON.stringify({ antes, depois: ajDepois }));
ok('8.3 e não fica mais "identificada"    ', !A.temIdentificacao(depois));
ok('8.4 o resumo volta a dizer que não há ', A.resumoApoio(depois) === 'nada informado',
  A.resumoApoio(depois));

/* Depois de apagar, tudo virou escolha manual — e continua sendo do adulto. */
const expDepois = A.explicarAjustes(depois);
ok('8.5 a explicação credita o adulto     ',
  expDepois.length > 0 && expDepois.every((l) => l.manual),
  JSON.stringify(expDepois.filter((l) => !l.manual)));

/* ============================================================
   9. ida e volta do armazenamento
   ============================================================ */
console.log('\n— armazenamento —');
await A.gravarApoio(caso);
const lido = await A.carregarApoio();
ok('9.1 grava e lê o mesmo perfil         ',
  JSON.stringify(A.derivarAjustes(lido)) === JSON.stringify(antes));
ok('9.2 em chave própria, separada do app ',
  !!window.localStorage.getItem('combinado_apoio_v1')
  && !String(window.localStorage.getItem('combinado_v1')).includes('condicoes'));

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
