// ===== CONFIGURAÇÃO =====
// Após criar a planilha:
// 1. Arquivo → Compartilhar → Publicar na web
// 2. Selecione a aba "Imóveis" e formato "CSV"
// 3. Clique em Publicar e copie a URL gerada
const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXlt3SATFCw5_loZKK3aG_G3_J1QGbud5GrmYTfnAS3GaVpDFGtxLCqvnSseVWJ7VBWvXIrb_0HaO8/pub?gid=2087164215&single=true&output=csv";

const CACHE_KEY = "magnus_imoveis_v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ===== PARSER CSV =====
function _parseLinhaCSV(linha) {
  const res = [];
  let atual = "";
  let dentroAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      dentroAspas = !dentroAspas;
    } else if (c === ',' && !dentroAspas) {
      res.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  res.push(atual);
  return res;
}

function _parseCSV(csv) {
  const linhas = csv.trim().split("\n");
  if (linhas.length < 2) return [];
  const headers = _parseLinhaCSV(linhas[0]);
  const numericos = ["id", "quartos", "suites", "banheiros", "vagas", "area_util", "area_construida", "area_terreno"];

  return linhas.slice(1).map(linha => {
    const vals = _parseLinhaCSV(linha);
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] ?? "").trim();
      if (h === "preco") {
        // Suporta formatos: "150000", "150.000", "150.000,00", "R$ 150,000.00"
        const s = v.replace(/[R$\s]/g, "");
        let n;
        if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
          n = parseFloat(s.replace(/\./g, "").replace(",", "."));     // BR: 150.000,00
        } else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) {
          n = parseFloat(s.replace(/,/g, ""));                         // US: 150,000.00
        } else {
          n = parseFloat(s.replace(",", "."));                         // simples: 150000
        }
        obj[h] = Math.round(isNaN(n) ? 0 : n);
      } else if (numericos.includes(h)) {
        obj[h] = v === "" || v === "null" ? null : Number(v);
      } else if (h === "destaque") {
        obj[h] = v === "true" || v === "1" || v === "sim";
      } else if (h === "fotos") {
        try { obj[h] = v.startsWith("[") ? JSON.parse(v) : v.split("|").filter(Boolean); }
        catch { obj[h] = v ? [v] : []; }
      } else {
        obj[h] = v === "null" ? null : v;
      }
    });
    return obj;
  }).filter(o => o.ref);
}

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
// Ordem: cache sessionStorage → Google Sheets CSV → imoveis.json (fallback)
async function carregarImoveis() {
  const cache = _lerCache();
  if (cache) return cache;

  if (SHEETS_CSV_URL) {
    try {
      const r = await fetch(SHEETS_CSV_URL);
      if (r.ok) {
        const dados = _parseCSV(await r.text());
        if (dados.length > 0) {
          _salvarCache(dados);
          return dados;
        }
      }
    } catch {}
  }

  // Fallback: JSON local
  const r = await fetch("imoveis.json");
  const dados = await r.json();
  _salvarCache(dados);
  return dados;
}

function invalidarCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

window.dadosImoveis = { carregarImoveis, invalidarCache };
