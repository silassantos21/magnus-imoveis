(function () {
  // ===== CONSTANTES =====
  const TAXA_ANUAL = 0.105; // 10,5% a.a. SBPE
  const TAXA_MENSAL = TAXA_ANUAL / 12;
  const WA_NUM = "5531999845813";
  const CAIXA_URL = "https://www8.caixa.gov.br/siopcfe/simulador/simulador.asp";

  // ===== ESTADO =====
  let state = {
    valorImovel: 0,
    entradaPerc: 20,
    rendaMensal: 0,
    prazoAnos: 30,
    sistema: "SAC",
    ref: null,
    titulo: null,
  };

  // ===== HELPERS =====
  const fmtBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const fmtBRLd = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseBRL = (str) => parseFloat(str.replace(/\D/g, "")) || 0;

  // ===== CÁLCULOS =====
  function calcSAC(pv, n, i) {
    if (pv <= 0 || n <= 0) return null;
    const amort = pv / n;
    const primeiraParcela = amort + pv * i;
    const ultimaParcela = amort + amort * i;
    const totalJuros = pv * i * (n + 1) / 2;
    const totalPago = pv + totalJuros;
    return { primeiraParcela, ultimaParcela, totalPago, totalJuros };
  }

  function calcPRICE(pv, n, i) {
    if (pv <= 0 || n <= 0) return null;
    const fator = Math.pow(1 + i, n);
    const pmt = pv * i * fator / (fator - 1);
    const totalPago = pmt * n;
    const totalJuros = totalPago - pv;
    return { pmt, totalPago, totalJuros };
  }

  // ===== MODAL HTML =====
  function criarModalHTML() {
    return `
    <div class="modal-overlay" id="modal-calc" style="display:none" role="dialog" aria-modal="true" aria-label="Simulador de Financiamento">
      <div class="modal-calc-box">
        <button class="modal-close" id="modal-calc-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div class="modal-calc-header">
          <div class="modal-calc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 14h.01M10 14h.01M14 14h4"/></svg>
          </div>
          <h3 class="modal-calc-title">Simular Financiamento</h3>
        </div>
        <div class="modal-calc-content">
        <p class="modal-calc-subtitle" id="modal-calc-subtitle">Calcule sua parcela em SAC ou PRICE</p>

        <div class="modal-calc-body">

          <!-- INPUTS -->
          <div class="calc-inputs">

            <!-- Sistema -->
            <div class="calc-field">
              <label class="calc-label">Sistema de amortização</label>
              <div class="calc-toggle">
                <button class="calc-toggle-btn active" data-sistema="SAC" id="toggle-sac">
                  SAC
                  <span>Parcelas decrescentes</span>
                </button>
                <button class="calc-toggle-btn" data-sistema="PRICE" id="toggle-price">
                  PRICE
                  <span>Parcela fixa</span>
                </button>
              </div>
            </div>

            <!-- Valor do imóvel -->
            <div class="calc-field">
              <label class="calc-label" for="calc-valor">Valor do imóvel</label>
              <div class="calc-input-wrap">
                <span class="calc-input-prefix">R$</span>
                <input type="text" id="calc-valor" class="calc-input" placeholder="0" inputmode="numeric" autocomplete="off">
              </div>
            </div>

            <!-- Entrada -->
            <div class="calc-field">
              <label class="calc-label">
                Valor de entrada
                <span class="calc-hint">(mín. 20%)</span>
              </label>
              <div class="calc-slider-row">
                <input type="range" id="calc-entrada-slider" min="20" max="80" step="1" value="20" class="calc-slider">
                <div class="calc-slider-values">
                  <span id="calc-entrada-perc">20%</span>
                  <span id="calc-entrada-reais">R$ 0</span>
                </div>
              </div>
            </div>

            <!-- Financiado -->
            <div class="calc-financiado" id="calc-financiado-wrap">
              <span>Valor financiado:</span>
              <strong id="calc-financiado-val">R$ 0</strong>
            </div>

            <!-- Renda mensal -->
            <div class="calc-field">
              <label class="calc-label" for="calc-renda">
                Renda mensal familiar
                <span class="calc-hint">(opcional)</span>
              </label>
              <div class="calc-input-wrap">
                <span class="calc-input-prefix">R$</span>
                <input type="text" id="calc-renda" class="calc-input" placeholder="0" inputmode="numeric" autocomplete="off">
              </div>
            </div>

            <!-- Prazo -->
            <div class="calc-field">
              <label class="calc-label">
                Prazo
                <span class="calc-hint">(5 a 35 anos)</span>
              </label>
              <div class="calc-slider-row">
                <input type="range" id="calc-prazo-slider" min="5" max="35" step="1" value="30" class="calc-slider">
                <div class="calc-slider-values">
                  <span id="calc-prazo-anos">30 anos</span>
                  <span id="calc-prazo-meses">360 meses</span>
                </div>
              </div>
            </div>

          </div>

          <!-- RESULTADOS -->
          <div class="calc-results" id="calc-results">

            <div class="calc-taxa-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Taxa SBPE: 10,5% a.a. · 0,875% a.m.
            </div>

            <div id="calc-result-box" class="calc-result-box">
              <div class="calc-empty-state" id="calc-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                <p>Preencha o valor do imóvel para calcular</p>
              </div>

              <!-- SAC -->
              <div id="calc-result-sac" style="display:none">
                <div class="result-sistema-label">Sistema SAC</div>
                <div class="result-rows">
                  <div class="result-row highlight">
                    <span>1ª parcela</span>
                    <strong id="sac-primeira">—</strong>
                  </div>
                  <div class="result-row">
                    <span>Última parcela</span>
                    <strong id="sac-ultima">—</strong>
                  </div>
                  <div class="result-row">
                    <span>Total pago</span>
                    <strong id="sac-total">—</strong>
                  </div>
                  <div class="result-row danger">
                    <span>Total de juros</span>
                    <strong id="sac-juros">—</strong>
                  </div>
                </div>
              </div>

              <!-- PRICE -->
              <div id="calc-result-price" style="display:none">
                <div class="result-sistema-label">Sistema PRICE</div>
                <div class="result-rows">
                  <div class="result-row highlight">
                    <span>Parcela mensal fixa</span>
                    <strong id="price-pmt">—</strong>
                  </div>
                  <div class="result-row">
                    <span>Total pago</span>
                    <strong id="price-total">—</strong>
                  </div>
                  <div class="result-row danger">
                    <span>Total de juros</span>
                    <strong id="price-juros">—</strong>
                  </div>
                </div>
              </div>

            </div>

            <!-- Aviso renda -->
            <div class="calc-renda-warn" id="calc-renda-warn" style="display:none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span id="calc-renda-warn-text">A parcela compromete mais de 30% da renda informada.</span>
            </div>

            <!-- Disclaimer -->
            <p class="calc-disclaimer">
              Simulação estimada com taxa de 10,5% a.a. (SBPE). Condições reais sujeitas à análise de crédito, seguro obrigatório e aprovação do banco.
            </p>

            <!-- CTAs -->
            <div class="calc-ctas" id="calc-ctas" style="display:none">
              <a href="#" class="calc-cta-wa" id="calc-cta-wa" target="_blank">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.737a.5.5 0 00.614.61l5.995-1.567A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 01-5.17-1.438l-.371-.22-3.844 1.004 1.026-3.742-.241-.386A10 10 0 1112 22z"/></svg>
                Quero este imóvel
              </a>
              <a href="${CAIXA_URL}" class="calc-cta-caixa" target="_blank" rel="noopener">
                Ver na Caixa Econômica
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>

          </div>
        </div>
        </div>
      </div>
    </div>`;
  }

  // ===== FORMATAR INPUT BRL =====
  function formatarInputBRL(input) {
    let raw = input.value.replace(/\D/g, "");
    if (!raw) { input.value = ""; return; }
    const num = parseInt(raw, 10);
    input.value = num.toLocaleString("pt-BR");
  }

  // ===== ATUALIZAR RESULTADOS =====
  function atualizarResultados() {
    const valorImovel = parseBRL(document.getElementById("calc-valor").value);
    const entradaPerc = parseInt(document.getElementById("calc-entrada-slider").value);
    const rendaBruta = parseBRL(document.getElementById("calc-renda").value);
    const prazoAnos = parseInt(document.getElementById("calc-prazo-slider").value);
    const prazoMeses = prazoAnos * 12;

    const entrada = Math.round(valorImovel * entradaPerc / 100);
    const financiado = valorImovel - entrada;

    document.getElementById("calc-entrada-perc").textContent = entradaPerc + "%";
    document.getElementById("calc-entrada-reais").textContent = valorImovel > 0 ? fmtBRL(entrada) : "R$ 0";
    document.getElementById("calc-prazo-anos").textContent = prazoAnos + " ano" + (prazoAnos !== 1 ? "s" : "");
    document.getElementById("calc-prazo-meses").textContent = prazoMeses + " meses";

    // valor financiado
    const finWrap = document.getElementById("calc-financiado-wrap");
    if (valorImovel > 0) {
      document.getElementById("calc-financiado-val").textContent = fmtBRL(financiado);
      finWrap.style.display = "flex";
    } else {
      finWrap.style.display = "none";
    }

    // calcula
    const emptyEl = document.getElementById("calc-empty");
    const sacEl = document.getElementById("calc-result-sac");
    const priceEl = document.getElementById("calc-result-price");
    const ctasEl = document.getElementById("calc-ctas");

    if (valorImovel <= 0 || financiado <= 0) {
      emptyEl.style.display = "flex";
      sacEl.style.display = "none";
      priceEl.style.display = "none";
      ctasEl.style.display = "none";
      document.getElementById("calc-renda-warn").style.display = "none";
      return;
    }

    emptyEl.style.display = "none";
    ctasEl.style.display = "flex";

    const sistema = state.sistema;
    let primeiraParcelaCalc = 0;

    if (sistema === "SAC") {
      const r = calcSAC(financiado, prazoMeses, TAXA_MENSAL);
      if (r) {
        sacEl.style.display = "";
        priceEl.style.display = "none";
        document.getElementById("sac-primeira").textContent = fmtBRLd(r.primeiraParcela);
        document.getElementById("sac-ultima").textContent = fmtBRLd(r.ultimaParcela);
        document.getElementById("sac-total").textContent = fmtBRL(r.totalPago);
        document.getElementById("sac-juros").textContent = fmtBRL(r.totalJuros);
        primeiraParcelaCalc = r.primeiraParcela;
      }
    } else {
      const r = calcPRICE(financiado, prazoMeses, TAXA_MENSAL);
      if (r) {
        priceEl.style.display = "";
        sacEl.style.display = "none";
        document.getElementById("price-pmt").textContent = fmtBRLd(r.pmt);
        document.getElementById("price-total").textContent = fmtBRL(r.totalPago);
        document.getElementById("price-juros").textContent = fmtBRL(r.totalJuros);
        primeiraParcelaCalc = r.pmt;
      }
    }

    // aviso renda
    const warnEl = document.getElementById("calc-renda-warn");
    if (rendaBruta > 0 && primeiraParcelaCalc > 0) {
      const comprometimento = (primeiraParcelaCalc / rendaBruta) * 100;
      if (comprometimento > 30) {
        const percStr = comprometimento.toFixed(1).replace(".", ",");
        document.getElementById("calc-renda-warn-text").textContent =
          `Atenção: a parcela compromete ${percStr}% da renda informada. Os bancos geralmente exigem no máximo 30%.`;
        warnEl.style.display = "flex";
      } else {
        warnEl.style.display = "none";
      }
    } else {
      warnEl.style.display = "none";
    }

    // CTA WhatsApp com resumo
    atualizarCTAWhatsApp(valorImovel, entrada, entradaPerc, financiado, prazoAnos, prazoMeses, primeiraParcelaCalc);
  }

  function atualizarCTAWhatsApp(valorImovel, entrada, entradaPerc, financiado, prazoAnos, prazoMeses, parcela) {
    const refTxt = state.ref ? ` (Ref. ${state.ref})` : "";
    const tituloTxt = state.titulo ? `Imóvel: ${state.titulo}${refTxt}\n` : "";
    const msg = `Olá! Fiz uma simulação no site Magnus Imóveis e tenho interesse em avançar.\n\n${tituloTxt}Simulação (${state.sistema}):\n• Valor do imóvel: ${fmtBRL(valorImovel)}\n• Entrada: ${fmtBRL(entrada)} (${entradaPerc}%)\n• Financiado: ${fmtBRL(financiado)}\n• Prazo: ${prazoAnos} anos (${prazoMeses} meses)\n• 1ª parcela estimada: ${fmtBRLd(parcela)}\n\nPoderia me dar mais informações?`;
    document.getElementById("calc-cta-wa").href =
      `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
  }

  // ===== ABRIR / FECHAR MODAL =====
  function abrirModal() {
    const modal = document.getElementById("modal-calc");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => modal.querySelector(".modal-calc-box").classList.add("open"));
    document.getElementById("calc-valor").focus();
    if (typeof trackSimulationStart === "function") trackSimulationStart(state.ref, state.valorImovel);
  }

  function fecharModal() {
    const modal = document.getElementById("modal-calc");
    modal.querySelector(".modal-calc-box").classList.remove("open");
    setTimeout(() => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }, 200);
  }

  // ===== API PÚBLICA =====
  window.openCalculadora = function (valor, ref, titulo) {
    state.ref = ref || null;
    state.titulo = titulo || null;

    // preencher valor
    const inputValor = document.getElementById("calc-valor");
    if (valor && valor > 0) {
      inputValor.value = valor.toLocaleString("pt-BR");
    } else {
      inputValor.value = "";
    }

    // atualizar subtitle
    const subtitle = document.getElementById("modal-calc-subtitle");
    subtitle.textContent = titulo
      ? titulo
      : "Calcule sua parcela em SAC ou PRICE";

    // reset outros campos
    document.getElementById("calc-entrada-slider").value = 20;
    document.getElementById("calc-prazo-slider").value = 30;
    document.getElementById("calc-renda").value = "";

    // reset toggle
    document.querySelectorAll(".calc-toggle-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('[data-sistema="SAC"]').classList.add("active");
    state.sistema = "SAC";

    atualizarResultados();
    abrirModal();
  };

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    // injeta modal no body
    document.body.insertAdjacentHTML("beforeend", criarModalHTML());

    // fechar
    document.getElementById("modal-calc-close").addEventListener("click", fecharModal);
    document.getElementById("modal-calc").addEventListener("click", (e) => {
      if (e.target === document.getElementById("modal-calc")) fecharModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("modal-calc").style.display !== "none") fecharModal();
    });

    // toggle SAC/PRICE
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".calc-toggle-btn");
      if (!btn) return;
      document.querySelectorAll(".calc-toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.sistema = btn.dataset.sistema;
      atualizarResultados();
    });

    // input valor
    document.getElementById("calc-valor").addEventListener("input", function () {
      formatarInputBRL(this);
      atualizarResultados();
    });

    // slider entrada
    document.getElementById("calc-entrada-slider").addEventListener("input", atualizarResultados);

    // input renda
    document.getElementById("calc-renda").addEventListener("input", function () {
      formatarInputBRL(this);
      atualizarResultados();
    });

    // slider prazo
    document.getElementById("calc-prazo-slider").addEventListener("input", atualizarResultados);
  });
})();
