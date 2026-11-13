#!/usr/bin/env node
/**
 * Gera o par de chaves que assina os tokens de licença (ECDSA P-256).
 *
 * A privada vai para os secrets do Supabase e nunca sai de lá.
 * A pública entra no app, que a usa para verificar o token sem internet.
 *
 *   node servidor/gerar-chaves.mjs
 */
import { webcrypto as crypto } from 'node:crypto';

const par = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', par.privateKey)).toString('base64');
const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
const publica = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };

console.log(`
=====================================================================
 CHAVE PRIVADA — secret do Supabase, nome CHAVE_PRIVADA
 Nunca comite este valor. Guarde uma cópia no cofre: sem ela, nenhum
 token novo pode ser emitido e todos os aparelhos param na carência.
=====================================================================

${pkcs8}

=====================================================================
 CHAVE PÚBLICA — cole em src/servidor.js, em CHAVE_PUBLICA
 Esta pode ser versionada: com ela só se verifica, não se assina.
=====================================================================

export const CHAVE_PUBLICA = ${JSON.stringify(publica, null, 2)};
`);
