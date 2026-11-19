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
};
