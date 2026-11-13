/* A marca que o app veste.
 *
 * O padrão é o Combinado. Quando a licença pertence a uma clínica que
 * subiu a identidade dela, o servidor devolve um tema na ativação e
 * `aplicarTema` troca estes valores — sem tocar nas telas da criança.
 *
 * O que a clínica personaliza é a moldura: logotipo, cor de destaque,
 * nome exibido e rodapé. O miolo (ilustrações, paleta das tarefas,
 * tempos de animação) é fixo, porque é onde está o trabalho de
 * acessibilidade sensorial — e uma cor saturada vinda de uma marca
 * qualquer quebraria justamente essa parte.
 */

export const MARCA_PADRAO = {
  nome: 'Combinado',
  logo: '/logo-combinado.svg',
  assinatura: 'Organizador visual de rotinas',
  rodape: '',
  destaque: null, // null = usa a cor do próprio app
};

let atual = { ...MARCA_PADRAO };

export function marca() {
  return atual;
}

/* Contraste relativo entre duas cores, pela fórmula da WCAG. */
function luminancia(hex) {
  const n = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

export function contrasteOk(hex, fundo = '#FFFFFF') {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return false;
  const a = luminancia(hex), b = luminancia(fundo);
  const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return razao >= 3; // mínimo da WCAG para elemento gráfico
}

export function aplicarTema(tema) {
  if (!tema) {
    atual = { ...MARCA_PADRAO };
    return atual;
  }
  atual = {
    ...MARCA_PADRAO,
    ...tema,
    // Cor reprovada no contraste cai para a do app, em vez de
    // renderizar algo que a criança não enxerga.
    destaque: contrasteOk(tema.destaque) ? tema.destaque : null,
  };
  if (atual.destaque) {
    document.documentElement.style.setProperty('--musgo', atual.destaque);
  }
  return atual;
}
