/* Narração do passo em voz alta.
 *
 * Usa o sintetizador do próprio aparelho — nada é enviado para fora, que é a
 * regra do projeto. Em troca, a voz depende do que está instalado: num celular
 * sem o pacote do idioma a fala sai com sotaque, ou não sai. Por isso a voz é
 * apoio e nunca o único caminho: todo texto falado também está escrito na tela.
 *
 * O idioma vem de fora, de `src/idioma.js`. Antes `pt-BR` estava fixo aqui, e
 * num app multilíngue isso significaria o espanhol sendo lido com fonética
 * portuguesa — pior que não falar.
 *
 * **Quando falta o pacote, alguém precisa saber.** Para a criança que usa a
 * voz como caminho de leitura, uma narração que simplesmente não sai é
 * regressão de acessibilidade, não detalhe. `faltaVoz()` existe para a tela
 * do adulto avisar, em vez de deixar o silêncio parecer defeito do app.
 */

import { idiomaAtual, infoDe } from './idioma.js';

let cache = {};

export function temVoz() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/* A melhor voz instalada para o idioma, seguindo a ordem de preferência do
 * próprio idioma (es-ES antes de es-419, por exemplo). */
function escolherVoz(sintese, id) {
  if (cache[id] !== undefined) return cache[id];
  try {
    const vs = sintese.getVoices() || [];
    const prefs = infoDe(id).voz;
    let achada = null;
    for (const p of prefs) {
      achada = vs.find((v) => (v.lang || '').replace('_', '-') === p)
        || vs.find((v) => (v.lang || '').replace('_', '-').startsWith(p + '-'))
        || null;
      if (achada) break;
    }
    if (!achada) {
      const curto = infoDe(id).curto;
      achada = vs.find((v) => (v.lang || '').toLowerCase().startsWith(curto)) || null;
    }
    /* Lista vazia costuma significar "ainda carregando", e não "não tem".
       Nesse caso não guardamos a ausência no cache. */
    if (!vs.length) return null;
    cache[id] = achada;
  } catch {
    cache[id] = null;
  }
  return cache[id];
}

/* Há voz do idioma atual neste aparelho? `null` significa "ainda não sei" —
 * a lista do sintetizador chega assíncrona em alguns navegadores. */
export function faltaVoz(id) {
  if (!temVoz()) return true;
  const alvo = id || idiomaAtual();
  try {
    const s = window.speechSynthesis;
    const vs = s.getVoices() || [];
    if (!vs.length) return null;
    return !escolherVoz(s, alvo);
  } catch {
    return true;
  }
}

/* Troca de idioma limpa o cache: a voz certa é outra. */
export function esquecerVozes() {
  cache = {};
}

/* `devagar` serve para a sílaba separada: lento o bastante para a criança
   acompanhar o movimento da boca. */
export function falar(texto, { devagar = false, idioma } = {}) {
  if (!texto || !temVoz()) return;
  try {
    const id = idioma || idiomaAtual();
    const s = window.speechSynthesis;
    s.cancel();
    const u = new window.SpeechSynthesisUtterance(String(texto));
    u.lang = infoDe(id).voz[0];
    u.rate = devagar ? 0.62 : 0.88;
    u.pitch = 1.05;
    const v = escolherVoz(s, id);
    if (v) u.voice = v;
    s.speak(u);
  } catch {
    /* Sem voz o app segue: o texto está na tela. */
  }
}

export function calar() {
  if (!temVoz()) return;
  try { window.speechSynthesis.cancel(); } catch { /* nada a fazer */ }
}
