// ===== CONFIGURAÇÃO SUPABASE =====
// Após criar o projeto no Supabase, substitua os valores abaixo:
// supabase.com → Project Settings → API
const SUPABASE_URL      = "https://pwdwpcqpiodbotqmrfxq.supabase.co";   // só o domínio — sem /rest/v1/
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZHdwY3FwaW9kYm90cW1yZnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjY2NDYsImV4cCI6MjA5OTM0MjY0Nn0.amY3RTm5b9TSfOqpi1kAf_vcPecfRWbGmkW-7SdpMo4";          // "anon public" key

const CACHE_KEY = "magnus_imoveis_v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ===== CACHE sessionStorage =====
function _salvarCache(dados) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), dados })); } catch {}
}

function _lerCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, dados } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? dados : null;
  } catch { return null; }
}

// ===== CARREGAR IMÓVEIS =====
// Ordem: cache sessionStorage → Supabase REST API → imoveis.json (fallback)
async function carregarImoveis() {
  const cache = _lerCache();
  if (cache) return cache;

  try {
    const r = await fetch(
      SUPABASE_URL + "/rest/v1/imoveis?select=*&order=id",
      { headers: { apikey: SUPABASE_ANON_KEY, Accept: "application/json" } }
    );
    if (r.ok) {
      const dados = await r.json();
      if (Array.isArray(dados) && dados.length > 0) {
        _salvarCache(dados);
        return dados;
      }
    }
  } catch {}

  // Fallback: JSON local
  try {
    const r = await fetch("imoveis.json");
    const dados = await r.json();
    _salvarCache(dados);
    return dados;
  } catch { return []; }
}

function invalidarCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

window.dadosImoveis = { carregarImoveis, invalidarCache, salvarCache: _salvarCache };
