#!/usr/bin/env node
/* Grava a versão no projeto iOS.
 *
 * Roda nos dois lugares — no workflow e no Mac, antes de arquivar pelo Xcode
 * — e é por isso que ele existe em vez de dois `sed` soltos.
 *
 * A versão de marketing vem do `docs/latest.json`, que é a fonte única, a
 * mesma que o `release.yml` usa para o gradle.
 *
 * O número de build é outra coisa, e a conta tem motivo. O App Store Connect
 * recusa build repetido, então ele tem de subir a cada envio, mesmo sem
 * versão nova — reenviar a mesma versão é rotina em teste. Só que há DOIS
 * lugares que enviam: o workflow e o Mac. Se o workflow usasse o `run_number`
 * e o Mac usasse outra coisa, os dois se cruzariam: um envio do Mac com
 * número menor que o último do CI é recusado, e descobrir isso leva uma
 * rodada inteira.
 *
 * Então os dois contam do mesmo relógio: minutos desde 2020-01-01, em UTC.
 * Sobe sozinho, nunca repete, e cabe num inteiro de 32 bits com folga de
 * séculos — o que importa, porque `CFBundleVersion` é inteiro, não data.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const PROJETO = 'ios/App/App.xcodeproj/project.pbxproj';
const EPOCA = Date.UTC(2020, 0, 1) / 1000;

export const numeroDeBuild = (agora = Date.now()) =>
  Math.floor((agora / 1000 - EPOCA) / 60);

const nomeDaVersao = () =>
  JSON.parse(readFileSync('docs/latest.json', 'utf8')).versionName;

function gravar() {
  const nome = nomeDaVersao();
  const build = numeroDeBuild();
  let fonte = readFileSync(PROJETO, 'utf8');

  const antes = fonte;
  fonte = fonte
    .replace(/MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${nome};`)
    .replace(/CURRENT_PROJECT_VERSION = [^;]*;/g, `CURRENT_PROJECT_VERSION = ${build};`);

  /* Se nada casou, o pbxproj mudou de forma e gravar silenciosamente nada
     seria pior que falhar: o envio sairia com a versão velha. */
  if (fonte === antes) {
    console.error('Não achei MARKETING_VERSION nem CURRENT_PROJECT_VERSION no pbxproj.');
    process.exit(1);
  }
  writeFileSync(PROJETO, fonte);
  console.log(`versão ${nome}, build ${build}`);
  return { nome, build };
}

if (process.argv[1]?.endsWith('ios-versao.mjs')) {
  const { nome, build } = gravar();
  /* O workflow lê estes dois para o resumo e para o altool. */
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `nome=${nome}\ncodigo=${build}\n`, { flag: 'a' });
  }
}
