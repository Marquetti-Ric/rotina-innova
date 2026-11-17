/* Gera os arquivos da marca a partir de uma geometria só.
 *
 * O símbolo é um nó: dois anéis que se cruzam de verdade. Um passa por
 * cima num cruzamento e por baixo no outro, e é por isso que ele lê como
 * encaixe e não como um oito deitado.
 *
 * O desenho é feito de dois arcos. O vão de cada arco fica exatamente
 * sobre o ponto onde as duas circunferências se cruzam — é o vão que
 * deixa o traço do outro anel passar. Nada de máscara: máscara quebra
 * em favicon, em ícone nativo e em renderizador antigo.
 *
 * Os dois anéis ficam na diagonal, não lado a lado. Lado a lado o
 * desenho lê como aliança de casamento; inclinado, lê como elo.
 *
 *   node scripts/marca.mjs
 *
 * Escreve public/logo-combinado.svg, docs/logo-combinado.svg e os
 * quatro PNG de assets/ que o @capacitor/assets consome. Depois:
 *
 *   npx capacitor-assets generate
 *
 * Mexeu aqui? Olhe o resultado. Marca não se confere lendo coordenada.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* As cores vêm do AGENTS.md. Musgo e damasco são do app; creme é da marca. */
export const CORES = {
  musgo: '#2F6B62',
  damasco: '#F2A65A',
  creme: '#F0EEDF',
};

/* Geometria escolhida olhando: varri distância, raio e espessura e esta é
 * a única que continua legível a 20px sem virar borrão nem perder o nó. */
export const GEOMETRIA = {
  d: 30, // distância entre os centros
  r: 25, // raio da linha de centro de cada anel
  w: 11, // espessura do traço
  ang: -28, // inclinação do eixo que liga os centros, em graus
  folga: 3.2, // sobra de cada lado do vão, para o cruzamento respirar
  margem: 1,
};

const rad = (g) => (g * Math.PI) / 180;

function arco(cx, cy, r, a1, a2, cor, w) {
  const fim = a1 + (((a2 - a1) % 360) + 360) % 360;
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const x2 = cx + r * Math.cos(rad(fim));
  const y2 = cy + r * Math.sin(rad(fim));
  const maior = fim - a1 > 180 ? 1 : 0;
  const n = (v) => v.toFixed(2);
  return (
    `<path d="M${n(x1)} ${n(y1)}A${n(r)} ${n(r)} 0 ${maior} 1 ${n(x2)} ${n(y2)}" ` +
    `fill="none" stroke="${cor}" stroke-width="${n(w)}" stroke-linecap="round"/>`
  );
}

/* O nó, centrado em (0,0). `esquerda` e `direita` são as cores dos anéis. */
export function no(esquerda, direita, g = GEOMETRIA) {
  const { d, r, w, ang, folga } = g;
  const ux = Math.cos(rad(ang));
  const uy = Math.sin(rad(ang));
  const c1 = [(-d / 2) * ux, (-d / 2) * uy];
  const c2 = [(d / 2) * ux, (d / 2) * uy];
  // Os dois cruzamentos ficam na perpendicular ao eixo, a `h` do centro.
  const h = Math.sqrt(Math.max(r * r - (d / 2) ** 2, 0.01));
  const k1 = [h * -uy, h * ux];
  const k2 = [-h * -uy, -h * ux];
  const anguloDe = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
  const vao = ((w + 2 * folga) / r) * (180 / Math.PI);
  const a1 = anguloDe(c1, k1); // onde o anel 1 passa por baixo
  const a2 = anguloDe(c2, k2); // onde o anel 2 passa por baixo
  return (
    arco(c1[0], c1[1], r, a1 + vao / 2, a1 - vao / 2, esquerda, w) +
    arco(c2[0], c2[1], r, a2 + vao / 2, a2 - vao / 2, direita, w)
  );
}

export function caixa(g = GEOMETRIA) {
  const arred = (v) => Math.ceil(v * 100) / 100;
  const l = arred(Math.abs((g.d / 2) * Math.cos(rad(g.ang))) + g.r + g.w / 2 + g.margem);
  const a = arred(Math.abs((g.d / 2) * Math.sin(rad(g.ang))) + g.r + g.w / 2 + g.margem);
  return { x: -l, y: -a, larg: 2 * l, alt: 2 * a };
}

/* SVG pronto. `fundo` null deixa transparente. */
export function svg({ esquerda = CORES.musgo, direita = CORES.damasco, fundo = null, escala = 1 } = {}) {
  const c = caixa();
  const atras = fundo
    ? `<rect x="${c.x}" y="${c.y}" width="${c.larg}" height="${c.alt}" fill="${fundo}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${c.x} ${c.y} ${c.larg} ${c.alt}" ` +
    `width="${(c.larg * escala).toFixed(0)}" height="${(c.alt * escala).toFixed(0)}">` +
    `${atras}${no(esquerda, direita)}</svg>`
  );
}

/* Quadrado, para ícone e splash: o nó centrado dentro de um lado `lado`,
 * ocupando `ocupa` da largura. O Android recorta o ícone adaptativo em
 * círculo, folha e quadrado arredondado, então a área segura é o miolo. */
export function quadrado({ lado, ocupa, fundo, esquerda = CORES.musgo, direita = CORES.damasco }) {
  const c = caixa();
  const k = (lado * ocupa) / c.larg;
  const atras = fundo ? `<rect width="${lado}" height="${lado}" fill="${fundo}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" ` +
    `width="${lado}" height="${lado}">${atras}` +
    `<g transform="translate(${lado / 2} ${lado / 2}) scale(${k.toFixed(4)})">` +
    `${no(esquerda, direita)}</g></svg>`
  );
}

function grava(caminho, conteudo) {
  const destino = resolve(RAIZ, caminho);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
  return caminho;
}

/* As fontes dos PNG nativos. `ocupa` é a fração da largura do quadrado que o
 * símbolo toma. No primeiro plano do ícone adaptativo ele é pequeno de
 * propósito: o Android recorta o quadrado em círculo, folha e quadrado
 * arredondado, e só o miolo sobrevive aos três. */
const FONTES = [
  ['icon', () => quadrado({ lado: 1024, ocupa: 0.62, fundo: CORES.creme }), 1024],
  ['icon-foreground', () => quadrado({ lado: 1024, ocupa: 0.5, fundo: null }), 1024],
  ['icon-background', () => quadrado({ lado: 1024, ocupa: 0, fundo: CORES.creme }), 1024],
  ['splash', () => quadrado({ lado: 2732, ocupa: 0.26, fundo: CORES.creme }), 2732],
  [
    'splash-dark',
    () => quadrado({ lado: 2732, ocupa: 0.26, fundo: CORES.musgo, esquerda: CORES.creme }),
    2732,
  ],
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const marca = svg();
  const escritos = [grava('public/logo-combinado.svg', marca), grava('docs/logo-combinado.svg', marca)];

  /* O sharp já vem com o @capacitor/assets, então o PNG sai daqui mesmo e
   * ninguém precisa de ferramenta de fora para refazer a marca. */
  let sharp = null;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('sharp não encontrado: só os SVG foram escritos.');
  }

  for (const [nome, monta, lado] of FONTES) {
    const fonte = monta();
    escritos.push(grava(`assets/fonte/${nome}.svg`, fonte));
    if (!sharp) continue;
    const destino = resolve(RAIZ, `assets/${nome}.png`);
    await sharp(Buffer.from(fonte), { density: 384 }).resize(lado, lado).png().toFile(destino);
    escritos.push(`assets/${nome}.png`);
  }

  console.log(escritos.join('\n'));
  if (sharp) console.log('\nagora: npx capacitor-assets generate --android');
}
