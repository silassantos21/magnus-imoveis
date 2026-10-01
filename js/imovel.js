// ===== HELPERS =====
const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const tipoImg = { "Terreno": "images/terreno.jpg", "Casa": "images/casa.jpg", "Apartamento": "images/apartamento.jpg" };

const tipoIcon = (tipo) => {
  const icons = {
    "Apartamento": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z"/></svg>`,
    "Casa": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
    "Terreno": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M3 21V7l9-4 9 4v14"/><path d="M12 21v-6"/></svg>`
  };
  return icons[tipo] || icons["Casa"];
};

const waLink = (im) =>
  `https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${im.ref} - ${im.tipo} em ${im.bairro}, ${im.cidade}. Valor: ${fmt(im.preco)}. Poderia me dar mais informações?`)}`;

// ===== VÍDEO =====
function _isVideo(src) {
  return /\.(mp4|webm|mov|avi|ogv)(\?.*)?$/i.test(src) || /youtube\.com|youtu\.be|vimeo\.com/.test(src);
}

function _videoEmbed(src) {
  // YouTube
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `<iframe src="https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  // Vimeo
  const vi = src.match(/vimeo\.com\/(\d+)/);
  if (vi) return `<iframe src="https://player.vimeo.com/video/${vi[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  // Arquivo de vídeo direto (.mp4, .webm, .mov…)
  return `<video controls playsinline><source src="${src}"></video>`;
}

// ===== GALERIA =====
let galeria = { fotos: [], atual: 0 };

function initGaleria(fotos) {
  galeria.fotos = fotos.length > 0 ? fotos : ["images/casa.jpg"];
  galeria.atual = 0;

  const slides = document.getElementById("gallery-slides");
  const thumbs = document.getElementById("gallery-thumbs");

  slides.innerHTML = galeria.fotos.map((src, i) => `
    <div class="gallery-slide ${i === 0 ? "active" : ""}" data-index="${i}">
      ${_isVideo(src)
        ? `<div class="gallery-video">${_videoEmbed(src)}</div>`
        : `<img src="${src}" alt="Foto ${i + 1}" loading="${i === 0 ? "eager" : "lazy"}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="gallery-placeholder" style="display:none">
            ${tipoIcon(document.title.includes("Casa") ? "Casa" : "Apartamento")}
          </div>`
      }
    </div>
  `).join("");

  if (galeria.fotos.length > 1) {
    thumbs.style.display = "";
    thumbs.innerHTML = galeria.fotos.map((src, i) => `
      <button class="gallery-thumb ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="${_isVideo(src) ? "Vídeo" : "Foto"} ${i + 1}">
        ${_isVideo(src)
          ? `<div class="gallery-thumb-video"><svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg></div>`
          : `<img src="${src}" alt="Miniatura ${i + 1}" loading="lazy" onerror="this.src='images/casa.jpg'">`
        }
      </button>
    `).join("");
  } else {
    thumbs.style.display = "none";
    thumbs.innerHTML = "";
  }

  atualizarGaleria();

  // eventos thumbs
  thumbs.querySelectorAll(".gallery-thumb").forEach(btn => {
    btn.addEventListener("click", () => goToSlide(parseInt(btn.dataset.index)));
  });

  // eventos arrows
  document.getElementById("gallery-prev").addEventListener("click", () => goToSlide(galeria.atual - 1));
  document.getElementById("gallery-next").addEventListener("click", () => goToSlide(galeria.atual + 1));

  // mostrar/ocultar arrows se só 1 foto
  const showNav = galeria.fotos.length > 1;
  document.getElementById("gallery-prev").style.display = showNav ? "" : "none";
  document.getElementById("gallery-next").style.display = showNav ? "" : "none";

  // swipe touch
  let touchStartX = 0;
  const carouselEl = document.getElementById("gallery-carousel");
  carouselEl.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carouselEl.addEventListener("touchend", e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goToSlide(diff > 0 ? galeria.atual + 1 : galeria.atual - 1);
  }, { passive: true });

  // clique na foto abre o lightbox
  carouselEl.addEventListener("click", e => {
    const img = e.target.closest(".gallery-slide img");
    if (!img) return;
    const idx = parseInt(img.closest(".gallery-slide").dataset.index);
    openLightbox(idx);
  });

  // keyboard
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") return closeLightbox();
    if (e.key === "ArrowLeft") goToSlide(galeria.atual - 1);
    if (e.key === "ArrowRight") goToSlide(galeria.atual + 1);
  });
}

// ===== LIGHTBOX =====
function openLightbox(index) {
  const src = galeria.fotos[index];
  if (_isVideo(src)) return;
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-overlay").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const overlay = document.getElementById("lightbox-overlay");
  if (overlay.style.display === "none") return;
  overlay.style.display = "none";
  document.getElementById("lightbox-img").src = "";
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-overlay").addEventListener("click", e => {
    if (e.target.id === "lightbox-overlay") closeLightbox();
  });
});

function goToSlide(index) {
  const total = galeria.fotos.length;
  galeria.atual = (index + total) % total;
  atualizarGaleria();
}

function atualizarGaleria() {
  const slides = document.querySelectorAll(".gallery-slide");
  const thumbBtns = document.querySelectorAll(".gallery-thumb");

  slides.forEach((s, i) => s.classList.toggle("active", i === galeria.atual));
  thumbBtns.forEach((t, i) => t.classList.toggle("active", i === galeria.atual));

  document.getElementById("gallery-counter").textContent = `${galeria.atual + 1} / ${galeria.fotos.length}`;
}

// ===== SPECS =====
function renderSpecs(im) {
  const specs = [];

  if (im.quartos > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V12a9 9 0 0118 0v10"/><path d="M3 18h18"/></svg>`,
    label: "Quartos", value: im.quartos
  });
  if (im.suites > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V12a9 9 0 0118 0v10"/><path d="M3 18h18"/><circle cx="12" cy="10" r="2"/></svg>`,
    label: "Suítes", value: im.suites
  });
  if (im.banheiros > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/></svg>`,
    label: "Banheiros", value: im.banheiros
  });
  if (im.vagas > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="8" width="22" height="12" rx="2"/><path d="M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2"/><path d="M9 16h6"/></svg>`,
    label: "Vagas", value: im.vagas
  });
  if (im.area_util) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>`,
    label: "Área útil", value: `${im.area_util}m²`
  });
  if (im.area_construida && im.area_construida !== im.area_util) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    label: "Área construída", value: `${im.area_construida}m²`
  });
  if (im.area_terreno) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 21V7l9-4 9 4v14"/></svg>`,
    label: "Área terreno", value: `${im.area_terreno}m²`
  });
  if (im.andar > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18"/></svg>`,
    label: "Andar", value: im.andar
  });

  return specs.map(s => `
    <div class="spec-item">
      <div class="spec-icon">${s.icon}</div>
      <div class="spec-info">
        <span class="spec-value">${s.value}</span>
        <span class="spec-label">${s.label}</span>
      </div>
    </div>
  `).join("");
}

// ===== CUSTOS ADICIONAIS (IPTU / Condomínio) =====
function renderCustos(im) {
  const itens = [];
  if (im.iptu > 0) itens.push({ label: "IPTU", value: `${fmt(im.iptu)}/ano` });
  if (im.condominio > 0) itens.push({ label: "Condomínio", value: `${fmt(im.condominio)}/mês` });
  return itens.map(c => `
    <div class="custo-item">
      <span class="custo-label">${c.label}</span>
      <span class="custo-value">${c.value}</span>
    </div>
  `).join("");
}

// ===== MODAIS =====
function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function initModais(im) {
  document.getElementById("action-schedule").addEventListener("click", () => {
    if (window.openModalAgendamento) {
      window.openModalAgendamento(im);
    }
  });

  document.getElementById("action-simulate").addEventListener("click", () => {
    if (window.openCalculadora) {
      window.openCalculadora(im.preco, im.ref, im.titulo);
    } else {
      openModal("modal-simulate");
    }
  });

  // Botão "Tenho Interesse" na sidebar (se existir em versões futuras)
  const btnLead = document.getElementById("action-lead");
  if (btnLead) btnLead.addEventListener("click", () => {
    if (window.openModalLead) window.openModalLead(im);
  });

  // Fecha modal-simulate ao pressionar ESC (calculadora trata os outros)
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal("modal-simulate");
  });
  const simOverlay = document.getElementById("modal-simulate");
  if (simOverlay) {
    document.getElementById("modal-simulate-close")?.addEventListener("click", () => closeModal("modal-simulate"));
    simOverlay.addEventListener("click", e => { if (e.target === simOverlay) closeModal("modal-simulate"); });
    const simWa = document.getElementById("modal-simulate-wa");
    if (simWa) simWa.href = waLink(im);
  }
}

// ===== SEO DINÂMICO =====
const BASE_URL = "https://www.magnusimoveisbh.com.br";

function atualizarSEO(im) {
  const ogTitle = `${im.titulo} — Magnus Imóveis`;
  const ogDesc = `${im.tipo} à venda em ${im.bairro}, ${im.cidade}.${im.quartos > 0 ? " " + im.quartos + " quartos." : ""}${im.area_util ? " " + im.area_util + "m²." : ""} ${fmt(im.preco)}.`;
  const primeiraFoto = im.fotos && im.fotos[0] && !_isVideo(im.fotos[0]) ? im.fotos[0] : `${BASE_URL}/images/og-cover.jpg`;
  const ogUrl = `${BASE_URL}/imovel.html?ref=${im.ref}`;

  const set = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
  set("og-title", "content", ogTitle);
  set("og-description", "content", ogDesc);
  set("og-image", "content", primeiraFoto);
  set("og-url", "content", ogUrl);
  set("tw-title", "content", ogTitle);
  set("tw-description", "content", ogDesc);
  set("tw-image", "content", primeiraFoto);
  set("canonical", "href", ogUrl);

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": im.titulo,
    "description": ogDesc,
    "url": ogUrl,
    "image": primeiraFoto,
    "offers": {
      "@type": "Offer",
      "price": im.preco,
      "priceCurrency": "BRL",
      "availability": im.status === "disponivel"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": im.bairro,
      "addressLocality": im.cidade,
      "addressRegion": im.estado,
      "addressCountry": "BR"
    }
  };
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(schema);
  document.head.appendChild(ld);
}

// ===== RENDER PÁGINA =====
function renderPage(im, todos) {
  // meta + SEO
  document.getElementById("page-title").textContent = `${im.titulo} — Magnus Imóveis`;
  document.getElementById("page-desc").content = `${im.tipo} em ${im.bairro}, ${im.cidade}. Ref. ${im.ref}. ${fmt(im.preco)}.`;
  document.getElementById("breadcrumb-ref").textContent = im.ref;
  atualizarSEO(im);

  // galeria
  initGaleria(im.fotos && im.fotos.length > 0 ? im.fotos : [tipoImg[im.tipo] || "images/casa.jpg"]);

  // status badge na galeria
  const statusBadge = document.getElementById("gallery-status-badge");
  if (im.status === "vendido") {
    statusBadge.className = "gallery-status-badge sold";
    statusBadge.textContent = "VENDIDO";
  } else if (im.status === "reservado") {
    statusBadge.className = "gallery-status-badge reserved";
    statusBadge.textContent = "RESERVADO";
  } else {
    statusBadge.style.display = "none";
  }

  // header
  const badges = document.getElementById("detail-badges");
  badges.innerHTML = `
    <span class="detail-badge finalidade">${im.finalidade}</span>
    <span class="detail-badge tipo">${im.tipo}</span>
    ${im.destaque ? `<span class="detail-badge destaque">⭐ Destaque</span>` : ""}
  `;
  document.getElementById("detail-title").textContent = im.titulo;
  document.getElementById("detail-location").innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    ${im.bairro} · ${im.cidade} - ${im.estado}
  `;

  // specs
  const specsHtml = renderSpecs(im);
  if (specsHtml) {
    document.getElementById("detail-specs").innerHTML = specsHtml;
  } else {
    document.getElementById("detail-specs-box").style.display = "none";
  }

  // custos adicionais (IPTU / condomínio)
  const custosHtml = renderCustos(im);
  if (custosHtml) {
    document.getElementById("detail-custos").innerHTML = custosHtml;
    document.getElementById("detail-custos-box").style.display = "";
  }

  // descrição
  document.getElementById("detail-desc").textContent = im.descricao;

  // sidebar
  document.getElementById("sidebar-finalidade").innerHTML = `
    <span class="sidebar-badge">${im.finalidade}</span>
  `;
  document.getElementById("sidebar-price").textContent = fmt(im.preco);
  document.getElementById("sidebar-ref").textContent = `Ref.: ${im.ref}`;
  document.getElementById("action-wa").href = waLink(im);

  // modais
  initModais(im);

  // analytics
  if (typeof trackViewItem === "function") trackViewItem(im);

  // exibe página
  document.getElementById("detail-loading").style.display = "none";
  document.getElementById("detail-page").style.display = "";

  // intersection observer para fade-in
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (!ref) {
    document.getElementById("detail-loading").style.display = "none";
    document.getElementById("detail-not-found").style.display = "flex";
    return;
  }

  window.dadosImoveis.carregarImoveis()
    .then(todos => {
      const im = todos.find(x => x.ref === ref);
      if (!im) {
        document.getElementById("detail-loading").style.display = "none";
        document.getElementById("detail-not-found").style.display = "flex";
        return;
      }
      renderPage(im, todos);
    })
    .catch(() => {
      document.getElementById("detail-loading").style.display = "none";
      document.getElementById("detail-not-found").style.display = "flex";
    });
});
