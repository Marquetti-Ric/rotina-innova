/* Peças compartilhadas pelas Edge Functions. */

import { createClient } from 'jsr:@supabase/supabase-js@2';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function erro(motivo: string, codigo: string, status = 400) {
  return resposta({ ok: false, codigo, motivo }, status);
}

/* Cliente com a service role: as tabelas estão todas sob RLS fechada,
   então só por aqui se entra nelas. */
export function banco() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

export const VALIDADE_TOKEN_DIAS = 14;
export const GRACIA_PADRAO = 7;

/* Mesmo normalizador usado na geração: o responsável pode digitar com
   espaços, minúsculas ou sem os hifens. */
export function normalizar(codigo: string) {
  return (codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function hashCodigo(codigo: string) {
  const bruto = new TextEncoder().encode(normalizar(codigo));
  const digest = await crypto.subtle.digest('SHA-256', bruto);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/* O tema que o app aplica na moldura. Campos ausentes viram nulos e o
   app cai no padrão do Combinado. */
export function montarTema(t: Record<string, unknown> | null) {
  if (!t) return null;
  return {
    logo: t.logo_url ?? null,
    destaque: t.destaque ?? null,
    nome: t.nome_exibido ?? null,
    assinatura: t.assinatura ?? null,
    rodape: t.rodape ?? null,
  };
}
