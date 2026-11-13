/* Verificação do token de licença, dentro do aparelho.
 *
 * O app carrega só a chave pública, então pode conferir a assinatura
 * sem internet — é isso que permite abrir no modo avião e seguir
 * funcionando. Um token adulterado reprova aqui mesmo.
 */

import { CHAVE_PUBLICA } from './servidor';

const deB64url = (s) => {
  const p = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '='.repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

let chave = null;
async function publica() {
  if (chave) return chave;
  chave = await crypto.subtle.importKey(
    'jwk',
    { ...CHAVE_PUBLICA, ext: true, key_ops: ['verify'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  return chave;
}

/* Devolve o conteúdo quando a assinatura confere, ou null.
   Não julga validade: quem decide sobre vencimento e carência é licenca.js,
   porque um token vencido ainda vale durante a carência. */
export async function verificar(token) {
  try {
    if (!CHAVE_PUBLICA || typeof token !== 'string') return null;
    const [cab, corpo, assinatura] = token.split('.');
    if (!cab || !corpo || !assinatura) return null;

    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await publica(),
      deB64url(assinatura),
      new TextEncoder().encode(`${cab}.${corpo}`),
    );
    if (!ok) return null;

    return JSON.parse(new TextDecoder().decode(deB64url(corpo)));
  } catch {
    return null;
  }
}
