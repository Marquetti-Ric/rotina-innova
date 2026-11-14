import { AppLauncher } from '@capacitor/app-launcher';
import { storage } from './armazenamento.js';

/* Os adultos que a criança pode chamar. Fica numa chave própria, separada do
   resto do estado: número de telefone é dado de outra pessoa, e uma chave
   isolada deixa o apagamento ser uma operação só. Nada disto sobe ao servidor
   de licenças nem aparece no painel da clínica. */

const CHAVE = 'combinado_contatos_v1';

export const MENSAGEM_PADRAO = 'Preciso de você.';

export const PADRAO_CONTATOS = { lista: [], mensagem: MENSAGEM_PADRAO };

/* ---------------- telefone ---------------- */

/* Guarda só dígitos. O DDI do Brasil entra quando o responsável digitou
   apenas DDD + número, que é como as pessoas escrevem na prática. */
export function soDigitos(bruto) {
  return String(bruto || '').replace(/\D/g, '');
}

export function normalizar(bruto) {
  let d = soDigitos(bruto);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d;
}

/* Dois formatos aceitos: celular (11 dígitos no país) e fixo (10). Com DDI,
   13 e 12. Fora disso o responsável errou a digitação e precisa saber. */
export function telefoneValido(bruto) {
  const d = normalizar(bruto);
  if (d.startsWith('55')) return d.length === 12 || d.length === 13;
  return d.length >= 8 && d.length <= 15;
}

export function exibir(bruto) {
  const d = normalizar(bruto);
  if (!d.startsWith('55')) return '+' + d;
  const resto = d.slice(2);
  const ddd = resto.slice(0, 2);
  const n = resto.slice(2);
  const meio = n.length > 8 ? n.slice(0, 5) : n.slice(0, 4);
  return `+55 ${ddd} ${meio}-${n.slice(meio.length)}`;
}

/* Esconde o miolo do número nas telas que a criança pode ver de relance. */
export function mascarar(bruto) {
  const v = exibir(bruto);
  return v.replace(/\d(?=[\d\s-]*\d{4}(?:\D|$))/g, (c, i) => (i < 8 ? c : '•'));
}

/* ---------------- endereços ---------------- */

/* Discador, não ligação direta: assim a pessoa confirma na tela do telefone e
   o app não precisa da permissão CALL_PHONE, que levanta pergunta na revisão
   das lojas. */
export const enderecoLigacao = (fone) => 'tel:' + normalizar(fone);

/* Formato oficial de click-to-chat: wa.me/<número internacional sem + nem
   zeros>, com a mensagem em ?text=. O texto chega digitado no campo; quem
   aperta enviar é a pessoa. */
export function enderecoWhatsapp(fone, mensagem) {
  const base = 'https://wa.me/' + normalizar(fone);
  const t = String(mensagem || '').trim();
  return t ? base + '?text=' + encodeURIComponent(t) : base;
}

/* ---------------- abrir ---------------- */

export async function temWhatsapp() {
  try {
    const { value } = await AppLauncher.canOpenUrl({ url: 'whatsapp://send' });
    return !!value;
  } catch {
    /* No navegador o plugin não responde. Não dá para afirmar que falta, então
       deixa o botão aparecer: o pior caso é abrir a versão web. */
    return true;
  }
}

async function abrir(url) {
  try {
    await AppLauncher.openUrl({ url });
    return true;
  } catch {
    try {
      window.open(url, '_system');
      return true;
    } catch {
      return false;
    }
  }
}

export const ligar = (fone) => abrir(enderecoLigacao(fone));
export const conversar = (fone, mensagem) => abrir(enderecoWhatsapp(fone, mensagem));

/* ---------------- contatos ---------------- */

export function novoContato() {
  return {
    id: 'c' + Date.now(),
    nome: '',
    relacao: '',
    fone: '',
    avatar: 'a',
    ligar: true,
    whatsapp: true,
    sozinha: true,
  };
}

export function limpar(c) {
  return {
    ...c,
    nome: String(c.nome || '').trim().slice(0, 18) || 'Adulto',
    relacao: String(c.relacao || '').trim().slice(0, 18),
    fone: normalizar(c.fone),
  };
}

/* O que a criança vê: só quem ela pode acionar sem o adulto do lado, e só
   quem tem pelo menos uma das duas ações ligada. */
export function visiveisParaCrianca(contatos) {
  return (contatos.lista || []).filter((c) => c.sozinha && (c.ligar || c.whatsapp));
}

/* A clínica entra pelo tema da licença e não pode ser apagada no aparelho.
   Recebe o objeto de `marca()`. */
export function comClinica(contatos, m) {
  const lista = [...(contatos.lista || [])];
  if (m && telefoneValido(m.telefone)) {
    lista.push({
      id: 'clinica',
      nome: 'Recepção',
      relacao: m.rodape || m.nome || 'clínica',
      fone: m.telefone,
      avatar: 'predio',
      ligar: true,
      whatsapp: !!m.telefoneWhatsapp,
      sozinha: false,
      fixo: true,
    });
  }
  return { ...contatos, lista };
}

export async function carregarContatos() {
  try {
    const r = await storage.get(CHAVE);
    if (!r) return PADRAO_CONTATOS;
    const s = JSON.parse(r.value);
    return { ...PADRAO_CONTATOS, ...s, lista: (s.lista || []).filter((c) => !c.fixo) };
  } catch {
    return PADRAO_CONTATOS;
  }
}

export async function gravarContatos(c) {
  try {
    await storage.set(CHAVE, JSON.stringify({ ...c, lista: (c.lista || []).filter((x) => !x.fixo) }));
  } catch {
    /* Sem armazenamento o app continua: os contatos valem para esta sessão. */
  }
}

export async function apagarContatos() {
  await gravarContatos(PADRAO_CONTATOS);
  return PADRAO_CONTATOS;
}
