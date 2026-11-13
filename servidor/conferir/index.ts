/* POST /conferir  { token }
 *
 * Revalidação periódica. O app chama quando o token está perto de vencer,
 * ou de tempos em tempos quando há internet. Devolve um token novo, ou diz
 * que a licença caiu.
 *
 * Aceita token expirado de propósito: é exatamente o caso de quem ficou
 * sem internet por mais tempo que a validade e está voltando.
 */

import { assinar, lerSemVerificar } from '../_comum/token.ts';
import {
  CORS, banco, erro, resposta, hoje, montarTema,
  VALIDADE_TOKEN_DIAS, GRACIA_PADRAO,
} from '../_comum/base.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return erro('Método não suportado.', 'metodo', 405);

  let corpo: { token?: string };
  try {
    corpo = await req.json();
  } catch {
    return erro('Corpo inválido.', 'corpo');
  }

  const anterior = lerSemVerificar(corpo.token ?? '');
  if (!anterior?.lic || !anterior?.dev) return erro('Token ilegível.', 'token');

  const db = banco();

  // O aparelho precisa continuar vinculado: se a clínica o removeu do
  // painel, o token para de ser renovado mesmo sendo bem formado.
  const { data: ap } = await db
    .from('aparelhos')
    .select('id')
    .eq('licenca_id', anterior.lic)
    .eq('device_id', anterior.dev)
    .maybeSingle();

  if (!ap) return resposta({ ok: false, codigo: 'desvinculado', motivo: 'Este aparelho foi removido da licença.' });

  const { data: lic } = await db
    .from('licencas')
    .select('id, assentos, validade, ativa, organizacoes(slug, nome), temas:org_id(*)')
    .eq('id', anterior.lic)
    .maybeSingle();

  if (!lic) return resposta({ ok: false, codigo: 'nao_encontrada', motivo: 'Licença não encontrada.' });
  if (!lic.ativa) return resposta({ ok: false, codigo: 'revogada', motivo: 'Licença desativada.' });
  if (lic.validade && lic.validade < hoje()) {
    return resposta({ ok: false, codigo: 'vencida', motivo: `Licença vencida em ${lic.validade}.` });
  }

  await db.from('aparelhos')
    .update({ ultimo_uso: new Date().toISOString() })
    .eq('id', ap.id);

  const tema = montarTema((lic as Record<string, any>).temas ?? null);
  const org = (lic as Record<string, any>).organizacoes;

  const token = await assinar({
    lic: lic.id,
    dev: anterior.dev,
    org: org?.slug ?? '',
    exp: Math.floor(Date.now() / 1000) + VALIDADE_TOKEN_DIAS * 86400,
    gracia: GRACIA_PADRAO,
    tema,
  }, Deno.env.get('CHAVE_PRIVADA')!);

  return resposta({ ok: true, token, tema, organizacao: org?.nome ?? null });
});
