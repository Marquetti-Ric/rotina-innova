/* Interfaz en español.
 *
 * Esto es INTERFAZ, no contenido. Las tareas de fábrica, los 144 pasos y el
 * vocabulario núcleo del tablero de CAA son contenido clínico-pedagógico y
 * viven en archivos propios.
 *
 * El español NO está en `COMPLETOS` todavía: faltan el vocabulario núcleo
 * propio (no traducido palabra por palabra — la lista cambia de lengua a
 * lengua), la revisión del tono por alguien que hable el idioma, el barrido
 * de vocabulario de síntoma en español, y el análisis regulatorio del país
 * de destino. Traducir no localiza.
 */

export default {
  'portao.titulo': 'Código de acceso',
  'portao.texto': 'Escribe el código que la clínica entregó a la persona responsable. Se pide una sola vez.',
  'portao.campo.rotulo': 'Código de acceso, cuatro grupos de letras y números',
  'portao.campo.marca': 'Código de acceso: CMB-…',
  'portao.colar': 'Pegar el código copiado',
  'portao.botao': 'Activar la app',
  'portao.botao.enviando': 'Comprobando…',
  'portao.dica': '¿Todavía no tienes un código? Pídelo en la recepción de la clínica.',
  'portao.sobre': 'Combinado organiza la rutina del día en pasos ilustrados, al ritmo de cada niño.',

  'portao.erro.vazio': 'Escribe el código que entregó la clínica. El campo todavía está vacío.',
  'portao.erro.incompleto': 'Ese código está incompleto. Revisa si copiaste los cuatro grupos.',
  'portao.erro.semCopia': 'No hay nada copiado. Copia el código del mensaje de la clínica y vuelve aquí.',
  'portao.erro.semLeitura': 'Tu dispositivo no me dejó leer lo que está copiado. ',
  'portao.erro.colarManual': 'Mantén pulsado el campo de arriba para pegar.',

  'portao.bloqueada.titulo': 'Acceso finalizado',
  'portao.bloqueada.texto': 'El código de este dispositivo ya no es válido. Los datos de la rutina siguen guardados aquí y vuelven en cuanto se introduzca un código nuevo.',
  'portao.bloqueada.botao': 'Introducir otro código',

  'portao.carencia.dia': 'El acceso vence en {n} día',
  'portao.carencia.dias': 'El acceso vence en {n} días',
  'portao.carencia.clinica': 'Habla con la clínica para renovar.',
  'portao.carencia.pessoa': 'Renueva en la tienda para seguir usando la app.',

  'idioma.titulo': 'Idioma',
  'idioma.texto': 'Cambia el idioma de toda la app, incluida la voz.',
  'idioma.semVoz': 'Este dispositivo no tiene instalada la voz en {idioma}. La app sigue funcionando, pero la narración en voz alta queda muda hasta que alguien instale el paquete de voz en los ajustes del dispositivo.',
};
