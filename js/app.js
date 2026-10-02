// ===== ESTADO =====
let imoveis = [];
let filtros = { tipo: "todos", cidade: "todos", bairro: "todos", valor: "todos" };
let ordenacao = "preco-asc";
let visiveis = 9;
const POR_PAGINA = 3;

// ===== HELPERS =====
const fmt = valor => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtArea = valor => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const waLink = (im) =>
  `https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${im.ref} - ${im.tipo} em ${im.bairro}, ${im.cidade}. Valor: ${fmt(im.preco)}. Poderia me dar mais informações?`)}`;

const tipoImg = { "Terreno": "images/terreno.jpg", "Casa": "images/casa.jpg", "Apartamento": "images/apartamento.jpg" };

const tipoIcon = (tipo) => {
  const icons = {
    "Apartamento": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z"/></svg>`,
    "Casa": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
    "Terreno": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M3 21V7l9-4 9 4v14"/><path d="M12 21v-6"/></svg>`
  };
  return icons[tipo] || icons["Casa"];
};

// ===== FILTRAR & ORDENAR =====
function getImovelFiltrado() {
  let lista = imoveis.filter(im => {
    if (filtros.tipo !== "todos" && im.tipo !== filtros.tipo) return false;
    if (filtros.cidade !== "todos" && im.cidade !== filtros.cidade) return false;
    if (filtros.bairro !== "todos" && im.bairro !== filtros.bairro) return false;
    if (filtros.valor !== "todos") {
      const [min, max] = filtros.valor.split("-").map(Number);
      if (max && im.preco > max) return false;
      if (im.preco < min) return false;
    }
    return true;
  });

  lista.sort((a, b) => {
    if (ordenacao === "preco-asc") return a.preco - b.preco;
    if (ordenacao === "preco-desc") return b.preco - a.preco;
    if (ordenacao === "area-desc") return (b.area_util || b.area_terreno || 0) - (a.area_util || a.area_terreno || 0);
    return 0;
  });

  return lista;
}

// ===== RENDER CARD =====
function renderCard(im) {
  const area = im.area_util || im.area_terreno || 0;
  const hasFeatures = im.quartos > 0 || im.banheiros > 0 || area > 0;
  const imgSrc = (im.fotos && im.fotos[0]) || tipoImg[im.tipo] || "images/casa.jpg";
  const vendido = im.status === "vendido";
  return `
    <div class="property-card fade-in" data-id="${im.id}">
      <div class="card-image">
        <img src="${imgSrc}" alt="${im.tipo} em ${im.bairro}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="card-image-placeholder" style="display:none">
          ${tipoIcon(im.tipo)}
          <span>${im.tipo}</span>
        </div>
        <span class="card-badge">${im.finalidade}</span>
        <span class="badge-tipo">${im.tipo}</span>
        ${vendido ? `<div class="badge-sold"><span>VENDIDO</span></div>` : ""}
        <button class="badge-fav" title="Favoritar" onclick="toggleFav(this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${im.bairro} · ${im.cidade} - ${im.estado}</span>
        </div>
        <div class="card-price">${fmt(im.preco)}</div>
        ${hasFeatures ? `
        <div class="card-features">
          ${im.quartos > 0 ? `<span class="feat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V12a9 9 0 0118 0v10"/><path d="M3 18h18"/></svg>${im.quartos} qts</span>` : ""}
          ${im.banheiros > 0 ? `<span class="feat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/></svg>${im.banheiros} bhs</span>` : ""}
          ${area > 0 ? `<span class="feat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>${fmtArea(area)}m²</span>` : ""}
        </div>` : ""}
        <div class="card-ref">Ref.: ${im.ref}</div>
      </div>
      <div class="card-footer">
        <button class="btn-card interesse" onclick="if(window.openModalLead) window.openModalLead(imoveis.find(x=>x.ref==='${im.ref}'))">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          Tenho Interesse
        </button>
        <a href="imovel.html?ref=${im.ref}" class="btn-card primary">Ver Detalhes</a>
      </div>
    </div>`;
}

// ===== RENDER GRID =====
function renderGrid() {
  const lista = getImovelFiltrado();
  const grid = document.getElementById("properties-grid");
  const countEl = document.getElementById("results-count");
  const loadMoreWrap = document.getElementById("load-more-wrap");

  const slice = lista.slice(0, visiveis);

  countEl.innerHTML = `<strong>${lista.length}</strong> ${lista.length !== 1 ? "imóveis" : "imóvel"} encontrado${lista.length !== 1 ? "s" : ""}`;

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>
        <p>Nenhum imóvel encontrado</p>
        <span>Tente ajustar os filtros de busca</span>
      </div>`;
    loadMoreWrap.style.display = "none";
    return;
  }

  grid.innerHTML = slice.map(renderCard).join("");
  loadMoreWrap.style.display = lista.length > visiveis ? "block" : "none";

  requestAnimationFrame(() => {
    grid.querySelectorAll(".fade-in").forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), i * 60);
    });
  });
}

// ===== POPULAR SELECTS =====
function popularSelects() {
  const cidades = [...new Set(imoveis.map(i => i.cidade))].sort();
  const bairros = [...new Set(imoveis.map(i => i.bairro))].sort();
  const selCidade = document.getElementById("sel-cidade");
  const selBairro = document.getElementById("sel-bairro");

  cidades.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    selCidade.appendChild(o);
  });
  bairros.forEach(b => {
    const o = document.createElement("option");
    o.value = b; o.textContent = b;
    selBairro.appendChild(o);
  });
}

// ===== EVENTOS =====
function buscar() {
  filtros.tipo = document.getElementById("sel-tipo").value;
  filtros.cidade = document.getElementById("sel-cidade").value;
  filtros.bairro = document.getElementById("sel-bairro").value;
  filtros.valor = document.getElementById("sel-valor").value;
  visiveis = 9;
  renderGrid();
  if (typeof trackSearch === "function") trackSearch(filtros);

  const sec = document.getElementById("imoveis");
  if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleFav(btn) {
  btn.classList.toggle("active");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  window.dadosImoveis.carregarImoveis()
    .then(data => {
      imoveis = data;
      popularSelects();
      renderGrid();
      const statTotal = document.getElementById("stat-total-imoveis");
      if (statTotal) {
        const disponiveis = imoveis.filter(im => im.status === "disponivel").length;
        statTotal.textContent = disponiveis + "+";
      }
    })
    .catch(() => {
      document.getElementById("properties-grid").innerHTML = `
        <div class="no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <p>Não foi possível carregar os imóveis</p>
          <span>Tente recarregar a página</span>
        </div>`;
    });

  // ordenação
  document.getElementById("sel-ordenar")?.addEventListener("change", e => {
    ordenacao = e.target.value;
    renderGrid();
  });

  // load more
  document.getElementById("btn-load-more")?.addEventListener("click", () => {
    visiveis += POR_PAGINA;
    renderGrid();
  });

  // view_item ao clicar em "Ver Detalhes"
  document.getElementById("properties-grid")?.addEventListener("click", e => {
    const link = e.target.closest("a.btn-card.primary");
    if (!link) return;
    const ref = new URL(link.href, location.href).searchParams.get("ref");
    const im = imoveis.find(x => x.ref === ref);
    if (im && typeof trackViewItem === "function") trackViewItem(im);
  });

  // intersection observer para fade-in global
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));
});
