#!/usr/bin/env node
/**
 * Gestão de licenças do Rotina Innova.
 *
 * O arquivo docs/licencas.json é PÚBLICO (servido pelo GitHub Pages).
 * Por isso ele guarda apenas o HASH SHA-256 do código, nunca o código em si:
 * de posse do arquivo ninguém consegue derivar um código válido.
 *
 * Uso:
 *   node scripts/licenca.mjs --acao liberar --apelido "Família A" --validade 2027-12-31
 *   node scripts/licenca.mjs --acao renovar --codigo INNV-XXXX-XXXX-XXXX --validade 2028-06-30
 *   node scripts/licenca.mjs --acao revogar --codigo INNV-XXXX-XXXX-XXXX
 *   node scripts/licenca.mjs --acao listar
 */
import { createHash, randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ARQUIVO = 'docs/licencas.json';
// Alfabeto sem caracteres que se confundem lidos ou ditados: sem 0/O, 1/I/L, 5/S.
const ALFABETO = '23456789ABCDEFGHJKMNPQRTUVWXYZ';

function args() {
  const a = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    a[process.argv[i].replace(/^--/, '')] = (process.argv[i + 1] || '').trim();
  }
  return a;
}

function normalizar(codigo) {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function hash(codigo) {
  return createHash('sha256').update(normalizar(codigo)).digest('hex');
}

function gerarCodigo() {
  let miolo = '';
  for (let i = 0; i < 12; i++) miolo += ALFABETO[randomInt(ALFABETO.length)];
  // ~59 bits de entropia: inviável de adivinhar a partir dos hashes publicados.
  return 'INNV-' + miolo.match(/.{1,4}/g).join('-');
}

function carregar() {
  if (!existsSync(ARQUIVO)) {
    return { atualizadoEm: '', graciaDias: 7, licencas: [] };
  }
  return JSON.parse(readFileSync(ARQUIVO, 'utf8'));
}

function salvar(dados) {
  dados.atualizadoEm = new Date().toISOString().slice(0, 10);
  writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + '\n');
}

function validarData(d) {
  if (!d) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Data inválida: ${d}. Use AAAA-MM-DD.`);
  return d;
}

const a = args();
const base = carregar();
const acao = a.acao || 'listar';

if (acao === 'liberar') {
  const codigo = gerarCodigo();
  const validade = validarData(a.validade);
  base.licencas.push({
    h: hash(codigo),
    apelido: a.apelido || 'sem apelido',
    criadaEm: new Date().toISOString().slice(0, 10),
    validade: validade || null,
    ativa: true,
  });
  salvar(base);
  console.log(`## Licença criada\n`);
  console.log(`**Código para entregar ao responsável:**\n`);
  console.log('```');
  console.log(codigo);
  console.log('```\n');
  console.log(`- Apelido: ${a.apelido || 'sem apelido'}`);
  console.log(`- Validade: ${validade || 'sem prazo'}`);
  console.log(`\n> Anote este código agora. Só o hash fica guardado — não há como recuperá-lo depois.`);

} else if (acao === 'renovar') {
  if (!a.codigo) throw new Error('Informe --codigo para renovar.');
  const h = hash(a.codigo);
  const lic = base.licencas.find((l) => l.h === h);
  if (!lic) throw new Error('Código não encontrado.');
  lic.validade = validarData(a.validade) || null;
  lic.ativa = true;
  salvar(base);
  console.log(`## Licença renovada\n`);
  console.log(`- Apelido: ${lic.apelido}`);
  console.log(`- Nova validade: ${lic.validade || 'sem prazo'}`);

} else if (acao === 'revogar') {
  if (!a.codigo) throw new Error('Informe --codigo para revogar.');
  const h = hash(a.codigo);
  const lic = base.licencas.find((l) => l.h === h);
  if (!lic) throw new Error('Código não encontrado.');
  lic.ativa = false;
  lic.revogadaEm = new Date().toISOString().slice(0, 10);
  salvar(base);
  console.log(`## Licença revogada\n`);
  console.log(`- Apelido: ${lic.apelido}`);
  console.log(`\n> O app bloqueia após o período de carência de ${base.graciaDias} dias sem conexão.`);

} else {
  const hoje = new Date().toISOString().slice(0, 10);
  console.log(`## Licenças (${base.licencas.length})\n`);
  console.log('| Apelido | Criada | Validade | Situação |');
  console.log('|---|---|---|---|');
  for (const l of base.licencas) {
    const vencida = l.validade && l.validade < hoje;
    const sit = !l.ativa ? 'revogada' : vencida ? 'vencida' : 'ativa';
    console.log(`| ${l.apelido} | ${l.criadaEm} | ${l.validade || '—'} | ${sit} |`);
  }
}
