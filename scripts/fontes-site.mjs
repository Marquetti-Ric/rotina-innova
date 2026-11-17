/* Leva as fontes do app para o site, para o docs/ não buscar nada fora.
 *
 *   node scripts/fontes-site.mjs
 *
 * O app já empacota as fontes (src/main.jsx importa do @fontsource). O site
 * do GitHub Pages ainda puxava do CDN do Google, o que manda o IP de quem
 * abre a página de privacidade para um terceiro — justamente na página que
 * promete que o app não faz isso. Este script copia os woff2 para
 * docs/fontes/ e escreve o docs/fontes.css com os @font-face.
 *
 * As mesmas famílias e pesos do app, nada a mais: cada peso é um arquivo
 * que a pessoa baixa.
 */

import { copyFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(RAIZ, 'docs/fontes');

/* [pacote, família, pesos] — espelha os imports de src/main.jsx. */
const FAMILIAS = [
  ['baloo-2', 'Baloo 2', [600, 700]],
  ['nunito', 'Nunito', [400, 600, 700, 800]],
  ['source-sans-3', 'Source Sans 3', [400]],
];

mkdirSync(DESTINO, { recursive: true });

const regras = [
  '/* Fontes do Combinado, servidas pelo próprio site.',
  ' * Geradas por scripts/fontes-site.mjs — não editar à mão.',
  ' * Nada vem do Google: a página que promete não mandar dados a',
  ' * terceiros não pode ser a que manda. */',
  '',
];
let total = 0;

for (const [pacote, familia, pesos] of FAMILIAS) {
  for (const peso of pesos) {
    const nome = `${pacote}-latin-${peso}-normal.woff2`;
    const origem = resolve(RAIZ, 'node_modules/@fontsource', pacote, 'files', nome);
    copyFileSync(origem, resolve(DESTINO, nome));
    total += statSync(origem).size;
    regras.push(
      '@font-face{'
      + `font-family:'${familia}';font-style:normal;font-weight:${peso};font-display:swap;`
      + `src:url('fontes/${nome}') format('woff2')}`,
    );
  }
}

writeFileSync(resolve(RAIZ, 'docs/fontes.css'), regras.join('\n') + '\n');
console.log(`${regras.length - 5} arquivos, ${Math.round(total / 1024)} KB em docs/fontes/`);
console.log('docs/fontes.css escrito');
