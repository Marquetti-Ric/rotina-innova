/* English interface.
 *
 * This is INTERFACE, not content. The factory tasks, the 144 steps and the
 * AAC board's core vocabulary are clinical-pedagogical content and live in
 * their own files.
 *
 * English is NOT in `COMPLETOS` yet. Still missing: its own core vocabulary
 * (not a word-by-word translation — the list changes from language to
 * language), a tone review by a native speaker who knows the audience, the
 * symptom-vocabulary sweep in English, syllabification rules, and the
 * regulatory analysis for the destination country. Translating is not
 * localising.
 */

export default {
  'portao.titulo': 'Access code',
  'portao.texto': 'Enter the code the clinic gave the parent or carer. You only need to do this once.',
  'portao.campo.rotulo': 'Access code, four groups of letters and numbers',
  'portao.campo.marca': 'Access code: CMB-…',
  'portao.colar': 'Paste the copied code',
  'portao.botao': 'Unlock the app',
  'portao.botao.enviando': 'Checking…',
  'portao.dica': 'No code yet? Ask at the clinic reception.',
  'portao.sobre': 'Combinado lays out the day as illustrated steps, at each child’s own pace.',

  'portao.erro.vazio': 'Enter the code the clinic gave you. The field is still empty.',
  'portao.erro.incompleto': 'That code is incomplete. Check that you copied all four groups.',
  'portao.erro.semCopia': 'Nothing is copied. Copy the code from the clinic’s message and come back.',
  'portao.erro.semLeitura': 'Your device would not let me read what is copied. ',
  'portao.erro.colarManual': 'Press and hold the field above to paste.',

  'portao.bloqueada.titulo': 'Access ended',
  'portao.bloqueada.texto': 'This device’s code is no longer valid. The routine data stays here and comes back as soon as a new code is entered.',
  'portao.bloqueada.botao': 'Enter another code',

  'portao.carencia.dia': 'Access ends in {n} day',
  'portao.carencia.dias': 'Access ends in {n} days',
  'portao.carencia.clinica': 'Talk to the clinic to renew.',
  'portao.carencia.pessoa': 'Renew in the store to keep using the app.',

  'idioma.titulo': 'Language',
  'idioma.texto': 'Changes the language of the whole app, including the voice.',
  'idioma.semVoz': 'This device does not have the {idioma} voice installed. The app still works, but read-aloud stays silent until someone installs the voice pack in the device settings.',

  /* ------------------------------------------- telas da criança */
  'atrapalhou.titulo': 'What got in the way?',
  'atrapalhou.sub': '{tarefa} You can pick more than one.',
  'atrapalhou.grupo': 'What got in the way',
  'atrapalhou.pronto': 'Done',
  'atrapalhou.pular': 'I’d rather not say',
  'adultos.vazio.titulo': 'Nobody here yet.',
  'adultos.vazio.texto': 'A grown-up can add who you call, in the carers’ area.',
  'adultos.confirmar.ligar': 'Call {nome}?',
  'adultos.confirmar.mensagem': 'Send {nome} a message?',
  'adultos.aviso.ligar': 'The phone will open with the number ready.',
  'adultos.aviso.mensagem': 'WhatsApp will open with the message written. Then just press send.',
  'adultos.sim.ligar': 'Yes, call',
  'adultos.sim.mensagem': 'Yes, send',
  'adultos.nao': 'Not now',

  /* ------------------------------------ nível 4: a casa do jovem */
  'jovem.aba.hoje': 'Today',
  'jovem.aba.segurou': 'What stuck',
  'jovem.aba.ajustes': 'Settings',
  'jovem.semHorario': 'no time set',
  'jovem.semLembrete': ' · no reminder',
  'jovem.vazio': 'Nothing set for today. Build something if you want.',
  'jovem.nova': '+ New',
  'jovem.semTarefa': 'No task to look at yet.',
  'jovem.legenda': '● done   ○ not done   · day off',
  'jovem.marcou': 'When it stalled, you marked:',
  'jovem.ambiente': 'The number is about the setting, not about you. No score, no percentage, no streak.',
  'jovem.menos.titulo': 'This looks sorted.',
  'jovem.menos.texto': 'It has happened on its own for six weeks. Want me to stop reminding you?',
  'jovem.menos.volta': 'You can bring it back any time, without starting over.',
  'jovem.partilha.titulo': 'What {quem} sees',
  'jovem.partilha.texto': '{quem} knows these three things exist. The contents, only if you switch them on.',
  'jovem.quemCuida': 'whoever looks after you',
  'jovem.essaPessoa': 'That person',
  'jovem.semLigar': 'Cannot be switched on',
  'jovem.notas.titulo': 'Your notes',
  'jovem.notas.botao': 'Open the notebook',
  'jovem.devolver.titulo': 'Hand the app back',
  'jovem.devolver.texto': 'If you no longer want to look after this, you can hand it back. Your tasks and notes stay as they are.',
  'jovem.devolver.botao': 'Hand back',
};
