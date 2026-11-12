/* Verificação de nova versão.
 *
 * O manifesto latest.json é reescrito pelo GitHub Actions a cada release, e o
 * app compara o versionCode dele com o seu próprio. Como o APK é distribuído
 * fora da Play Store, a atualização é um download: o Android reconhece como
 * atualização (e não app novo) porque a assinatura é a mesma.
 */
import { App as AppNativo } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { storage } from './armazenamento';
import { URL_VERSAO, buscarJson } from './servidor';

const CHAVE_ADIADO = 'atualizacao_adiada_v1';

export async function versaoInstalada() {
  try {
    const info = await AppNativo.getInfo();
    return { nome: info.version, codigo: Number(info.build) || 0 };
  } catch {
    return { nome: 'dev', codigo: 0 }; // rodando no navegador
  }
}

export async function checar({ ignorarAdiamento = false } = {}) {
  let manifesto;
  try {
    manifesto = await buscarJson(URL_VERSAO);
  } catch {
    return { temNova: false };
  }

  const atual = await versaoInstalada();
  if (!manifesto.versionCode || manifesto.versionCode <= atual.codigo) {
    return { temNova: false, atual };
  }

  if (!ignorarAdiamento && !manifesto.obrigatoria) {
    try {
      const r = await storage.get(CHAVE_ADIADO);
      // "Agora não" silencia aquela versão específica por 3 dias.
      if (r) {
        const { codigo, ate } = JSON.parse(r.value);
        if (codigo === manifesto.versionCode && ate >= new Date().toISOString().slice(0, 10)) {
          return { temNova: false, atual };
        }
      }
    } catch {}
  }

  return {
    temNova: true,
    atual,
    nova: manifesto.versionName,
    codigo: manifesto.versionCode,
    url: manifesto.apk,
    notas: manifesto.notas || '',
    obrigatoria: !!manifesto.obrigatoria,
    tamanho: manifesto.tamanho || '',
  };
}

export async function adiar(versionCode, dias = 3) {
  const ate = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  try {
    await storage.set(CHAVE_ADIADO, JSON.stringify({ codigo: versionCode, ate }));
  } catch {}
}

export async function baixar(url) {
  try {
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank');
  }
}
