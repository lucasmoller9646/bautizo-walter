/**
 * Confirmações do Batizado do Walter → Planilha Google (no seu Drive)
 *
 * Como instalar (detalhes no README.md do repositório):
 *  1. Crie uma Planilha Google em branco no seu Drive, por exemplo
 *     "Bautismo Walter – Confirmaciones".
 *  2. Na planilha: Extensões › Apps Script. Apague o que houver e cole
 *     este arquivo inteiro. Salve.
 *  3. Selecione a função "configurar" e clique em Executar (autorize
 *     com a sua conta). Ela cria as abas Respuestas, Invitados e Resumen.
 *  4. Implantar › Nova implantação › tipo "App da Web":
 *       Executar como: Eu
 *       Quem pode acessar: Qualquer pessoa
 *     Copie a URL que termina em /exec e cole em config.js (endpoint).
 *
 * Cada envio gera uma linha em "Respuestas" e uma linha por pessoa em
 * "Invitados". Se a mesma família responder de novo (mesmo WhatsApp ou,
 * sem WhatsApp, mesmo nome), as linhas antigas viram "reemplazada" e o
 * Resumen passa a contar só a resposta mais recente.
 */

var HOJA_RESPUESTAS = 'Respuestas';
var HOJA_INVITADOS = 'Invitados';
var HOJA_RESUMEN = 'Resumen';

var COLS_RESPUESTAS = ['Recibido', 'Estado', 'Responsable', 'WhatsApp', 'Asiste', 'Misa', 'Fiesta',
  'Adultos', 'Niños', 'Total personas', 'Platos', 'Idioma', 'Clave', 'ID'];
var COLS_INVITADOS = ['Recibido', 'Estado', 'Nombre', 'Tipo', 'Edad', 'Plato', 'Misa', 'Fiesta', 'Responsable', 'Clave', 'ID'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    asegurarHojas_(ss);
    var resp = ss.getSheetByName(HOJA_RESPUESTAS);
    var inv = ss.getSheetByName(HOJA_INVITADOS);

    var id = String(data.id || '');
    if (id && yaExiste_(resp, id)) return json_({ ok: true, duplicado: true });

    var responsable = limpiar_(data.responsable, 80);
    if (!responsable) return json_({ ok: false, error: 'sin nombre' });
    var telefono = limpiar_(data.telefono, 30);
    var clave = clave_(telefono, responsable);
    var asiste = data.asiste === 'si';
    var misa = asiste && data.misa === true;
    var fiesta = asiste && data.fiesta === true;
    var adultos = asiste ? entero_(data.adultos, 0, 30) : 0;
    var ninos = asiste ? entero_(data.ninos, 0, 30) : 0;
    var personas = asiste && Array.isArray(data.personas) ? data.personas.slice(0, 60) : [];
    var ahora = new Date();

    marcarReemplazadas_(resp, clave, COLS_RESPUESTAS.indexOf('Clave') + 1);
    marcarReemplazadas_(inv, clave, COLS_INVITADOS.indexOf('Clave') + 1);

    var platos = {};
    personas.forEach(function (p) { if (p && p.plato) platos[p.plato] = (platos[p.plato] || 0) + 1; });
    var textoPlatos = Object.keys(platos).map(function (k) { return k + ': ' + platos[k]; }).join(' · ');

    resp.appendRow([ahora, 'vigente', responsable, telefono, asiste ? 'Sí' : 'No', misa ? 'Sí' : 'No', fiesta ? 'Sí' : 'No',
      adultos, ninos, adultos + ninos, textoPlatos, data.idioma === 'pt' ? 'PT' : 'ES', clave, id]);

    if (personas.length) {
      var filas = personas.map(function (p) {
        var nino = p.tipo === 'Niño';
        return [ahora, 'vigente', limpiar_(p.nombre, 80), nino ? 'Niño' : 'Adulto', nino ? limpiar_(p.edad, 20) : '',
          fiesta ? limpiar_(p.plato, 80) : '', misa ? 'Sí' : 'No', fiesta ? 'Sí' : 'No', responsable, clave, id];
      });
      inv.getRange(inv.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, servicio: 'Confirmaciones Bautismo Walter' });
}

/** Rode uma vez pelo editor para criar as abas e o resumo. */
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  asegurarHojas_(ss);
  SpreadsheetApp.flush();
}

function asegurarHojas_(ss) {
  var resp = ss.getSheetByName(HOJA_RESPUESTAS) || ss.insertSheet(HOJA_RESPUESTAS);
  if (resp.getLastRow() === 0) prepararHoja_(resp, COLS_RESPUESTAS);
  var inv = ss.getSheetByName(HOJA_INVITADOS) || ss.insertSheet(HOJA_INVITADOS);
  if (inv.getLastRow() === 0) prepararHoja_(inv, COLS_INVITADOS);
  var res = ss.getSheetByName(HOJA_RESUMEN);
  if (!res) { res = ss.insertSheet(HOJA_RESUMEN, 0); prepararResumen_(res); }
  var vacia = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (vacia && vacia.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vacia);
}

function prepararHoja_(sh, cols) {
  sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#f3ebdf');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
}

function prepararResumen_(sh) {
  var R = "'" + HOJA_RESPUESTAS + "'!", I = "'" + HOJA_INVITADOS + "'!";
  var vig = R + 'B:B,"vigente"';
  var filas = [
    ['Bautismo de Walter · 1 de noviembre de 2026', ''],
    ['', ''],
    ['Respuestas recibidas (vigentes)', '=COUNTIF(' + R + 'B:B,"vigente")'],
    ['Familias que vienen', '=COUNTIFS(' + vig + ',' + R + 'E:E,"Sí")'],
    ['Familias que no vienen', '=COUNTIFS(' + vig + ',' + R + 'E:E,"No")'],
    ['', ''],
    ['Personas en total', '=SUMIFS(' + R + 'J:J,' + vig + ')'],
    ['Adultos', '=SUMIFS(' + R + 'H:H,' + vig + ')'],
    ['Niños', '=SUMIFS(' + R + 'I:I,' + vig + ')'],
    ['', ''],
    ['Personas en la misa', '=SUMIFS(' + R + 'J:J,' + vig + ',' + R + 'F:F,"Sí")'],
    ['Personas en la fiesta', '=SUMIFS(' + R + 'J:J,' + vig + ',' + R + 'G:G,"Sí")'],
    ['', ''],
    ['Platos (solo quienes van a la fiesta)', ''],
    ['', '=IFERROR(QUERY(' + I + 'A:K,"select F, count(C) where B = \'vigente\' and F <> \'\' group by F label count(C) \'Cantidad\'",1),"Todavía no hay platos")']
  ];
  sh.getRange(1, 1, filas.length, 2).setValues(filas);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('A3:A14').setFontWeight('bold');
  sh.setColumnWidth(1, 300);
  sh.setColumnWidth(2, 160);
}

function marcarReemplazadas_(sh, clave, colClave) {
  var n = sh.getLastRow();
  if (n < 2 || !clave) return;
  var claves = sh.getRange(2, colClave, n - 1, 1).getValues();
  var estados = sh.getRange(2, 2, n - 1, 1).getValues();
  var cambio = false;
  for (var i = 0; i < claves.length; i++) {
    if (claves[i][0] === clave && estados[i][0] === 'vigente') { estados[i][0] = 'reemplazada'; cambio = true; }
  }
  if (cambio) sh.getRange(2, 2, n - 1, 1).setValues(estados);
}

function yaExiste_(sh, id) {
  var n = sh.getLastRow();
  if (n < 2) return false;
  var col = COLS_RESPUESTAS.indexOf('ID') + 1;
  var ids = sh.getRange(2, col, n - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return true;
  return false;
}

function clave_(telefono, nombre) {
  var dig = String(telefono || '').replace(/\D/g, '');
  if (dig.length >= 6) return 'tel:' + dig.slice(-9);
  return 'nom:' + String(nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
}

function limpiar_(v, max) {
  var s = String(v == null ? '' : v).trim().slice(0, max);
  // evita que um texto começando com = + - @ vire fórmula na planilha
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function entero_(v, min, max) {
  var n = parseInt(v, 10);
  if (isNaN(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
