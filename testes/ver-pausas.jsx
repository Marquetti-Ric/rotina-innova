/* Gera uma página com as quatro pausas do corpo animadas, para olhar antes de
 * dizer que está pronto.
 *
 * Existe porque a primeira versão destas figuras foi escrita às cegas e saiu
 * errada: duas cenas ficaram idênticas, as setas apontavam ao contrário, as
 * mãos não encostavam na parede e a criança parecia um bebê. Nada disso
 * aparece lendo o SVG — só olhando.
 *
 *   npm run ver:pausas   →  abre o caminho do arquivo; abra no navegador
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import { PAUSAS_CORPO } from '../src/pausas.jsx';
import { AVATARES } from '../src/avatar.jsx';

const CSS = `
  body { margin: 0; padding: 28px; background: #E8F0EE; color: #24403C;
    font-family: ui-rounded, system-ui, sans-serif; }
  h1 { font-size: 19px; margin: 0 0 4px; }
  p.leg { font-size: 13px; color: #5F7B77; margin: 0 0 22px; }
  .grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 16px; max-width: 1000px; }
  .cena { background: #fff; border-radius: 26px; padding: 14px;
    box-shadow: 0 10px 24px -12px rgba(36,64,60,.28); }
  .cena h2 { font-size: 16px; margin: 6px 0 2px; }
  .cena small { font-size: 12.5px; color: #5F7B77; display: block; line-height: 1.45; }
  .mexer { --mx: calc(4.6s - 1.8s * var(--t)); width: 100%; }
  .mexer svg { display: block; width: 100%; height: auto; }
  .normal { --t: 1; }
  .calmo { --t: 0; }
  .barra { display: flex; gap: 18px; align-items: center; margin: 26px 0 10px; }
  .barra b { font-size: 14px; }
  .barra span { font-size: 12.5px; color: #5F7B77; }
  .mx-aperta { animation: mx-aperta var(--mx) ease-in-out infinite; transform-origin: 110px 79px; }
  .mx-pula { animation: mx-pula var(--mx) ease-in-out infinite; }
  .mx-sombra { animation: mx-sombra var(--mx) ease-in-out infinite; transform-origin: 110px 143px; }
  .mx-abraca { animation: mx-abraca var(--mx) ease-in-out infinite; transform-origin: 110px 72px; }
  .mx-empurra { animation: mx-empurra var(--mx) ease-in-out infinite; transform-origin: 90px 146px; }
  @keyframes mx-aperta { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(.84) } }
  @keyframes mx-pula { 0%,100% { transform: translateY(0) } 45% { transform: translateY(-16px) } }
  @keyframes mx-sombra { 0%,100% { transform: scaleX(1); opacity: 1 } 45% { transform: scaleX(.7); opacity: .55 } }
  @keyframes mx-abraca { 0%,100% { transform: scale(1) } 50% { transform: scale(.92) } }
  @keyframes mx-empurra { 0%,100% { transform: translateX(0) rotate(0deg) } 50% { transform: translateX(8px) rotate(2.5deg) } }
  @media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; } }
`;

const bloco = (avatar) => PAUSAS_CORPO.map((p) => `
    <div class="cena">
      <div class="mexer">${renderToStaticMarkup(
    React.createElement(p.Arte, { pele: avatar.pele, cabelo: avatar.cabelo, tipo: avatar.tipo }),
  )}</div>
      <h2>${p.nome}</h2>
      <small>${p.dica}</small>
    </div>`).join('');

const a = AVATARES[0];
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Pausas do corpo</title><style>${CSS}</style></head><body>
<h1>Pausas do corpo</h1>
<p class="leg">Quatro cenas, como a criança vê. Compare as duas velocidades e,
nas preferências do sistema, ligue "reduzir movimento" para ver o que sobra.</p>

<div class="barra"><b>Normal</b><span>ciclo de 2,8s</span></div>
<div class="grade normal">${bloco(a)}</div>

<div class="barra"><b>Modo calmo</b><span>ciclo de 4,6s — mais lento, não parado</span></div>
<div class="grade calmo">${bloco(a)}</div>

<div class="barra"><b>Com os outros personagens</b><span>a figura usa a pele e o cabelo que a criança escolheu</span></div>
<div class="grade normal">${AVATARES.slice(1).map((av) => `
  <div class="cena"><div class="mexer">${renderToStaticMarkup(
    React.createElement(PAUSAS_CORPO[2].Arte, { pele: av.pele, cabelo: av.cabelo, tipo: av.tipo }),
  )}</div><h2>Abraço apertado</h2><small>personagem ${av.id}</small></div>`).join('')}</div>
</body></html>`;

const destino = '/tmp/pausas.html';
fs.writeFileSync(destino, html);
console.log(`\nAbra no navegador:\n  ${destino}\n`);
