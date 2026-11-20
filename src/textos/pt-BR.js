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
  'idioma.previa': 'prévia — interface só',
  'idioma.previa.aviso': 'Os idiomas marcados como prévia têm a interface traduzida, mas as tarefas, as etiquetas e a prancha seguem em português, e falta a revisão de quem fala a língua. Servem para testar, não para entregar a uma família.',
  'idioma.semVoz': 'Este aparelho não tem a voz de {idioma} instalada. O app continua funcionando, mas a narração em voz alta fica muda até alguém instalar o pacote de voz nas configurações do aparelho.',

  /* ------------------------------------------- telas da criança */
  'atrapalhou.titulo': 'O que atrapalhou?',
  'atrapalhou.sub': '{tarefa} Pode escolher mais de um.',
  'atrapalhou.grupo': 'O que atrapalhou',
  'atrapalhou.pronto': 'Pronto',
  'atrapalhou.pular': 'Não quero dizer',
  'adultos.vazio.titulo': 'Ainda não tem ninguém aqui.',
  'adultos.vazio.texto': 'Um adulto pode cadastrar quem você chama, na área dos responsáveis.',
  'adultos.confirmar.ligar': 'Ligar para {nome}?',
  'adultos.confirmar.mensagem': 'Mandar mensagem para {nome}?',
  'adultos.aviso.ligar': 'O telefone vai abrir com o número pronto.',
  'adultos.aviso.mensagem': 'O WhatsApp vai abrir com a mensagem escrita. Depois é só apertar enviar.',
  'adultos.sim.ligar': 'Sim, ligar',
  'adultos.sim.mensagem': 'Sim, mandar',
  'adultos.nao': 'Não agora',

  /* ------------------------------------ nível 4: a casa do jovem */
  'jovem.aba.hoje': 'Hoje',
  'jovem.aba.segurou': 'O que segurou',
  'jovem.aba.ajustes': 'Ajustes',
  'jovem.semHorario': 'sem horário',
  'jovem.semLembrete': ' · sem lembrete',
  'jovem.vazio': 'Nada marcado para hoje. Se quiser, monte alguma coisa.',
  'jovem.nova': '+ Nova',
  'jovem.semTarefa': 'Ainda não há tarefa para olhar.',
  'jovem.legenda': '● feito   ○ não feito   · dia sem cobrança',
  'jovem.marcou': 'Quando travou, você marcou:',
  'jovem.ambiente': 'O número conta o ambiente, não você. Aqui não tem nota, porcentagem nem sequência.',
  'jovem.menos.titulo': 'Isto parece resolvido.',
  'jovem.menos.texto': 'Faz seis semanas que acontece sozinho. Quer que eu pare de lembrar?',
  'jovem.menos.volta': 'Dá para trazer de volta quando quiser, sem recomeçar nada.',
  'jovem.partilha.titulo': 'O que {quem} vê',
  'jovem.partilha.texto': '{quem} sabe que estas três coisas existem. O conteúdo, só se você ligar.',
  'jovem.quemCuida': 'quem cuida de você',
  'jovem.essaPessoa': 'Essa pessoa',
  'jovem.semLigar': 'Não dá para ligar',
  'jovem.notas.titulo': 'Suas anotações',
  'jovem.notas.botao': 'Abrir o caderno',
  'jovem.devolver.titulo': 'Devolver o app',
  'jovem.devolver.texto': 'Se você não quiser mais cuidar disso, dá para devolver. Suas tarefas e anotações ficam como estão.',
  'jovem.devolver.botao': 'Devolver',

  /* Licença, na área dos responsáveis. Existe porque a clínica pode liberar
     o nível 4 ou renovar, e isso vem num código novo: sem esta tela a
     família teria de desinstalar, e desinstalar apaga a rotina da criança. */
  'licenca.titulo': 'Licença',
  'licenca.semValidade': 'sem data de vencimento',
  'licenca.vence': 'vence em {dia}',
  'licenca.titular.clinica': 'no nome da clínica',
  'licenca.titular.pessoa': 'no seu nome',
  'licenca.nivel4.sim': 'nível 4 liberado',
  'licenca.nivel4.nao': 'nível 4 não liberado nesta licença',
  'licenca.trocar': 'Trocar o código de acesso',
  'licenca.trocar.confirmar': 'Toque de novo para pedir o código',
  'licenca.trocar.texto': 'Se a clínica mandou um código novo — por renovação, ou para liberar o nível 4 — é aqui que ele entra. A rotina, as anotações e o perfil ficam como estão: só o código é trocado.',
};
