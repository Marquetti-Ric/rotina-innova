/* Controle de acesso do Combinado.
 *
 * Dois modos, decididos por src/servidor.js:
 *
 *   servidor    o código é validado no Supabase, que vincula o aparelho
 *               e devolve um token assinado mais o tema da clínica.
 *   lista       modo antigo: confere o hash contra o JSON do GitHub Pages.
 *               Fica como ponte até o servidor entrar no ar.
 *
 * O que não muda nos dois: o app NUNCA bloqueia de repente. Licença
 * revogada ou vencida abre um período de carência em que a rotina da
 * criança segue funcionando e só o adulto vê o aviso. Interromper uma
 * rotina no meio do dia prejudica exatamente quem o app deveria ajudar.
 */

import { storage } from './armazenamento';
import { URL_LICENCAS, buscarJson, chamar, temServidor } from './servidor';
import { verificar } from './token';
import { aplicarTema } from './marca';

const CHAVE = 'licenca_v2';
const CHAVE_APARELHO = 'aparelho_v1';
const INTERVALO_HORAS = 24;
const RENOVAR_ANTES_DIAS = 4;

const hoje = () => new Date().toISOString().slice(0, 10);
const agora = () => Math.floor(Date.now() / 1000);
const diasEntre = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
const normalizar = (c) => (c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Identificador do aparelho: número aleatório criado na primeira abertura.
   Não vem de IMEI, de conta nem de pessoa — serve só para o servidor saber
   que são dois aparelhos distintos. */
export async function idAparelho() {
  try {
    const r = await storage.get(CHAVE_APARELHO);
    if (r?.value) return r.value;
  } catch { /* segue e gera um novo */ }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const id = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  try { await storage.set(CHAVE_APARELHO, id); } catch { /* sem persistência */ }
  return id;
}

async function ler() {
  try {
    const r = await storage.get(CHAVE);
    return r?.value ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

async function gravar(dados) {
  try { await storage.set(CHAVE, dados ? JSON.stringify(dados) : ''); } catch { /* best effort */ }
}

export const lerLicenca = ler;

export async function limparLicenca() {
  await gravar(null);
}

/* ------------------------------------------------------------------ ativar */

export async function ativar(codigo) {
  const limpo = normalizar(codigo);
  if (limpo.length < 12) {
    return { ok: false, motivo: 'Código curto demais. Confira se digitou tudo.' };
  }
  return temServidor() ? ativarNoServidor(limpo) : ativarPelaLista(limpo);
}

async function ativarNoServidor(codigo) {
  const device = await idAparelho();
  let r;
  try {
    r = await chamar('ativar', { codigo, device });
  } catch {
    return { ok: false, motivo: 'Sem conexão. A primeira ativação precisa de internet.' };
  }
  if (!r?.ok) {
    return { ok: false, motivo: r?.motivo || 'Não foi possível ativar. Tente de novo.' };
  }

  const conteudo = await verificar(r.token);
  if (!conteudo) {
    return { ok: false, motivo: 'A resposta do servidor não pôde ser verificada.' };
  }

  const dados = {
    modo: 'servidor',
    token: r.token,
    exp: conteudo.exp,
    gracia: conteudo.gracia ?? 7,
    tema: r.tema ?? null,
    organizacao: r.organizacao ?? null,
    ultimaConferencia: hoje(),
    primeiroAviso: null,
  };
  await gravar(dados);
  aplicarTema(dados.tema);
  return { ok: true, licenca: dados };
}

async function ativarPelaLista(codigo) {
  let lista;
  try {
    lista = await buscarJson(URL_LICENCAS);
  } catch {
    return { ok: false, motivo: 'Sem conexão. A primeira ativação precisa de internet.' };
  }

  const h = await sha256(codigo);
  const achada = (lista.licencas || []).find((l) => l.h === h);
  if (!achada) return { ok: false, motivo: 'Código não encontrado. Confira com a clínica.' };
  if (!achada.ativa) return { ok: false, motivo: 'Este código foi desativado. Fale com a clínica.' };
  if (achada.validade && achada.validade < hoje()) {
    return { ok: false, motivo: `Este código venceu em ${achada.validade}.` };
  }

  const dados = {
    modo: 'lista',
    h,
    apelido: achada.apelido || '',
    validade: achada.validade || null,
    gracia: lista.graciaDias ?? 7,
    ultimaConferencia: hoje(),
    primeiroAviso: null,
  };
  await gravar(dados);
  return { ok: true, licenca: dados };
}

/* ---------------------------------------------------------------- conferir */

export async function conferir() {
  const lic = await ler();
  if (!lic) return { estado: 'sem-licenca' };
  if (lic.tema) aplicarTema(lic.tema);
  return lic.modo === 'servidor' ? conferirServidor(lic) : conferirLista(lic);
}

async function conferirServidor(lic) {
  const conteudo = await verificar(lic.token);
  if (!conteudo) {
    // Token ilegível ou adulterado: pede o código de novo, sem carência.
    await gravar(null);
    return { estado: 'sem-licenca' };
  }

  const vencendo = conteudo.exp - agora() < RENOVAR_ANTES_DIAS * 86400;
  let caiu = null;

  if (vencendo) {
    try {
      const r = await chamar('conferir', { token: lic.token });
      if (r?.ok && r.token) {
        const novo = await verificar(r.token);
        if (novo) {
          Object.assign(lic, {
            token: r.token, exp: novo.exp, gracia: novo.gracia ?? lic.gracia,
            tema: r.tema ?? lic.tema, organizacao: r.organizacao ?? lic.organizacao,
            ultimaConferencia: hoje(), primeiroAviso: null,
          });
          await gravar(lic);
          aplicarTema(lic.tema);
          return { estado: 'ok', licenca: lic };
        }
      } else if (r && r.ok === false) {
        caiu = r.codigo || 'revogada';
      }
    } catch {
      // Offline: segue com o token que tem. A carência cuida do resto.
    }
  }

  if (!caiu && conteudo.exp > agora()) return { estado: 'ok', licenca: lic };

  if (!lic.primeiroAviso) {
    lic.primeiroAviso = hoje();
    await gravar(lic);
  }
  const restantes = Math.max(0, (lic.gracia ?? 7) - diasEntre(lic.primeiroAviso, hoje()));
  return {
    estado: restantes > 0 ? 'carencia' : 'bloqueada',
    diasRestantes: restantes,
    motivo: caiu || 'vencida',
    licenca: lic,
  };
}

async function conferirLista(lic) {
  const precisa = !lic.ultimaConferencia
    || diasEntre(lic.ultimaConferencia, hoje()) * 24 >= INTERVALO_HORAS;

  let revogada = false;
  if (precisa) {
    try {
      const lista = await buscarJson(URL_LICENCAS);
      lic.gracia = lista.graciaDias ?? lic.gracia ?? 7;
      const achada = (lista.licencas || []).find((l) => l.h === lic.h);
      revogada = !achada || !achada.ativa;
      if (achada && achada.validade !== undefined) lic.validade = achada.validade;
      lic.ultimaConferencia = hoje();
      if (!revogada && !(lic.validade && lic.validade < hoje())) lic.primeiroAviso = null;
      await gravar(lic);
    } catch { /* offline: mantém o que sabia */ }
  }

  const problema = revogada || (lic.validade && lic.validade < hoje());
  if (!problema) return { estado: 'ok', licenca: lic };

  if (!lic.primeiroAviso) {
    lic.primeiroAviso = hoje();
    await gravar(lic);
  }
  const restantes = Math.max(0, (lic.gracia ?? 7) - diasEntre(lic.primeiroAviso, hoje()));
  return {
    estado: restantes > 0 ? 'carencia' : 'bloqueada',
    diasRestantes: restantes,
    motivo: revogada ? 'revogada' : 'vencida',
    licenca: lic,
  };
}
