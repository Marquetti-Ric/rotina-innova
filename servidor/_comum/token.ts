/* Token de licença: um JWT assinado em ES256 (ECDSA P-256 + SHA-256).
 *
 * A escolha de assimétrico é deliberada. O app carrega apenas a chave
 * PÚBLICA e verifica a assinatura sozinho, sem internet — é isso que
 * permite abrir o app no modo avião e seguir funcionando. Com HMAC, o
 * segredo teria que viajar dentro do aplicativo, onde qualquer um o
 * extrairia e emitiria os próprios tokens.
 *
 * ES256 e não Ed25519 porque a Web Crypto de WebViews Android mais
 * antigos ainda não traz Ed25519.
 */

const b64url = (dados: Uint8Array) =>
  btoa(String.fromCharCode(...dados))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const texto = (s: string) => new TextEncoder().encode(s);

export interface Conteudo {
  lic: string;        // id da licença
  dev: string;        // id do aparelho
  org: string;        // slug da organização
  exp: number;        // expiração, em segundos
  gracia: number;     // dias de carência depois do vencimento
  tema?: Record<string, unknown> | null;
}

async function chavePrivada(pkcs8Base64: string) {
  const bruto = Uint8Array.from(atob(pkcs8Base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    bruto,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

export async function assinar(conteudo: Conteudo, pkcs8Base64: string) {
  const cabecalho = b64url(texto(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const corpo = b64url(texto(JSON.stringify(conteudo)));
  const base = `${cabecalho}.${corpo}`;
  const assinatura = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    await chavePrivada(pkcs8Base64),
    texto(base),
  );
  return `${base}.${b64url(new Uint8Array(assinatura))}`;
}

/* Lê o conteúdo SEM conferir a assinatura. Serve só para descobrir de qual
   licença um token fala antes de ir ao banco — nunca para decidir acesso. */
export function lerSemVerificar(token: string): Conteudo | null {
  try {
    const corpo = token.split('.')[1];
    const json = atob(corpo.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
