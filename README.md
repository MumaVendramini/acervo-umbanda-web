# 🌿 Acervo de Cantigas de Umbanda

Aplicação web moderna, limpa e responsiva criada para consulta rápida de cantigas de Umbanda durante a gira, estudos de curimba e impressão de apostilas litúrgicas em formato A4.

---

## 🏛️ Arquitetura de Dados (100% Google Sheets)

O site **não possui banco de dados local nem arquivos JSON fixos**. Toda a inteligência e o armazenamento residem exclusivamente na sua planilha privada do **Google Drive**:

- **Aba `Acervo`:** Contém todas as cantigas oficiais com colunas:
  `ID | Linha | Toque | Letra | Video | Autor | Origem`
  - Qualquer alteração feita nas células (letra, linha, toque ou link de vídeo) é refletida no site.
  - Para adicionar uma cantiga nova, basta inserir uma nova linha na planilha.
- **Aba `Pontos Enviados`:** Recebe automaticamente as cantigas sugeridas pelos médiuns através do botão **"➕ Enviar Ponto"**.
- **Aba `Comentários`:** Recebe as sugestões de correção enviadas pelos usuários pelo ícone de balão de cada cantiga.

---

## 📱 Recursos e Usabilidade

1. **Layout Clean para Uso na Gira:**
   - Fundo claro de alto contraste para não cansar a visão sob qualquer iluminação do terreiro.
   - **No Desktop:** Grade paralela em 2 colunas.
   - **No Mobile:** Empilhamento em 1 coluna vertical otimizado para rolagem com o polegar.
2. **Reconhecimento Imediato da Cantiga:**
   - Sem títulos artificiais.
   - **As 2 primeiras linhas sempre visíveis** no mesmo estilo e peso de fonte do restante do texto.
   - Toque no card para expandir ou recolher a cantiga completa.
3. **Controle de Fonte Dinâmico:**
   - Botões `[ A- ]` e `[ A+ ]` no topo para ajustar o tamanho da letra conforme a distância do atabaque.
4. **Offline-First (Cache Local no Celular):**
   - Ao abrir o app, as cantigas são salvas no armazenamento local do navegador (`localStorage`).
   - Se o médium estiver sem internet no terreiro, o app abre instantaneamente e funciona 100% offline.
5. **🖨️ Impressão de Apostilas A4:**
   - Botão de impressora no topo (`/imprimir`).
   - Diagramação econômica em 2 colunas com quebra de página inteligente (`break-inside: avoid` / sem cortar versos ao meio de folhas).
   - Permite imprimir a **Apostila Completa** ou **Apostila por Linha Selecionada** (ex: apenas Pretos Velhos, apenas Caboclos, etc.).
6. **🔒 Painel do Zelador (`/admin`):**
   - Acesso seguro por senha master (`umbanda2026`).
   - Indicador de **Versão Sistêmica** e controle de dados.
   - Botão para forçar a limpeza do cache local caso necessário.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 14 (App Router)
- **Estilização:** Tailwind CSS (modo clean / alto contraste)
- **Ícones:** Lucide React
- **Hospedagem & Deploy:** Vercel (com deploy contínuo via GitHub)
- **Backend / Banco de Dados:** Google Apps Script Webhook conectado ao Google Sheets

---

## 🚀 Como Executar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse no navegador: `http://localhost:3000`

