# Configuração Google Sheets — Magnus Imóveis

## 1. Criar a planilha

Acesse: https://sheets.google.com → Criar nova planilha  
Nome sugerido: **Magnus Imóveis — Dados**

---

## 2. Criar as abas

A planilha precisa ter exatamente **3 abas** com estes nomes:

| Aba | Finalidade |
|---|---|
| `Imóveis` | Cadastro dos imóveis (lida pelo site) |
| `Leads` | Formulários "Tenho Interesse" (gravados pelo Apps Script) |
| `Agendamentos` | Solicitações de visita (gravados pelo Apps Script) |

---

## 3. Colunas da aba `Imóveis`

Coloque os seguintes cabeçalhos **na linha 1** (exatamente como escrito):

```
id | ref | tipo | finalidade | status | titulo | bairro | cidade | estado | preco | quartos | suites | banheiros | vagas | area_util | area_construida | area_terreno | fotos | descricao | destaque | data_venda
```

Valores aceitos por coluna:

| Coluna | Tipo | Exemplos |
|---|---|---|
| `id` | Número | 1, 2, 3... |
| `ref` | Texto | AP00113, CA00194 |
| `tipo` | Texto | Apartamento / Casa / Terreno |
| `finalidade` | Texto | Venda / Aluguel |
| `status` | Texto | disponivel / reservado / vendido |
| `titulo` | Texto | Apartamento espaçoso no Tirol... |
| `bairro` | Texto | Tirol (Barreiro) |
| `cidade` | Texto | Belo Horizonte |
| `estado` | Texto | MG |
| `preco` | Número | 850000 |
| `quartos` | Número | 3 (deixe vazio se não se aplica) |
| `suites` | Número | 1 |
| `banheiros` | Número | 2 |
| `vagas` | Número | 2 |
| `area_util` | Número | 190 (m²) |
| `area_construida` | Número | 190 (m²) |
| `area_terreno` | Número | 360 (m²) ou vazio |
| `fotos` | Texto | URL da foto ou `images/casa.jpg` |
| `descricao` | Texto | Texto longo do imóvel |
| `destaque` | Texto | true / false |
| `data_venda` | Texto | vazio ou 2024-01-15 |

**Fotos:** Para múltiplas fotos, separe as URLs com pipe: `url1|url2|url3`

---

## 4. Colunas da aba `Leads` (criadas pelo Apps Script)

Deixe a linha 1 vazia — o Apps Script escreve diretamente. Mas você pode adicionar cabeçalhos para referência:

```
data_hora | nome | telefone | interesse | ref_imovel | origem
```

---

## 5. Colunas da aba `Agendamentos` (criadas pelo Apps Script)

```
data_hora | nome | telefone | data_visita | horario | tipo_visita | ref_imovel | titulo_imovel | observacoes | status
```

Status: `pendente` → `confirmado` → `realizado` (você atualiza manualmente por enquanto)

---

## 6. Publicar a aba `Imóveis` como CSV

1. Menu: **Arquivo → Compartilhar → Publicar na web**
2. Em "Link", selecione: **Imóveis** e formato **Valores separados por vírgula (.csv)**
3. Clique em **Publicar**
4. Copie a URL gerada (ex: `https://docs.google.com/spreadsheets/d/SEU_ID/pub?gid=0&single=true&output=csv`)
5. Cole essa URL em `js/dados.js` → linha `const SHEETS_CSV_URL = "..."`

---

## 7. Configurar o Apps Script

1. No Sheets: **Extensões → Apps Script**
2. Apague o conteúdo padrão
3. Copie e cole todo o conteúdo do arquivo `apps-script.js` (na raiz do projeto)
4. Salve (Ctrl+S) com qualquer nome
5. **Implantar → Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu mesmo**
   - Acesso: **Qualquer pessoa, mesmo anônimo**
6. Autorize as permissões (Google Calendar + Sheets + Gmail)
7. Copie a URL da implantação (ex: `https://script.google.com/macros/s/SEU_ID/exec`)
8. Cole em `js/leads.js` → linha `const APPS_SCRIPT_URL = "..."`

---

## 8. Testar

Após configurar as duas URLs:

1. Abra `index.html` — os imóveis devem carregar da planilha
2. Clique em "Tenho Interesse" em qualquer card → preencha e envie → verifique a aba `Leads`
3. Abra um imóvel → clique "Agendar Visita" → preencha e envie → verifique a aba `Agendamentos` e o Google Calendar
4. Verifique o email `magnusimoveisbh@hotmail.com` para notificações

---

## Observação sobre CORS

O Apps Script usa `mode: 'no-cors'` no fetch, o que significa que a requisição chega ao servidor mas o navegador não lê a resposta. Isso é normal — o site mostra "sucesso" após o envio independente da resposta, e a lógica de verificação fica no painel da planilha.
