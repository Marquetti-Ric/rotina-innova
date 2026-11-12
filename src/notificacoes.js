import { LocalNotifications } from '@capacitor/local-notifications';
import { storage } from './armazenamento';

/* Avisos nos horários das tarefas.
 *
 * Uma notificação por tarefa e por dia da semana, repetindo toda semana.
 * O Capacitor usa weekday 1=domingo … 7=sábado; o app usa 0=domingo.
 *
 * Nada é enviado para servidor algum: o próprio aparelho agenda e dispara.
 */

const CHAVE = 'avisos_ligados_v1';

export async function avisosLigados() {
  try {
    const r = await storage.get(CHAVE);
    return r ? r.value === 'sim' : false;
  } catch {
    return false;
  }
}

export async function definirAvisos(ligado) {
  await storage.set(CHAVE, ligado ? 'sim' : 'nao');
  if (!ligado) await cancelarTudo();
}

export async function pedirPermissao() {
  try {
    const atual = await LocalNotifications.checkPermissions();
    if (atual.display === 'granted') return true;
    const pedido = await LocalNotifications.requestPermissions();
    return pedido.display === 'granted';
  } catch {
    return false;
  }
}

async function cancelarTudo() {
  try {
    const pendentes = await LocalNotifications.getPending();
    if (pendentes.notifications.length) {
      await LocalNotifications.cancel({ notifications: pendentes.notifications });
    }
  } catch {}
}

/* Chamar sempre que a rotina mudar: criar, editar, ligar/desligar tarefa. */
export async function reprogramar(tarefas) {
  if (!(await avisosLigados())) return;
  if (!(await pedirPermissao())) return;

  await cancelarTudo();

  const lista = [];
  let id = 1;

  for (const t of tarefas) {
    if (t.oculta || !t.horario) continue;
    const [hora, minuto] = String(t.horario).split(':').map(Number);
    if (Number.isNaN(hora) || Number.isNaN(minuto)) continue;

    for (const dia of t.dias || []) {
      lista.push({
        id: id++,
        title: t.nome,
        body: t.duracao ? `${t.horario} · ${t.duracao} minutos` : `São ${t.horario}`,
        schedule: {
          on: { weekday: dia + 1, hour: hora, minute: minuto },
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon',
        channelId: 'rotina',
      });
      // O Android limita notificações agendadas; 400 cobre a rotina inteira.
      if (lista.length >= 400) break;
    }
  }

  if (!lista.length) return;

  try {
    await LocalNotifications.createChannel({
      id: 'rotina',
      name: 'Rotina',
      description: 'Avisos dos horários das tarefas',
      importance: 4,
      visibility: 1,
    });
  } catch {}

  try {
    await LocalNotifications.schedule({ notifications: lista });
  } catch {}
}
