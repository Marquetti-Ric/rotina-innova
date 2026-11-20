import { JSDOM } from 'jsdom';
import { createHash } from 'node:crypto';

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

/* Código só para o teste: alfabeto válido, nunca emitido de verdade. */
const CODIGO = 'CMB-AB23-CD45-EF67';
const H = createHash('sha256').update(CODIGO.replace(/[^A-Z0-9]/g, '')).digest('hex');
const licencas = {
  graciaDias: 7,
  licencas: [{ h: H, apelido: 'Teste', validade: '2027-12-31', ativa: true }],
};
const versao = { versionName: '1.0.0', versionCode: 1, tamanho: '4 MB', apk: 'https://x/a.apk', obrigatoria: false, notas: '' };
global.fetch = async (u) => ({ ok: true, json: async () => (String(u).includes('licencas') ? licencas : versao) });

/* Área de transferência de mentira, para o botão "Colar". */
let naAreaDeTransferencia = '';
let deixaLer = true;
Object.defineProperty(dom.window.navigator, 'clipboard', {
  value: {
    readText: async () => {
      if (!deixaLer) throw new Error('bloqueado');
      return naAreaDeTransferencia;
    },
  },
  configurable: true,
});

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const { extrair } = await import('../src/licenca.js');
const Portao = (await import('../src/Portao.jsx')).default;
const { tx, definirIdioma } = await import('../src/idioma.js');

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const todos = (sel) => [...document.querySelectorAll(sel)];
const porTexto = (sel, t) => todos(sel).find((e) => e.textContent.includes(t));
const clicar = async (el) => {
  if (!el) throw new Error('sem elemento para clicar');
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};
const escrever = async (v) => {
  await act(async () => {
    const el = document.querySelector('.pt-campo');
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
};

let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

/* ============================================================
   1. achar o código dentro do que a pessoa colou
   ============================================================ */
console.log('\n— colar a mensagem da clínica —');
ok('1.1 código com traços                 ', extrair('CMB-AB23-CD45-EF67') === 'CMBAB23CD45EF67');
ok('1.2 minúscula e sem traços            ', extrair('cmbab23cd45ef67') === 'CMBAB23CD45EF67');
ok('1.3 separado por espaços              ', extrair('cmb ab23 cd45 ef67') === 'CMBAB23CD45EF67');
ok('1.4 dentro de uma frase inteira       ',
  extrair('Olá! Código de acesso: CMB-AB23-CD45-EF67 — é só digitar no app.') === 'CMBAB23CD45EF67',
  extrair('Olá! Código de acesso: CMB-AB23-CD45-EF67 — é só digitar no app.'));
ok('1.5 com quebra de linha antes         ',
  extrair('Segue o código\nCMB-AB23-CD45-EF67\nQualquer dúvida avise') === 'CMBAB23CD45EF67');
ok('1.6 sem código, devolve o que veio    ', extrair('bom dia') === 'BOMDIA');
ok('1.7 vazio não quebra                  ', extrair('') === '' && extrair(null) === '');

/* ============================================================
   2. a máscara ensina o alfabeto certo
   ============================================================ */
console.log('\n— a tela —');
window.localStorage.clear();
const root = createRoot(document.getElementById('root'));
await act(async () => { root.render(React.createElement(Portao)); });
await pausa(300);

const campo = () => document.querySelector('.pt-campo');
ok('2.1 abre pedindo o código             ', txt().includes(tx('portao.titulo')));
const mascara = campo().getAttribute('placeholder');
ok('2.2 a máscara não usa 0, 1, O, I, L, S',
  !/[01OILS]/.test(mascara.replace(/^CMB/, '')), mascara);
ok('2.3 a máscara se parece com máscara   ', mascara.includes('XXXX'), mascara);
ok('2.4 o campo tem rótulo para leitor    ',
  !!campo().getAttribute('aria-label'), String(campo().getAttribute('aria-label')));
ok('2.5 cabe uma mensagem colada inteira  ',
  Number(campo().getAttribute('maxlength')) > 60, campo().getAttribute('maxlength'));

/* ============================================================
   3. o botão sempre responde
   ============================================================ */
console.log('\n— o botão —');
const botao = () => porTexto('.pt-botao', 'Liberar') || document.querySelector('.pt-botao');
ok('3.1 não nasce desabilitado            ', botao().disabled === false);

await clicar(botao());
await pausa(100);
ok('3.2 campo vazio: diz o que falta      ',
  txt().includes('O campo ainda está vazio'), txt().slice(-120));

await escrever('CMB-AB23');
await clicar(botao());
await pausa(100);
ok('3.3 código curto: diz que falta parte ',
  txt().includes('incompleto'), txt().slice(-120));
ok('3.4 e não foi para a rede à toa       ', !txt().includes('Não encontramos'));

/* ============================================================
   4. colar
   ============================================================ */
console.log('\n— o botão de colar —');
await escrever('');
await pausa(60);
ok('4.1 com campo vazio, oferece colar    ', !!porTexto('.pt-colar', 'Colar'));

naAreaDeTransferencia = '';
await clicar(porTexto('.pt-colar', 'Colar'));
await pausa(80);
ok('4.2 nada copiado: avisa               ', txt().includes(tx('portao.erro.semCopia')));

naAreaDeTransferencia = `Boa tarde! O código do Léo é ${CODIGO}. Abraço, recepção.`;
await clicar(porTexto('.pt-colar', 'Colar'));
await pausa(80);
ok('4.3 colar extrai o código da frase    ',
  campo().value === 'CMBAB23CD45EF67', campo().value);
ok('4.4 com campo cheio, o colar sai      ', !porTexto('.pt-colar', 'Colar'));

/* ============================================================
   5. ativar de verdade
   ============================================================ */
console.log('\n— ativar —');
await clicar(botao());
await pausa(400);
ok('5.1 o código válido libera o app      ',
  !document.querySelector('.pt-campo') && !txt().includes('Código de acesso'),
  txt().slice(0, 80));

/* Um código que não está na lista não culpa o código de cara. */
await act(async () => { root.unmount(); });
window.localStorage.clear();
const root2 = createRoot(document.getElementById('root'));
await act(async () => { root2.render(React.createElement(Portao)); });
await pausa(300);
deixaLer = false;
await escrever('CMB-ZZ99-ZZ99-ZZ99');
await clicar(document.querySelector('.pt-botao'));
await pausa(400);
ok('5.2 código ausente sugere esperar     ',
  txt().includes('espere um minuto'), txt().slice(-160));
ok('5.3 e só depois manda conferir        ', txt().includes('confira os caracteres'));

await escrever('');
await pausa(60);
await clicar(porTexto('.pt-colar', 'Colar'));
await pausa(80);
ok('5.4 aparelho que barra a leitura avisa',
  txt().includes('Toque e segure no campo'), txt().slice(-140));

/* ============================================================
   6. contraste — trava a paleta desta tela
   ============================================================ */
console.log('\n— contraste —');
const css = document.querySelector('.pt style')?.textContent
  || [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const corDe = (regra) => {
  const bloco = css.match(new RegExp(`\\${regra}\\s*{[^}]*}`));
  const c = bloco && bloco[0].match(/color:\s*(#[0-9A-Fa-f]{6})/);
  return c ? c[1] : null;
};
const corBorda = () => {
  const bloco = css.match(/\.pt-campo\s*{[^}]*}/);
  const c = bloco && bloco[0].match(/border:\s*\d+px solid (#[0-9A-Fa-f]{6})/);
  return c ? c[1] : null;
};
const CREME = '#F0EEDF';

const texto = corDe('.pt-texto');
const erro = corDe('.pt-erro');
const marca = corDe('.pt-marca');
const borda = corBorda();

ok('6.1 texto do corpo ≥ 4,5:1            ',
  texto && razao(texto, CREME) >= 4.5, `${texto} = ${texto && razao(texto, CREME).toFixed(2)}`);
ok('6.2 mensagem de erro ≥ 4,5:1          ',
  erro && razao(erro, CREME) >= 4.5, `${erro} = ${erro && razao(erro, CREME).toFixed(2)}`);
ok('6.3 nome da marca ≥ 4,5:1             ',
  marca && razao(marca, CREME) >= 4.5, `${marca} = ${marca && razao(marca, CREME).toFixed(2)}`);
ok('6.4 borda do campo ≥ 3:1              ',
  borda && razao(borda, CREME) >= 3, `${borda} = ${borda && razao(borda, CREME).toFixed(2)}`);
/* A faixa de carência e a de nova versão são cartões brancos, e o "Depois"
   é um controle: 4,5:1 vale para ele também. */
const sobreBranco = (regra) => {
  const c = corDe(regra);
  return c && razao(c, '#FFFFFF') >= 4.5;
};
ok('6.5 texto da faixa ≥ 4,5:1 no branco  ',
  sobreBranco('.pt-faixa-txt small'), String(corDe('.pt-faixa-txt small')));
ok('6.6 botão "Depois" ≥ 4,5:1 no branco  ',
  sobreBranco('.pt-faixa button.ignorar'), String(corDe('.pt-faixa button.ignorar')));
ok('6.7 a máscara é bem mais clara        ', (() => {
  const b = css.match(/\.pt-campo::placeholder\s*{[^}]*}/);
  const c = b && b[0].match(/color:\s*(#[0-9A-Fa-f]{6})/);
  return c && razao(c[1], '#FFFFFF') < 3;
})(), 'a máscara não pode competir com o texto digitado');

/* ============================================================
   7. o Portão nos três idiomas
   ============================================================ */
console.log('\n— idiomas —');

const { IDIOMAS, COMPLETOS, faltando, doAparelho } = await import('../src/idioma.js');

/* Nenhum idioma entra com chave faltando: chave sem tradução cai no
   português, e meio app em espanhol é pior que app em português. */
for (const i of IDIOMAS) {
  const f = faltando(i.id);
  ok(`7.${IDIOMAS.indexOf(i) + 1} ${i.id} tem todas as chaves`.padEnd(39), f.length === 0, f.join(', '));
}

/* Traduzir não localiza: espanhol e inglês só entram em COMPLETOS com
   vocabulário-núcleo próprio, revisão de tom e parecer do país de destino. */
ok('7.4 só o português está completo     ',
  COMPLETOS.length === 1 && COMPLETOS[0] === 'pt-BR', COMPLETOS.join(','));
ok('7.5 e o aparelho não escolhe incompleto',
  doAparelho({ languages: ['es-MX', 'es'] }) === 'pt-BR');

/* Raiz nova a cada idioma: re-renderizar o mesmo componente mantém o
   estado interno, e a segunda volta começaria na tela errada. */
const verNoIdioma = async (id) => {
  definirIdioma(id);
  const alvo = document.createElement('div');
  document.body.appendChild(alvo);
  const r = createRoot(alvo);
  await act(async () => { r.render(React.createElement(Portao)); });
  await pausa(200);
  const visto = alvo.textContent.replace(/\s+/g, ' ');
  await act(async () => { r.unmount(); });
  alvo.remove();
  definirIdioma('pt-BR');
  return visto;
};

const emEs = await verNoIdioma('es');
ok('7.6 o Portão fala espanhol           ', emEs.includes('Activar la app'), emEs.slice(0, 70));
const emEn = await verNoIdioma('en');
ok('7.7 e inglês                         ', emEn.includes('Unlock the app'), emEn.slice(0, 70));
/* O que prova que a migração do Portão ficou completa: nenhuma palavra em
   português sobrou na tela quando o idioma é outro. */
ok('7.8 sem português sobrando na tela   ',
  !/Liberar o app|Código de acesso|Conferindo/.test(emEn), emEn.slice(0, 90));

/* ---------------------------------------------------------------- 8. carência
 *
 * A faixa de carência tinha duas chamadas a `t()` em vez de `tx()`. O único
 * `t` em volta era o handle de um setTimeout, então a faixa quebrava a tela —
 * e nada disso aparecia, porque a faixa só existe com licença vencida. Build,
 * lint e 445 testes passavam. Agora renderiza-se a faixa de verdade.
 *
 * Há também um guarda estático em `scripts/idioma.mjs`, que proíbe `t(` cru
 * em arquivo que importa `tx`. Os dois servem: o guarda pega a classe inteira
 * sem renderizar, este teste prova que a tela monta. */
const { storage } = await import('../src/armazenamento.js');
const hojeIso = new Date().toISOString().slice(0, 10);

const verCarencia = async () => {
  /* A lista também tem de dizer que venceu: a conferência diária sobrescreve
     a validade guardada com a que vem da lista. */
  licencas.licencas[0].validade = '2020-01-01';
  licencas.licencas[0].titular = 'clinica';
  await storage.set('licenca_v2', JSON.stringify({
    modo: 'lista', h: H, apelido: 'Teste', validade: '2020-01-01',
    gracia: 7, ultimaConferencia: '2020-01-01', primeiroAviso: hojeIso,
    titular: 'clinica', nivel4: true, previa: false,
  }));
  const alvo = document.createElement('div');
  document.body.appendChild(alvo);
  const r = createRoot(alvo);
  await act(async () => { r.render(React.createElement(Portao)); });
  await pausa(250);
  const visto = alvo.textContent.replace(/\s+/g, ' ');
  await act(async () => { r.unmount(); });
  alvo.remove();
  licencas.licencas[0].validade = '2027-12-31';
  delete licencas.licencas[0].titular;
  await storage.set('licenca_v2', '');
  return visto;
};

const naCarencia = await verCarencia();
ok('8.1 a faixa de carência monta        ',
  naCarencia.includes('Acesso vence em'), naCarencia.slice(0, 90));
ok('8.2 com o número de dias            ',
  /Acesso vence em 7 dias/.test(naCarencia), naCarencia.slice(0, 90));
/* Quem renova licença de clínica é a clínica. Mandar a família renovar na
   loja é mandar fazer o que ela não pode. */
ok('8.3 e manda a clínica renovar, não a família',
  naCarencia.includes('Fale com a clínica') && !naCarencia.includes('Renove na loja'),
  naCarencia.slice(0, 120));
/* A rotina da criança segue funcionando: a carência é faixa, não bloqueio. */
ok('8.4 o app continua aberto por baixo ',
  naCarencia.length > 200, `${naCarencia.length} caracteres`);

/* ----------------------------------------------------- 9. prévia de idioma
 *
 * O seletor esconde espanhol e inglês porque só pt-BR está em COMPLETOS, e
 * isso é a regra. Mas sem caminho nenhum não havia como testar os dois num
 * aparelho, e revisão de tom empurrada para o fim sai caro. Quem destrava é
 * a licença, igual ao nível 4. */
const { definirPrevia, temPrevia, oferecidos } = await import('../src/idioma.js');

definirPrevia(false);
ok('9.1 sem prévia, só o português      ', oferecidos().length === 1);
definirPrevia(true);
ok('9.2 com prévia, os três aparecem    ', oferecidos().length === 3,
  oferecidos().map((i) => i.id).join(','));
/* Um idioma incompleto só entra na prévia se a interface estiver inteira:
   prévia é para testar tom e layout, não para caçar chave faltando. */
ok('9.3 e só os que têm a interface inteira',
  oferecidos().every((i) => faltando(i.id).length === 0));
/* Deliberado: a prévia é escolha de tela, nunca padrão herdado. Um aparelho
   em espanhol não abre o app em espanhol por ter prévia ligada. */
ok('9.4 o aparelho ainda não herda prévia',
  doAparelho({ languages: ['es-MX', 'es'] }) === 'pt-BR');
ok('9.5 e COMPLETOS não muda            ',
  COMPLETOS.length === 1 && COMPLETOS[0] === 'pt-BR');
definirPrevia(false);
ok('9.6 desligar volta ao português só  ', oferecidos().length === 1 && !temPrevia());

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
