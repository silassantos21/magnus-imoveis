// ===== HELPERS =====
const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtArea = v => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
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

  // keyboard — com o lightbox aberto, pula vídeos (ele só exibe foto);
  // no carrossel normal, navega pra qualquer slide (inclusive vídeo).
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") return closeLightbox();
    if (e.key === "ArrowLeft") lightboxAberto() ? lightboxNavegar(-1) : goToSlide(galeria.atual - 1);
    if (e.key === "ArrowRight") lightboxAberto() ? lightboxNavegar(1) : goToSlide(galeria.atual + 1);
  });
}

// ===== LIGHTBOX =====
// Navegação do lightbox usa o mesmo goToSlide()/galeria do carrossel normal
// (mesma fonte de verdade), então as duas telas ficam sempre sincronizadas.
function lightboxAberto() {
  const overlay = document.getElementById("lightbox-overlay");
  return !!overlay && overlay.style.display !== "none";
}

// Anda uma foto na direção indicada (+1/-1), pulando vídeos — o lightbox só
// exibe foto, então não faz sentido parar num slide de vídeo navegando nele.
function lightboxNavegar(direcao) {
  const total = galeria.fotos.length;
  let idx = galeria.atual;
  for (let i = 0; i < total; i++) {
    idx = (idx + direcao + total) % total;
    if (!_isVideo(galeria.fotos[idx])) break;
  }
  goToSlide(idx);
}

function openLightbox(index) {
  const src = galeria.fotos[index];
  if (_isVideo(src)) return;
  galeria.atual = index;
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-counter").textContent = `${galeria.atual + 1} / ${galeria.fotos.length}`;
  const mostraNav = galeria.fotos.length > 1;
  document.getElementById("lightbox-prev").style.display = mostraNav ? "" : "none";
  document.getElementById("lightbox-next").style.display = mostraNav ? "" : "none";
  document.getElementById("lightbox-overlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  atualizarGaleria();
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
  document.getElementById("lightbox-prev").addEventListener("click", () => lightboxNavegar(-1));
  document.getElementById("lightbox-next").addEventListener("click", () => lightboxNavegar(1));

  // swipe no lightbox, igual ao carrossel normal
  let lbTouchStartX = 0;
  const lightboxImg = document.getElementById("lightbox-img");
  lightboxImg.addEventListener("touchstart", e => { lbTouchStartX = e.touches[0].clientX; }, { passive: true });
  lightboxImg.addEventListener("touchend", e => {
    const diff = lbTouchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) lightboxNavegar(diff > 0 ? 1 : -1);
  }, { passive: true });
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

  // se o lightbox estiver aberto, mantém a foto grande sincronizada também
  if (lightboxAberto()) {
    const src = galeria.fotos[galeria.atual];
    if (!_isVideo(src)) {
      document.getElementById("lightbox-img").src = src;
      document.getElementById("lightbox-counter").textContent = `${galeria.atual + 1} / ${galeria.fotos.length}`;
    }
  }
}

// Características de sim/não exibidas na página do imóvel (card some quando
// o campo não está marcado). Lista única: pra adicionar uma nova no futuro,
// basta incluir aqui (e o checkbox correspondente no admin).
const CARACTERISTICAS_BOOL = [
  { campo: "aceita_financiamento", label: "Aceita financiamento",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>` },
  { campo: "portaria_24h", label: "Portaria 24h",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { campo: "elevador", label: "Elevador",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 8l3-3 3 3"/><path d="M9 16l3 3 3-3"/></svg>` },
  { campo: "gas_canalizado", label: "Gás canalizado",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/></svg>` },
  { campo: "piscina", label: "Piscina",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M2 21c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M5 13V5a2 2 0 012-2h3v10"/></svg>` },
  { campo: "academia", label: "Academia",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="9" width="3" height="6" rx="1"/><rect x="20" y="9" width="3" height="6" rx="1"/><rect x="4" y="7" width="2.5" height="10" rx="1"/><rect x="17.5" y="7" width="2.5" height="10" rx="1"/><line x1="6.5" y1="12" x2="17.5" y2="12"/></svg>` },
  { campo: "quadra_futsal", label: "Quadra de futsal",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 010 20M2 12h20"/></svg>` },
  { campo: "playground", label: "Playground",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V9M20 21V9M4 9h16"/><path d="M9 9v6a3 3 0 006 0V9"/></svg>` },
  { campo: "salao_festas", label: "Salão de festas",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v8M9 21h6"/></svg>` },
  { campo: "minimercado", label: "Minimercado",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L22 6H6"/></svg>` },
  { campo: "luz_individual", label: "Luz individual", labelAlt: "Energia elétrica individual", labelAltTipos: ["Terreno", "Galpão", "Comercial"],
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>` },
  { campo: "agua_individual", label: "Água individual",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.7l5.7 5.6a8 8 0 11-11.3 0z"/></svg>` },
  { campo: "monitoramento_cameras", label: "Câmeras de segurança", labelAlt: "Segurança/monitoramento", labelAltTipos: ["Terreno", "Galpão", "Comercial"],
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
  { campo: "predio_individual", label: "Prédio individual", tiposExcluidos: ["Casa"],
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="1"/><path d="M6 22v-3h12v3"/><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>` },
  { campo: "conjunto_apartamentos", label: "Conjunto de apartamentos", tiposExcluidos: ["Casa"],
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V10l4-3 4 3v11"/><path d="M11 21V6l4-3 4 3v15"/><path d="M3 21h18"/></svg>` },
  { campo: "lavabo", label: "Lavabo",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="6" rx="1"/><path d="M5 8h14l-1.5 11a2.5 2.5 0 01-2.49 2H8.99a2.5 2.5 0 01-2.49-2L5 8z"/></svg>` },
  { campo: "closet", label: "Closet",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M12 2v20M9 11v2M15 11v2"/></svg>` },
  { campo: "hidromassagem", label: "Hidromassagem",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><circle cx="10" cy="8" r=".6"/><circle cx="13" cy="6" r=".6"/><circle cx="16" cy="9" r=".6"/></svg>` },
  { campo: "energia_solar", label: "Energia solar",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>` },
  { campo: "ponto_ar_condicionado", label: "Ponto de ar-condicionado",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="7" rx="2"/><path d="M6 13v4M10 13v4M14 13v4M18 13v4"/><circle cx="19" cy="9.5" r=".6"/></svg>` },
  { campo: "agua_aquecida_cozinha", label: "Água aquecida na cozinha",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2c.4.9.9.9.9 1.8M14 2c.4.9.9.9.9 1.8"/><path d="M12 5.5l5.7 6.2a8 8 0 11-11.4 0z"/></svg>` },
  { campo: "agua_aquecida_suite", label: "Água aquecida na suíte",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2c.4.9.9.9.9 1.8M14 2c.4.9.9.9.9 1.8"/><path d="M12 5.5l5.7 6.2a8 8 0 11-11.4 0z"/></svg>` },
  { campo: "agua_aquecida_banho_social", label: "Água aquecida no banho social",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2c.4.9.9.9.9 1.8M14 2c.4.9.9.9.9 1.8"/><path d="M12 5.5l5.7 6.2a8 8 0 11-11.4 0z"/></svg>` },
  { campo: "rua_asfaltada", label: "Rua asfaltada",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 22L10 2M19 22L14 2M10.5 13h3"/></svg>` },
  { campo: "rede_agua", label: "Rede de água",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4v7a4 4 0 004 4h4M21 20v-7a4 4 0 00-4-4H9"/></svg>` },
  { campo: "rede_esgoto", label: "Rede de esgoto",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v10M8 9l4 4 4-4"/><rect x="4" y="19" width="16" height="2" rx="1"/></svg>` },
  { campo: "rede_eletrica", label: "Rede elétrica",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>` },
  { campo: "iluminacao_publica", label: "Iluminação pública",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M8.5 11.5L8 6h8l-.5 5.5a3.5 3.5 0 01-7 0z"/><path d="M12 15v7M8.5 22h7"/></svg>` },
  { campo: "calcada", label: "Calçada",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 16h18M3 16V9h18v7"/><path d="M9 9v7M15 9v7"/></svg>` },
  { campo: "murado", label: "Murado",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 16h18M9 4v6M15 10v6M9 16v4M15 4v6"/></svg>` },
  { campo: "cercado", label: "Cercado",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22V8M9 22V8M14 22V8M19 22V8"/><path d="M2 12h20M2 17h20"/></svg>` },
  { campo: "esquina", label: "Esquina",
    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v10a6 6 0 006 6h10"/></svg>` }
];

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
    label: "Área útil", value: `${fmtArea(im.area_util)}m²`
  });
  if (im.area_construida && im.area_construida !== im.area_util) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    label: "Área construída", value: `${fmtArea(im.area_construida)}m²`
  });
  if (im.area_terreno) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 21V7l9-4 9 4v14"/></svg>`,
    label: "Área terreno", value: `${fmtArea(im.area_terreno)}m²`
  });
  if (im.andar > 0) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18"/></svg>`,
    label: "Andar", value: im.andar
  });
  if (im.topografia) specs.push({
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20l5-9 3 5 3-4 7 8z"/></svg>`,
    label: "Topografia", value: im.topografia
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

// ===== AMENIDADES (características de sim/não — "O que esse imóvel oferece") =====
// Lista fluida de ícone + texto, sem card ao redor. Pra adicionar uma nova
// característica assim no futuro, basta incluir em CARACTERISTICAS_BOOL.
function renderAmenidades(im) {
  return CARACTERISTICAS_BOOL
    .filter(c => im[c.campo] && !(c.tiposExcluidos && c.tiposExcluidos.includes(im.tipo)))
    .map(c => {
      const label = (c.labelAltTipos && c.labelAltTipos.includes(im.tipo)) ? c.labelAlt : c.label;
      return `<span class="amenidade-item">${c.icone}${label}</span>`;
    })
    .join("");
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
  const primeiraFoto = im.fotos && im.fotos[0] && !_isVideo(im.fotos[0]) ? im.fotos[0] : `${BASE_URL}/images/og-cover-v2.jpg`;
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

  // amenidades (características de sim/não)
  const amenidadesHtml = renderAmenidades(im);
  if (amenidadesHtml) {
    document.getElementById("detail-amenidades").innerHTML = amenidadesHtml;
    document.getElementById("detail-amenidades-box").style.display = "";
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

  // No layout mobile (sidebar não é sticky, ≤960px) o botão flutuante do WhatsApp
  // fica fixo bem em cima de "Simular financiamento" assim que a página abre, porque
  // o bloco de ações (que já tem seu próprio botão "Falar com um corretor") cai
  // naquela mesma faixa da tela. Esconde o flutuante enquanto esse bloco estiver
  // visível — ele já tem WhatsApp embutido, então não faz falta.
  const waFloat = document.querySelector(".wa-float");
  const sidebarActions = document.querySelector(".sidebar-actions");
  if (waFloat && sidebarActions && window.innerWidth <= 960) {
    const waObserver = new IntersectionObserver(entries => {
      entries.forEach(e => waFloat.classList.toggle("wa-float-oculto", e.isIntersecting));
    }, { threshold: 0.15 });
    waObserver.observe(sidebarActions);
  }
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
