/* Controle de acesso do Combinado.
 *
 * Como funciona: o responsável digita o código uma vez. O app guarda apenas o
 * hash SHA-256 e, quando há internet, confere esse hash na lista publicada.
 *
 * Decisão deliberada: o app NUNCA bloqueia de repente. Se a licença for
 * revogada ou vencer, começa um período de carência (padrão 7 dias) em que a
 * rotina da criança continua funcionando e só o adulto vê o aviso. Interromper
 * uma rotina no meio do dia prejudica justamente quem o app deveria ajudar.
 */
import { storage } from './armazenamento';
import { URL_LICENCAS, buscarJson } from './servidor';

const CHAVE = 'licenca_v1';
const INTERVALO_HORAS = 24;

async function sha256(texto) {
  const dados = new TextEncoder().encode(texto);
  const buf = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const normalizar = (c) => (c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hoje = () => new Date().toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

export async function lerLicenca() {
  try {
    const r = await storage.get(CHAVE);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

async function gravarLicenca(dados) {
  try {
    await storage.set(CHAVE, JSON.stringify(dados));
  } catch {
    /* sem armazenamento: o app segue, pedirá o código de novo */
  }
}

/* Confere um código contra a lista pública. Exige internet. */
export async function ativar(codigo) {
  const limpo = normalizar(codigo);
  if (limpo.length < 12) {
    return { ok: false, motivo: 'Código curto demais. Confira se digitou tudo.' };
  }

  let lista;
  try {
    lista = await buscarJson(URL_LICENCAS);
  } catch {
    return { ok: false, motivo: 'Sem conexão. A primeira ativação precisa de internet.' };
  }

  const h = await sha256(limpo);
  const achada = (lista.licencas || []).find((l) => l.h === h);

  if (!achada) return { ok: false, motivo: 'Código não encontrado. Confira com a clínica.' };
  if (!achada.ativa) return { ok: false, motivo: 'Este código foi desativado. Fale com a clínica.' };
  if (achada.validade && achada.validade < hoje()) {
    return { ok: false, motivo: `Este código venceu em ${achada.validade}.` };
  }

  const dados = {
    h,
    apelido: achada.apelido || '',
    validade: achada.validade || null,
    ativadaEm: hoje(),
    ultimaConferencia: hoje(),
    primeiroAviso: null,
  };
  await gravarLicenca(dados);
  return { ok: true, licenca: dados };
}

/* Reconferência silenciosa, uma vez por dia. Nunca trava por falta de rede. */
export async function conferir() {
  const lic = await lerLicenca();
  if (!lic) return { estado: 'sem-licenca' };

  const venceu = lic.validade && lic.validade < hoje();
  const precisaConferir =
    !lic.ultimaConferencia ||
    diasEntre(lic.ultimaConferencia, hoje()) * 24 >= INTERVALO_HORAS;

  let revogada = false;
  let gracia = 7;

  if (precisaConferir) {
    try {
      const lista = await buscarJson(URL_LICENCAS);
      gracia = lista.graciaDias ?? 7;
      const achada = (lista.licencas || []).find((l) => l.h === lic.h);
      revogada = !achada || !achada.ativa;
      if (achada && achada.validade !== undefined) lic.validade = achada.validade;
      lic.ultimaConferencia = hoje();
      if (!revogada && !venceu) lic.primeiroAviso = null;
      await gravarLicenca(lic);
    } catch {
      /* offline: mantém o que já sabia e segue */
    }
  }

  const problema = revogada || (lic.validade && lic.validade < hoje());
  if (!problema) return { estado: 'ok', licenca: lic };

  if (!lic.primeiroAviso) {
    lic.primeiroAviso = hoje();
    await gravarLicenca(lic);
  }
  const corridos = diasEntre(lic.primeiroAviso, hoje());
  const restantes = Math.max(0, gracia - corridos);

  return {
    estado: restantes > 0 ? 'carencia' : 'bloqueada',
    diasRestantes: restantes,
    motivo: revogada ? 'revogada' : 'vencida',
    licenca: lic,
  };
}

export async function limparLicenca() {
  await gravarLicenca(null);
  try {
    await storage.set(CHAVE, '');
  } catch {}
}
