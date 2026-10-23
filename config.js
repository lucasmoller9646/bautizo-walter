/*
 * Configuração do site do batizado — edite só este arquivo.
 *
 * endpoint: cole aqui a URL do App da Web do Google Apps Script
 *           (termina em /exec). Veja o passo a passo no README.md.
 *           Enquanto estiver vazio, o formulário funciona em "modo de teste"
 *           e NÃO grava nada.
 *
 * platos:   os pratos principais que cada convidado pode escolher no
 *           formulário. "es" é o nome que vai para a planilha.
 *           (O cardápio exibido na página fica no index.html e no i18n.js.)
 */
window.BAUTISMO_CONFIG = {
  endpoint: "",

  // prazo de confirmação (horário do Paraguai, UTC-3)
  plazo: "2026-10-29T23:59:00-03:00",
  // true = depois do prazo o formulário fecha e mostra um aviso
  cerrarDespuesDelPlazo: false,

  grupos: [
    { id: "cordero", es: "Cordero", pt: "Cordeiro" },
    { id: "pescado", es: "Pescados", pt: "Peixes" },
    { id: "pasta", es: "Pastas", pt: "Massas" }
  ],

  platos: [
    { id: "cordero-miel", grupo: "cordero", es: "Lomito de cordero con salsa de miel y romero", pt: "Lombinho de cordeiro ao molho de mel e alecrim" },
    { id: "ragu-cordero", grupo: "cordero", es: "Ragú de cordero con risotto blanco", pt: "Ragu de cordeiro com risoto branco" },
    { id: "surubi-roquefort", grupo: "pescado", es: "Surubí al horno con crema de roquefort", pt: "Surubim assado com creme de roquefort" },
    { id: "surubi-citrico", grupo: "pescado", es: "Surubí en costra cítrica", pt: "Surubim em crosta cítrica" },
    { id: "triangoli", grupo: "pasta", es: "Triangoli de calabaza", pt: "Triangoli de abóbora" },
    { id: "gnocchi", grupo: "pasta", es: "Gnocchi de remolacha", pt: "Nhoque de beterraba" }
  ],

  maxPorTipo: 12
};
