/* O idioma do app.
 *
 * Duas coisas que valem antes de qualquer linha:
 *
 * 1. **Interface e conteúdo são coisas diferentes.** Os textos de tela —
 *    botões, títulos, erros — são interface e moram em `src/textos/`. Os
 *    144 passos das tarefas de fábrica e o vocabulário-núcleo da prancha
 *    são CONTEÚDO clínico-pedagógico: eles vão para arquivos próprios, que
 *    uma terapeuta edita sem tocar em código. Misturar os dois é o que
 *    torna tradução cara para sempre.
 *
 * 2. **Traduzir não localiza.** Um idioma só entra em `COMPLETOS` quando
 *    tem, além da interface: vocabulário-núcleo próprio (não traduzido
 *    palavra a palavra — a lista de palavras muda de língua para língua),
 *    revisão do tom por alguém que fale a língua, varredura de vocabulário
 *    de sintoma na língua, e a análise regulatória do país de destino. A
 *    RDC 657 da ANVISA é o que mantém o produto fora do registro de
 *    dispositivo médico aqui; lá fora isso é MDR ou FDA, e a página de
 *    privacidade citando a LGPD vira documento errado. Nada disso é
 *    trabalho de tradutor.
 *
 * Enquanto um idioma não está completo ele existe no código e NÃO aparece
 * para o usuário. Meio app em espanhol é pior que app em português.
 */

export const IDIOMAS = [
  { id: 'pt-BR', nome: 'Português (Brasil)', curto: 'pt', voz: ['pt-BR', 'pt'] },
  { id: 'es', nome: 'Español', curto: 'es', voz: ['es-ES', 'es-419', 'es'] },
  { id: 'en', nome: 'English', curto: 'en', voz: ['en-US', 'en-GB', 'en'] },
];

export const PADRAO_IDIOMA = 'pt-BR';

/* Só o português está completo. Espanhol e inglês têm a interface pronta e
   esperam conteúdo e parecer por mercado. */
export const COMPLETOS = ['pt-BR'];

export const ehCompleto = (id) => COMPLETOS.includes(id);

/* A prévia. Um idioma incompleto não aparece para ninguém — é a regra, e
 * existe porque interface traduzida com tarefas em português é pior que app
 * em português. Mas então não havia como *testar* espanhol e inglês num
 * aparelho de verdade, o que empurra a revisão para o fim, quando sai caro.
 *
 * Então quem destrava é a licença, do mesmo jeito que destrava o nível 4: a
 * licença decide o que esta instalação mostra. Uma clínica não cai nisso por
 * acidente, e o idioma incompleto aparece rotulado como incompleto.
 *
 * Deliberadamente NÃO entra em `doAparelho`: um aparelho em espanhol não
 * abre o app em espanhol por ter prévia ligada. A prévia é uma escolha que
 * alguém faz na tela, nunca um padrão herdado. */
let previa = false;
export const definirPrevia = (v) => { previa = v === true; };
export const temPrevia = () => previa;

export const oferecidos = () =>
  IDIOMAS.filter((i) => ehCompleto(i.id) || (previa && faltando(i.id).length === 0));
export const infoDe = (id) => IDIOMAS.find((i) => i.id === id) || IDIOMAS[0];

/* O idioma do aparelho, se for um que o app fala. Só vale como sugestão
   inicial: a escolha do adulto, uma vez feita, manda. */
export function doAparelho(navegador) {
  const nav = navegador || (typeof navigator !== 'undefined' ? navigator : null);
  const tags = (nav && (nav.languages || (nav.language ? [nav.language] : []))) || [];
  for (const tag of tags) {
    const baixo = String(tag).toLowerCase();
    const achado = IDIOMAS.find((i) => baixo === i.id.toLowerCase() || baixo.startsWith(i.curto + '-') || baixo === i.curto);
    if (achado && ehCompleto(achado.id)) return achado.id;
  }
  return PADRAO_IDIOMA;
}

/* --------------------------------------------------------------- textos */

import ptBR from './textos/pt-BR.js';
import es from './textos/es.js';
import en from './textos/en.js';

const DICIONARIOS = { 'pt-BR': ptBR, es, en };

let atual = PADRAO_IDIOMA;

export const idiomaAtual = () => atual;

export function definirIdioma(id) {
  atual = DICIONARIOS[id] ? id : PADRAO_IDIOMA;
  return atual;
}

/* `tx('portao.titulo')`, com substituição por `{nome}`.
 *
 * O nome não é `t` de propósito: neste código `t` é a convenção para
 * *tarefa* (`lista.find((t) => ...)`), e há oito variáveis locais com esse
 * nome. Importar `t` sombrearia em silêncio — foi exatamente o que
 * aconteceu no Portão, e o erro virou a mensagem errada na tela.
 *
 * Chave sem tradução cai no português e não some da tela: um texto faltando
 * é um defeito a corrigir, não motivo para a criança ver um espaço vazio no
 * meio de uma rotina. */
export function tx(chave, vars) {
  const dic = DICIONARIOS[atual] || DICIONARIOS[PADRAO_IDIOMA];
  let texto = dic[chave];
  if (texto === undefined) texto = DICIONARIOS[PADRAO_IDIOMA][chave];
  if (texto === undefined) return chave;
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (inteiro, nome) =>
    (vars[nome] === undefined ? inteiro : String(vars[nome])));
}

/* Quais chaves faltam num idioma. O guarda usa isto para não deixar um
   idioma entrar em COMPLETOS pela metade. */
export function faltando(id) {
  const base = DICIONARIOS[PADRAO_IDIOMA];
  const dic = DICIONARIOS[id] || {};
  return Object.keys(base).filter((k) => dic[k] === undefined);
}

/* ----------------------------------------------------------- datas e nº */

/* Datas pelo Intl, nunca na mão. A primeira versão da casa do nível 4
   escrevia "quarta, 18 de novembro" com os meses num array — isso é um
   idioma embutido num lugar onde ninguém procura. */
export function dataPorExtenso(iso, id) {
  const quando = new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso);
  try {
    return new Intl.DateTimeFormat(id || atual, { weekday: 'long', day: 'numeric', month: 'long' })
      .format(quando);
  } catch {
    return String(iso);
  }
}

export function diaDaSemana(indice, id) {
  try {
    /* 2026-11-15 é um domingo: serve de âncora para o índice 0..6. */
    const base = new Date(Date.UTC(2026, 10, 15 + (indice % 7), 12));
    return new Intl.DateTimeFormat(id || atual, { weekday: 'short', timeZone: 'UTC' }).format(base);
  } catch {
    return String(indice);
  }
}

export function numero(n, id) {
  try {
    return new Intl.NumberFormat(id || atual).format(n);
  } catch {
    return String(n);
  }
}
