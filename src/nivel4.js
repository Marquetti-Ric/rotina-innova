/* Nível 4 — "por conta própria". O nível em que o jovem é dono do app.
 *
 * Os níveis 1 a 3 variam o tamanho do passo. Este varia outra coisa: QUEM É
 * O DONO DA ROTINA. Nos três primeiros o adulto monta e a criança executa;
 * para um adolescente essa relação é o problema, porque a tarefa da idade é
 * deixar de ser executor.
 *
 * Três papéis, e confundi-los é o erro que desmonta o nível:
 *
 *   titular da licença → paga, recebe aviso de vencimento e HABILITA o
 *                        nível 4. Clínica, ou quem comprou na loja.
 *   responsável        → administra no dia a dia e executa a passagem.
 *   dono da rotina     → níveis 1 a 3: o responsável. Nível 4: o jovem.
 *
 * A licença define quem RESPONDE, nunca quem é dono. É por isso que o nível
 * 4 move a propriedade sem mover a responsabilidade — e é o que torna o
 * modelo defensável para a clínica que paga.
 *
 * Cinco invariantes, todas com teste:
 *
 * 1. **Retirar o app de volta é possível, nunca silencioso.** O adulto pode
 *    voltar ao nível 3; quando volta, o app conta para o jovem. Autonomia
 *    revogável em segredo é pior que autonomia nenhuma: ensina que o
 *    controle era da boca para fora.
 * 2. **O número conta o ambiente, nunca a pessoa.** "Esqueci — 2" é fato
 *    sobre a manhã; "você cumpriu 62%" é veredito. Sem nota, sem
 *    porcentagem e sem sequência — quebrar uma sequência transformaria o
 *    pior dia dele numa punição visível.
 * 3. **A recompensa é menos app.** Quando a rotina se sustenta, o app
 *    oferece parar de lembrar. Um organizador que funciona deveria ser
 *    necessário cada vez menos.
 * 4. **As anotações dele não têm interruptor.** Rotina e travamentos ele
 *    partilha se quiser; as anotações, não existe botão para ligar.
 * 5. **A partilha não é configurável pela clínica.** O `marca.js` já
 *    separou moldura de miolo: a clínica veste logotipo, cor e nome, e o
 *    miolo é fixo. Partilha é miolo. A clínica liga ou não liga o nível 4;
 *    o que ela não faz é ligar e continuar vendo tudo.
 */

export const NIVEL4 = 4;

/* ------------------------------------------------------------ propriedade */

export const DONO_ADULTO = 'adulto';
export const DONO_JOVEM = 'jovem';

export const PADRAO_N4 = {
  dono: DONO_ADULTO,
  /* O que o adulto vê. As anotações não entram aqui de propósito: não há
     interruptor para elas. */
  partilha: { rotina: false, travamentos: false },
  /* Marcado quando o adulto devolve o app ao nível 3, para o jovem ser
     avisado na próxima vez que abrir. Invariante 1. */
  retomadoEm: '',
  /* Pedido do jovem, no nível 3, para ter o app para si. */
  pedido: '',
};

/* A licença permite o nível 4? Licença antiga, sem o campo, não permite. */
export const permiteNivel4 = (licenca) => Boolean(licenca && licenca.nivel4 === true);

/* Quem recebe aviso de vencimento. A família não renova licença de clínica:
 * mandar o aviso para ela é inútil, e para o jovem é pior — é um lembrete
 * silencioso de que o app não é dele. */
export const avisoDeLicencaPara = (licenca) =>
  licenca && licenca.titular === 'clinica' ? 'clinica' : 'responsavel';

export const ehDono = (d) => (d || {}).dono === DONO_JOVEM;

/* A passagem. Só acontece com licença que permite, e é explícita dos dois
 * lados: o adulto confirma o que está abrindo mão, e o jovem é recebido com
 * a regra na cara. */
export function passar(d) {
  return { ...d, dono: DONO_JOVEM, retomadoEm: '', pedido: '' };
}

/* A retomada. Invariante 1: deixa rastro, e o rastro é para o jovem. */
export function retomar(d, hoje) {
  return { ...d, dono: DONO_ADULTO, retomadoEm: hoje || new Date().toISOString().slice(0, 10) };
}

export const viuRetomada = (d) => ({ ...d, retomadoEm: '' });

/* O pedido do jovem, no nível 3: hoje ele não tem nem como levantar o
 * assunto. Quem decide continua sendo o adulto — mas pedir já é o exercício
 * que o nível inteiro existe para sustentar. */
export function pedir(d, hoje) {
  return { ...d, pedido: hoje || new Date().toISOString().slice(0, 10) };
}
export const limparPedido = (d) => ({ ...d, pedido: '' });

/* --------------------------------------------------------------- partilha */

export const CANAIS = [
  {
    id: 'rotina', nome: 'Minha rotina de hoje',
    ligado: 'Ela vê os nomes e os horários.',
    desligado: 'Hoje ela não vê.',
  },
  {
    id: 'travamentos', nome: 'O que eu marco quando trava',
    ligado: 'Ela vê o que você marcou.',
    desligado: 'Hoje ela não vê.',
  },
  {
    id: 'notas', nome: 'Minhas anotações', travado: true,
    desligado: 'Ninguém vê. Não dá para ligar.',
  },
];

export const partilhaDe = (d) => ({ ...PADRAO_N4.partilha, ...(d || {}).partilha });

export function virarPartilha(d, canal) {
  const atual = partilhaDe(d);
  /* As anotações não têm interruptor, então nem o código aceita ligá-las. */
  if (canal === 'notas') return d;
  return { ...d, partilha: { ...atual, [canal]: !atual[canal] } };
}

/* O que o adulto efetivamente enxerga. Fora do nível 4 ele vê tudo, porque
 * ali a rotina é dele mesmo. */
export function adultoVe(d) {
  if (!ehDono(d)) return { rotina: true, travamentos: true, notas: true };
  const p = partilhaDe(d);
  return { rotina: p.rotina, travamentos: p.travamentos, notas: false };
}

/* ----------------------------------------------------------------- padrão */

export const DIAS_FITA = 14;

const iso = (dt) => dt.toISOString().slice(0, 10);

/* A fita dos últimos dias de uma tarefa: feito, não feito, ou dia sem
 * cobrança. Invariante 2: isto mostra o que aconteceu, não quanto ele
 * acertou — não há contagem de acertos em lugar nenhum. */
export function fitaDe({ tarefa, historico = [], hojeFeitas = [], hoje, dias = DIAS_FITA }) {
  const base = hoje ? new Date(hoje + 'T12:00:00') : new Date();
  const porDia = new Map();
  for (const r of historico) if (r && r.dia) porDia.set(r.dia, r);
  /* O dia de hoje ainda não entrou no histórico: ele só é arquivado na
     virada. Sem isto a tarefa cumprida há dez minutos aparece como falha. */
  if (hoje) porDia.set(hoje, { dia: hoje, feitas: hojeFeitas });
  const saida = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    const dia = iso(dt);
    const semana = dt.getDay();
    const cobra = !tarefa.dias || tarefa.dias.length === 0 || tarefa.dias.includes(semana);
    if (!cobra) { saida.push({ dia, estado: 'folga' }); continue; }
    const r = porDia.get(dia);
    const feito = Boolean(r && (r.feitas || []).includes(tarefa.id));
    saida.push({ dia, estado: feito ? 'feito' : 'nao' });
  }
  return saida;
}

/* O que ele marcou quando travou, contado. O número aqui é sobre o
 * ambiente — "esqueci: 2" é um fato sobre a manhã, não uma nota sobre ele.
 * Invariante 2 de novo, do outro lado. */
export function marcadoQuandoTravou({ tarefa, notas = [], dias = 60, hoje }) {
  const base = hoje ? new Date(hoje + 'T12:00:00') : new Date();
  const limite = new Date(base);
  limite.setDate(limite.getDate() - dias);
  const corte = iso(limite);
  const conta = new Map();
  for (const n of notas) {
    if (!n || n.tarefa !== tarefa.id) continue;
    if (n.fonte !== 'crianca' && n.fonte !== 'jovem') continue;
    if (n.dia && n.dia < corte) continue;
    for (const e of n.etiquetas || []) conta.set(e, (conta.get(e) || 0) + 1);
  }
  return [...conta.entries()]
    .map(([rotulo, vezes]) => ({ rotulo, vezes }))
    .sort((a, b) => b.vezes - a.vezes);
}

/* ------------------------------------------------------------- menos app */

export const SEMANAS_PARA_OFERECER = 6;

/* Invariante 3. A oferta aparece quando a rotina se sustentou pelo período
 * inteiro sem falha nos dias em que era cobrada. Repare no que NÃO existe
 * aqui: nenhuma contagem é mostrada ao jovem como placar, e uma falha não
 * "zera" nada — ela só adia a oferta. */
export function podeOferecerMenos({ tarefa, historico = [], hojeFeitas = [], hoje }) {
  if (tarefa.semLembrete) return false;
  const dias = SEMANAS_PARA_OFERECER * 7;
  const fita = fitaDe({ tarefa, historico, hojeFeitas, hoje, dias });
  const cobrados = fita.filter((f) => f.estado !== 'folga');
  if (cobrados.length < SEMANAS_PARA_OFERECER) return false;
  return cobrados.every((f) => f.estado === 'feito');
}

export const OPCOES_MENOS = [
  { id: 'calar', rotulo: 'Parar de lembrar, mas deixar na lista' },
  { id: 'tirar', rotulo: 'Tirar da lista de vez' },
  { id: 'manter', rotulo: 'Deixar como está' },
];

/* Devolve a sobreposição da tarefa. Nada é destrutivo: "tirar" é o mesmo
 * `oculta` que o responsável já usa, e volta no mesmo lugar. */
export function aplicarMenos(escolha) {
  if (escolha === 'calar') return { semLembrete: true };
  if (escolha === 'tirar') return { oculta: true };
  return {};
}
