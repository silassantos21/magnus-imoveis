// ===== CONFIGURAÇÃO =====
// Apps Script: usado APENAS para enviar email ao corretor e criar evento no Calendar.
// Após simplificar o apps-script.js e republicar, cole a nova URL aqui.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn31FIreCa2vrdXxFgJOeJrBs-am1b2JGP5TSrHZ9rnvFhxRulrY948XM-A5UAmMhr/exec";

// Supabase — cole os mesmos valores de dados.js:
const _SB_URL  = "https://pwdwpcqpiodbotqmrfxq.supabase.co";  // só o domínio — sem /rest/v1/
const _SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZHdwY3FwaW9kYm90cW1yZnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjY2NDYsImV4cCI6MjA5OTM0MjY0Nn0.amY3RTm5b9TSfOqpi1kAf_vcPecfRWbGmkW-7SdpMo4";         // "anon public" key

const WA_NUM = "5531999845813";
const DEBOUNCE_MS = 10000; // 10s anti-spam

let _imovelAtivo = null;
let _leadDebounce = false;
let _agendDebounce = false;
let _dpDisplay = null;

// ===== UTILITÁRIOS =====
function _maskTel(input) {
  let v = input.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d+)$/, "($1) $2-$3");
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d+)$/, "($1) $2");
  input.value = v;
}

function _fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = "none"; document.body.style.overflow = ""; }
}

function _setEstado(formId, estado, html) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll(".form-feedback").forEach(el => el.remove());
  const btn = form.querySelector(".form-submit");

  if (estado === "loading") {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-inline"></span>Enviando...`;
  } else if (estado === "sucesso") {
    form.style.display = "none";
    const div = document.createElement("div");
    div.className = "form-feedback sucesso";
    div.innerHTML = html;
    form.parentNode.insertBefore(div, form.nextSibling);
  } else if (estado === "erro") {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label;
    const div = document.createElement("div");
    div.className = "form-feedback erro";
    div.innerHTML = html;
    form.prepend(div);
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label;
  }
}

// Insere lead ou agendamento no Supabase (retorna resposta legível)
async function _sbInsert(tabela, dados) {
  const r = await fetch(_SB_URL + "/rest/v1/" + tabela, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": _SB_ANON,
      "Authorization": "Bearer " + _SB_ANON
    },
    body: JSON.stringify(dados)
  });
  if (!r.ok) throw new Error("Supabase " + r.status);
}

// Notifica o corretor via Apps Script (email + Calendar) — fire and forget
function _notificarAppsScript(tipo, payload) {
  if (!APPS_SCRIPT_URL) return;
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(Object.assign({ tipo }, payload))
  }).catch(() => {});
}

// ===== MODAL: TENHO INTERESSE =====
function openModalLead(im) {
  _imovelAtivo = im;
  if (!document.getElementById("modal-lead")) _criarModalLead();

  const form = document.getElementById("form-lead");
  form.style.display = "";
  form.reset();
  form.querySelectorAll(".form-feedback").forEach(el => el.remove());
  const btn = form.querySelector(".form-submit");
  if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }

  const campo = document.getElementById("lead-imovel");
  if (campo && im) campo.value = `${im.ref} — ${im.titulo || im.tipo + " em " + im.bairro}`;

  const modal = document.getElementById("modal-lead");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => document.getElementById("lead-nome")?.focus());
}

function _criarModalLead() {
  const modal = document.createElement("div");
  modal.id = "modal-lead";
  modal.className = "modal-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-box modal-form-box">
      <button class="modal-close" id="modal-lead-close" aria-label="Fechar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="modal-form-header">
        <div class="modal-form-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </div>
        <div>
          <h3>Tenho Interesse</h3>
        </div>
      </div>
      <form id="form-lead" novalidate>
        <div class="form-group">
          <label for="lead-nome">Seu nome *</label>
          <input type="text" id="lead-nome" name="nome" placeholder="Nome completo" required autocomplete="name">
        </div>
        <div class="form-group">
          <label for="lead-tel">WhatsApp *</label>
          <input type="tel" id="lead-tel" name="telefone" placeholder="(31) 99999-9999" required autocomplete="tel">
        </div>
        <div class="form-group">
          <label for="lead-interesse">Interesse</label>
          <select id="lead-interesse" name="interesse">
            <option value="Comprar">Quero comprar</option>
            <option value="Alugar">Quero alugar</option>
            <option value="Mais informações">Mais informações</option>
            <option value="Visita">Agendar uma visita</option>
          </select>
        </div>
        <div class="form-group">
          <label for="lead-imovel">Imóvel de interesse</label>
          <input type="text" id="lead-imovel" name="imovel" readonly class="form-input-readonly">
        </div>
        <button type="submit" class="form-submit" data-label="Enviar interesse">Enviar interesse</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("modal-lead-close").addEventListener("click", () => _fecharModal("modal-lead"));
  modal.addEventListener("click", e => { if (e.target === modal) _fecharModal("modal-lead"); });
  document.getElementById("lead-tel").addEventListener("input", e => _maskTel(e.target));

  document.getElementById("form-lead").addEventListener("submit", async e => {
    e.preventDefault();
    if (_leadDebounce) return;
    const form = e.target;
    const nome = form.nome.value.trim();
    const tel = form.telefone.value.trim();

    if (!nome) { _setEstado("form-lead", "erro", "Preencha seu <strong>nome</strong>."); return; }
    if (tel.replace(/\D/g, "").length < 10) { _setEstado("form-lead", "erro", "Número de <strong>WhatsApp inválido</strong>."); return; }

    const payload = {
      tipo: "lead",
      nome,
      telefone: tel.replace(/\D/g, ""),
      interesse: form.interesse.value,
      ref_imovel: _imovelAtivo?.ref || "",
      origem: "site"
    };

    _setEstado("form-lead", "loading");
    _leadDebounce = true;
    setTimeout(() => { _leadDebounce = false; }, DEBOUNCE_MS);

    try {
      await _sbInsert("leads", {
        nome:      payload.nome,
        telefone:  payload.telefone,
        interesse: payload.interesse,
        ref_imovel: payload.ref_imovel,
        origem:    "site"
      });
      _notificarAppsScript("notificar_lead", payload);
      if (typeof trackLeadFormSubmit === "function") trackLeadFormSubmit(payload.ref_imovel);
      _setEstado("form-lead", "sucesso", `
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div><h4>Interesse enviado!</h4><p>Recebemos sua solicitação. Em breve um corretor entrará em contato pelo WhatsApp.</p></div>`);
    } catch {
      _fallbackLeadWA(payload, tel);
    }
  });
}

function _fallbackLeadWA(p, tel) {
  const msg = `Olá! Tenho interesse no imóvel ${p.ref_imovel || ""}.\n\nMeu nome: ${p.nome}\nInteresse: ${p.interesse}`;
  window.open(`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`, "_blank");
  _setEstado("form-lead", "sucesso", `
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <div><h4>WhatsApp aberto!</h4><p>Uma conversa com nosso corretor foi aberta com seus dados pré-preenchidos.</p></div>`);
}

// ===== MODAL: AGENDAR VISITA =====
function openModalAgendamento(im) {
  _imovelAtivo = im;
  if (!document.getElementById("modal-agendar")) _criarModalAgendamento();

  const form = document.getElementById("form-agendar");
  form.style.display = "";
  form.reset();
  if (_dpDisplay) { _dpDisplay.querySelector("span").textContent = "Selecione a data"; _dpDisplay.classList.remove("has-value"); }
  form.querySelectorAll(".form-feedback").forEach(el => el.remove());
  const btn = form.querySelector(".form-submit");
  if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }

  const refEl = document.getElementById("agenda-ref");
  const tituloEl = document.getElementById("agenda-titulo");
  if (refEl && im) refEl.value = im.ref;
  if (tituloEl && im) tituloEl.value = im.titulo || `${im.tipo} em ${im.bairro}`;

  const dataInput = document.getElementById("agenda-data");
  if (dataInput) {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    dataInput.min = amanha.toISOString().split("T")[0];
  }

  const modal = document.getElementById("modal-agendar");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => document.getElementById("agenda-nome")?.focus());
}

function _criarModalAgendamento() {
  const modal = document.createElement("div");
  modal.id = "modal-agendar";
  modal.className = "modal-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-box modal-form-box modal-form-wide">
      <button class="modal-close" id="modal-agendar-close" aria-label="Fechar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="modal-form-header">
        <div class="modal-form-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div>
          <h3>Agendar Visita</h3>
        </div>
      </div>
      <form id="form-agendar" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="agenda-nome">Seu nome *</label>
            <input type="text" id="agenda-nome" name="nome" placeholder="Nome completo" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="agenda-tel">WhatsApp *</label>
            <input type="tel" id="agenda-tel" name="telefone" placeholder="(31) 99999-9999" required autocomplete="tel">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="agenda-data">Data preferida *</label>
            <input type="date" id="agenda-data" name="data" required>
          </div>
          <div class="form-group">
            <label for="agenda-horario">Horário *</label>
            <select id="agenda-horario" name="horario" required>
              <option value="">Selecione</option>
              <option value="09:00">09h00</option>
              <option value="09:30">09h30</option>
              <option value="10:00">10h00</option>
              <option value="10:30">10h30</option>
              <option value="11:00">11h00</option>
              <option value="11:30">11h30</option>
              <option value="12:00">12h00</option>
              <option value="12:30">12h30</option>
              <option value="13:00">13h00</option>
              <option value="13:30">13h30</option>
              <option value="14:00">14h00</option>
              <option value="14:30">14h30</option>
              <option value="15:00">15h00</option>
              <option value="15:30">15h30</option>
              <option value="16:00">16h00</option>
              <option value="16:30">16h30</option>
              <option value="17:00">17h00</option>
              <option value="17:30">17h30</option>
              <option value="18:00">18h00</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="agenda-tipo">Tipo de visita</label>
            <select id="agenda-tipo" name="tipo_visita">
              <option value="Presencial">Presencial</option>
              <option value="Online">Online (vídeo)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="agenda-ref">Ref. do imóvel</label>
            <input type="text" id="agenda-ref" name="ref_imovel" readonly class="form-input-readonly">
          </div>
        </div>
        <div class="form-group">
          <label for="agenda-titulo">Imóvel</label>
          <input type="text" id="agenda-titulo" name="titulo_imovel" readonly class="form-input-readonly">
        </div>
        <div class="form-group">
          <label for="agenda-obs">Observações</label>
          <textarea id="agenda-obs" name="observacoes" placeholder="Informações adicionais (opcional)" rows="2"></textarea>
        </div>
        <button type="submit" class="form-submit" data-label="Confirmar agendamento">Confirmar agendamento</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("modal-agendar-close").addEventListener("click", () => _fecharModal("modal-agendar"));
  modal.addEventListener("click", e => { if (e.target === modal) _fecharModal("modal-agendar"); });
  document.getElementById("agenda-tel").addEventListener("input", e => _maskTel(e.target));
  _initDatePicker("agenda-data");

  document.getElementById("form-agendar").addEventListener("submit", async e => {
    e.preventDefault();
    if (_agendDebounce) return;
    const form = e.target;
    const nome = form.nome.value.trim();
    const tel = form.telefone.value.trim();
    const data = form.data.value;
    const horario = form.horario.value;

    if (!nome) { _setEstado("form-agendar", "erro", "Preencha seu <strong>nome</strong>."); return; }
    if (tel.replace(/\D/g, "").length < 10) { _setEstado("form-agendar", "erro", "<strong>WhatsApp inválido</strong>."); return; }
    if (!data) { _setEstado("form-agendar", "erro", "Selecione a <strong>data</strong> da visita."); return; }
    if (!horario) { _setEstado("form-agendar", "erro", "Selecione o <strong>horário</strong> preferido."); return; }

    const dataFmt = new Date(data + "T12:00:00").toLocaleDateString("pt-BR");

    const payload = {
      tipo: "agendamento",
      nome,
      telefone: tel.replace(/\D/g, ""),
      data, horario,
      tipo_visita: form.tipo_visita.value,
      ref_imovel: _imovelAtivo?.ref || "",
      titulo_imovel: _imovelAtivo?.titulo || "",
      tipo_imovel: _imovelAtivo?.tipo || "",
      observacoes: form.observacoes.value.trim()
    };

    _setEstado("form-agendar", "loading");
    _agendDebounce = true;
    setTimeout(() => { _agendDebounce = false; }, DEBOUNCE_MS);

    try {
      await _sbInsert("agendamentos", {
        nome:          payload.nome,
        telefone:      payload.telefone,
        data_visita:   payload.data,
        horario:       payload.horario,
        tipo_visita:   payload.tipo_visita,
        ref_imovel:    payload.ref_imovel,
        titulo_imovel: payload.titulo_imovel,
        tipo_imovel:   payload.tipo_imovel,
        observacoes:   payload.observacoes,
        status:        "pendente"
      });
      _notificarAppsScript("notificar_agendamento", payload);
      _setEstado("form-agendar", "sucesso", `
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div><h4>Visita agendada!</h4><p>Solicitação para <strong>${dataFmt} às ${horario.replace(":", "h")}</strong> registrada. Confirmaremos pelo WhatsApp <strong>${tel}</strong>.</p></div>`);
    } catch {
      _fallbackAgendWA(payload, dataFmt, tel);
    }
  });
}

function _fallbackAgendWA(p, dataFmt, tel) {
  const msg = `Olá! Gostaria de agendar uma visita.\n\nImóvel: ${p.titulo_imovel || p.ref_imovel}\nData: ${dataFmt}\nHorário: ${p.horario.replace(":", "h")}\nTipo: ${p.tipo_visita}\nMeu nome: ${p.nome}${p.observacoes ? "\nObs: " + p.observacoes : ""}`;
  window.open(`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`, "_blank");
  _setEstado("form-agendar", "sucesso", `
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <div><h4>WhatsApp aberto!</h4><p>Os detalhes do agendamento foram enviados para nosso corretor.</p></div>`);
}

// ===== DATEPICKER CUSTOMIZADO =====
function _initDatePicker(inputId) {
  const nativeInput = document.getElementById(inputId);
  if (!nativeInput || nativeInput.dataset.dpInit) return;
  nativeInput.dataset.dpInit = "1";
  nativeInput.style.display = "none";

  const display = document.createElement("button");
  display.type = "button";
  display.className = "datepicker-display";
  display.innerHTML = `<span>Selecione a data</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  nativeInput.after(display);
  _dpDisplay = display;

  const popup = document.createElement("div");
  popup.className = "datepicker-popup";
  popup.style.display = "none";
  document.body.appendChild(popup);

  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  function render() {
    const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const total = new Date(viewYear, viewMonth + 1, 0).getDate();
    const minDate = nativeInput.min ? new Date(nativeInput.min + "T00:00:00") : null;
    const today = new Date(); today.setHours(0,0,0,0);
    const sel = nativeInput.value;

    let g = days.map(d => `<span class="dp-weekday">${d}</span>`).join("");
    for (let i = 0; i < firstDay; i++) g += `<span class="dp-day dp-empty"></span>`;
    for (let d = 1; d <= total; d++) {
      const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dt = new Date(viewYear, viewMonth, d);
      const dis = minDate && dt < minDate;
      const isSel = ds === sel;
      const isToday = dt.getTime() === today.getTime();
      g += `<button type="button" class="dp-day${isSel?" dp-sel":""}${isToday&&!isSel?" dp-today":""}${dis?" dp-dis":""}" data-date="${ds}"${dis?" disabled":""}>${d}</button>`;
    }

    popup.innerHTML = `
      <div class="dp-hd">
        <button type="button" class="dp-nav" data-d="-1">&#8249;</button>
        <span class="dp-title">${months[viewMonth]} ${viewYear}</span>
        <button type="button" class="dp-nav" data-d="1">&#8250;</button>
      </div>
      <div class="dp-grid">${g}</div>`;

    popup.querySelectorAll(".dp-nav").forEach(btn => {
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        viewMonth += parseInt(btn.dataset.d);
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        render();
      });
    });
    popup.querySelectorAll(".dp-day:not(.dp-dis):not(.dp-empty)").forEach(btn => {
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        nativeInput.value = btn.dataset.date;
        const [y,m,dd] = btn.dataset.date.split("-");
        display.querySelector("span").textContent = `${dd}/${m}/${y}`;
        display.classList.add("has-value");
        popup.style.display = "none";
        render();
      });
    });
  }

  display.addEventListener("click", ev => {
    ev.stopPropagation();
    if (popup.style.display !== "none") { popup.style.display = "none"; return; }
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    const rect = display.getBoundingClientRect();
    popup.style.left = rect.left + "px";
    popup.style.top = (rect.bottom + 6) + "px";
    popup.style.display = "block";
    render();
  });
  document.addEventListener("click", () => { popup.style.display = "none"; });
}

// ESC fecha qualquer modal de lead/agenda
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { _fecharModal("modal-lead"); _fecharModal("modal-agendar"); }
});

window.openModalLead = openModalLead;
window.openModalAgendamento = openModalAgendamento;
