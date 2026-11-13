/* Endereços do Combinado.
 *
 * Enquanto SUPABASE estiver vazio, o app usa o modo antigo: a lista de
 * licenças publicada no GitHub Pages. Assim nada quebra entre a troca de
 * marca e a entrada do servidor no ar.
 */

export const SITE = 'https://marquetti-ric.github.io/rotina-innova';

/* Preencher depois de implantar o servidor (veja servidor/README.md).
   Exemplo: 'https://abcdefgh.supabase.co/functions/v1' */
export const SUPABASE = '';

/* Chave anônima do projeto Supabase — pública por definição, só abre as
   Edge Functions. As tabelas estão sob RLS fechada. */
export const SUPABASE_ANON = '';

/* Chave pública que verifica a assinatura dos tokens, sem internet.
   Gerada por `node servidor/gerar-chaves.mjs`. */
export const CHAVE_PUBLICA = null;

export const temServidor = () => Boolean(SUPABASE && SUPABASE_ANON && CHAVE_PUBLICA);

export const URL_LICENCAS = `${SITE}/licencas.json`;
export const URL_VERSAO = `${SITE}/latest.json`;

export async function buscarJson(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${url}?t=${Date.now()}`, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export async function chamar(funcao, corpo, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${SUPABASE}/${funcao}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify(corpo),
    });
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}
