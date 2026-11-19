/* Interface em português do Brasil. É a base: toda chave nasce aqui.
 *
 * Isto é INTERFACE, não conteúdo. As tarefas de fábrica, os 144 passos e o
 * vocabulário-núcleo da prancha são conteúdo clínico-pedagógico e moram em
 * arquivos próprios, para uma terapeuta editar sem tocar em código.
 *
 * Convenção de chave: `tela.coisa`. Nada de frase como chave — frase muda,
 * e aí a tradução se perde em silêncio.
 */

export default {
  /* ---------------------------------------------------------- o portão */
  'portao.titulo': 'Código de acesso',
  'portao.texto': 'Digite o código que a clínica entregou ao responsável. Isso é pedido uma única vez.',
  'portao.campo.rotulo': 'Código de acesso, quatro grupos de letras e números',
  'portao.campo.marca': 'Código de acesso: CMB-…',
  'portao.colar': 'Colar o código copiado',
  'portao.botao': 'Liberar o app',
  'portao.botao.enviando': 'Conferindo…',
  'portao.dica': 'Ainda não tem um código? Peça na recepção da clínica.',
  'portao.sobre': 'O Combinado organiza a rotina do dia em passos ilustrados, no ritmo de cada criança.',

  /* O botão nunca fica mudo: ele responde e diz o que falta, em vez de
     parecer quebrado. Por isso cada motivo tem a sua frase. */
  'portao.erro.vazio': 'Digite o código que a clínica entregou. O campo ainda está vazio.',
  'portao.erro.incompleto': 'Esse código está incompleto. Confira se copiou os quatro grupos.',
  'portao.erro.semCopia': 'Não há nada copiado. Copie o código na mensagem da clínica e volte aqui.',
  'portao.erro.semLeitura': 'Seu aparelho não deixou eu ler o que está copiado. ',
  'portao.erro.colarManual': 'Toque e segure no campo acima para colar.',

  'portao.bloqueada.titulo': 'Acesso encerrado',
  'portao.bloqueada.texto': 'O código deste aparelho não está mais válido. Os dados da rotina continuam guardados aqui e voltam assim que um novo código for inserido.',
  'portao.bloqueada.botao': 'Inserir outro código',

  'portao.carencia.dia': 'Acesso vence em {n} dia',
  'portao.carencia.dias': 'Acesso vence em {n} dias',
  /* Quem renova é o titular da licença: numa licença de clínica a família
     não consegue, e mandá-la renovar é mandar fazer o que ela não pode. */
  'portao.carencia.clinica': 'Fale com a clínica para renovar.',
  'portao.carencia.pessoa': 'Renove na loja para continuar usando.',

  /* --------------------------------------------------------- o idioma */
  'idioma.titulo': 'Idioma',
  'idioma.texto': 'Muda a língua do app inteiro, inclusive a voz.',
  'idioma.semVoz': 'Este aparelho não tem a voz de {idioma} instalada. O app continua funcionando, mas a narração em voz alta fica muda até alguém instalar o pacote de voz nas configurações do aparelho.',
};
