import { storage } from './armazenamento.js';

/* "O que eu noto" — registro de observação do responsável, e o relatório que
 * ele leva na consulta.
 *
 * O que isto NÃO é, e a distinção sustenta o enquadramento do produto: não é
 * triagem, não pontua, não compara com norma nenhuma e não conclui nada. É um
 * caderno estruturado. Quem interpreta é o profissional.
 *
 * Por isso o vocabulário é de COMPORTAMENTO OBSERVÁVEL, nunca de sintoma.
 * "Som alto incomodou" é o que o responsável viu; "hipersensibilidade
 * auditiva" é conclusão, e conclusão não é trabalho deste app. Se uma etiqueta
 * nova parecer nome de sintoma, ela não entra.
 *
 * O relatório também não carrega a lista de condições do perfil de apoio.
 * Ele diz o que o app está fazendo e o que a família observou; o diagnóstico,
 * quem conta é a família, com as palavras dela. Um documento gerado por app
 * que afirma a condição da criança vira outra coisa — e essa outra coisa tem
 * regra própria.
 */

const CHAVE = 'combinado_notas_v1';

export const TIPOS = [
  {
    id: 'rotina',
    nome: 'Numa rotina',
    pergunta: 'O que ajudou ou atrapalhou?',
    cor: 'musgo',
  },
  {
    id: 'sensorial',
    nome: 'Som, luz, textura',
    pergunta: 'O que incomodou, e o que acalmou?',
    cor: 'agua',
  },
  {
    id: 'dificil',
    nome: 'Momento difícil',
    pergunta: 'O que veio antes, e o que ajudou a passar?',
    cor: 'coral',
  },
  {
    id: 'conquista',
    nome: 'Conquista',
    pergunta: 'O que ela fez que não fazia antes?',
    cor: 'damasco',
  },
];

/* Etiquetas de um toque, para a anotação levar trinta segundos. Caderno que
   pede redação fica vazio na segunda semana. */
export const ETIQUETAS = {
  rotina: [
    'travou no mesmo passo', 'precisou que eu mostrasse', 'fez quase tudo sozinha',
    'desistiu no meio', 'o tempo não deu', 'quis repetir',
  ],
  sensorial: [
    'som alto', 'luz forte', 'lugar cheio', 'etiqueta ou costura da roupa',
    'textura da comida', 'cheiro forte', 'ser tocada de surpresa',
    'acalmou em lugar quieto', 'acalmou com aperto ou abraço', 'acalmou com fone',
    'acalmou com o objeto preferido',
  ],
  dificil: [
    'mudança de plano', 'barulho de repente', 'pedido novo', 'fome ou sono',
    'acabou uma coisa de que gostava', 'não consegui entender o que ela queria',
    'passou sozinha', 'passou com companhia', 'passou mudando de lugar',
  ],
  conquista: [
    'fez sozinha pela primeira vez', 'pediu com palavras', 'pediu pela prancha',
    'esperou a vez', 'aceitou mudar de plano', 'contou como estava se sentindo',
  ],
};

export const PADRAO_NOTAS = { lista: [] };

export function novaNota(tipo = 'rotina', tarefaId = '') {
  return {
    id: 'n' + Date.now(),
    tipo,
    dia: new Date().toISOString().slice(0, 10),
    etiquetas: [],
    texto: '',
    tarefa: tarefaId,
  };
}

export function limparNota(n) {
  return {
    ...n,
    texto: String(n.texto || '').trim().slice(0, 400),
    etiquetas: (n.etiquetas || []).slice(0, 8),
  };
}

/* Uma nota sem etiqueta e sem texto não diz nada: não vale gravar. */
export function temConteudo(n) {
  return (n.etiquetas || []).length > 0 || String(n.texto || '').trim().length > 0;
}

export async function carregarNotas() {
  try {
    const r = await storage.get(CHAVE);
    if (!r) return PADRAO_NOTAS;
    const s = JSON.parse(r.value);
    return { ...PADRAO_NOTAS, ...s, lista: s.lista || [] };
  } catch {
    return PADRAO_NOTAS;
  }
}

export async function gravarNotas(n) {
  try {
    await storage.set(CHAVE, JSON.stringify(n));
  } catch {
    /* Sem armazenamento o app continua: as notas valem para esta sessão. */
  }
}

export async function apagarNotas() {
  await gravarNotas(PADRAO_NOTAS);
  return PADRAO_NOTAS;
}

/* ---------------- relatório ---------------- */

const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const PERIODOS = [
  { dias: 7, nome: '7 dias' },
  { dias: 30, nome: '30 dias' },
  { dias: 90, nome: '3 meses' },
];

export function diaBR(iso) {
  return `${iso.slice(8)}/${iso.slice(5, 7)}`;
}

/* Reúne num objeto o que o app mediu e o que o responsável anotou.
 *
 * Duas honestidades que o formato precisa carregar:
 * - o que é do período e o que é acumulado vêm rotulados de formas diferentes,
 *   porque as conclusões de rotina não guardam data e fingir que guardam seria
 *   inventar uma série temporal;
 * - não há totais, médias nem tendência. Um número que sobe sugere conclusão,
 *   e conclusão é do profissional.
 */
export function montarRelatorio({ estado, notas, emocoes = [], tarefas = [], dias = 30, hoje }) {
  const d = estado || {};
  const limite = diasAtras(dias);
  const fim = hoje || new Date().toISOString().slice(0, 10);

  const doPeriodo = (lista) => (lista || []).filter((x) => (x.dia || '') >= limite && (x.dia || '') <= fim);

  const notasPeriodo = doPeriodo(notas.lista).sort((a, b) => (a.dia < b.dia ? 1 : -1));
  const porTipo = TIPOS.map((t) => ({
    ...t,
    notas: notasPeriodo.filter((n) => n.tipo === t.id),
  })).filter((t) => t.notas.length > 0);

  const diarioPeriodo = doPeriodo(d.diario);
  const contagem = emocoes
    .map((e) => ({ nome: e.nome, n: diarioPeriodo.filter((x) => x.e === e.id).length }))
    .filter((x) => x.n > 0);

  const rotinas = tarefas
    .map((t) => {
      const vezes = (d.feitos || {})[t.id] || 0;
      const a = (d.autonomia || {})[t.id];
      return {
        nome: t.nome,
        vezes,
        semAjuda: a && a.total ? Math.round((a.sozinho / a.total) * 100) : null,
      };
    })
    .filter((r) => r.vezes > 0)
    .sort((a, b) => b.vezes - a.vezes);

  return {
    nome: d.nome || 'a criança',
    de: limite,
    ate: fim,
    dias,
    porTipo,
    contagem,
    rotinas,
    totalNotas: notasPeriodo.length,
  };
}

/* A mesma coisa em texto, para colar numa mensagem. O cabeçalho e o rodapé
   dizem o que isto é e o que não é — se o relatório viajar sozinho para o
   WhatsApp de alguém, precisa dizer por si. */
export function comoTexto(rel) {
  const L = [];
  L.push(`Observações sobre ${rel.nome}`);
  L.push(`Período: ${diaBR(rel.de)} a ${diaBR(rel.ate)}`);
  L.push('');
  L.push('Este resumo reúne o que a família observou e o que o aplicativo de');
  L.push('rotina registrou. Não é avaliação, não é triagem e não conclui nada.');
  L.push('');

  if (rel.rotinas.length) {
    L.push('ROTINAS CONCLUÍDAS (desde o início do uso)');
    rel.rotinas.forEach((r) => {
      const auto = r.semAjuda === null ? '' : ` · ${r.semAjuda}% das vezes sem ajuda`;
      L.push(`- ${r.nome}: ${r.vezes}x${auto}`);
    });
    L.push('');
  }

  if (rel.contagem.length) {
    L.push(`COMO ELA DISSE QUE ESTAVA (${rel.dias} dias)`);
    L.push(rel.contagem.map((c) => `${c.nome}: ${c.n}`).join(' · '));
    L.push('');
  }

  rel.porTipo.forEach((t) => {
    L.push(t.nome.toUpperCase());
    t.notas.forEach((n) => {
      const partes = [];
      if (n.etiquetas.length) partes.push(n.etiquetas.join('; '));
      if (n.texto) partes.push(n.texto);
      L.push(`- ${diaBR(n.dia)}: ${partes.join(' — ')}`);
    });
    L.push('');
  });

  if (!rel.rotinas.length && !rel.contagem.length && !rel.porTipo.length) {
    L.push('Ainda não há nada registrado neste período.');
    L.push('');
  }

  L.push('Quem interpreta isto é o profissional que acompanha a criança.');
  return L.join('\n');
}

/* Copiar sem plugin novo: a área de transferência do WebView resolve, e o
   caminho de baixo cobre o navegador antigo. Devolve se conseguiu, porque a
   tela precisa dizer a verdade ao responsável. */
export async function copiar(texto) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* cai para o caminho de baixo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
