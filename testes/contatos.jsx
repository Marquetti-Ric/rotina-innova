import { JSDOM } from 'jsdom';

/* O jsdom tem de existir antes de o react-dom ser carregado. */
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle'])
  global[k] = dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, 'crypto', { value: globalThis.crypto, configurable: true });

const H = '79df46456e96a09964594cd0d3274a601384f55173c495fc634bde214a03e700';
const licencas = { graciaDias: 7, licencas: [{ h: H, apelido: 'Família Teste', validade: '2027-12-31', ativa: true }] };
const versao = { versionName: '1.0.0', versionCode: 1, tamanho: '4 MB', apk: 'https://x/a.apk', obrigatoria: false, notas: '' };
global.fetch = async (u) => ({ ok: true, json: async () => (String(u).includes('licencas') ? licencas : versao) });

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const C = await import('../src/contatos.js');
const { abertas } = await import('./falso-launcher.js');

const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const clicar = async (sel, n = 0) => {
  await act(async () => {
    const els = document.querySelectorAll(sel);
    if (!els[n]) throw new Error('sem elemento para ' + sel + '[' + n + ']');
    els[n].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
};
let falhas = 0;
const ok = (n, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);
};

/* ============================================================
   1. telefone e endereços
   ============================================================ */
console.log('\n— telefone —');
ok('1.1 DDD + celular ganha o DDI 55       ', C.normalizar('11 98888-7777') === '5511988887777', C.normalizar('11 98888-7777'));
ok('1.2 número já internacional não dobra  ', C.normalizar('+55 11 98888-7777') === '5511988887777', C.normalizar('+55 11 98888-7777'));
ok('1.3 zeros de operadora caem            ', C.normalizar('005511988887777') === '5511988887777', C.normalizar('005511988887777'));
ok('1.4 fixo de 10 dígitos vale            ', C.telefoneValido('11 3333-4444'));
ok('1.5 número curto é recusado            ', !C.telefoneValido('9999'));
ok('1.6 vazio é recusado                   ', !C.telefoneValido(''));
ok('1.7 exibição formata o celular         ', C.exibir('11988887777') === '+55 11 98888-7777', C.exibir('11988887777'));
ok('1.8 ligação usa o discador             ', C.enderecoLigacao('11 98888-7777') === 'tel:5511988887777', C.enderecoLigacao('11 98888-7777'));

const zap = C.enderecoWhatsapp('11 98888-7777', 'Preciso de você.');
ok('1.9 wa.me sem +, sem zeros, sem traços ', zap.startsWith('https://wa.me/5511988887777?text='), zap);
ok('1.10 mensagem vai codificada           ', zap.includes('Preciso%20de%20voc%C3%AA.'), zap);
ok('1.11 sem mensagem não sobra o ?text    ', C.enderecoWhatsapp('11988887777', '  ') === 'https://wa.me/5511988887777');

/* ============================================================
   2. quem a criança vê
   ============================================================ */
console.log('\n— visibilidade —');
const base = {
  mensagem: 'Preciso de você.',
  lista: [
    { id: 'c1', nome: 'Mamãe', relacao: 'mãe', fone: '5511988887777', avatar: 'a', ligar: true, whatsapp: true, sozinha: true },
    { id: 'c2', nome: 'Tia Rose', relacao: 'terapeuta', fone: '5511977776666', avatar: 'c', ligar: true, whatsapp: true, sozinha: false },
    { id: 'c3', nome: 'Vovó', relacao: 'avó', fone: '5511966665555', avatar: 'b', ligar: false, whatsapp: false, sozinha: true },
  ],
};
const vis = C.visiveisParaCrianca(base);
ok('2.1 só quem pode usar sozinha aparece  ', vis.length === 1 && vis[0].nome === 'Mamãe', vis.map((v) => v.nome).join(','));
ok('2.2 contato sem ação nenhuma não entra ', !vis.some((v) => v.id === 'c3'));

const comRecepcao = C.comClinica(base, { nome: 'Innova', rodape: 'Instituto Innova', telefone: '1133334444' });
ok('2.3 clínica entra travada              ', comRecepcao.lista.some((c) => c.id === 'clinica' && c.fixo));
ok('2.4 clínica não vai para a criança     ', !C.visiveisParaCrianca(comRecepcao).some((c) => c.id === 'clinica'));
ok('2.5 tema sem telefone não cria contato ', C.comClinica(base, { nome: 'Innova' }).lista.length === base.lista.length);

/* ============================================================
   3. a tela da criança
   ============================================================ */
console.log('\n— tela "Meus adultos" —');
const Adultos = (await import('../src/Adultos.jsx')).default;
const root = createRoot(document.getElementById('root'));
let voltou = 0;

await act(async () => {
  root.render(React.createElement(Adultos, { contatos: base, nivel: 2, voltar: () => { voltou++; } }));
});
await pausa(120);

ok('3.1 mostra só a Mamãe                  ', document.querySelectorAll('.pessoa').length === 1,
  String(document.querySelectorAll('.pessoa').length));
ok('3.2 oferece ligar e WhatsApp           ', !!document.querySelector('.ac-ligar') && !!document.querySelector('.ac-zap'));
ok('3.3 não liga sem confirmar             ', abertas.length === 0 && !document.querySelector('.folha'));

await clicar('.ac-ligar');
await pausa(60);
ok('3.4 pedir ligação abre a confirmação   ', !!document.querySelector('.folha') && txt().includes('Ligar para Mamãe?'), txt().slice(-90));
ok('3.5 ainda não saiu do app              ', abertas.length === 0);

await clicar('.btn-nao');
await pausa(60);
ok('3.6 "não agora" fecha e não liga       ', !document.querySelector('.folha') && abertas.length === 0);

await clicar('.ac-ligar');
await pausa(60);
await clicar('.btn-sim');
await pausa(120);
ok('3.7 confirmado, abre o discador        ', abertas[0] === 'tel:5511988887777', String(abertas[0]));

await clicar('.ac-zap');
await pausa(60);
await clicar('.btn-sim');
await pausa(120);
ok('3.8 WhatsApp leva a frase da criança   ', String(abertas[1]).startsWith('https://wa.me/5511988887777?text=Preciso'), String(abertas[1]));

/* A frase montada na prancha vence a mensagem padrão: ela disse o que queria. */
await act(async () => {
  root.render(React.createElement(Adultos, {
    contatos: base, nivel: 2, frase: 'eu quero banheiro', voltar: () => { voltou++; },
  }));
});
await pausa(80);
await clicar('.ac-zap');
await pausa(60);
await clicar('.btn-sim');
await pausa(120);
ok('3.9 frase da prancha substitui o texto ', decodeURIComponent(String(abertas[2])).includes('eu quero banheiro'), String(abertas[2]));

await clicar('.btn-x');
await pausa(60);
ok('3.10 o botão de voltar volta           ', voltou === 1, String(voltou));

/* Sem ninguém cadastrado, a tela explica em vez de ficar vazia. */
await act(async () => {
  root.render(React.createElement(Adultos, { contatos: C.PADRAO_CONTATOS, nivel: 1, voltar: () => {} }));
});
await pausa(80);
ok('3.11 lista vazia explica o que fazer   ', txt().includes('Ainda não tem ninguém aqui'), txt().slice(0, 80));

/* ============================================================
   4. o app inteiro: o botão de chamar
   ============================================================ */
console.log('\n— o botão na casa —');
await act(async () => { root.unmount(); });

const hoje = new Date().toISOString().slice(0, 10);
window.localStorage.setItem('licenca_v2', JSON.stringify({
  h: H, modo: 'lista', validade: '2027-12-31', ultimaConferencia: hoje, gracia: 7, primeiroAviso: null,
}));
window.localStorage.setItem('combinado_v1', JSON.stringify({
  nome: 'Léo', avatar: 'a', nivel: 2, estrelas: 0, feitos: {}, autonomia: {},
  hoje: [], dia: hoje, calmo: true, som: false, ajustes: {}, custom: [], prova: false,
}));

const Portao = (await import('../src/Portao.jsx')).default;
const raiz2 = createRoot(document.getElementById('root'));
await act(async () => { raiz2.render(React.createElement(Portao)); });
await pausa(400);

ok('4.1 licença válida abre direto na casa ', txt().includes('Oi, Léo!'), txt().slice(0, 90));
ok('4.2 sem contatos, sem botão de chamar  ', !document.querySelector('.chamar'));

await act(async () => { raiz2.unmount(); });
window.localStorage.setItem('combinado_contatos_v1', JSON.stringify(base));
const raiz3 = createRoot(document.getElementById('root'));
await act(async () => { raiz3.render(React.createElement(Portao)); });
await pausa(400);

ok('4.3 com contatos, o botão aparece      ', !!document.querySelector('.chamar'));
await clicar('.chamar');
await pausa(120);
ok('4.4 o botão abre "Meus adultos"        ', txt().includes('Meus adultos') && !!document.querySelector('.ac-ligar'), txt().slice(0, 90));

await clicar('.btn-x');
await pausa(120);
ok('4.5 volta para a casa                  ', txt().includes('Oi, Léo!'));

/* Dentro da tarefa, travar num passo é quando ela mais precisa de alguém. */
const cartao = document.querySelector('.cartao');
if (cartao) {
  await clicar('.cartao');
  await pausa(150);
  ok('4.6 a tarefa também tem como chamar   ', !!document.querySelector('.chamar-barra'));
  await clicar('.chamar-barra');
  await pausa(120);
  ok('4.7 e leva para a mesma tela          ', txt().includes('Meus adultos'));
} else {
  console.log('4.6 (sem tarefa neste momento do dia — pulado)');
}

console.log(falhas === 0 ? '\nTodos passaram.\n' : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
