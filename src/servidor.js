/* Endereço único do site publicado pelo GitHub Pages.
   Troque apenas esta linha se o repositório ou a organização mudarem. */
export const SITE = import.meta.env.VITE_SITE || 'https://marquetti-ric.github.io/combinado';

export const URL_LICENCAS = `${SITE}/licencas.json`;
export const URL_VERSAO = `${SITE}/latest.json`;

/* O arquivo é pequeno e muda pouco; o parâmetro evita cache velho do CDN. */
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
