/**
 * Magnus Imóveis — Google Apps Script (versão simplificada)
 *
 * Responsabilidade: APENAS enviar emails ao corretor e criar eventos no Google Calendar.
 * Os dados agora são armazenados no Supabase — este script não toca mais o Google Sheets.
 *
 * INSTRUÇÕES DE ATUALIZAÇÃO:
 * 1. Abra o projeto em script.google.com (acesse pelo Google Drive)
 * 2. Apague o conteúdo atual e cole TODO este arquivo
 * 3. Salve (Ctrl+S)
 * 4. Implantar → Gerenciar implantações → ✏️ Editar → Nova versão → Implantar
 * 5. A URL de implantação NÃO muda — não é necessário atualizar leads.js
 */

const EMAIL_CORRETOR = "magnusimoveisbh@hotmail.com"; // fallback, só usado se o lead não tiver vendedor atribuído

// ===== ROTEADOR PRINCIPAL =====

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    if (dados.tipo === "notificar_lead")        return _notificarLead(dados);
    if (dados.tipo === "notificar_agendamento") return _notificarAgendamento(dados);

    return _resposta(400, "Tipo inválido");
  } catch (err) {
    Logger.log("Erro doPost: " + err.toString());
    return _resposta(500, err.toString());
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Magnus Imóveis — Notificador ativo")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ===== NOTIFICAÇÃO DE LEAD (email) =====

function _notificarLead(d) {
  const ts = new Date();

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
      <tr><td style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Imóvel</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.ref_imovel || "não informado"}</p>
      </td></tr>
      <tr><td style="padding:9px 0">
        <p style="margin:0;font-size:10px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.8px">Vendedor responsável</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.vendedor_nome || "—"}</p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;text-align:center">
      <a href="https://wa.me/55${(d.telefone||"").replace(/\D/g,"")}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700">Responder no WhatsApp</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center">
    <p style="margin:0;font-size:11px;color:#94a3b8">Magnus Imóveis · R. José do Carmo de Oliveira, 74 - Tirol, Belo Horizonte/MG</p>
    <p style="margin:3px 0 0;font-size:11px;color:#94a3b8">(31) 3321-6775 · magnusimoveisbh@hotmail.com</p>
  </td></tr>
</table>
<p style="margin:12px 0 0;font-size:10px;color:#94a3b8;text-align:center">Notificação automática — Magnus Imóveis</p>
</td></tr></table></body></html>`;

  MailApp.sendEmail({
    to: d.vendedor_email || EMAIL_CORRETOR,
    subject: "Novo lead — " + (d.nome || "sem nome") + " — " + (d.ref_imovel || "sem imóvel"),
    body: "Novo interesse: " + (d.nome || "—") + " | " + (d.telefone || "—") + " | " + (d.ref_imovel || "—") + " | Vendedor: " + (d.vendedor_nome || "—"),
    htmlBody: htmlLead
  });

  return _resposta(200, "Email enviado");
}

// ===== NOTIFICAÇÃO DE AGENDAMENTO (email + Calendar) =====

function _notificarAgendamento(d) {
  const ts = new Date();
  const dataFmt = d.data ? new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";

  _criarEventoCalendar(d);

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
      ${d.observacoes ? `<tr><td colspan="2" style="padding:9px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">Observações</p>
        <p style="margin:3px 0 0;font-size:13px;color:#374151">${d.observacoes}</p>
      </td></tr>` : ""}
      <tr><td colspan="2" style="padding:9px 0">
        <p style="margin:0;font-size:10px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.8px">Vendedor responsável</p>
        <p style="margin:3px 0 0;font-size:15px;color:#0f172a;font-weight:600">${d.vendedor_nome || "—"}</p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;text-align:center">
      <a href="https://wa.me/55${(d.telefone||"").replace(/\D/g,"")}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700">Confirmar pelo WhatsApp</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center">
    <p style="margin:0;font-size:11px;color:#94a3b8">Magnus Imóveis · R. José do Carmo de Oliveira, 74 - Tirol, Belo Horizonte/MG</p>
    <p style="margin:3px 0 0;font-size:11px;color:#94a3b8">(31) 3321-6775 · magnusimoveisbh@hotmail.com</p>
  </td></tr>
</table>
<p style="margin:12px 0 0;font-size:10px;color:#94a3b8;text-align:center">Notificação automática — Magnus Imóveis</p>
</td></tr></table></body></html>`;

  MailApp.sendEmail({
    to: d.vendedor_email || EMAIL_CORRETOR,
    subject: "Nova visita — " + (d.nome || "sem nome") + " — " + dataFmt + " " + (d.horario || ""),
    body: "Agendamento: " + (d.nome || "—") + " | " + dataFmt + " " + (d.horario || "—") + " | " + (d.ref_imovel || "—") + " | Vendedor: " + (d.vendedor_nome || "—"),
    htmlBody: htmlAgend
  });

  return _resposta(200, "Email e Calendar enviados");
}

function _criarEventoCalendar(d) {
  try {
    const calendario = CalendarApp.getDefaultCalendar();
    const dataHoraInicio = new Date(d.data + "T" + d.horario + ":00");
    const dataHoraFim = new Date(dataHoraInicio.getTime() + 60 * 60 * 1000);
    const titulo = "Visita — " + (d.tipo_imovel || "Imóvel") + " " + (d.ref_imovel || "") + " — " + (d.nome || "cliente") + " (" + (d.vendedor_nome || "sem vendedor") + ")";
    const descricao = [
      "Cliente: " + (d.nome || "—"),
      "WhatsApp: " + (d.telefone || "—"),
      "Imóvel: " + (d.titulo_imovel || d.ref_imovel || "—"),
      "Tipo: " + (d.tipo_visita || "Presencial"),
      "Vendedor responsável: " + (d.vendedor_nome || "—"),
      "Obs: " + (d.observacoes || "nenhuma")
    ].join("\n");
    calendario.createEvent(titulo, dataHoraInicio, dataHoraFim, {
      description: descricao,
      location: "R. José do Carmo de Oliveira, 74 - Tirol, Belo Horizonte, MG"
    });
  } catch (err) {
    Logger.log("Erro Calendar: " + err.toString());
  }
}

// ===== UTILITÁRIOS =====

function _resposta(status, mensagem) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status, mensagem: mensagem }))
    .setMimeType(ContentService.MimeType.JSON);
}
