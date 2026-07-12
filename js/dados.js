// ===== CONFIGURAÇÃO SUPABASE =====
// supabase.com → Project Settings → API
const SUPABASE_URL      = "https://pwdwpcqpiodbotqmrfxq.supabase.co";   // só o domínio — sem /rest/v1/
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZHdwY3FwaW9kYm90cW1yZnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjY2NDYsImV4cCI6MjA5OTM0MjY0Nn0.amY3RTm5b9TSfOqpi1kAf_vcPecfRWbGmkW-7SdpMo4";          // "anon public" key

// ===== CARREGAR IMÓVEIS =====
// Ordem: Supabase REST API → imoveis.json (fallback)
async function carregarImoveis() {
  try {
    const r = await fetch(
      SUPABASE_URL + "/rest/v1/imoveis?select=*&order=id",
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, Accept: "application/json" } }
    );
    if (r.ok) {
      const dados = await r.json();
      if (Array.isArray(dados) && dados.length > 0) return dados;
    }
  } catch {}

  // Fallback: JSON local
  try {
    const r = await fetch("imoveis.json");
    return await r.json();
  } catch { return []; }
}

function invalidarCache() {} // mantido por compatibilidade

window.dadosImoveis = { carregarImoveis, invalidarCache };
