/*
 * Configuração do site do batizado — edite só este arquivo.
 *
 * endpoint: cole aqui a URL do App da Web do Google Apps Script
 *           (termina em /exec). Veja o passo a passo no README.md.
 *           Enquanto estiver vazio, o formulário funciona em "modo de teste"
 *           e NÃO grava nada.
 */
window.BAUTISMO_CONFIG = {
  endpoint: "https://script.google.com/macros/s/AKfycbwJYBT02wjakcQuPmUuEtm5NaGWbx8ALDDqGOgdTdRNHigjpUx14XhEBS9wlPxZWpHa/exec",

  // prazo de confirmação (horário do Paraguai, UTC-3)
  plazo: "2026-10-30T23:59:00-03:00",
  // true = depois do prazo o formulário fecha e mostra um aviso
  cerrarDespuesDelPlazo: false,

  maxPorTipo: 12
};
