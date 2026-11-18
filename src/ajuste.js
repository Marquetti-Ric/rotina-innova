/* O assistente de ajuste: a conversa que liga "esta tarefa está travando"
 * a "então mude isto".
 *
 * O app já sabia derivar 18 ajustes do perfil (apoio.js). O que faltava era
 * usar esse perfil para resolver um problema concreto, meses depois da
 * identificação. É isso que está aqui.
 *
 * Quatro invariantes. As três primeiras são de produto, a quarta é a que
 * mantém o app fora do registro de dispositivo médico:
 *
 * 1. **A saída é mudança no app, nunca conselho sobre a criança.** Toda
 *    proposta cai em `d.ajustes[tarefa]` ou em `apoio.manual`, que já
 *    existem. "Quebrar o passo em dois" é configuração de organizador de
 *    rotina; "ela parece desregulada à noite" seria leitura clínica.
 * 2. **A criança não liga ajuste nenhum.** O que ela escolhe em
 *    `Atrapalhou` chega aqui como ponto de partida, e quem decide é o
 *    adulto. É a mesma invariante do apoio.js: a escolha manual vence a
 *    derivada.
 * 3. **Vocabulário de comportamento observável**, como no caderno. Nenhuma
 *    pergunta nomeia sintoma ou condição — `teste:ajuste` varre e quebra.
 * 4. **Nada sai do aparelho.** Árvore de decisão, sem rede e sem modelo de
 *    linguagem. Pela RDC 657/2022 a finalidade continua sendo organizar
 *    rotina; um assistente que interpretasse sintoma e orientasse conduta
 *    mudaria isso e levaria a registro e responsável técnico.
 */

import { derivarAjustes } from './apoio.js';

/* ----------------------------------------------------------- propostas */

/* `alvo` diz onde a mudança cai. `valor` fixo, ou calculado por `calcular`
 * quando depende da tarefa e das respostas. `efeito` é a linha que o
 * responsável lê antes de decidir, e é também o que vai para o caderno. */
export const PROPOSTAS = {
  passosFinos: {
    alvo: 'tarefa', campo: 'passosNivel',
    titulo: 'Quebrar os passos desta tarefa em pedaços menores',
    porque:
      'A tarefa já tem uma versão com mais passos, escrita para idade menor. Ela entra só aqui, sem mudar o resto do app.',
    /* Não é conteúdo novo: toda tarefa de fábrica já traz três quebras. */
    cabe: ({ tarefa, nivel }) => Boolean(tarefa.n) && nivel > 1,
    calcular: ({ nivel }) => nivel - 1,
    efeito: ({ tarefa, nivel }) =>
      `${tarefa.nome}: de ${(tarefa.n[nivel] || []).length} para ${(tarefa.n[nivel - 1] || []).length} passos`,
  },
  antecipacao: {
    alvo: 'perfil', campo: 'antecipacao', valor: true,
    titulo: 'Mostrar a faixa agora / depois',
    porque: 'O fim fica visível desde o começo. Serve quando o travamento é não saber quanto falta.',
    efeito: () => 'Aparece uma faixa no topo com o passo atual e o próximo',
  },
  moverHorario: {
    alvo: 'tarefa', campo: 'horario',
    titulo: 'Mover o horário desta tarefa',
    porque: 'Encostar a tarefa em outra que já funciona costuma resolver mais que insistir no horário.',
    cabe: ({ vizinha }) => Boolean(vizinha),
    calcular: ({ vizinha }) => vizinha.horario,
    efeito: ({ tarefa, vizinha }) =>
      `${tarefa.nome}: de ${tarefa.horario || 'sem horário'} para ${vizinha.horario}, junto de ${vizinha.nome.toLowerCase()}`,
  },
  blocos: {
    alvo: 'perfil', campo: 'minutosFoco',
    titulo: 'Oferecer pausa a cada bloco curto',
    porque: 'A pausa vem antes de ela parar sozinha, e aí a volta é mais fácil.',
    calcular: ({ minutos }) => minutos || 5,
    efeito: ({ minutos }) => `Blocos de ${minutos || 5} minutos, com pausa oferecida no fim`,
  },
  pausaAntes: {
    alvo: 'tarefa', campo: 'pausaAntes', valor: true,
    titulo: 'Pôr uma pausa do corpo antes desta tarefa',
    porque: 'Uma das quatro cenas de movimento entra como passo zero, para gastar o corpo antes de pedir atenção.',
    efeito: ({ tarefa }) => `${tarefa.nome} começa com "preciso me mexer"`,
  },
  reforcoDenso: {
    alvo: 'perfil', campo: 'reforcoDenso', valor: true,
    titulo: 'Elogiar a cada passo, não só no fim',
    porque: 'Quando o fim está longe, o reforço no fim não sustenta o meio.',
    efeito: () => 'Cada passo concluído ganha retorno, e a recompensa dobra',
  },
  menosCartoes: {
    alvo: 'perfil', campo: 'cartoes', valor: 2,
    titulo: 'Mostrar menos cartões por tela',
    porque: 'Tela com muita escolha trava a escolha.',
    efeito: () => 'No máximo 2 cartões por momento',
  },
  voz: {
    alvo: 'perfil', campo: 'voz', valor: true,
    titulo: 'A voz do aparelho lê os passos',
    porque: 'Serve quando o passo é entendido ouvindo, mas não lido.',
    efeito: () => 'Um alto-falante no passo, que ela toca quando quiser',
  },
  calmo: {
    alvo: 'perfil', campo: 'calmo', valor: true,
    titulo: 'Ligar o modo calmo',
    porque: 'Tira animação, faísca e confete de todo o app.',
    efeito: () => 'Nada se move além do necessário',
  },
  tema: {
    alvo: 'perfil', campo: 'interesse',
    titulo: 'Usar o interesse dela nos cartões',
    porque: 'O desenho do cartão e o elogio passam a falar do que ela gosta.',
    cabe: ({ apoio }) => Boolean(apoio.interesse) && !derivarAjustes(apoio).interesse,
    calcular: ({ apoio }) => apoio.interesse,
    efeito: ({ apoio }) => `Os cartões ganham o tema "${apoio.interesse}"`,
  },
  menosDias: {
    alvo: 'tarefa', campo: 'dias',
    titulo: 'Cobrar esta tarefa em menos dias por semana',
    porque:
      'Uma rotina que falha quase todo dia ensina que falhar é o normal. Menos dias, todos cumpridos, sustenta melhor.',
    cabe: ({ tarefa }) => (tarefa.dias || []).length > 3,
    calcular: ({ tarefa }) => (tarefa.dias || []).filter((_, i) => i % 2 === 0).slice(0, 3),
    efeito: ({ tarefa }) =>
      `${tarefa.nome}: de ${(tarefa.dias || []).length} para 3 dias por semana`,
  },
  tirarCronometro: {
    alvo: 'tarefa', campo: 'duracao', valor: 0,
    titulo: 'Tirar o cronômetro desta tarefa',
    porque: 'O relógio correndo é pressão a mais quando o problema é começar.',
    cabe: ({ tarefa }) => Boolean(tarefa.duracao),
    efeito: () => 'O passo deixa de ter contagem de tempo',
  },
};

/* ------------------------------------------------- pontos de travamento */

export const PONTOS = [
  { id: 'naoComeca', rotulo: 'Ela não começa', sub: 'O cartão fica lá, e ela não toca' },
  { id: 'paraNoMeio', rotulo: 'Começa e para no meio', sub: 'Faz alguns passos e abandona' },
  { id: 'briga', rotulo: 'Faz, mas com muita briga', sub: 'Sai, mas custa caro para os dois' },
  { id: 'corrido', rotulo: 'Faz correndo e sai incompleto', sub: 'Marca tudo sem fazer de verdade' },
  { id: 'varia', rotulo: 'Depende do dia', sub: 'Uns dias flui, outros não' },
];

/* ---------------------------------------------------------------- sondas */

const tem = (a, id) => (a.condicoes || []).includes(id);

/* `quando` é o que faz o assistente ser especializado: a mesma queixa gera
 * perguntas diferentes porque o perfil já disse como essa criança funciona.
 * `peso` ordena as escolhidas pelo perfil — para quem não fala, saber se o
 * pedido de ajuda chega vem antes de qualquer sensorial, porque sem isso
 * todo o resto é adivinhação. */
export const SONDAS = [
  {
    id: 'qualPasso', pontos: ['paraNoMeio', 'corrido'], ancora: true,
    quando: () => true,
    pergunta: 'Em qual passo ela para?',
    dica: 'São os passos do cartão de hoje.',
    /* As opções saem da tarefa de verdade, não de uma lista fixa. */
    gerar: ({ passos }) => [
      ...passos.slice(0, 6).map((p, i) => ({
        id: 'p' + i,
        rotulo: p.t || p.txt || `Passo ${i + 1}`,
        /* Travar no primeiro passo é não entrar na sequência; travar depois
           é a sequência ficar longa demais. São consertos diferentes. */
        propoe: i === 0 ? ['antecipacao', 'reforcoDenso'] : ['passosFinos', 'reforcoDenso'],
      })),
      { id: 'variado', rotulo: 'Não é sempre no mesmo', propoe: ['antecipacao', 'passosFinos'] },
    ],
  },
  {
    id: 'comoPede', peso: 1, pontos: ['naoComeca', 'paraNoMeio', 'briga'],
    quando: (a) => a.comunicacao === 'prancha' || a.comunicacao === 'mista',
    pergunta: 'Quando trava, ela consegue avisar de algum jeito?',
    peloPerfil: 'O perfil diz que ela usa a prancha, então saber se o pedido chega muda o conserto.',
    opcoes: [
      { id: 'prancha', rotulo: 'Sim, pela prancha', propoe: ['passosFinos'] },
      { id: 'chora', rotulo: 'Só chorando ou se jogando', propoe: ['passosFinos', 'antecipacao', 'pausaAntes'] },
      { id: 'sai', rotulo: 'Não avisa, só sai de perto', propoe: ['antecipacao', 'passosFinos'] },
    ],
  },
  {
    id: 'entendeOPasso', peso: 2, pontos: ['naoComeca', 'paraNoMeio'],
    quando: (a) => tem(a, 'dislexia') || tem(a, 'di') || tem(a, 'down') || a.visao === 'baixa',
    pergunta: 'Ela entende o que o passo pede?',
    peloPerfil: 'O perfil pede apoio à leitura, então vale separar "não entendi" de "não quero".',
    opcoes: [
      { id: 'lendo', rotulo: 'Só se alguém ler para ela', propoe: ['voz'] },
      { id: 'desenho', rotulo: 'Pelo desenho, sim; pelo texto, não', propoe: ['voz', 'passosFinos'] },
      { id: 'entende', rotulo: 'Entende, mas não faz', propoe: ['reforcoDenso', 'antecipacao'] },
    ],
  },
  {
    id: 'quantoAguenta', peso: 3, pontos: ['paraNoMeio', 'corrido'],
    quando: (a) => tem(a, 'tdah'),
    pergunta: 'Quanto tempo ela costuma aguentar antes de parar?',
    peloPerfil: 'O perfil informa TDAH, então o tamanho do bloco é a primeira coisa a medir.',
    opcoes: [
      { id: 'tres', rotulo: 'Uns 3 minutos', minutos: 3, propoe: ['blocos', 'pausaAntes', 'reforcoDenso'] },
      { id: 'cinco', rotulo: 'Uns 5 minutos', minutos: 5, propoe: ['blocos', 'reforcoDenso'] },
      { id: 'mais', rotulo: 'Mais que isso', propoe: ['reforcoDenso'] },
    ],
  },
  {
    id: 'sensorialEvita', peso: 4, pontos: ['naoComeca', 'paraNoMeio', 'briga'],
    quando: (a) => a.sensorial === 'hiper' || a.sensorial === 'misto',
    pergunta: 'Nesse momento tem algum som, luz, gosto ou textura que ela evita?',
    peloPerfil: 'O perfil diz que ela evita estímulo forte, então esta vem primeiro.',
    opcoes: [
      { id: 'gosto', rotulo: 'O gosto ou a textura', propoe: ['passosFinos', 'moverHorario'] },
      { id: 'som', rotulo: 'O som do ambiente', propoe: ['moverHorario', 'calmo'] },
      { id: 'luz', rotulo: 'A luz do lugar', propoe: ['moverHorario'] },
      { id: 'gente', rotulo: 'Tem muita gente em volta', propoe: ['moverHorario'] },
      { id: 'nada', rotulo: 'Nada disso', propoe: [] },
    ],
  },
  {
    id: 'sabeOQueVem', peso: 4, pontos: ['naoComeca', 'briga', 'varia'],
    quando: (a) => tem(a, 'tea') || tem(a, 'ansiedade'),
    pergunta: 'Ela sabe o que vem depois desta tarefa?',
    peloPerfil: 'O perfil informa TEA, e o travamento no começo costuma ser sobre o depois, não sobre a tarefa.',
    opcoes: [
      { id: 'nao', rotulo: 'Não, e ela pergunta muito', propoe: ['antecipacao', 'menosCartoes'] },
      { id: 'mudou', rotulo: 'Sabe, mas a ordem mudou ultimamente', propoe: ['antecipacao', 'moverHorario'] },
      { id: 'sabe', rotulo: 'Sabe e está tudo igual', propoe: ['reforcoDenso', 'tema'] },
    ],
  },
  {
    id: 'sensorialBusca', peso: 5, pontos: ['naoComeca', 'paraNoMeio', 'corrido', 'briga'],
    quando: (a) => a.sensorial === 'hipo' || a.sensorial === 'misto',
    pergunta: 'Quando trava, ela está parada ou se mexendo muito?',
    peloPerfil: 'O perfil diz que ela busca movimento e aperto.',
    opcoes: [
      { id: 'mexendo', rotulo: 'Se mexendo muito', propoe: ['pausaAntes', 'blocos'] },
      { id: 'parada', rotulo: 'Parada, como se tivesse desligado', propoe: ['pausaAntes', 'reforcoDenso'] },
      { id: 'varia', rotulo: 'Varia', propoe: ['pausaAntes'] },
    ],
  },
  {
    id: 'comoEhOComeco', pontos: ['naoComeca'],
    quando: () => true,
    pergunta: 'Como é o pedido para começar?',
    opcoes: [
      { id: 'falado', rotulo: 'Eu falo e ela precisa procurar o cartão', propoe: ['menosCartoes'] },
      { id: 'mostro', rotulo: 'Eu mostro o cartão na tela', propoe: ['antecipacao'] },
      { id: 'sozinha', rotulo: 'Ela deveria abrir sozinha, no horário', propoe: ['moverHorario', 'tirarCronometro'] },
    ],
  },
  {
    id: 'oQueVemAntes', pontos: ['briga', 'varia'],
    quando: () => true,
    pergunta: 'O que costuma vir imediatamente antes?',
    dica: 'Muitas brigas não são com a tarefa, e sim com o que ela interrompe.',
    opcoes: [
      { id: 'tela', rotulo: 'Tela, jogo ou vídeo', propoe: ['antecipacao', 'moverHorario'] },
      { id: 'brincar', rotulo: 'Brincadeira que ela escolheu', propoe: ['antecipacao', 'moverHorario'] },
      { id: 'outra', rotulo: 'Outra tarefa da rotina', propoe: ['pausaAntes', 'menosCartoes'] },
      { id: 'nada', rotulo: 'Nada em especial', propoe: ['reforcoDenso'] },
    ],
  },
  {
    id: 'porQueCorre', pontos: ['corrido'],
    quando: () => true,
    pergunta: 'O que ela ganha quando termina?',
    opcoes: [
      { id: 'tela', rotulo: 'Vai para a tela ou para o brinquedo', propoe: ['tirarCronometro', 'passosFinos'] },
      { id: 'estrela', rotulo: 'A estrela do app', propoe: ['passosFinos', 'reforcoDenso'] },
      { id: 'nada', rotulo: 'Nada, é só a próxima tarefa', propoe: ['tema', 'reforcoDenso'] },
    ],
  },
  {
    id: 'quantosDias', pontos: ['varia'],
    quando: () => true,
    pergunta: 'Em quantos dias da semana ela cumpre esta tarefa?',
    dica: 'Uma rotina que falha quase todo dia ensina que falhar é o normal.',
    opcoes: [
      { id: 'quase', rotulo: 'Quase todos', propoe: ['reforcoDenso'] },
      { id: 'metade', rotulo: 'Umas três vezes', propoe: ['menosDias', 'reforcoDenso'] },
      { id: 'raro', rotulo: 'Uma ou nenhuma', propoe: ['menosDias', 'passosFinos', 'antecipacao'] },
    ],
  },
];

/* No máximo três perguntas: a quarta já é interrogatório, e quem responde
 * está cansado. A âncora primeiro, as do perfil por peso, as gerais depois. */
export const MAX_SONDAS = 3;

export function sondasDe(pontoId, apoio) {
  const servem = SONDAS.filter((s) => s.pontos.includes(pontoId) && s.quando(apoio));
  const ancora = servem.filter((s) => s.ancora);
  const resto = servem.filter((s) => !s.ancora);
  const doPerfil = resto.filter((s) => s.peloPerfil).sort((a, b) => (a.peso || 9) - (b.peso || 9));
  const gerais = resto.filter((s) => !s.peloPerfil);
  return [...ancora, ...doPerfil, ...gerais].slice(0, MAX_SONDAS);
}

export function opcoesDa(sonda, ctx) {
  return sonda.gerar ? sonda.gerar(ctx) : sonda.opcoes;
}

/* -------------------------------------------------------------- contexto */

/* A tarefa vizinha é a âncora para mover o horário: encostar a que trava numa
 * que já funciona.
 *
 * Tem de ser do MESMO momento do dia. A primeira versão pegava a mais
 * distante no relógio, com o argumento de que encostar numa tarefa do mesmo
 * minuto não muda nada — e aí o app propôs mover "se arrumar" das 07:00 para
 * as 21:30, junto da hora de dormir. Fora do momento não é ajuste, é outra
 * rotina. Sem vizinha no mesmo momento, não se propõe mover. */
const MINUTOS_MINIMOS = 20;

export function vizinhaDe(tarefa, tarefas) {
  if (!tarefa) return null;
  const emMinutos = (t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t.horario || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const minha = emMinutos(tarefa);
  const candidatas = (tarefas || []).filter(
    (t) => t.id !== tarefa.id && !t.oculta && emMinutos(t) !== null
      && (!tarefa.momento || t.momento === tarefa.momento),
  );
  if (!candidatas.length) return null;
  if (minha === null) return candidatas[0];
  /* A mais próxima que ainda represente mudança de verdade. */
  const uteis = candidatas.filter((t) => Math.abs(emMinutos(t) - minha) >= MINUTOS_MINIMOS);
  if (!uteis.length) return null;
  return uteis.reduce((melhor, t) =>
    Math.abs(emMinutos(t) - minha) < Math.abs(emMinutos(melhor) - minha) ? t : melhor);
}

export function contextoDe({ tarefa, nivel, apoio, tarefas, respostas = [] }) {
  const passos = tarefa && tarefa.n ? tarefa.n[nivel] || [] : (tarefa && tarefa.passos) || [];
  const minutos = respostas.map((r) => r.minutos).find(Boolean);
  return { tarefa, nivel, apoio, passos, minutos, vizinha: vizinhaDe(tarefa, tarefas) };
}

/* ------------------------------------------------------------ propostas */

/* O que já está ligado não se propõe: um assistente que sugere o que a
 * pessoa já fez parece que não olhou. */
function jaLigada(id, ctx) {
  const p = PROPOSTAS[id];
  const ajustes = derivarAjustes(ctx.apoio);
  if (p.alvo === 'perfil') {
    const atual = ajustes[p.campo];
    if (p.campo === 'minutosFoco') return Boolean(atual);
    if (p.campo === 'cartoes') return atual <= 2;
    if (p.campo === 'interesse') return Boolean(atual);
    return atual === true;
  }
  const atual = ctx.tarefa[p.campo];
  if (p.campo === 'passosNivel') return Boolean(atual);
  if (p.campo === 'pausaAntes') return atual === true;
  if (p.campo === 'duracao') return !atual;
  return false;
}

export const MAX_PROPOSTAS = 4;

export function propostasDe(respostas, ctx) {
  const ids = [];
  for (const r of respostas) for (const id of r.propoe || []) if (!ids.includes(id)) ids.push(id);
  return ids
    .filter((id) => PROPOSTAS[id])
    .filter((id) => !jaLigada(id, ctx))
    .filter((id) => !PROPOSTAS[id].cabe || PROPOSTAS[id].cabe(ctx))
    /* Quatro é o teto: a tela é lida por um adulto cansado, e uma lista de
       seis decisões não é ajuda, é mais trabalho. */
    .slice(0, MAX_PROPOSTAS)
    .map((id) => {
      const p = PROPOSTAS[id];
      return {
        id, alvo: p.alvo, campo: p.campo, titulo: p.titulo, porque: p.porque,
        valor: p.calcular ? p.calcular(ctx) : p.valor,
        efeito: p.efeito(ctx),
      };
    });
}

/* Aplica. Devolve estado novo, sem mexer no recebido: `d` para a tarefa e
 * `apoio` para o perfil, com a mudança indo sempre para `manual`. */
export function aplicar(proposta, { d, apoio, tarefa }) {
  if (proposta.alvo === 'tarefa') {
    const anterior = (d.ajustes || {})[tarefa.id] || {};
    return {
      d: { ...d, ajustes: { ...(d.ajustes || {}), [tarefa.id]: { ...anterior, [proposta.campo]: proposta.valor } } },
      apoio,
    };
  }
  return { d, apoio: { ...apoio, manual: { ...(apoio.manual || {}), [proposta.campo]: proposta.valor } } };
}

export function aplicarTodas(propostas, estado) {
  return propostas.reduce((acc, p) => aplicar(p, acc), estado);
}

/* ---------------------------------------------------------- o caderno */

/* Uma frase, não uma lista de respostas soltas: o caderno é lido pela
 * terapeuta meses depois, e "molhar a escova; a luz do lugar" não diz nada. */
export function fraseDoAjuste(ponto, respostas, tarefa) {
  const passo = respostas.find((r) => /^p\d+$/.test(r.id || ''));
  const outras = respostas.filter((r) => r !== passo && (r.propoe || []).length);
  let f = `${tarefa.nome}: ${ponto.rotulo.toLowerCase()}`;
  if (passo) f += `, no passo "${passo.rotulo.toLowerCase()}"`;
  f += '.';
  if (outras.length) f += ' ' + outras.map((r) => r.rotulo).join('. ') + '.';
  return f;
}

/* ------------------------------------------ o check-in da criança */

/* Isto NÃO é o check-in de emoções, que já existe em Sentimentos.jsx. Ali a
 * pergunta é como ela está; aqui é o que atrapalhou.
 *
 * A pergunta é "o que atrapalhou?", nunca "por que você não fez?". A
 * primeira põe o problema fora dela; a segunda é acusação, e para uma
 * criança que falha na mesma tarefa todo dia a diferença não é de estilo.
 *
 * Só opção desenhada, nenhum texto livre, e nada do que ela escolhe liga
 * ajuste sozinho: chega no assistente do adulto como ponto de partida. */
export const ATRAPALHOU = [
  { id: 'barulho', rotulo: 'Muito barulho', quando: (a) => a.sensorial !== 'hipo', propoe: ['moverHorario', 'calmo'] },
  { id: 'luz', rotulo: 'Luz forte', quando: (a) => a.sensorial === 'hiper' || a.sensorial === 'misto', propoe: ['moverHorario'] },
  { id: 'gosto', rotulo: 'Não gostei do gosto', quando: (a) => a.sensorial === 'hiper' || a.sensorial === 'misto', propoe: ['passosFinos', 'moverHorario'] },
  { id: 'mexer', rotulo: 'Precisei me mexer', quando: () => true, propoe: ['pausaAntes', 'blocos'] },
  { id: 'longo', rotulo: 'Era muito longo', quando: () => true, propoe: ['passosFinos', 'blocos'] },
  { id: 'entendi', rotulo: 'Não entendi', quando: () => true, propoe: ['voz', 'passosFinos'] },
  { id: 'cansada', rotulo: 'Estava cansada', quando: () => true, propoe: ['moverHorario', 'menosDias'] },
  { id: 'ajuda', rotulo: 'Queria ajuda', quando: () => true, propoe: ['passosFinos', 'voz'] },
  { id: 'naoSei', rotulo: 'Não sei', quando: () => true, propoe: [] },
];

export const atrapalhouDe = (apoio) => ATRAPALHOU.filter((o) => o.quando(apoio));

/* O que a criança disse vira nota atribuída a ela. Nunca misturada com a do
 * adulto: no resumo da consulta a terapeuta precisa saber quem falou. */
export function notaDaCrianca(escolhas, tarefa) {
  const ditos = escolhas.map((id) => (ATRAPALHOU.find((o) => o.id === id) || {}).rotulo).filter(Boolean);
  return {
    tipo: 'rotina',
    fonte: 'crianca',
    tarefa: tarefa.id,
    etiquetas: [],
    texto: `Ela disse: ${ditos.join('; ').toLowerCase()}.`,
  };
}
