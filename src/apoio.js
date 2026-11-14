import { storage } from './armazenamento.js';

/* O perfil de apoio: o que o responsável informa sobre o funcionamento da
 * criança, e os ajustes que o app tira disso.
 *
 * Três regras de arquitetura que não devem ser afrouxadas:
 *
 * 1. O rótulo nunca governa a tela. Quem informa a condição é o adulto; quem
 *    manda na interface é o objeto `ajustes`. O diagnóstico só pré-preenche.
 *    Por isso apagar a identificação não desmonta o app para a criança: os
 *    ajustes ficam, só a informação de saúde sai.
 * 2. Chave de armazenamento própria (`combinado_apoio_v1`), separada do estado
 *    do app. Dado sensível de saúde de criança apagado tem de ser uma operação
 *    só, auditável, sem carregar o resto do estado junto.
 *    Nada disto sai do aparelho — nem para o servidor de licenças, nem para o
 *    painel da clínica.
 * 3. A escolha manual do responsável vence a derivada. Cada criança é única e
 *    nenhuma tabela de condição acerta sempre; se um ajuste não serve, ele
 *    desliga, e o que o adulto desligou continua desligado.
 */

const CHAVE = 'combinado_apoio_v1';

export const CONDICOES = [
  { id: 'tea', nome: 'TEA (autismo)', temNivel: true },
  { id: 'tdah', nome: 'TDAH' },
  { id: 'tdl', nome: 'Atraso ou transtorno de linguagem' },
  { id: 'apraxia', nome: 'Apraxia de fala' },
  { id: 'dislexia', nome: 'Dislexia' },
  { id: 'tdc', nome: 'Disgrafia ou TDC (coordenação)' },
  { id: 'di', nome: 'Deficiência intelectual' },
  { id: 'down', nome: 'Síndrome de Down' },
  { id: 'ansiedade', nome: 'Ansiedade' },
];

export const NIVEIS_TEA = [
  { n: 1, nome: 'Nível 1', sub: 'exige apoio' },
  { n: 2, nome: 'Nível 2', sub: 'apoio substancial' },
  { n: 3, nome: 'Nível 3', sub: 'apoio muito substancial' },
];

export const SENSORIAL = [
  { id: 'nenhum', nome: 'Sem alteração marcante', desc: '' },
  { id: 'hiper', nome: 'Hiper-reativo', desc: 'Evita som alto, luz forte, certos toques.' },
  { id: 'hipo', nome: 'Hipo-reativo', desc: 'Busca movimento, aperto, barulho.' },
  { id: 'misto', nome: 'Misto', desc: 'Depende do dia e do estímulo.' },
];

export const COMUNICACAO = [
  { id: 'oral', nome: 'Fala oral funcional', desc: 'Pede e conta o que precisa falando.' },
  { id: 'mista', nome: 'Fala em construção', desc: 'Fala um pouco e usa a prancha de apoio.' },
  { id: 'prancha', nome: 'Usa prancha', desc: 'Não falante ou fala pouco funcional.' },
];

export const VISAO = [
  { id: 'tipica', nome: 'Visão típica ou corrigida', desc: '' },
  { id: 'baixa', nome: 'Baixa visão', desc: 'Precisa de alto contraste e texto grande.' },
];

export const INTERESSES = [
  { id: 'bichos', nome: 'Animais' },
  { id: 'dinos', nome: 'Dinossauros' },
  { id: 'espaco', nome: 'Espaço' },
  { id: 'carros', nome: 'Carros' },
  { id: 'mar', nome: 'Mar' },
  { id: 'musica', nome: 'Música' },
];

export const APOIO_PADRAO = {
  consentiu: false,
  condicoes: [],
  nivelTEA: 1,
  sensorial: 'nenhum',
  comunicacao: 'oral',
  visao: 'tipica',
  interesse: '',
  /* O que o responsável mexeu à mão. Guardado à parte para a derivação nunca
     sobrescrever uma escolha consciente dele. */
  manual: {},
};

/* O que o app faz de diferente. Cada chave é lida por uma tela; nenhuma
   consulta a lista de condições. */
export function derivarAjustes(a = APOIO_PADRAO) {
  const p = { ...APOIO_PADRAO, ...a };
  const tem = (id) => (p.condicoes || []).includes(id);
  const nivelTEA = tem('tea') ? p.nivelTEA || 1 : 0;

  const bruto = {
    /* passoUnico: uma coisa por tela, mesmo no nível 3. */
    passoUnico: nivelTEA >= 2 || tem('di'),
    /* literal: sem metáfora, sem ironia, uma ação por frase. */
    literal: tem('tea'),
    /* antecipacao: a faixa "agora / depois", que reduz imprevisibilidade. */
    antecipacao: tem('tea') || tem('ansiedade'),
    /* cartoes: quantos cartões de rotina por momento. */
    cartoes: nivelTEA >= 3 ? 2 : nivelTEA === 2 ? 3 : tem('di') ? 3 : 0,
    /* calmo: o modo que já existia no app, agora também derivado. */
    calmo: p.sensorial === 'hiper' || nivelTEA >= 2,
    /* voz: narrar o passo em voz alta. Desligada para quem evita som. */
    voz: (tem('dislexia') || tem('di') || tem('down') || tem('tdl')) && p.sensorial !== 'hiper',
    /* leitura: texto maior e mais espaçado. */
    leitura: tem('dislexia') || tem('di') || tem('down'),
    /* minutosFoco: tamanho do bloco antes de oferecer pausa. 0 = sem bloco. */
    minutosFoco: tem('tdah') ? 5 : nivelTEA >= 2 ? 7 : 0,
    /* pausaCorpo: atalho de movimento na casa. */
    pausaCorpo: tem('tdah') || p.sensorial === 'hipo' || p.sensorial === 'misto',
    /* reforcoDenso: elogio a cada passo e recompensa dobrada. */
    reforcoDenso: tem('tdah') || tem('di') || tem('down'),
    /* silabar: palavra partida em sílabas, com modelo lento. */
    silabar: tem('apraxia') || tem('tdl') || tem('down'),
    /* tracadoSimples: menos pontos e área de acerto maior. */
    tracadoSimples: tem('tdc') || tem('down') || nivelTEA >= 2,
    /* prancha: a prancha de comunicação a um toque, em qualquer tela. */
    prancha: p.comunicacao === 'prancha' || p.comunicacao === 'mista',
    /* semExigenciaOral: nenhuma atividade cobra fala. */
    semExigenciaOral: p.comunicacao === 'prancha',
    /* contraste: paleta de alto contraste. */
    contraste: p.visao === 'baixa',
    /* sentimentos: o check-in de emoções e a respiração. Módulo à parte, não
       liga sozinho — a não ser quando a ansiedade foi informada, que é
       exatamente o caso em que ter onde dizer "estou com medo" ajuda. */
    sentimentos: tem('ansiedade'),
    interesse: p.interesse || '',
  };

  /* A última palavra é do adulto. */
  return { ...bruto, ...(p.manual || {}) };
}

/* De onde veio cada ajuste. É o que a tela "o que muda no app" mostra, e é o
   que permite ao responsável discordar de um item sem desconfiar do resto. */
export function explicarAjustes(a = APOIO_PADRAO) {
  const p = { ...APOIO_PADRAO, ...a };
  const aj = derivarAjustes(p);
  const tem = (id) => (p.condicoes || []).includes(id);
  const nivelTEA = tem('tea') ? p.nivelTEA || 1 : 0;
  const rotuloTEA = nivelTEA ? `TEA nível ${nivelTEA}` : 'TEA';
  const sens = (SENSORIAL.find((s) => s.id === p.sensorial) || SENSORIAL[0]).nome.toLowerCase();
  const manual = p.manual || {};
  const linhas = [];

  const põe = (chave, texto, origem) => {
    if (!aj[chave]) return;
    linhas.push({
      texto,
      origem: chave in manual ? 'você escolheu' : origem,
      manual: chave in manual,
    });
  };

  põe('passoUnico', 'Rotina um passo por tela, inclusive no nível 3', tem('di') ? 'deficiência intelectual' : rotuloTEA);
  põe('literal', 'Linguagem literal, uma instrução por frase', 'TEA');
  põe('antecipacao', 'Faixa agora / depois em toda atividade', tem('tea') ? 'TEA' : 'ansiedade');
  if (aj.cartoes) {
    linhas.push({
      texto: `No máximo ${aj.cartoes} cartões por tela`,
      origem: 'cartoes' in manual ? 'você escolheu' : (nivelTEA ? rotuloTEA : 'deficiência intelectual'),
      manual: 'cartoes' in manual,
    });
  }
  põe('calmo', 'Modo calmo: sem animação, faísca ou confete', p.sensorial === 'hiper' ? sens : rotuloTEA);
  põe('voz', 'A voz do aparelho lê o passo e a dica', 'apoio à leitura');
  põe('leitura', 'Texto maior e mais espaçado', 'apoio à leitura');
  if (!aj.voz && p.sensorial === 'hiper') {
    linhas.push({ texto: 'Voz automática desligada', origem: sens, manual: false });
  }
  if (aj.minutosFoco) {
    linhas.push({
      texto: `Blocos de ${aj.minutosFoco} minutos, com pausa oferecida no fim`,
      origem: 'minutosFoco' in manual ? 'você escolheu' : (tem('tdah') ? 'TDAH' : rotuloTEA),
      manual: 'minutosFoco' in manual,
    });
  }
  põe('reforcoDenso', 'Elogio a cada passo e recompensa dobrada', tem('tdah') ? 'TDAH' : 'apoio à motivação');
  põe('pausaCorpo', 'Atalho de pausa do corpo na casa', tem('tdah') ? 'TDAH' : sens);
  põe('silabar', 'Palavras partidas em sílabas, com modelo lento', tem('apraxia') ? 'apraxia de fala' : 'linguagem');
  põe('tracadoSimples', 'Traçado com menos pontos e alvo maior', tem('tdc') ? 'coordenação' : rotuloTEA);
  põe('prancha', 'Prancha de comunicação a um toque, em qualquer tela', 'como a criança se comunica');
  põe('semExigenciaOral', 'Nenhuma atividade cobra fala oral', 'como a criança se comunica');
  põe('contraste', 'Alto contraste: fundo escuro, cores puras, texto maior', 'baixa visão');
  põe('sentimentos', 'Atalho "como eu estou", com respiração', 'ansiedade');

  return linhas;
}

/* Alguma coisa foi informada? Serve para o app saber se mostra a identificação
   como "a preencher" ou como "preenchida". */
export function temIdentificacao(a) {
  const p = { ...APOIO_PADRAO, ...(a || {}) };
  return (p.condicoes || []).length > 0
    || p.sensorial !== 'nenhum'
    || p.comunicacao !== 'oral'
    || p.visao !== 'tipica';
}

/* Resumo de uma linha para a área dos responsáveis. */
export function resumoApoio(a) {
  const p = { ...APOIO_PADRAO, ...(a || {}) };
  const nomes = (p.condicoes || []).map((id) => {
    const c = CONDICOES.find((x) => x.id === id);
    if (!c) return id;
    return c.id === 'tea' ? `${c.nome} — nível ${p.nivelTEA}` : c.nome;
  });
  return nomes.length ? nomes.join(' + ') : 'nada informado';
}

export async function carregarApoio() {
  try {
    const r = await storage.get(CHAVE);
    if (!r) return APOIO_PADRAO;
    return { ...APOIO_PADRAO, ...JSON.parse(r.value) };
  } catch {
    return APOIO_PADRAO;
  }
}

export async function gravarApoio(a) {
  try {
    await storage.set(CHAVE, JSON.stringify(a));
  } catch {
    /* Sem armazenamento o app continua: o perfil vale para esta sessão. */
  }
}

/* Apaga a informação de saúde e preserva o comportamento do app: o que a
   derivação tinha produzido é promovido a escolha manual, então a criança
   abre o app amanhã e encontra exatamente o que já usava. */
export async function apagarIdentificacao(a) {
  const aj = derivarAjustes(a);
  const novo = { ...APOIO_PADRAO, consentiu: false, manual: aj, interesse: '' };
  delete novo.manual.interesse;
  await gravarApoio(novo);
  return novo;
}
