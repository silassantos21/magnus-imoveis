/**
 * Magnus Imóveis — Google Apps Script
 * Sprint 2: Leads + Agendamentos
 * Sprint 4: Admin CRUD (imóveis, leads, agendamentos)
 *
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Abra a planilha Google Sheets do projeto
 * 2. Extensões → Apps Script
 * 3. Apague o conteúdo padrão e cole TODO este arquivo
 * 4. Salve o projeto (Ctrl+S)
 * 5. Implantar → Nova implantação (ou "Gerenciar implantações" → editar a existente)
 *    - Tipo: App da Web
 *    - Executar como: Eu mesmo (seu Google)
 *    - Quem tem acesso: Qualquer pessoa, mesmo anônimo
 * 6. Autorize as permissões solicitadas
 * 7. Copie a URL gerada e cole em js/leads.js → APPS_SCRIPT_URL
 *    e em js/admin.js → APPS_SCRIPT_URL (mesma URL)
 *
 * ESTRUTURA DA PLANILHA (abas necessárias):
 * - Imóveis      → cadastro dos imóveis (colunas: ver abaixo)
 * - Leads        → formulários "Tenho Interesse"
 * - Agendamentos → solicitações de visita
 *
 * COLUNAS DA ABA "Imóveis" (linha 1 = cabeçalho):
 * id | ref | tipo | finalidade | status | titulo | bairro | cidade | estado |
 * preco | quartos | suites | banheiros | vagas | area_util | area_construida |
 * area_terreno | fotos | descricao | destaque | data_venda
 */

const EMAIL_CORRETOR = "silasribeiro11@gmail.com";

// CONFIGURAR: Defina um token secreto (mín. 16 caracteres).
// Este mesmo token deve ser digitado no setup do admin.html.
// Após alterar, republique o script como nova implantação.
const ADMIN_TOKEN = "Magnus@4dm1n#2026";

// ===== ROTEADOR PRINCIPAL =====

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    // Rotas públicas (Sprint 2)
    if (dados.tipo === "lead")        return _gravarLead(dados);
    if (dados.tipo === "agendamento") return _gravarAgendamento(dados);

    // Rotas admin — token obrigatório
    if (!_verificarToken(dados)) return _resposta(401, "Token inválido");

    if (dados.tipo === "admin_criar")                return _adminCriar(dados);
    if (dados.tipo === "admin_editar")               return _adminEditar(dados);
    if (dados.tipo === "admin_status")               return _adminStatus(dados);
    if (dados.tipo === "admin_deletar")              return _adminDeletar(dados);
    if (dados.tipo === "admin_listar_leads")         return _adminListarLeads(dados);
    if (dados.tipo === "admin_listar_agendamentos")  return _adminListarAgendamentos(dados);
    if (dados.tipo === "admin_status_agendamento")   return _adminStatusAgendamento(dados);

    return _resposta(400, "Tipo inválido");
  } catch (err) {
    Logger.log("Erro doPost: " + err.toString());
    return _resposta(500, err.toString());
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Magnus Imóveis — API ativa")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ===== AUTENTICAÇÃO =====

function _verificarToken(dados) {
  return dados.token === ADMIN_TOKEN;
}

// ===== MAPA DE COLUNAS (lê cabeçalho da planilha dinamicamente) =====

function _getColMap(sheet) {
  const last = sheet.getLastColumn();
  if (last === 0) return {};
  const headers = sheet.getRange(1, 1, 1, last).getValues()[0];
  const map = {};
  headers.forEach(function(h, i) { if (h) map[String(h).trim()] = i + 1; });
  return map;
}

// ===== SPRINT 2 — LEAD =====

function _gravarLead(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  const ts = new Date();

  sheet.appendRow([
    ts,
    d.nome || "",
    d.telefone || "",
    d.interesse || "",
    d.ref_imovel || "",
    d.origem || "site"
  ]);

  const htmlLead = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
  <tr><td style="background:#0f172a;padding:24px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:2px">MAGNUS <span style="color:#c9a84c">IMÓVEIS</span></p>
    <p style="margin:5px 0 0;font-size:11px;color:#94a3b8;letter-spacing:1px">CRECI 32.402</p>
  </td></tr>
  <tr><td style="padding:16px 32px 12px;background:#fafafa;border-bottom:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px">Novo Interesse — Site</p>
    <p style="margin:3px 0 0;font-size:12px;color:#64748b">Recebido em ${ts.toLocaleString("pt-BR")}</p>
  </td></tr>
  <tr><td style="padding:24px 32px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Nome</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.nome || "—"}</p>
      </td></tr>
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">WhatsApp</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.telefone || "—"}</p>
      </td></tr>
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Interesse</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.interesse || "—"}</p>
      </td></tr>
      <tr><td style="padding:9px 0">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Imóvel</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.ref_imovel || "não informado"}</p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;text-align:center">
      <a href="https://wa.me/55${(d.telefone||"").replace(/\D/g,"")}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700">Responder no WhatsApp</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center">
    <p style="margin:0;font-size:11px;color:#94a3b8">Magnus Imóveis · Av. Senador Levindo Coelho, 54 - Tirol, Belo Horizonte/MG</p>
    <p style="margin:3px 0 0;font-size:11px;color:#94a3b8">(31) 3321-6775 · magnusimoveisbh@hotmail.com</p>
  </td></tr>
</table>
<p style="margin:12px 0 0;font-size:10px;color:#94a3b8;text-align:center">Notificação automática — Magnus Imóveis</p>
</td></tr></table></body></html>`;

  MailApp.sendEmail({
    to: EMAIL_CORRETOR,
    subject: "Novo lead — " + (d.nome || "sem nome") + " — " + (d.ref_imovel || "sem imóvel"),
    body: "Novo interesse: " + (d.nome || "—") + " | " + (d.telefone || "—") + " | " + (d.ref_imovel || "—"),
    htmlBody: htmlLead
  });

  return _resposta(200, "Lead registrado");
}

// ===== SPRINT 2 — AGENDAMENTO =====

function _gravarAgendamento(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Agendamentos");
  const ts = new Date();

  sheet.appendRow([
    ts,
    d.nome || "",
    d.telefone || "",
    d.data || "",
    d.horario || "",
    d.tipo_visita || "Presencial",
    d.ref_imovel || "",
    d.titulo_imovel || "",
    d.observacoes || "",
    "pendente"
  ]);

  _criarEventoCalendar(d);

  const dataFmt = d.data ? new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const htmlAgend = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
  <tr><td style="background:#0f172a;padding:24px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:2px">MAGNUS <span style="color:#c9a84c">IMÓVEIS</span></p>
    <p style="margin:5px 0 0;font-size:11px;color:#94a3b8;letter-spacing:1px">CRECI 32.402</p>
  </td></tr>
  <tr><td style="padding:16px 32px 12px;background:#fafafa;border-bottom:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px">Nova Visita Agendada</p>
    <p style="margin:3px 0 0;font-size:12px;color:#64748b">Solicitado em ${ts.toLocaleString("pt-BR")}</p>
  </td></tr>
  <tr><td style="padding:24px 32px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9" width="50%">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Cliente</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.nome || "—"}</p>
      </td><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">WhatsApp</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.telefone || "—"}</p>
      </td></tr>
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Data</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${dataFmt}</p>
      </td><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Horário</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${(d.horario||"—").replace(":","h")}</p>
      </td></tr>
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Imóvel</p>
        <p style="margin:3px 0 0;font-size:14px;color:#0f172a;font-weight:600">${d.titulo_imovel || d.ref_imovel || "—"}</p>
      </td><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Tipo</p>
        <p style="margin:3px 0 0;font-size:14px;color:#0f172a;font-weight:600">${d.tipo_visita || "Presencial"}</p>
      </td></tr>
      ${d.observacoes ? `<tr><td colspan="2" style="padding:9px 0">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Observações</p>
        <p style="margin:3px 0 0;font-size:13px;color:#374151">${d.observacoes}</p>
      </td></tr>` : ""}
    </table>
    <p style="margin:20px 0 0;text-align:center">
      <a href="https://wa.me/55${(d.telefone||"").replace(/\D/g,"")}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700">Confirmar pelo WhatsApp</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center">
    <p style="margin:0;font-size:11px;color:#94a3b8">Magnus Imóveis · Av. Senador Levindo Coelho, 54 - Tirol, Belo Horizonte/MG</p>
    <p style="margin:3px 0 0;font-size:11px;color:#94a3b8">(31) 3321-6775 · magnusimoveisbh@hotmail.com</p>
  </td></tr>
</table>
<p style="margin:12px 0 0;font-size:10px;color:#94a3b8;text-align:center">Notificação automática — Magnus Imóveis</p>
</td></tr></table></body></html>`;

  MailApp.sendEmail({
    to: EMAIL_CORRETOR,
    subject: "Nova visita — " + (d.nome || "sem nome") + " — " + dataFmt + " " + (d.horario || ""),
    body: "Agendamento: " + (d.nome || "—") + " | " + dataFmt + " " + (d.horario || "—") + " | " + (d.ref_imovel || "—"),
    htmlBody: htmlAgend
  });

  return _resposta(200, "Agendamento registrado");
}

function _criarEventoCalendar(d) {
  try {
    const calendario = CalendarApp.getDefaultCalendar();
    const dataHoraInicio = new Date(d.data + "T" + d.horario + ":00");
    const dataHoraFim = new Date(dataHoraInicio.getTime() + 60 * 60 * 1000);
    const titulo = "Visita — " + (d.tipo_imovel || "Imóvel") + " " + (d.ref_imovel || "") + " — " + (d.nome || "cliente");
    const descricao = [
      "Cliente: " + (d.nome || "—"),
      "WhatsApp: " + (d.telefone || "—"),
      "Imóvel: " + (d.titulo_imovel || d.ref_imovel || "—"),
      "Tipo: " + (d.tipo_visita || "Presencial"),
      "Obs: " + (d.observacoes || "nenhuma")
    ].join("\n");
    calendario.createEvent(titulo, dataHoraInicio, dataHoraFim, {
      description: descricao,
      location: "Av. Senador Levindo Coelho, 54 - Tirol, Belo Horizonte, MG"
    });
  } catch (err) {
    Logger.log("Erro Calendar: " + err.toString());
  }
}

// ===== SPRINT 4 — CRUD IMÓVEIS =====

function _adminCriar(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Imóveis");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id","ref","tipo","finalidade","status","titulo","bairro","cidade","estado",
      "preco","quartos","suites","banheiros","vagas","area_util","area_construida",
      "area_terreno","fotos","descricao","destaque","data_venda"]);
  }

  const cols = _getColMap(sheet);
  const lastRow = sheet.getLastRow();

  var novoId = 1;
  if (lastRow > 1 && cols["id"]) {
    var ids = sheet.getRange(2, cols["id"], lastRow - 1, 1).getValues().flat();
    var maxId = Math.max.apply(null, [0].concat(ids.map(function(v){ return Number(v) || 0; })));
    novoId = maxId + 1;
  }

  const d = dados.imovel || {};
  const totalCols = sheet.getLastColumn();
  const linha = new Array(totalCols).fill("");

  function set(campo, val) {
    if (cols[campo]) linha[cols[campo] - 1] = (val === undefined || val === null) ? "" : val;
  }

  set("id", novoId);
  set("ref", d.ref || "");
  set("tipo", d.tipo || "");
  set("finalidade", d.finalidade || "");
  set("status", d.status || "disponivel");
  set("titulo", d.titulo || "");
  set("bairro", d.bairro || "");
  set("cidade", d.cidade || "");
  set("estado", d.estado || "MG");
  set("preco", Number(d.preco) || 0);
  set("quartos",      _num(d.quartos));
  set("suites",       _num(d.suites));
  set("banheiros",    _num(d.banheiros));
  set("vagas",        _num(d.vagas));
  set("area_util",    _num(d.area_util));
  set("area_construida", _num(d.area_construida));
  set("area_terreno", _num(d.area_terreno));
  set("fotos", Array.isArray(d.fotos) ? d.fotos.join("|") : (d.fotos || ""));
  set("descricao", d.descricao || "");
  set("destaque", d.destaque ? "true" : "false");
  set("data_venda", d.data_venda || "");

  sheet.appendRow(linha);
  return _resposta(200, "Imóvel criado com ID " + novoId);
}

function _adminEditar(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Imóveis");
  const cols = _getColMap(sheet);
  const ref = String(dados.ref || "").trim();
  const lastRow = sheet.getLastRow();

  if (!ref || lastRow < 2 || !cols["ref"]) return _resposta(404, "Imóvel não encontrado");

  const refs = sheet.getRange(2, cols["ref"], lastRow - 1, 1).getValues().flat()
    .map(function(r){ return String(r).trim(); });
  const idx = refs.indexOf(ref);
  if (idx === -1) return _resposta(404, "Imóvel não encontrado: " + ref);

  const rowNum = idx + 2;
  const d = dados.imovel || {};
  const camposNum = ["preco","quartos","suites","banheiros","vagas","area_util","area_construida","area_terreno"];
  const campos = ["tipo","finalidade","status","titulo","bairro","cidade","estado",
    "preco","quartos","suites","banheiros","vagas","area_util","area_construida",
    "area_terreno","fotos","descricao","destaque","data_venda"];

  campos.forEach(function(campo) {
    if (!cols[campo] || !(campo in d)) return;
    var val = d[campo];
    if (campo === "fotos") val = Array.isArray(val) ? val.join("|") : (val || "");
    else if (campo === "destaque") val = val ? "true" : "false";
    else if (camposNum.indexOf(campo) !== -1) val = _num(val);
    sheet.getRange(rowNum, cols[campo]).setValue(val === null ? "" : val);
  });

  return _resposta(200, "Atualizado: " + ref);
}

function _adminStatus(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Imóveis");
  const cols = _getColMap(sheet);
  const ref = String(dados.ref || "").trim();
  const lastRow = sheet.getLastRow();

  if (!ref || lastRow < 2 || !cols["ref"]) return _resposta(404, "Imóvel não encontrado");

  const refs = sheet.getRange(2, cols["ref"], lastRow - 1, 1).getValues().flat()
    .map(function(r){ return String(r).trim(); });
  const idx = refs.indexOf(ref);
  if (idx === -1) return _resposta(404, "Imóvel não encontrado: " + ref);

  const rowNum = idx + 2;
  if (dados.status != null && cols["status"])   sheet.getRange(rowNum, cols["status"]).setValue(dados.status);
  if (dados.destaque != null && cols["destaque"]) sheet.getRange(rowNum, cols["destaque"]).setValue(dados.destaque ? "true" : "false");

  return _resposta(200, "Status atualizado: " + ref);
}

function _adminDeletar(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Imóveis");
  const cols = _getColMap(sheet);
  const ref = String(dados.ref || "").trim();
  const lastRow = sheet.getLastRow();

  if (!ref || lastRow < 2 || !cols["ref"]) return _resposta(404, "Imóvel não encontrado");

  const refs = sheet.getRange(2, cols["ref"], lastRow - 1, 1).getValues().flat()
    .map(function(r){ return String(r).trim(); });
  const idx = refs.indexOf(ref);
  if (idx === -1) return _resposta(404, "Imóvel não encontrado: " + ref);

  sheet.deleteRow(idx + 2);
  return _resposta(200, "Excluído: " + ref);
}

// ===== SPRINT 4 — LISTAR LEADS =====

function _adminListarLeads(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _respostaJSON({ leads: [] });

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const leads = rows
    .map(function(r) {
      return {
        data:      r[0] instanceof Date ? r[0].toLocaleString("pt-BR") : String(r[0] || ""),
        nome:      String(r[1] || ""),
        telefone:  String(r[2] || ""),
        interesse: String(r[3] || ""),
        ref_imovel: String(r[4] || ""),
        origem:    String(r[5] || "site")
      };
    })
    .filter(function(l){ return (l.nome || l.telefone) && l.nome !== "nome" && l.telefone !== "telefone"; })
    .reverse();

  return _respostaJSON({ leads: leads });
}

// ===== SPRINT 4 — LISTAR AGENDAMENTOS =====

function _adminListarAgendamentos(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Agendamentos");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _respostaJSON({ agendamentos: [] });

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const agendamentos = rows
    .map(function(r, i) {
      return {
        row:         i + 2,
        data_criacao: r[0] instanceof Date ? r[0].toLocaleString("pt-BR") : String(r[0] || ""),
        nome:        String(r[1] || ""),
        telefone:    String(r[2] || ""),
        data:    r[3] instanceof Date ? Utilities.formatDate(r[3], "America/Sao_Paulo", "yyyy-MM-dd") : String(r[3] || ""),
        horario: r[4] instanceof Date ? Utilities.formatDate(r[4], "America/Sao_Paulo", "HH:mm") : String(r[4] || ""),
        tipo_visita: String(r[5] || "Presencial"),
        ref_imovel:  String(r[6] || ""),
        titulo_imovel: String(r[7] || ""),
        observacoes: String(r[8] || ""),
        status:      String(r[9] || "pendente")
      };
    })
    .filter(function(a){ return a.nome || a.telefone; })
    .reverse();

  return _respostaJSON({ agendamentos: agendamentos });
}

function _adminStatusAgendamento(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Agendamentos");
  const rowNum = Number(dados.row);
  if (!rowNum || rowNum < 2) return _resposta(400, "Linha inválida");
  sheet.getRange(rowNum, 10).setValue(dados.status || "pendente");
  return _resposta(200, "Agendamento atualizado");
}

// ===== UTILITÁRIOS =====

function _num(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return isNaN(n) ? "" : n;
}

function _resposta(status, mensagem) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status, mensagem: mensagem }))
    .setMimeType(ContentService.MimeType.JSON);
}

function _respostaJSON(dados) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: 200 }, dados)))
    .setMimeType(ContentService.MimeType.JSON);
}
