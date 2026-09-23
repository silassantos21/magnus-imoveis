// ===== CONFIGURAÇÃO SUPABASE =====
// Cole os mesmos valores de dados.js:
const SUPABASE_ADMIN_URL = "https://pwdwpcqpiodbotqmrfxq.supabase.co";  // só o domínio — sem /rest/v1/

const SESSION_KEY        = "magnus_admin_session";
const HASH_KEY           = "magnus_admin_hash";
const TOKEN_KEY          = "magnus_admin_token";
const CLOUDINARY_CLOUD_KEY  = "magnus_cloudinary_cloud";
const CLOUDINARY_PRESET_KEY = "magnus_cloudinary_preset";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8h em ms
let fpDataVenda, fpLeadDe, fpLeadAte; // instâncias Flatpickr

const FP_LOCALE = {
  weekdays: {
    shorthand: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
    longhand:  ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]
  },
  months: {
    shorthand: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    longhand:  ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
  },
  firstDayOfWeek: 0
};

// ===== ÍCONES SVG =====
const _ico = (p, s = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

const Icons = {
  edit:    _ico('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  copy:    _ico('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  trash:   _ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  starOn:  _ico('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>', 17),
  starOff: _ico('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', 17),
  check:   _ico('<polyline points="20 6 9 17 4 12"/>'),
  xMark:   _ico('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  flag:    _ico('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
};

// ===== UTILITÁRIOS =====

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fmtPreco(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtTelefone(tel) {
  const n = (tel || "").replace(/\D/g, "");
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return tel || "—";
}

function esc(str) {
  return String(str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ===== AUTENTICAÇÃO =====

const Auth = {
  async login(senha) {
    const hash  = await sha256(senha);
    const stored = localStorage.getItem(HASH_KEY);
    if (hash !== stored) return false;
    const expires = Date.now() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ expires }));
    return true;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    showScreen("login");
  },

  isAuthenticated() {
    try {
      const sess = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!sess || Date.now() > sess.expires) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      // renova a sessão a cada verificação (8h de inatividade)
      localStorage.setItem(SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_DURATION }));
      return true;
    } catch { return false; }
  },

  getToken() { return localStorage.getItem(TOKEN_KEY) || ""; },

  isSetupDone() { return !!localStorage.getItem(HASH_KEY); },

  async setup(senha, token, cloudName, cloudPreset) {
    const hash = await sha256(senha);
    localStorage.setItem(HASH_KEY, hash);
    localStorage.setItem(TOKEN_KEY, token);
    if (cloudName)   localStorage.setItem(CLOUDINARY_CLOUD_KEY, cloudName);
    if (cloudPreset) localStorage.setItem(CLOUDINARY_PRESET_KEY, cloudPreset);
  },

  resetSetup() {
    localStorage.removeItem(HASH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CLOUDINARY_CLOUD_KEY);
    localStorage.removeItem(CLOUDINARY_PRESET_KEY);
  },

  getCloudinary() {
    return {
      cloud:  localStorage.getItem(CLOUDINARY_CLOUD_KEY)  || "",
      preset: localStorage.getItem(CLOUDINARY_PRESET_KEY) || ""
    };
  },

  saveCloudinary(cloud, preset) {
    localStorage.setItem(CLOUDINARY_CLOUD_KEY,  cloud.trim());
    localStorage.setItem(CLOUDINARY_PRESET_KEY, preset.trim());
  }
};

// ===== API (Supabase REST) =====
// A service role key (armazenada em TOKEN_KEY no localStorage) bypassa o RLS
// e permite todas as operações de leitura e escrita do admin.

const Api = {
  _key() { return Auth.getToken(); },

  _h(extra) {
    const key = this._key();
    if (!key) throw new Error("Service Role Key não configurada — clique em Sair e reconfigure o painel");
    return Object.assign({
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": "Bearer " + key
    }, extra || {});
  },

  _err(r) {
    if (r.status === 401) throw new Error("Chave inválida — clique em Sair → Redefinir configurações e insira a Service Role Key correta");
    throw new Error("Erro " + r.status);
  },

  async select(tabela, qs) {
    const r = await fetch(SUPABASE_ADMIN_URL + "/rest/v1/" + tabela + (qs ? "?" + qs : ""), {
      headers: this._h()
    });
    if (!r.ok) this._err(r);
    return r.json();
  },

  async insert(tabela, dados) {
    const r = await fetch(SUPABASE_ADMIN_URL + "/rest/v1/" + tabela, {
      method: "POST",
      headers: this._h({ "Prefer": "return=representation" }),
      body: JSON.stringify(dados)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); if (r.status === 401) this._err(r); throw new Error(e.message || "Erro " + r.status); }
    return r.json();
  },

  async update(tabela, filtro, dados) {
    const r = await fetch(SUPABASE_ADMIN_URL + "/rest/v1/" + tabela + "?" + filtro, {
      method: "PATCH",
      headers: this._h({ "Prefer": "return=minimal" }),
      body: JSON.stringify(dados)
    });
    if (!r.ok) { if (r.status === 401) this._err(r); const e = await r.json().catch(() => ({})); throw new Error(e.message || "Erro " + r.status); }
    return true;
  },

  async delete(tabela, filtro) {
    const r = await fetch(SUPABASE_ADMIN_URL + "/rest/v1/" + tabela + "?" + filtro, {
      method: "DELETE",
      headers: this._h()
    });
    if (!r.ok) { if (r.status === 401) this._err(r); const e = await r.json().catch(() => ({})); throw new Error(e.message || "Erro " + r.status); }
    return true;
  }
};

// ===== ESTADO =====

const state = {
  imoveis: [],
  leads: [],
  agendamentos: [],
  tabAtual: "imoveis",
  filtroStatus: "",
  filtroTipo: "",
  filtroStatusAgend: "",
  busca: "",
  buscaLead: "",
  filtroLeadDe: "",
  filtroLeadAte: "",
  editandoRef: null
};

// ===== NAVEGAÇÃO DE TELAS =====

function showScreen(nome) {
  ["login","setup","admin"].forEach(id => {
    document.getElementById("screen-" + id).style.display = nome === id ? "flex" : "none";
  });
}

function showTab(tab) {
  state.tabAtual = tab;
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.tab === tab));
  document.getElementById("tab-" + tab).style.display = "block";

  if (tab === "imoveis"      && state.imoveis.length === 0)      carregarImoveis();
  if (tab === "leads"        && state.leads.length === 0)        carregarLeads();
  if (tab === "agendamentos" && state.agendamentos.length === 0) carregarAgendamentos();
}

// ===== UTILITÁRIOS DE DATA =====

function parsePtBRDate(str) {
  const m = String(str || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

// ===== IMÓVEIS — CARREGAMENTO =====

async function carregarImoveis() {
  setLoading(true);
  try {
    window.dadosImoveis.invalidarCache();
    state.imoveis = await window.dadosImoveis.carregarImoveis();
    renderStats();
    renderImoveis();
  } catch (err) {
    showToast("Erro ao carregar imóveis: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function getImoveisFiltrados() {
  return state.imoveis.filter(im => {
    if (state.filtroStatus && im.status !== state.filtroStatus) return false;
    if (state.filtroTipo   && im.tipo   !== state.filtroTipo)   return false;
    if (state.busca) {
      const b = state.busca.toLowerCase();
      return (im.ref    || "").toLowerCase().includes(b) ||
             (im.titulo || "").toLowerCase().includes(b) ||
             (im.bairro || "").toLowerCase().includes(b);
    }
    return true;
  });
}

function getAgendamentosFiltrados() {
  const filtro = state.filtroStatusAgend;
  return state.agendamentos.filter(a => !filtro || a.status === filtro);
}

// ===== IMÓVEIS — STATS =====

function renderStats() {
  const t    = state.imoveis.length;
  const disp = state.imoveis.filter(i => i.status === "disponivel").length;
  const res  = state.imoveis.filter(i => i.status === "reservado").length;
  const vend = state.imoveis.filter(i => i.status === "vendido").length;
  const dest = state.imoveis.filter(i => i.destaque).length;
  const set  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-total", t);
  set("stat-disp",  disp);
  set("stat-reserv",res);
  set("stat-vend",  vend);
  set("stat-dest",  dest);
}

// ===== IMÓVEIS — LISTA =====

function renderImoveis() {
  const lista   = getImoveisFiltrados();
  const tbody   = document.getElementById("imoveis-tbody");
  const cards   = document.getElementById("imoveis-cards");
  const countEl = document.getElementById("imoveis-count");
  if (!tbody) return;

  const statusMap  = { disponivel: ["badge-green","Disponível"], reservado: ["badge-yellow","Reservado"], vendido: ["badge-red","Vendido"] };
  const totalLabel = `${lista.length} ${lista.length !== 1 ? "imóveis" : "imóvel"}`;
  if (countEl) countEl.textContent = totalLabel;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Nenhum imóvel encontrado</td></tr>`;
    if (cards) cards.innerHTML = `<p style="text-align:center;padding:40px 0;color:var(--gray-400);font-size:.85rem">Nenhum imóvel encontrado</p>`;
    return;
  }

  tbody.innerHTML = lista.map(im => {
    const [cls, label] = statusMap[im.status] || ["badge-gray", im.status];
    const destClass = im.destaque ? " active" : "";
    return `<tr>
      <td class="td-ref"><code>${im.ref || "—"}</code></td>
      <td class="td-titulo">${im.titulo || "—"}</td>
      <td class="td-tipo">${im.tipo || "—"}</td>
      <td><span class="badge ${cls}">${label}</span></td>
      <td class="td-preco">${im.preco ? fmtPreco(im.preco) : "—"}</td>
      <td class="td-star">
        <button class="btn-star${destClass}" title="${im.destaque ? "Remover destaque" : "Marcar destaque"}"
          onclick="toggleDestaque('${esc(im.ref)}', ${!im.destaque})">${im.destaque ? Icons.starOn : Icons.starOff}</button>
      </td>
      <td class="td-acoes">
        <button class="btn-sm btn-editar" onclick="abrirFormEditar('${esc(im.ref)}')" title="Editar">${Icons.edit}</button>
        <button class="btn-sm btn-duplicar" onclick="duplicarImovel('${esc(im.ref)}')" title="Duplicar">${Icons.copy}</button>
        <select class="sel-status" title="Mudar status"
          onchange="mudarStatus('${esc(im.ref)}', this.value)">
          <option value="disponivel"${im.status==="disponivel"?" selected":""}>Disponível</option>
          <option value="reservado"${im.status==="reservado"?" selected":""}>Reservado</option>
          <option value="vendido"${im.status==="vendido"?" selected":""}>Vendido</option>
        </select>
        <button class="btn-sm btn-deletar" title="Excluir"
          onclick="confirmarDeletar('${esc(im.ref)}','${esc(im.titulo)}')">  ${Icons.trash}</button>
      </td>
    </tr>`;
  }).join("");

  if (cards) {
    cards.innerHTML = lista.map(im => {
      const [cls, label] = statusMap[im.status] || ["badge-gray", im.status];
      const destClass = im.destaque ? " active" : "";
      return `<div class="admin-card">
        <div class="admin-card-head">
          <div class="admin-card-head-left">
            <code>${im.ref || "—"}</code>
            <span class="badge ${cls}">${label}</span>
            <button class="btn-star${destClass}" title="${im.destaque ? "Remover destaque" : "Marcar destaque"}"
              onclick="toggleDestaque('${esc(im.ref)}', ${!im.destaque})">${im.destaque ? Icons.starOn : Icons.starOff}</button>
          </div>
          <div class="admin-card-acoes">
            <button class="btn-sm btn-editar" onclick="abrirFormEditar('${esc(im.ref)}')" title="Editar">${Icons.edit}</button>
            <button class="btn-sm btn-duplicar" onclick="duplicarImovel('${esc(im.ref)}')" title="Duplicar">${Icons.copy}</button>
            <button class="btn-sm btn-deletar" title="Excluir"
              onclick="confirmarDeletar('${esc(im.ref)}','${esc(im.titulo)}')">${Icons.trash}</button>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="admin-card-titulo">${im.titulo || "—"}</div>
          <div class="admin-card-sub">${im.tipo || "—"} · ${im.finalidade || "—"} · 📍 ${im.bairro || "—"}, ${im.cidade || "—"}</div>
        </div>
        <div class="admin-card-foot">
          <span class="admin-card-preco">${im.preco ? fmtPreco(im.preco) : "—"}</span>
          <select class="sel-status" title="Mudar status"
            onchange="mudarStatus('${esc(im.ref)}', this.value)">
            <option value="disponivel"${im.status==="disponivel"?" selected":""}>Disponível</option>
            <option value="reservado"${im.status==="reservado"?" selected":""}>Reservado</option>
            <option value="vendido"${im.status==="vendido"?" selected":""}>Vendido</option>
          </select>
        </div>
      </div>`;
    }).join("");
  }
}

// ===== IMÓVEIS — AÇÕES RÁPIDAS =====

async function mudarStatus(ref, novoStatus) {
  try {
    await Api.update("imoveis", "ref=eq." + encodeURIComponent(ref), { status: novoStatus });
    const im = state.imoveis.find(i => i.ref === ref);
    if (im) im.status = novoStatus;
    renderImoveis(); renderStats();
    showToast("Status atualizado!", "success");
    window.dadosImoveis.invalidarCache();
  } catch { showToast("Erro de conexão", "error"); }
}

async function toggleDestaque(ref, novoDestaque) {
  try {
    await Api.update("imoveis", "ref=eq." + encodeURIComponent(ref), { destaque: novoDestaque });
    const im = state.imoveis.find(i => i.ref === ref);
    if (im) im.destaque = novoDestaque;
    renderImoveis(); renderStats();
    showToast(novoDestaque ? "Marcado como destaque!" : "Destaque removido!", "success");
    window.dadosImoveis.invalidarCache();
  } catch { showToast("Erro de conexão", "error"); }
}

function duplicarImovel(ref) {
  const im = state.imoveis.find(i => i.ref === ref);
  if (!im) return;
  state.editandoRef = null;
  document.getElementById("form-header-titulo").textContent = "Duplicar Imóvel";

  const form = document.getElementById("form-imovel");
  form.reset();
  if (fpDataVenda) fpDataVenda.clear();

  const campos = ["tipo","finalidade","status","bairro","cidade","estado",
    "preco","quartos","suites","banheiros","vagas","area_util","area_construida","area_terreno","descricao"];
  campos.forEach(c => {
    const el = form.querySelector(`[name="${c}"]`);
    if (el) el.value = im[c] ?? "";
  });

  const tituloEl = form.querySelector('[name="titulo"]');
  if (tituloEl) tituloEl.value = "Cópia — " + (im.titulo || "");

  const destEl = form.querySelector('[name="destaque"]');
  if (destEl) destEl.checked = false;

  form.querySelector('[name="ref"]').disabled = false;
  form.querySelector('[name="ref"]').value = "";

  const paths = Array.isArray(im.fotos) ? im.fotos.filter(Boolean)
    : (im.fotos ? String(im.fotos).split("\n").map(s => s.trim()).filter(Boolean) : []);
  setFotosFromPaths(paths);

  if (fpDataVenda) {
    if (im.data_venda) {
      fpDataVenda.setDate(im.data_venda, false);
      if (fpDataVenda.altInput) {
        const _p = fpDataVenda.parseDate(im.data_venda, "Y-m-d");
        fpDataVenda.altInput.value = _p
          ? fpDataVenda.formatDate(_p, fpDataVenda.config.altFormat)
          : "";
      }
    } else {
      fpDataVenda.clear();
    }
  }

  atualizarPreview();
  abrirDrawer();
}

async function confirmarDeletar(ref, titulo) {
  if (!confirm(`Excluir "${titulo}" (${ref})?\n\nEsta ação não pode ser desfeita.`)) return;
  try {
    await Api.delete("imoveis", "ref=eq." + encodeURIComponent(ref));
    state.imoveis = state.imoveis.filter(i => i.ref !== ref);
    renderImoveis(); renderStats();
    showToast("Imóvel excluído!", "success");
    window.dadosImoveis.invalidarCache();
  } catch { showToast("Erro de conexão", "error"); }
}

// ===== FOTOS — UPLOAD UI (Cloudinary) =====

const fotosState = { items: [] };

function abrirModalCloudinary() {
  const { cloud, preset } = Auth.getCloudinary();
  document.getElementById("modal-cloud-name").value   = cloud;
  document.getElementById("modal-cloud-preset").value = preset;
  document.getElementById("modal-cloudinary").style.display = "flex";
}

function fecharModalCloudinary() {
  document.getElementById("modal-cloudinary").style.display = "none";
}

function atualizarBadgeCloudinary() {
  const badge = document.getElementById("cloudinary-badge");
  if (!badge) return;
  const { cloud, preset } = Auth.getCloudinary();
  if (cloud && preset) {
    badge.textContent = "✓";
    badge.className   = "cloudinary-status ok";
  } else {
    badge.textContent = "—";
    badge.className   = "cloudinary-status nok";
  }
}

function initFotosUpload() {
  const btnAdd = document.getElementById("btn-add-foto");
  if (!btnAdd) return;

  btnAdd.addEventListener("click", () => {
    const { cloud, preset } = Auth.getCloudinary();
    if (!cloud || !preset) {
      showToast("Configure o Cloudinary antes de fazer upload", "error");
      abrirModalCloudinary();
      return;
    }

    const widget = cloudinary.createUploadWidget(
      {
        cloudName:    cloud,
        uploadPreset: preset,
        sources:      ["local", "camera", "url"],
        multiple:     true,
        resourceType: "auto",
        folder:       "magnus-imoveis",
        maxFileSize:  15000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"],
        styles: {
          palette: {
            window:          "#FFFFFF",
            windowBorder:    "#e2e6ed",
            tabIcon:         "#C9A22B",
            link:            "#C9A22B",
            action:          "#1a1a1a",
            inProgress:      "#C9A22B",
            complete:        "#16a34a",
            error:           "#dc2626",
            sourceBg:        "#f4f6fa"
          }
        }
      },
      (error, result) => {
        if (error) {
          showToast("Erro no upload: " + (error.statusText || "tente novamente"), "error");
          return;
        }
        if (result.event === "success") {
          const info    = result.info;
          const isVideo = info.resource_type === "video";
          fotosState.items.push({
            name:    info.original_filename + "." + info.format,
            preview: info.secure_url,
            path:    info.secure_url,
            isVideo
          });
          renderFotosList();
        }
      }
    );

    widget.open();
  });
}

function initFotosLink() {
  const btnLink    = document.getElementById("btn-add-link");
  const linkRow    = document.getElementById("fotos-link-row");
  const inputUrl   = document.getElementById("input-foto-url");
  const btnConfirm = document.getElementById("btn-confirmar-link");
  const btnCancel  = document.getElementById("btn-cancelar-link");
  if (!btnLink) return;
  btnLink.addEventListener("click", () => { linkRow.classList.add("show"); inputUrl.focus(); });
  btnCancel.addEventListener("click", () => { linkRow.classList.remove("show"); inputUrl.value = ""; });
  btnConfirm.addEventListener("click", () => {
    const url = inputUrl.value.trim();
    if (url) { addLinkItem(url); linkRow.classList.remove("show"); inputUrl.value = ""; }
  });
  inputUrl.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); btnConfirm.click(); }
    if (e.key === "Escape") btnCancel.click();
  });
}

function addLinkItem(url) {
  const isVideoExt = /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
  const isYoutube  = /youtube\.com\/watch|youtu\.be\//i.test(url);
  const isVimeo    = /vimeo\.com\//i.test(url);
  const isVideo    = isVideoExt || isYoutube || isVimeo;

  let preview = url;
  if (isYoutube) {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (m) preview = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  }

  const name = isYoutube ? "YouTube" : isVimeo ? "Vimeo" : (url.split("/").pop() || "link");
  fotosState.items.push({ name, preview, path: url, isVideo });
  renderFotosList();
}

function removeFoto(idx) {
  fotosState.items.splice(idx, 1);
  renderFotosList();
}

let _skipBrokenCheck = false;

function renderFotosList() {
  const list   = document.getElementById("fotos-list");
  const hidden = document.getElementById("fotos-hidden");
  if (!list || !hidden) return;
  if (!fotosState.items.length) {
    list.innerHTML = '<span class="fotos-empty">Nenhuma mídia adicionada</span>';
    hidden.value = "";
  } else {
    list.innerHTML = fotosState.items.map((f, i) => {
      const thumb = f.isVideo
        ? `<video src="${f.preview}" class="foto-video-thumb" muted preload="metadata"></video><span class="foto-badge-video">🎬</span>`
        : `<img src="${f.preview}" alt="${esc(f.name)}" onerror="this.closest('.foto-item').dataset.broken='1'">`;
      return `<div class="foto-item" data-idx="${i}">
        ${thumb}
        <span class="foto-name" title="${esc(f.name)}">${esc(f.name)}</span>
        <button type="button" class="foto-remove" onclick="removeFoto(${i})" title="Remover">✕</button>
      </div>`;
    }).join("");
    hidden.value = fotosState.items.map(f => f.path).join("\n");
    if (!_skipBrokenCheck) setTimeout(_removerFotosBroken, 3000);
  }
  atualizarPreview();
}

function _removerFotosBroken() {
  const broken = [...document.querySelectorAll(".foto-item[data-broken='1']")];
  if (!broken.length) return;
  const indices = broken
    .map(el => parseInt(el.dataset.idx))
    .filter(n => !isNaN(n))
    .sort((a, b) => b - a);
  _skipBrokenCheck = true;
  indices.forEach(i => { if (fotosState.items[i]) fotosState.items.splice(i, 1); });
  renderFotosList();
  _skipBrokenCheck = false;
  showToast(`${indices.length} imagem(ns) inválida(s) removida(s) automaticamente`, "info");
}

function setFotosFromPaths(paths) {
  fotosState.items = paths.map(p => ({ name: p.split("/").pop() || p, preview: p, path: p }));
  renderFotosList();
}

// ===== FORMULÁRIO — DRAWER =====

function abrirFormNovo() {
  state.editandoRef = null;
  document.getElementById("form-header-titulo").textContent = "Novo Imóvel";
  const form = document.getElementById("form-imovel");
  form.reset();
  if (fpDataVenda) fpDataVenda.clear();
  setFotosFromPaths([]);
  form.querySelector('[name="ref"]').disabled    = false;
  form.querySelector('[name="estado"]').value    = "MG";
  form.querySelector('[name="status"]').value    = "disponivel";
  form.querySelector('[name="finalidade"]').value = "";
  form.querySelector('[name="tipo"]').value       = "";
  atualizarPreview();
  abrirDrawer();
}

function abrirFormEditar(ref) {
  const im = state.imoveis.find(i => i.ref === ref);
  if (!im) return;
  state.editandoRef = ref;
  document.getElementById("form-header-titulo").textContent = "Editar Imóvel";

  const form = document.getElementById("form-imovel");
  const campos = ["ref","tipo","finalidade","status","titulo","bairro","cidade","estado",
    "preco","quartos","suites","banheiros","vagas","area_util","area_construida","area_terreno","descricao"];

  campos.forEach(c => {
    const el = form.querySelector(`[name="${c}"]`);
    if (el) el.value = im[c] ?? "";
  });

  const destEl = form.querySelector('[name="destaque"]');
  if (destEl) destEl.checked = !!im.destaque;

  const paths = Array.isArray(im.fotos) ? im.fotos.filter(Boolean) :
    (im.fotos ? String(im.fotos).split("\n").map(s => s.trim()).filter(Boolean) : []);
  setFotosFromPaths(paths);

  if (fpDataVenda) {
    if (im.data_venda) {
      fpDataVenda.setDate(im.data_venda, false);
      // Flatpickr usa debounce interno — força update imediato do altInput
      if (fpDataVenda.altInput) {
        const _p = fpDataVenda.parseDate(im.data_venda, "Y-m-d");
        fpDataVenda.altInput.value = _p
          ? fpDataVenda.formatDate(_p, fpDataVenda.config.altFormat)
          : "";
      }
    } else {
      fpDataVenda.clear();
    }
  }

  form.querySelector('[name="ref"]').disabled = true;
  atualizarPreview();
  abrirDrawer();
}

function abrirDrawer() {
  document.getElementById("form-drawer").classList.add("open");
  document.getElementById("drawer-overlay").classList.add("show");
}

function fecharDrawer() {
  document.getElementById("form-drawer").classList.remove("open");
  document.getElementById("drawer-overlay").classList.remove("show");
  state.editandoRef = null;
}

// ===== FORMULÁRIO — SALVAR =====

async function salvarImovel(e) {
  e.preventDefault();
  const form = e.target;

  const gStr = n => (form.querySelector(`[name="${n}"]`)?.value || "").trim();
  const gNum = n => {
    const v = gStr(n);
    if (v === "") return null;
    const parsed = parseFloat(v.replace(/[^\d.,]/g, "").replace(",", "."));
    return Math.round(isNaN(parsed) ? 0 : parsed);
  };

  const imovel = {
    ref:            state.editandoRef || gStr("ref"),
    tipo:           gStr("tipo"),
    finalidade:     gStr("finalidade"),
    status:         gStr("status") || "disponivel",
    titulo:         gStr("titulo"),
    bairro:         gStr("bairro"),
    cidade:         gStr("cidade"),
    estado:         gStr("estado") || "MG",
    preco:          gNum("preco"),
    quartos:        gNum("quartos"),
    suites:         gNum("suites"),
    banheiros:      gNum("banheiros"),
    vagas:          gNum("vagas"),
    area_util:      gNum("area_util"),
    area_construida: gNum("area_construida"),
    area_terreno:   gNum("area_terreno"),
    fotos:          gStr("fotos").split("\n").map(s => s.trim()).filter(Boolean),
    data_venda:     (fpDataVenda && fpDataVenda.selectedDates.length > 0)
                      ? fpDataVenda.formatDate(fpDataVenda.selectedDates[0], "Y-m-d")
                      : null,
    descricao:      gStr("descricao"),
    destaque:       form.querySelector('[name="destaque"]').checked
  };

  if (!imovel.ref)        return showToast("Referência obrigatória", "error");
  if (!imovel.tipo)       return showToast("Tipo obrigatório", "error");
  if (!imovel.finalidade) return showToast("Finalidade obrigatória", "error");
  if (!imovel.titulo)     return showToast("Título obrigatório", "error");
  if (!imovel.bairro)     return showToast("Bairro obrigatório", "error");
  if (!imovel.cidade)     return showToast("Cidade obrigatória", "error");
  if (!imovel.preco)      return showToast("Preço obrigatório", "error");

  const btn = form.querySelector(".btn-salvar");
  btn.disabled = true; btn.textContent = "Salvando…";

  try {
    const refEditando = state.editandoRef; // captura ANTES de fecharDrawer() zerar

    if (refEditando) {
      // Edição: PATCH filtrando por ref (ref não entra no corpo para não tentar atualizá-lo)
      const { ref: _ref, ...camposEditar } = imovel;
      await Api.update("imoveis", "ref=eq." + encodeURIComponent(refEditando), camposEditar);
    } else {
      // Criação: POST com todos os campos
      await Api.insert("imoveis", imovel);
    }

    showToast(refEditando ? "Imóvel atualizado!" : "Imóvel criado!", "success");
    fecharDrawer();

    // Atualiza estado local imediatamente (sem aguardar cache expirar)
    if (refEditando) {
      const idx = state.imoveis.findIndex(i => i.ref === refEditando);
      if (idx !== -1) state.imoveis[idx] = Object.assign({}, state.imoveis[idx], imovel);
      else            state.imoveis.push(imovel);
    } else {
      state.imoveis.push(imovel);
    }
    renderImoveis();

  } catch (err) {
    showToast("Erro de conexão: " + err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Salvar imóvel";
  }
}

// ===== PREVIEW DO CARD =====

function atualizarPreview() {
  const form = document.getElementById("form-imovel");
  if (!form) return;
  const g = n => {
    const el = form.querySelector(`[name="${n}"]`);
    return el ? (el.type === "checkbox" ? el.checked : el.value) : "";
  };

  const tipo      = g("tipo") || "Tipo";
  const titulo    = g("titulo") || "Título do imóvel";
  const bairro    = g("bairro") || "Bairro";
  const cidade    = g("cidade") || "Cidade";
  const preco     = g("preco") ? fmtPreco(Number(g("preco")) || 0) : "R$ 0";
  const quartos   = g("quartos");
  const vagas     = g("vagas");
  const area      = g("area_util");
  const finalidade = (g("finalidade") || "VENDA").toUpperCase();
  const destaque  = g("destaque");

  const fotosRaw = fotosState.items
    .filter(f => !(f.isVideo && f.preview.startsWith("blob:")))
    .map(f => f.preview || f.path).filter(Boolean);
  const imgSrc    = fotosRaw[0] ||
    `images/${tipo.toLowerCase().includes("casa") ? "casa" :
      tipo.toLowerCase().includes("apartamento") ? "apartamento" : "terreno"}.jpg`;

  const pc = document.getElementById("preview-card");
  if (!pc) return;
  pc.innerHTML = `
    <div class="pc-img" style="background-image:url('${imgSrc}')">
      <span class="pc-badge">${finalidade}</span>
      ${destaque ? '<span class="pc-dest">★ Destaque</span>' : ""}
    </div>
    <div class="pc-body">
      <div class="pc-tipo">${tipo}</div>
      <div class="pc-titulo">${titulo}</div>
      <div class="pc-loc">📍 ${bairro}, ${cidade}</div>
      <div class="pc-specs">
        ${quartos ? `🛏 ${quartos}` : ""}
        ${vagas   ? `🚗 ${vagas}`   : ""}
        ${area    ? `📐 ${area}m²`  : ""}
      </div>
      <div class="pc-preco">${preco}</div>
    </div>`;
}

// ===== LEADS =====

function getLeadsFiltrados() {
  const b = state.buscaLead.toLowerCase();
  let lista = state.leads.filter(l => !b ||
    (l.nome     || "").toLowerCase().includes(b) ||
    (l.telefone || "").includes(b) ||
    (l.ref_imovel || "").toLowerCase().includes(b));

  if (state.filtroLeadDe || state.filtroLeadAte) {
    const de  = state.filtroLeadDe  ? new Date(state.filtroLeadDe  + "T00:00:00") : null;
    const ate = state.filtroLeadAte ? new Date(state.filtroLeadAte + "T23:59:59") : null;
    lista = lista.filter(l => {
      const d = parsePtBRDate(l.data);
      if (!d) return true;
      if (de  && d < de)  return false;
      if (ate && d > ate) return false;
      return true;
    });
  }

  return lista;
}

async function carregarLeads() {
  setLoading(true);
  try {
    const rows = await Api.select("leads", "select=*&order=criado_em.desc");
    state.leads = rows.map(l => ({
      ...l,
      // Normaliza campo de data para o formato esperado pelo renderLeads e getLeadsFiltrados
      data: l.criado_em ? new Date(l.criado_em).toLocaleString("pt-BR") : "—"
    }));
    renderLeads();
  } catch (err) {
    showToast("Erro ao carregar leads: " + err.message, "error");
  } finally { setLoading(false); }
}

function renderLeads() {
  const lista   = getLeadsFiltrados();
  const tbody   = document.getElementById("leads-tbody");
  const cards   = document.getElementById("leads-cards");
  const countEl = document.getElementById("leads-count");
  if (countEl) countEl.textContent = `${lista.length} lead${lista.length !== 1 ? "s" : ""}`;
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">Nenhum lead encontrado</td></tr>`;
    if (cards) cards.innerHTML = `<p style="text-align:center;padding:40px 0;color:var(--gray-400);font-size:.85rem">Nenhum lead encontrado</p>`;
    return;
  }

  tbody.innerHTML = lista.map(l => {
    const waNum = (l.telefone || "").replace(/\D/g,"");
    return `<tr>
      <td class="td-data">${l.data || "—"}</td>
      <td class="td-nome">${l.nome || "—"}</td>
      <td>${waNum
        ? `<a href="https://wa.me/55${waNum}" target="_blank" class="link-wa">${fmtTelefone(l.telefone)}</a>`
        : (l.telefone || "—")}</td>
      <td>${l.email || "—"}</td>
      <td>${l.interesse || "—"}</td>
      <td><code>${l.ref_imovel || "—"}</code></td>
      <td>${l.vendedor || "—"}</td>
      <td><span class="badge badge-gray">${l.origem || "site"}</span></td>
    </tr>`;
  }).join("");

  if (cards) {
    cards.innerHTML = lista.map(l => {
      const waNum = (l.telefone || "").replace(/\D/g,"");
      return `<div class="admin-card">
        <div class="admin-card-head">
          <span class="admin-card-nome">${l.nome || "—"}</span>
          <span class="admin-card-data">${l.data || "—"}</span>
        </div>
        <div class="admin-card-body">
          ${waNum
            ? `<div><a href="https://wa.me/55${waNum}" target="_blank" class="link-wa">📱 ${fmtTelefone(l.telefone)}</a></div>`
            : `<div>${l.telefone || "—"}</div>`}
          ${l.email ? `<div class="admin-card-info">✉️ ${l.email}</div>` : ""}
          <div class="admin-card-info">Interesse: ${l.interesse || "—"}</div>
          <div class="admin-card-info">Imóvel: <code>${l.ref_imovel || "—"}</code></div>
          <div class="admin-card-info">Vendedor: ${l.vendedor || "—"}</div>
          <div style="margin-top:2px"><span class="badge badge-gray">${l.origem || "site"}</span></div>
        </div>
      </div>`;
    }).join("");
  }
}

// ===== AGENDAMENTOS =====

async function carregarAgendamentos() {
  setLoading(true);
  try {
    const rows = await Api.select("agendamentos", "select=*&order=criado_em.desc");
    state.agendamentos = rows.map(a => ({
      ...a,
      // Normaliza campos para compatibilidade com renderAgendamentos
      data_criacao: a.criado_em ? new Date(a.criado_em).toLocaleString("pt-BR") : "—",
      data: a.data_visita  // renderAgendamentos usa a.data para a data da visita
    }));
    renderAgendamentos();
  } catch (err) {
    showToast("Erro ao carregar agendamentos: " + err.message, "error");
  } finally { setLoading(false); }
}

function renderAgendamentos() {
  const lista   = getAgendamentosFiltrados();
  const tbody   = document.getElementById("agend-tbody");
  const cards   = document.getElementById("agend-cards");
  const countEl = document.getElementById("agend-count");
  if (countEl) countEl.textContent = `${lista.length} agendamento${lista.length !== 1 ? "s" : ""}`;
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-row">Nenhum agendamento encontrado</td></tr>`;
    if (cards) cards.innerHTML = `<p style="text-align:center;padding:40px 0;color:var(--gray-400);font-size:.85rem">Nenhum agendamento encontrado</p>`;
    return;
  }

  const statusMap = {
    pendente:   ["badge-yellow","Pendente"],
    confirmado: ["badge-green","Confirmado"],
    realizado:  ["badge-blue","Realizado"],
    cancelado:  ["badge-red","Cancelado"]
  };

  const _acoes = a => {
    const waNum = (a.telefone || "").replace(/\D/g,"");
    if (a.status === "pendente") return `
      <button class="btn-sm btn-confirmar" title="Confirmar"
        onclick="atualizarStatusAgend(${a.id},'confirmado','${esc(a.nome)}','${a.data}','${a.horario}','${waNum}')">${Icons.check}</button>
      <button class="btn-sm btn-cancelar" title="Cancelar"
        onclick="atualizarStatusAgend(${a.id},'cancelado','${esc(a.nome)}','${a.data}','${a.horario}','${waNum}')">${Icons.xMark}</button>`;
    if (a.status === "confirmado") return `
      <button class="btn-sm btn-realizado" title="Marcar realizado"
        onclick="atualizarStatusAgend(${a.id},'realizado','${esc(a.nome)}','${a.data}','${a.horario}','')">${Icons.flag}</button>
      <button class="btn-sm btn-cancelar" title="Cancelar"
        onclick="atualizarStatusAgend(${a.id},'cancelado','${esc(a.nome)}','${a.data}','${a.horario}','${waNum}')">${Icons.xMark}</button>`;
    return "";
  };

  tbody.innerHTML = lista.map(a => {
    const [cls, label] = statusMap[a.status] || ["badge-gray", a.status];
    const dataFmt = a.data ? new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    const waNum   = (a.telefone || "").replace(/\D/g,"");
    return `<tr>
      <td class="td-data">${a.data_criacao || "—"}</td>
      <td class="td-nome">${a.nome || "—"}</td>
      <td>${waNum
        ? `<a href="https://wa.me/55${waNum}" target="_blank" class="link-wa">${fmtTelefone(a.telefone)}</a>`
        : (a.telefone || "—")}</td>
      <td>${a.email || "—"}</td>
      <td>${dataFmt} ${a.horario ? a.horario.replace(":","h") : ""}</td>
      <td>${a.tipo_visita || "—"}</td>
      <td><code>${a.ref_imovel || "—"}</code></td>
      <td>${a.vendedor || "—"}</td>
      <td><span class="badge ${cls}">${label}</span></td>
      <td class="td-acoes-agend">${_acoes(a)}</td>
    </tr>`;
  }).join("");

  if (cards) {
    cards.innerHTML = lista.map(a => {
      const [cls, label] = statusMap[a.status] || ["badge-gray", a.status];
      const dataFmt = a.data ? new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
      const waNum   = (a.telefone || "").replace(/\D/g,"");
      return `<div class="admin-card">
        <div class="admin-card-head">
          <div class="admin-card-head-left">
            <span class="admin-card-nome">${a.nome || "—"}</span>
            <span class="badge ${cls}">${label}</span>
          </div>
          <div class="admin-card-acoes">${_acoes(a)}</div>
        </div>
        <div class="admin-card-body">
          ${waNum
            ? `<div><a href="https://wa.me/55${waNum}" target="_blank" class="link-wa">📱 ${fmtTelefone(a.telefone)}</a></div>`
            : `<div>${a.telefone || "—"}</div>`}
          ${a.email ? `<div class="admin-card-info">✉️ ${a.email}</div>` : ""}
          <div class="admin-card-info">📅 ${dataFmt}${a.horario ? " · " + a.horario.replace(":","h") : ""}</div>
          <div class="admin-card-info">Imóvel: <code>${a.ref_imovel || "—"}</code> · ${a.tipo_visita || "Presencial"}</div>
          <div class="admin-card-info">Vendedor: ${a.vendedor || "—"}</div>
        </div>
        <div class="admin-card-foot">
          <span class="admin-card-data">Solicitado: ${a.data_criacao || "—"}</span>
        </div>
      </div>`;
    }).join("");
  }
}

async function atualizarStatusAgend(id, novoStatus, nome, data, horario, waNum) {
  try {
    await Api.update("agendamentos", "id=eq." + id, { status: novoStatus });
    const a = state.agendamentos.find(ag => ag.id === id);
    if (a) a.status = novoStatus;
    renderAgendamentos();
    showToast("Status atualizado!", "success");

    // Abre WhatsApp para notificar o cliente
    if (waNum && (novoStatus === "confirmado" || novoStatus === "cancelado")) {
      const dataFmt = data ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR") : "";
      const hora    = (horario || "").replace(":","h");
      const msg     = novoStatus === "confirmado"
        ? `Olá ${nome}! Sua visita foi *confirmada* para ${dataFmt} às ${hora}. Contamos com sua presença! — Magnus Imóveis`
        : `Olá ${nome}! Infelizmente precisamos *cancelar* sua visita de ${dataFmt}. Entre em contato para reagendar. — Magnus Imóveis`;
      setTimeout(() => window.open(`https://wa.me/55${waNum}?text=${encodeURIComponent(msg)}`, "_blank"), 400);
    }
  } catch { showToast("Erro de conexão", "error"); }
}

// ===== TOAST =====

function showToast(msg, tipo) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast toast-" + (tipo || "info") + " show";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3500);
}

// ===== LOADING =====

function setLoading(v) {
  const el = document.getElementById("loading-overlay");
  if (el) el.style.display = v ? "flex" : "none";
}

// ===== EXPORTAÇÃO PDF =====

function _pdfCabecalho(doc, titulo, filtroTexto, totalTexto) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("MAGNUS IMOVEIS", 12, 10);
  doc.setTextColor(201, 162, 43);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CRECI 32.402", 12, 17);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, W - 12, 10, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), W - 12, 17, { align: "right" });
  doc.setDrawColor(201, 162, 43);
  doc.setLineWidth(0.8);
  doc.line(0, 24, W, 24);

  let y = 31;
  if (filtroTexto) {
    doc.setTextColor(90, 100, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(filtroTexto, 12, y);
    y += 6;
  }
  if (totalTexto) {
    doc.setTextColor(50, 60, 80);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(totalTexto, 12, y);
    doc.setFont("helvetica", "normal");
    y += 7;
  }
  return y;
}

function _pdfRodape(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(12, H - 12, W - 12, H - 12);
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Magnus Imoveis  |  CRECI 32.402  |  magnusimoveisbh@hotmail.com  |  (31) 3321-6775", 12, H - 7);
    doc.text(i + " / " + pages, W - 12, H - 7, { align: "right" });
  }
}

function exportarLeadsPDF() {
  if (!window.jspdf) return showToast("Biblioteca PDF não carregada. Verifique sua conexão.", "error");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const lista = getLeadsFiltrados();
  const partes = [];
  if (state.filtroLeadDe || state.filtroLeadAte) {
    const de  = state.filtroLeadDe  ? new Date(state.filtroLeadDe  + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    const ate = state.filtroLeadAte ? new Date(state.filtroLeadAte + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    partes.push("Periodo: " + de + " a " + ate);
  }
  if (state.buscaLead) partes.push('Busca: "' + state.buscaLead + '"');

  const y = _pdfCabecalho(
    doc, "Relatorio de Leads",
    partes.join("   |   ") || null,
    "Total: " + lista.length + " lead" + (lista.length !== 1 ? "s" : "")
  );

  doc.autoTable({
    startY: y,
    head: [["Data", "Nome", "WhatsApp", "E-mail", "Interesse", "Imovel", "Vendedor", "Origem"]],
    body: lista.map(l => [
      l.data || "—",
      l.nome || "—",
      fmtTelefone(l.telefone),
      l.email || "—",
      l.interesse || "—",
      l.ref_imovel || "—",
      l.vendedor || "—",
      l.origem || "site"
    ]),
    styles:             { fontSize: 8, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }, overflow: "linebreak" },
    headStyles:         { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 0: { cellWidth: 32 }, 2: { cellWidth: 28 }, 3: { cellWidth: 36 }, 5: { cellWidth: 22 }, 6: { cellWidth: 26 }, 7: { cellWidth: 16 } }
  });

  _pdfRodape(doc);
  doc.save("magnus-leads-" + new Date().toISOString().slice(0, 10) + ".pdf");
  showToast("PDF gerado com sucesso!", "success");
}

function exportarImoveisPDF() {
  if (!window.jspdf) return showToast("Biblioteca PDF não carregada. Verifique sua conexão.", "error");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const lista = getImoveisFiltrados();
  const partes = [];
  if (state.filtroStatus) partes.push("Status: " + state.filtroStatus);
  if (state.filtroTipo)   partes.push("Tipo: " + state.filtroTipo);
  if (state.busca)        partes.push('Busca: "' + state.busca + '"');

  const y = _pdfCabecalho(
    doc, "Relatorio de Imoveis",
    partes.join("   |   ") || null,
    "Total: " + lista.length + " " + (lista.length !== 1 ? "imoveis" : "imovel")
  );

  const statusLabel = { disponivel: "Disponivel", reservado: "Reservado", vendido: "Vendido" };

  doc.autoTable({
    startY: y,
    head: [["Ref", "Titulo", "Tipo", "Finalidade", "Status", "Preco", "Bairro", "Cidade", "Destaque"]],
    body: lista.map(im => [
      im.ref    || "—",
      im.titulo || "—",
      im.tipo   || "—",
      im.finalidade || "—",
      statusLabel[im.status] || im.status || "—",
      im.preco ? fmtPreco(im.preco) : "—",
      im.bairro || "—",
      im.cidade || "—",
      im.destaque ? "Sim" : "Nao"
    ]),
    styles:             { fontSize: 8, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }, overflow: "linebreak" },
    headStyles:         { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 60 }, 2: { cellWidth: 24 }, 3: { cellWidth: 22 }, 4: { cellWidth: 22 }, 5: { cellWidth: 32 }, 8: { cellWidth: 16 } }
  });

  _pdfRodape(doc);
  doc.save("magnus-imoveis-" + new Date().toISOString().slice(0, 10) + ".pdf");
  showToast("PDF gerado com sucesso!", "success");
}

function exportarAgendamentosPDF() {
  if (!window.jspdf) return showToast("Biblioteca PDF não carregada. Verifique sua conexão.", "error");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const lista = getAgendamentosFiltrados();
  const filtroTexto = state.filtroStatusAgend ? "Status: " + state.filtroStatusAgend : null;

  const y = _pdfCabecalho(
    doc, "Relatorio de Agendamentos",
    filtroTexto,
    "Total: " + lista.length + " agendamento" + (lista.length !== 1 ? "s" : "")
  );

  const statusLabel = { pendente: "Pendente", confirmado: "Confirmado", realizado: "Realizado", cancelado: "Cancelado" };

  doc.autoTable({
    startY: y,
    head: [["Solicitado em", "Cliente", "WhatsApp", "E-mail", "Data Visita", "Horario", "Tipo", "Imovel", "Vendedor", "Status"]],
    body: lista.map(a => {
      const dataFmt = a.data ? new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
      return [
        a.data_criacao || "—",
        a.nome || "—",
        fmtTelefone(a.telefone),
        a.email || "—",
        dataFmt,
        a.horario ? a.horario.replace(":", "h") : "—",
        a.tipo_visita || "—",
        a.ref_imovel  || "—",
        a.vendedor    || "—",
        statusLabel[a.status] || a.status || "—"
      ];
    }),
    styles:             { fontSize: 8, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }, overflow: "linebreak" },
    headStyles:         { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 26 }, 3: { cellWidth: 32 }, 4: { cellWidth: 20 }, 5: { cellWidth: 14 }, 7: { cellWidth: 18 }, 8: { cellWidth: 24 }, 9: { cellWidth: 18 } }
  });

  _pdfRodape(doc);
  doc.save("magnus-agendamentos-" + new Date().toISOString().slice(0, 10) + ".pdf");
  showToast("PDF gerado com sucesso!", "success");
}

// ===== INICIALIZAÇÃO =====

async function init() {
  if (!Auth.isSetupDone()) { showScreen("setup"); return; }
  if (!Auth.isAuthenticated()) { showScreen("login"); return; }
  showScreen("admin");
  showTab("imoveis");
  atualizarBadgeCloudinary();
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  // ── Setup ──
  document.getElementById("form-setup").addEventListener("submit", async e => {
    e.preventDefault();
    const senha      = document.getElementById("setup-senha").value;
    const confirmar  = document.getElementById("setup-confirmar").value;
    const token      = document.getElementById("setup-token").value.trim();
    const cloudName  = document.getElementById("setup-cloud-name").value.trim();
    const cloudPreset= document.getElementById("setup-cloud-preset").value.trim();

    if (senha !== confirmar) return showToast("Senhas não conferem", "error");
    if (senha.length < 6)    return showToast("Senha muito curta (mín. 6 caracteres)", "error");
    if (!token)              return showToast("Service Role Key obrigatória", "error");

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Salvando…";
    await Auth.setup(senha, token, cloudName, cloudPreset);
    showToast("Configuração salva! Faça login.", "success");
    setTimeout(() => showScreen("login"), 1200);
    btn.disabled = false; btn.textContent = "Salvar configuração";
  });

  // ── Modal Cloudinary ──
  document.getElementById("btn-config-cloudinary").addEventListener("click", abrirModalCloudinary);
  document.getElementById("btn-fechar-cloudinary").addEventListener("click", fecharModalCloudinary);
  document.getElementById("modal-cloudinary").addEventListener("click", e => {
    if (e.target === e.currentTarget) fecharModalCloudinary();
  });
  document.getElementById("btn-salvar-cloudinary").addEventListener("click", () => {
    const cloud  = document.getElementById("modal-cloud-name").value.trim();
    const preset = document.getElementById("modal-cloud-preset").value.trim();
    if (!cloud || !preset) return showToast("Preencha os dois campos", "error");
    Auth.saveCloudinary(cloud, preset);
    atualizarBadgeCloudinary();
    fecharModalCloudinary();
    showToast("Cloudinary configurado com sucesso!", "success");
  });

  // ── Login ──
  document.getElementById("form-login").addEventListener("submit", async e => {
    e.preventDefault();
    const senhaEl = document.getElementById("login-senha");
    const btn     = e.target.querySelector("button[type=submit]");
    btn.disabled  = true; btn.textContent = "Entrando…";

    const ok = await Auth.login(senhaEl.value);
    if (ok) {
      showScreen("admin");
      showTab("imoveis");
    } else {
      showToast("Senha incorreta", "error");
      senhaEl.value = "";
      senhaEl.focus();
    }
    btn.disabled = false; btn.textContent = "Entrar";
  });

  document.getElementById("link-redefinir").addEventListener("click", e => {
    e.preventDefault();
    if (confirm("Redefinir configurações do painel?\n\nVocê precisará configurar senha e token novamente.")) {
      Auth.resetSetup();
      showScreen("setup");
    }
  });

  // ── Logout ──
  document.getElementById("btn-sair").addEventListener("click", () => {
    if (confirm("Deseja sair do painel?")) Auth.logout();
  });

  // ── Tabs (sidebar + mobile nav) ──
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach(btn => {
    if (btn.dataset.tab) btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
  const btnConfigMobile = document.getElementById("btn-config-cloudinary-mobile");
  if (btnConfigMobile) btnConfigMobile.addEventListener("click", abrirModalCloudinary);
  const btnSairMobile = document.getElementById("btn-sair-mobile");
  if (btnSairMobile) btnSairMobile.addEventListener("click", () => {
    if (confirm("Deseja sair do painel?")) Auth.logout();
  });

  // ── Imóveis ──
  document.getElementById("btn-novo-imovel").addEventListener("click", abrirFormNovo);
  document.getElementById("btn-refresh-imoveis").addEventListener("click", carregarImoveis);
  document.getElementById("btn-export-imoveis").addEventListener("click", exportarImoveisPDF);

  document.getElementById("busca-imovel").addEventListener("input", e => {
    state.busca = e.target.value;
    renderImoveis();
  });
  document.getElementById("filtro-status").addEventListener("change", e => {
    state.filtroStatus = e.target.value;
    renderImoveis();
  });
  document.getElementById("filtro-tipo").addEventListener("change", e => {
    state.filtroTipo = e.target.value;
    renderImoveis();
  });

  // ── Formulário ──
  initFotosUpload();
  initFotosLink();
  if (typeof flatpickr !== "undefined") {
    fpDataVenda = flatpickr('[name="data_venda"]', {
      locale: FP_LOCALE,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      disableMobile: false,
    });

    fpLeadDe = flatpickr('#filtro-lead-de', {
      locale: FP_LOCALE,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      disableMobile: false,
      allowInput: false,
      onChange(selectedDates, dateStr) {
        state.filtroLeadDe = dateStr;
        renderLeads();
      }
    });

    fpLeadAte = flatpickr('#filtro-lead-ate', {
      locale: FP_LOCALE,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      disableMobile: false,
      allowInput: false,
      onChange(selectedDates, dateStr) {
        state.filtroLeadAte = dateStr;
        renderLeads();
      }
    });
  }
  document.getElementById("form-imovel").addEventListener("submit", salvarImovel);
  document.getElementById("btn-fechar-drawer").addEventListener("click", fecharDrawer);
  document.getElementById("drawer-overlay").addEventListener("click", fecharDrawer);
  document.getElementById("form-imovel").addEventListener("input",  atualizarPreview);
  document.getElementById("form-imovel").addEventListener("change", atualizarPreview);

  // ── Leads ──
  document.getElementById("busca-lead").addEventListener("input", e => {
    state.buscaLead = e.target.value;
    renderLeads();
  });
  document.getElementById("btn-refresh-leads").addEventListener("click", carregarLeads);
  document.getElementById("btn-export-leads").addEventListener("click", exportarLeadsPDF);

  // ── Agendamentos ──
  document.getElementById("filtro-status-agend").addEventListener("change", e => {
    state.filtroStatusAgend = e.target.value;
    renderAgendamentos();
  });
  document.getElementById("btn-refresh-agend").addEventListener("click", carregarAgendamentos);
  document.getElementById("btn-export-agend").addEventListener("click", exportarAgendamentosPDF);
});
