/* Narração do passo em voz alta.
 *
 * Usa o sintetizador do próprio aparelho — nada é enviado para fora, que é a
 * regra do projeto. Em troca, a voz depende do que está instalado: num celular
 * sem pacote pt-BR a fala sai com sotaque, ou não sai. Por isso a voz é apoio
 * e nunca o único caminho: todo texto falado também está escrito na tela.
 */

let vozPtBr;

function escolherVoz(sintese) {
  if (vozPtBr !== undefined) return vozPtBr;
  try {
    const vs = sintese.getVoices() || [];
    vozPtBr = vs.find((v) => v.lang === 'pt-BR')
      || vs.find((v) => (v.lang || '').startsWith('pt'))
      || null;
  } catch {
    vozPtBr = null;
  }
  return vozPtBr;
}

export function temVoz() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/* `devagar` serve para a sílaba separada: lento o bastante para a criança
   acompanhar o movimento da boca. */
export function falar(texto, { devagar = false } = {}) {
  if (!texto || !temVoz()) return;
  try {
    const s = window.speechSynthesis;
    s.cancel();
    const u = new window.SpeechSynthesisUtterance(String(texto));
    u.lang = 'pt-BR';
    u.rate = devagar ? 0.62 : 0.88;
    u.pitch = 1.05;
    const v = escolherVoz(s);
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
