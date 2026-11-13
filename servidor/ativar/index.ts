/* POST /ativar  { codigo, device, apelido? }
 *
 * Primeira ativação de um aparelho. Confere o código, vincula o aparelho
 * à licença se ainda houver assento livre, e devolve o token assinado
 * mais o tema da clínica.
 */

import { assinar } from '../_comum/token.ts';
import {
  CORS, banco, erro, resposta, hashCodigo, hoje,
  montarTema, VALIDADE_TOKEN_DIAS, GRACIA_PADRAO,
} from '../_comum/base.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return erro('Método não suportado.', 'metodo', 405);

  let corpo: { codigo?: string; device?: string; apelido?: string };
  try {
    corpo = await req.json();
  } catch {
    return erro('Corpo inválido.', 'corpo');
  }

  const { codigo, device, apelido } = corpo;
  if (!codigo || !device) return erro('Faltou o código ou o aparelho.', 'faltando');
  if (device.length < 16 || device.length > 128) return erro('Aparelho inválido.', 'device');

  const db = banco();
  const hash = await hashCodigo(codigo);

  const { data: lic, error } = await db
    .from('licencas')
    .select('id, org_id, assentos, validade, ativa, organizacoes(slug, nome), temas:org_id(*)')
    .eq('codigo_hash', hash)
    .maybeSingle();

  if (error) return erro('Falha ao consultar a licença.', 'banco', 500);
  if (!lic) return erro('Código não encontrado. Confira com a clínica.', 'nao_encontrado', 404);
  if (!lic.ativa) return erro('Este código foi desativado. Fale com a clínica.', 'revogada', 403);
  if (lic.validade && lic.validade < hoje()) {
    return erro(`Este código venceu em ${lic.validade}.`, 'vencida', 403);
  }

  // Assentos: um aparelho já vinculado reativa sem consumir outro.
  const { data: jaTem } = await db
    .from('aparelhos')
    .select('id')
    .eq('licenca_id', lic.id)
    .eq('device_id', device)
    .maybeSingle();

  if (!jaTem) {
    const { count } = await db
      .from('aparelhos')
      .select('id', { count: 'exact', head: true })
      .eq('licenca_id', lic.id);

    if ((count ?? 0) >= lic.assentos) {
      return erro(
        `Esta licença já está em ${lic.assentos} ${lic.assentos === 1 ? 'aparelho' : 'aparelhos'}. ` +
        'A clínica pode liberar outro.',
        'assentos_esgotados',
        409,
      );
    }
  }

  const { error: eUp } = await db.from('aparelhos').upsert(
    { licenca_id: lic.id, device_id: device, apelido: apelido ?? null, ultimo_uso: new Date().toISOString() },
    { onConflict: 'licenca_id,device_id' },
  );
  if (eUp) return erro('Falha ao vincular o aparelho.', 'banco', 500);

  const tema = montarTema((lic as Record<string, any>).temas ?? null);
  const org = (lic as Record<string, any>).organizacoes;

  const token = await assinar({
    lic: lic.id,
    dev: device,
    org: org?.slug ?? '',
    exp: Math.floor(Date.now() / 1000) + VALIDADE_TOKEN_DIAS * 86400,
    gracia: GRACIA_PADRAO,
    tema,
  }, Deno.env.get('CHAVE_PRIVADA')!);

  return resposta({ ok: true, token, tema, organizacao: org?.nome ?? null });
});
