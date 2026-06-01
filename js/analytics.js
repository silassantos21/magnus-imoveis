// ===== CONFIGURAÇÃO GA4 =====
// Substitua pelo seu Measurement ID real (ex: G-A1B2C3D4E5)
// Obtenha em: Google Analytics → Admin → Fluxos de dados → Detalhes do fluxo
const GA_ID = "G-V355TXQ9Q3";

// ===== WRAPPER SEGURO =====
function _gtag() {
  if (typeof window.gtag === "function") window.gtag(...arguments);
}

// ===== EVENTOS CUSTOMIZADOS =====
function trackSearch(filtros) {
  const termo = [filtros.tipo, filtros.cidade, filtros.bairro, filtros.valor]
    .filter(v => v && v !== "todos").join(" | ") || "todos";
  _gtag("event", "search", { search_term: termo });
}

function trackViewItem(im) {
  _gtag("event", "view_item", {
    currency: "BRL",
    value: im.preco,
    items: [{
      item_id: im.ref,
      item_name: im.titulo || `${im.tipo} em ${im.bairro}`,
      item_category: im.tipo,
      item_category2: im.finalidade,
      price: im.preco
    }]
  });
}

function trackLeadFormSubmit(ref) {
  _gtag("event", "lead_form_submit", { item_ref: ref || "" });
}

function trackSimulationStart(ref, valor) {
  _gtag("event", "simulation_start", { item_ref: ref || "", item_value: valor || 0 });
}

// ===== TRACKING GLOBAL DE CLIQUES NO WHATSAPP =====
document.addEventListener("click", e => {
  const link = e.target.closest("a[href*='wa.me']");
  if (!link) return;
  const source = link.dataset.gaSource || link.className || "wa_link";
  _gtag("event", "contact_whatsapp", { source });
});
