# Magnus Imóveis — Planejamento de Sprints

**Projeto:** Landing page Magnus Imóveis  
**Cliente:** Magnus Imóveis (via Zeta Tech)  
**Stack:** HTML · CSS · JS vanilla · Google Sheets · Google Apps Script · Vercel  
**Última atualização:** 2026-06-02 (Sprint 5 — concluído)

---

## Decisões de arquitetura

| Decisão | Escolha |
|---|---|
| Dados dos imóveis | Google Sheets (planilha pública para leitura) |
| Captação de leads | Google Sheets via Google Apps Script webhook |
| Agendamento de visitas | Modal na página de detalhe → Apps Script → Google Calendar |
| Conta Google (inicial) | Gmail pessoal; migração para corporativo = trocar conta + republicar script |
| Painel de administração | Painel visual (`admin.html`) com senha local |
| Financiamento | Calculadora própria (SAC/PRICE, equivalente à Caixa) |
| Fotos | Genéricas por tipo por enquanto; individuais por imóvel depois |
| Página de detalhe | `imovel.html?ref=XXX` (modelo: site Imobex atual) |
| Deploy | Vercel (subdomínio por ora, domínio próprio depois) |

**Ordem de execução definida:** Sprint 1 → Sprint 3 → Sprint 2 → Sprint 4 → Sprint 5

---

## Sprint 0 — Base responsiva ✅ Concluído

### Entregues
- [x] Landing page responsiva (HTML/CSS/JS)
- [x] Header com logo, topbar com contatos
- [x] Hero com barra de busca (comprar/alugar · tipo · cidade · bairro · valor)
- [x] Grid de imóveis com filtros 100% front-end
- [x] Cards com foto genérica por tipo, badge de status, botão WA
- [x] Seção CTAs (Cadastre / Encomende / Financie / Compre·Alugue)
- [x] Seção Sobre com mapa, Footer completo
- [x] Botão WhatsApp flutuante com animação pulse
- [x] Mobile: header compacto, logo centralizado, overflow-x corrigido
- [x] Fotos genéricas por tipo: `terreno.jpg`, `casa.jpg`, `apartamento.jpg`

---

## Sprint 1 — Detalhe do imóvel + JSON ✅ Concluído

### Objetivo
Cada imóvel tem sua própria página de detalhes. Os dados saem do `app.js` hardcoded para um arquivo `imoveis.json` estruturado.

### 1.1 — Migrar dados para `imoveis.json`
- [x] Criar `imoveis.json` com os 14 imóveis atuais
- [x] Estrutura completa com: `id`, `ref`, `tipo`, `finalidade`, `status`, `titulo`, `bairro`, `cidade`, `estado`, `preco`, `quartos`, `suites`, `banheiros`, `vagas`, `area_util`, `area_construida`, `area_terreno`, `fotos`, `descricao`, `destaque`, `data_venda`
- [x] `status` aceita: `"disponivel"` / `"reservado"` / `"vendido"`
- [x] `app.js` migrado para `fetch("imoveis.json")` em vez de dados inline
- [x] Cards continuam funcionando após migração

### 1.2 — Página `imovel.html`
- [x] Header idêntico ao da landing (compartilhado)
- [x] Galeria de fotos com carrossel (navegação por setas + swipe mobile + teclado)
- [x] Badge de status (VENDA / ALUGUEL) + preço em destaque
- [x] Referência, tipo, cidade e bairro
- [x] Especificações: quartos · suítes · banheiros · vagas · área útil · área construída · área terreno
- [x] Descrição longa formatada
- [x] Banner WhatsApp "Atendimento pelo WhatsApp" com botão destacado
- [x] Ações laterais (desktop) / empilhadas (mobile):
  - "Falar online com um corretor" → WhatsApp
  - "Agendar uma visita" → modal placeholder (Sprint 2.4)
  - "Simular financiamento" → modal placeholder (Sprint 3)
- [x] Seção "Imóveis Semelhantes" (mesmo tipo e cidade, excluindo o atual, máx. 3)
- [x] URL: `imovel.html?ref=CA00194`

### 1.3 — Integração landing → detalhe
- [x] Botão "Ver Detalhes" nos cards linka para `imovel.html?ref=XXX`
- [x] Cards com status "vendido" exibem overlay, mas continuam clicáveis
- [x] `imovel.js` criado para carregar e renderizar a página de detalhe

### Critério de conclusão
✅ Clicar em qualquer card abre a página de detalhe com todos os dados, galeria e imóveis semelhantes funcionando no mobile.

---

## Sprint 3 — Calculadora de financiamento ✅ Concluído

> Executado antes do Sprint 2 porque entrega valor imediato ao usuário final.

### Objetivo
Simular financiamento com acurácia equivalente à calculadora da Caixa Econômica Federal.

### 3.1 — Modal da calculadora
- [x] Abre a partir da página de detalhe (botão "Simular financiamento") e da seção CTAs (landing)
- [x] Campos:
  - Valor do imóvel (preenchido automaticamente quando vem de um imóvel)
  - Valor de entrada — slider com % e R$ em tempo real (mínimo 20%)
  - Renda mensal familiar — input numérico (opcional)
  - Prazo — slider de 5 a 35 anos
  - Sistema de amortização — toggle SAC / PRICE
- [x] Validações: entrada mín. 20%, aviso quando parcela > 30% da renda

### 3.2 — Cálculo (arquivo `calculadora.js`)
- [x] Taxa padrão: 10,5% a.a. SBPE = 0,875% a.m. (constante configurável)
- [x] **SAC:** Total juros = PV × i × (n+1)/2; exibe 1ª parcela, última parcela, total pago, total de juros
- [x] **PRICE:** PMT = PV × i × (1+i)^n / ((1+i)^n - 1); exibe parcela fixa, total pago, total de juros
- [x] Resultado atualiza em tempo real conforme sliders
- [x] Disclaimer: "Simulação estimada. Condições reais sujeitas à análise de crédito."

### 3.3 — CTA pós-simulação
- [x] "Quero este imóvel" → WhatsApp com resumo completo da simulação na mensagem
- [x] "Ver na Caixa Econômica" → link externo para simulador oficial

### Critério de conclusão
✅ Simulação de R$650.000, entrada 20%, 30 anos, SAC: 1ª parcela ≈ R$5.994,44 — dentro de ±2% da Caixa.

---

## Sprint 2 — Google Sheets como banco de dados ✅ Concluído

### Objetivo
Imóveis lidos de planilha Google. Leads captados direto na planilha. Sem backend próprio.

### 2.1 — Planilha de imóveis (Google Sheets)
- [x] `app.js` e `imovel.js` migrados para ler CSV via `js/dados.js`
- [x] Parser CSV → objeto JS equivalente ao JSON do Sprint 1
- [x] Cache `sessionStorage` 5 min implementado (fallback automático para `imoveis.json`)
- [x] Planilha criada com abas `Imóveis`, `Leads`, `Agendamentos`
- [x] URL do CSV configurada em `js/dados.js → SHEETS_CSV_URL` *(configuração feita em conjunto com Sprint 4)*

### 2.2 — Google Apps Script — Webhook de leads
- [x] Código do Apps Script em `apps-script.js` (raiz do projeto)
- [x] Endpoint único: campo `tipo: "lead"` ou `tipo: "agendamento"` diferencia as rotas
- [x] Grava na aba `Leads` com timestamp + envia email HTML ao corretor
- [x] Email HTML profissional com branding Magnus, campos estruturados e botão WA
- [x] Apps Script implantado como Web App — URL configurada em `js/leads.js → APPS_SCRIPT_URL`
- [x] Email de notificação configurado para `silasribeiro11@gmail.com`

### 2.3 — Formulário de captação na landing e no detalhe
- [x] Modal "Tenho Interesse" criado dinamicamente por `js/leads.js`
- [x] Botão "Tenho Interesse" nos cards da landing (outlined dourado)
- [x] Botão "Tenho Interesse" na sidebar da página de detalhe
- [x] Campos: Nome · WhatsApp (com máscara) · Interesse · Imóvel (auto-preenchido, readonly)
- [x] Submit → POST para o Apps Script → mensagem de confirmação visual
- [x] Fallback: se Apps Script falhar → abre WhatsApp pré-preenchido
- [x] Debounce de 10s no submit (anti-spam)
- [x] Header escuro (navy + borda dourada) com ícone flat dourado — padrão visual das modais

### 2.4 — Agendamento de visitas + Google Calendar
- [x] Modal "Agendar Visita" criado dinamicamente por `js/leads.js`
- [x] Botão "Agendar uma visita" na sidebar conectado ao modal
- [x] Campos: Nome · WhatsApp · Data (calendário customizado, mín. amanhã) · Horário (30 em 30 min, 09h–18h) · Tipo (presencial/online) · Imóvel · Obs
- [x] Datepicker vanilla JS customizado (substitui input nativo do browser)
- [x] Submit → POST para Apps Script → confirmação visual com data/horário formatados
- [x] Apps Script cria evento no Google Calendar com título, descrição e local
- [x] Registro gravado na aba `Agendamentos` (status inicial: pendente)
- [x] Corretor recebe email HTML com todos os detalhes da visita + botão WA
- [x] Fallback: se Apps Script não estiver configurado → WA pré-preenchido com dados do agendamento
- [x] Header escuro (navy + borda dourada) — padrão visual das modais

### Critério de conclusão
✅ Testado e validado: lead → grava em `Leads` + email HTML recebido. Agendamento → grava em `Agendamentos` + evento criado no Google Calendar + email HTML recebido.

---

## Sprint 4 — Painel administrativo ✅ Concluído

### Objetivo
Corretor gerencia imóveis inteiramente pelo painel visual — sem abrir código, sem abrir planilha.
O Google Sheets é o banco de dados, mas fica **invisível** para o corretor; o admin.html é a interface única.

### Arquitetura de dados
```
Corretor → admin.html → Apps Script (token secreto) → Google Sheets
Site público ← CSV publicado ← Google Sheets
Leads/Agendamentos → Apps Script → Google Sheets (automático)
```

**Pré-requisito (feito pelo desenvolvedor, 1 vez):**
- Criar planilha com abas `Imóveis`, `Leads`, `Agendamentos` (ver `SHEETS_SETUP.md`)
- Publicar aba `Imóveis` como CSV → URL no `js/dados.js`
- Publicar Apps Script como Web App → URL no `js/leads.js` e em `js/admin.js`

### 4.1 — Autenticação (`admin.html`)
- [x] Tela de login com logo Magnus e campo de senha
- [x] Senha comparada com hash SHA-256 armazenado em `localStorage`
- [x] Sessão expira após 8h de inatividade (renova a cada acesso)
- [x] Botão "Sair" limpa sessão e redireciona para login
- [x] Tela de setup inicial (primeira vez): define senha + token do Apps Script

### 4.2 — Dashboard de imóveis
- [x] Contador topo: total · disponíveis · reservados · vendidos · destaques
- [x] Lista de imóveis com busca rápida (ref/título/bairro) e filtro por status e tipo
- [x] Cada linha: ref, título, tipo, status (badge colorido), preço, destaque (★)
- [x] Ações rápidas inline: mudar status · marcar/desmarcar destaque · excluir
- [x] Duplicar imóvel — botão 📋 abre drawer pré-preenchido com ref vazia
- [x] Exportar PDF dos imóveis filtrados (cabeçalho Magnus, tabela gold/navy, rodapé com paginação)

### 4.3 — Formulário de cadastro e edição
- [x] Abre como drawer lateral ao clicar em "Novo imóvel" ou "Editar"
- [x] Campos em seções: Identificação · Localização · Características · Valores · Fotos/Vídeos · Descrição
- [x] Drop-downs pré-configurados para tipo, finalidade e status
- [x] Upload de fotos e vídeos com preview de thumbnail; links YouTube/Vimeo com thumbnail automática
- [x] Preview do card em tempo real (atualiza enquanto digita)
- [x] Calendário moderno (Flatpickr, tema gold) para data de venda
- [x] Validação de campos obrigatórios antes de salvar

### 4.4 — Extensão do Apps Script para CRUD de imóveis
- [x] Rotas autenticadas: `admin_criar`, `admin_editar`, `admin_status`, `admin_deletar`
- [x] Rotas de leitura privada: `admin_listar_leads`, `admin_listar_agendamentos`, `admin_status_agendamento`
- [x] Token secreto (`ADMIN_TOKEN`) verificado antes de qualquer escrita
- [x] Token armazenado em `localStorage` — nunca hardcoded no HTML

### 4.7 — Melhorias pós-conclusão (mesma sessão)
- [x] `FP_LOCALE` extraído como constante — todos os Flatpickrs do projeto reusam a mesma config pt-BR
- [x] Exportar PDF dos agendamentos filtrados por status
- [x] Header da coluna "★" renomeado para "Destaque"

### 4.5 — Aba de agendamentos
- [x] Lista com filtro por status (pendente · confirmado · realizado · cancelado)
- [x] Ação: confirmar visita (atualiza planilha + abre WA pré-preenchido para o cliente)
- [x] Ação: cancelar visita (atualiza planilha + abre WA)
- [x] Ação: marcar como realizado
- [x] Datas e horários exibidos corretamente (fix de conversão do Sheets)
- [x] Telefone formatado com máscara (xx) xxxxx-xxxx

### 4.6 — Aba de leads
- [x] Lista com data, nome, WhatsApp (com máscara), interesse e imóvel de interesse
- [x] Busca por nome, telefone ou ref do imóvel
- [x] Clique no telefone abre WA diretamente
- [x] Filtro por data (De / Até) com Flatpickr — combina com busca por texto
- [x] Exportar PDF dos leads filtrados (período, busca, total, tabela formatada)

### Critério de conclusão ✅
Corretor acessa `admin.html`, faz login, cadastra um imóvel novo preenchendo um formulário e o imóvel aparece no site em até 5 minutos — sem abrir a planilha, sem tocar em código.

### Ação pendente (desenvolvedor)
Após qualquer alteração no `apps-script.js`, republicar o Apps Script:
**Google Apps Script → Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**

---

## Sprint 5 — SEO, Analytics e Deploy ✅ Concluído

### Objetivo
Site no ar no Vercel, rastreável no Google Analytics, indexável no Google Search.

### 5.1 — SEO técnico
- [x] `<meta>` tags OG e Twitter Card na landing (`index.html`)
- [x] `<meta>` tags OG e Twitter Card estáticas na página de detalhe (`imovel.html`)
- [x] OG tags atualizadas dinamicamente por `js/imovel.js` ao carregar o imóvel
- [x] Schema.org `RealEstateAgent` na landing (JSON-LD)
- [x] Schema.org `RealEstateListing` injetado por `js/imovel.js` para cada imóvel
- [x] `robots.txt` — bloqueia `admin.html`, libera tudo mais, aponta para sitemap
- [x] `sitemap.xml` — cobre `/` e `/imovel.html`
- [x] `<link rel="canonical">` em ambas as páginas

### 5.2 — Google Analytics 4
- [x] Tag GA4 instalada em `index.html` e `imovel.html` (ID: `G-V355TXQ9Q3` — substituir)
- [x] `js/analytics.js` — helpers de evento + tracking global de cliques WA
- [x] Evento `search` → `buscar()` em `app.js`
- [x] Evento `view_item` → `renderPage()` em `imovel.js` + clique "Ver Detalhes" em `app.js`
- [x] Evento `contact_whatsapp` → qualquer clique em `a[href*="wa.me"]` (global)
- [x] Evento `lead_form_submit` → submit bem-sucedido em `leads.js`
- [x] Evento `simulation_start` → abertura do modal em `calculadora.js`

✅ Measurement ID real do GA4 substituído em `index.html` (2x), `imovel.html` (2x) e `js/analytics.js`.

### 5.3 — Deploy no Vercel
- [x] `vercel.json` criado com headers de cache (CSS/JS/imagens: 1 ano; HTML: sem cache)
- [x] Repositório no GitHub criado e conectado ao Vercel
- [x] Deploy automático a cada `git push` na branch `main`
- [x] Domínio `magnus-imoveis.vercel.app` configurado
- [x] HTTPS automático ativo

### 5.4 — Performance
- [x] Lazy loading já aplicado em cards (`app.js`), galeria (`imovel.js`) e iframe do mapa
- [x] Primeira imagem da galeria com `loading="eager"` para LCP
- [x] Lighthouse score ≥ 90 em mobile ✅ verificado
- [x] Tempo de carregamento < 2s em 4G ✅ verificado

### Critério de conclusão ✅
Site no ar, Lighthouse ≥ 90, evento de clique no WA aparecendo no painel do GA4.

---

## Resumo geral

| Sprint | Foco | Principais entregas | Status | Ordem |
|---|---|---|---|---|
| 0 | Base responsiva | Landing page, filtros, cards, mobile | ✅ Concluído | — |
| 1 | Detalhe do imóvel + JSON | `imoveis.json`, `imovel.html`, carrossel, semelhantes | ✅ Concluído | 1º |
| 3 | Calculadora de financiamento | Modal SAC/PRICE, cálculo em tempo real, CTA WA | ✅ Concluído | 2º |
| 2 | Google Sheets + leads + agendamento | Sheets como DB, formulário de lead, agendamento → Google Calendar | ✅ Concluído | 3º |
| 4 | Painel administrativo | `admin.html`, CRUD imóveis, gestão de agendamentos, exportação PDF | ✅ Concluído | 4º |
| 5 | SEO + Analytics + Deploy | GA4, Open Graph, Schema.org, Vercel, Lighthouse ≥ 90 | ✅ Concluído | 5º |

---

## Estrutura de arquivos — estado final planejado

```
magnus-imoveis/
├── index.html              ✅ feito
├── imovel.html             ✅ sprint 1
├── admin.html              ✅ sprint 4
├── imoveis.json            ✅ sprint 1
├── css/
│   └── styles.css          ✅ feito
├── js/
│   ├── app.js              ✅ feito (fetch do JSON no sprint 1, Sheets no sprint 2)
│   ├── imovel.js           ✅ sprint 1
│   ├── calculadora.js      ✅ sprint 3
│   └── admin.js            ✅ sprint 4
└── images/
    ├── logo.png            ⚠️ colocar manualmente
    ├── terreno.jpg         ✅ genérica
    ├── casa.jpg            ✅ genérica
    └── apartamento.jpg     ✅ genérica
```

## Google ecosystem — abas da planilha

| Aba | Conteúdo | Quem escreve |
|---|---|---|
| `Imóveis` | Cadastro de imóveis | Admin (sprint 4) |
| `Leads` | Formulários "Tenho Interesse" | Apps Script (sprint 2) |
| `Agendamentos` | Solicitações de visita | Apps Script (sprint 2) |
