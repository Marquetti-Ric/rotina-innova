import { JSDOM } from 'jsdom';

/* O jsdom precisa existir ANTES de o react-dom ser carregado:
   imports estáticos são içados e o react-dom captura o document na inicialização. */
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement','HTMLInputElement','Element','Node','Event','MouseEvent','getComputedStyle'])
  global[k] = dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, 'crypto', { value: globalThis.crypto, configurable: true });

const H = '79df46456e96a09964594cd0d3274a601384f55173c495fc634bde214a03e700';
let licencas = { graciaDias: 7, licencas: [{ h: H, apelido: 'Família Teste', validade: '2027-12-31', ativa: true }] };
let versao = { versionName: '1.1.0', versionCode: 99, tamanho: '4.2 MB', apk: 'https://x/app.apk', obrigatoria: false, notas: 'Melhorias.' };
global.fetch = async (u) => ({ ok: true, json: async () => String(u).includes('licencas') ? licencas : versao });

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const Portao = (await import('../src/Portao.jsx')).default;

const root = createRoot(document.getElementById('root'));
const txt = () => document.body.textContent.replace(/\s+/g, ' ');
const pausa = async (ms = 80) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const digitar = async (sel, v) => {
  await act(async () => {
    const el = document.querySelector(sel);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
};
const clicar = async (sel) => {
  await act(async () => {
    document.querySelector(sel).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
};
const ok = (n, cond, extra = '') => console.log(`${n} ${cond ? '✓' : '✗ FALHOU ' + extra}`);

await act(async () => { root.render(React.createElement(Portao)); });
await pausa(150);
ok('1. abre pedindo o código de acesso       ', txt().includes('Código de acesso'));

await digitar('.pt-campo', 'INNV-0000-0000-0000');
ok('2. botão libera após digitar             ', !document.querySelector('.pt-botao').disabled);

await clicar('.pt-botao'); await pausa(200);
ok('3. código inválido mostra o erro         ', txt().includes('não encontrado'), txt().slice(-80));

await digitar('.pt-campo', 'innv 4x5d wba9 t4a6');
await clicar('.pt-botao'); await pausa(250);
ok('4. código válido abre o app              ', txt().includes('Quantos anos tem a criança'), txt().slice(0, 90));

const niveis = [...document.querySelectorAll('.nivel')];
ok('5. oferece os três níveis por idade      ', niveis.length === 3, String(niveis.length));

await clicar('.nivel:nth-of-type(2)'); await pausa(200);
ok('6. carrega a rotina com os momentos      ', txt().includes('Manhã') && txt().includes('Clínica'));

const cartoes = [...document.querySelectorAll('.cartao-nome')].map(e => e.textContent);
console.log('   tarefas visíveis agora:', cartoes.join(' · ') || '(nenhuma neste momento/dia)');

await pausa(4400);
const faixa = document.querySelector('.pt-faixa');
ok('7. avisa que há a versão 1.1.0           ', !!faixa && faixa.textContent.includes('1.1.0'));
