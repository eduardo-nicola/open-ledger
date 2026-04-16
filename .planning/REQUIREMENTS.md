# Requirements: OPEN-LEDGER

**Defined:** 2026-04-15
**Core Value:** Visão completa e em tempo real das finanças pessoais: saldo atual consolidado de todas as contas + despesas pagas e pendentes em um único lugar.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Usuário pode fazer login exclusivamente via Google OAuth
- [ ] **AUTH-02**: Sessão do usuário persiste entre recarregamentos do navegador
- [ ] **AUTH-03**: Múltiplos usuários podem usar a mesma instância com dados totalmente isolados via RLS
- [ ] **AUTH-04**: Usuário pode visualizar e editar seu perfil (nome, avatar via Google)

### Accounts

- [ ] **ACC-01**: Usuário pode criar conta bancária, carteira digital ou cartão de crédito com nome, tipo e cor personalizada
- [ ] **ACC-02**: Usuário pode editar e arquivar contas existentes
- [ ] **ACC-03**: Usuário pode configurar cartão de crédito com dia de fechamento e dia de vencimento
- [ ] **ACC-04**: Usuário vê saldo consolidado em tempo real (soma de contas bancárias e carteiras, excluindo cartões)
- [ ] **ACC-05**: Usuário vê histórico de evolução de saldo por conta (gráfico de linha)

### Transactions

- [ ] **TXN-01**: Usuário pode lançar despesa ou receita manualmente com valor, data, descrição, conta e tags
- [ ] **TXN-02**: Usuário pode marcar transação como paga ou a pagar (afeta saldo realizado vs previsto)
- [ ] **TXN-03**: Usuário pode editar e excluir transações individuais
- [ ] **TXN-04**: Usuário pode visualizar lista de transações filtrada por período, conta, status (pago/a pagar) e tag

### Installments

- [ ] **INST-01**: Usuário pode lançar compra parcelada no cartão; o sistema gera automaticamente N transações com valor corretamente dividido (resto na primeira parcela)
- [ ] **INST-02**: Usuário pode cancelar uma compra parcelada inteira (exclui todas as parcelas de uma vez)
- [ ] **INST-03**: Usuário pode editar descrição e tags de uma compra parcelada, aplicando a alteração em todas as parcelas

### Invoice

- [ ] **INV-01**: Usuário vê a fatura atual de cada cartão calculada dinamicamente com base nas transações do período
- [ ] **INV-02**: Usuário pode visualizar histórico de faturas passadas de cada cartão
- [ ] **INV-03**: Usuário pode fechar a fatura do cartão manualmente (muda status para "fechada")
- [ ] **INV-04**: Usuário pode pagar a fatura usando saldo de uma conta bancária; o sistema registra o pagamento como transação do tipo "pagamento de fatura" e marca as despesas da fatura como pagas atomicamente

### Tags

- [ ] **TAG-01**: Usuário pode criar, editar e excluir tags com nome e cor personalizada
- [ ] **TAG-02**: Usuário pode atribuir múltiplas tags a uma única transação

### Dashboard

- [ ] **DASH-01**: Usuário vê resumo do mês atual: total de entradas, total de saídas e saldo do período
- [ ] **DASH-02**: Usuário vê gráfico de fluxo de caixa mostrando entradas vs saídas por mês (histórico)
- [ ] **DASH-03**: Usuário vê lista de despesas "a pagar" com vencimento nos próximos dias
- [ ] **DASH-04**: Usuário vê resumo de faturas abertas e vencendo em breve de todos os cartões

### Import

- [ ] **IMP-01**: Usuário pode importar transações a partir de arquivo CSV (extratos genéricos)
- [ ] **IMP-02**: Usuário pode importar transações a partir de arquivo OFX (formato padrão dos bancos brasileiros)
- [ ] **IMP-03**: Usuário vê preview das transações antes de confirmar a importação
- [ ] **IMP-04**: O sistema detecta e descarta automaticamente transações duplicadas (por hash de account_id + date + amount + description)
- [ ] **IMP-05**: O sistema oferece perfis de banco pré-configurados (Nubank, Itaú, Bradesco, Santander) para mapeamento automático de colunas CSV

---

## v2 Requirements

### Budget

- **BUDG-01**: Usuário pode definir limite/orçamento mensal por tag ou categoria
- **BUDG-02**: Usuário recebe indicador visual quando está próximo ou acima do limite

### Notifications

- **NOTF-01**: Usuário recebe lembrete de vencimento de fatura do cartão
- **NOTF-02**: Usuário recebe lembrete de despesas "a pagar" próximas ao vencimento
- **NOTF-03**: Usuário pode configurar preferências de notificação (email)

### Reports

- **REP-01**: Usuário vê relatório de gastos por tag/categoria com gráfico de pizza
- **REP-02**: Usuário pode exportar relatórios em PDF ou Excel
- **REP-03**: Usuário vê visão anual com resumo mensal

### Transactions

- **TXN-05**: Transferência entre contas do mesmo usuário (débita uma conta, credita outra)
- **TXN-06**: Transações recorrentes (gera automaticamente em intervalos configuráveis)
- **TXN-07**: Busca por descrição de transação

### Installments

- **INST-04**: Cancelar apenas uma parcela específica
- **INST-05**: Cancelar parcelas restantes a partir de uma data

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login por email/senha ou GitHub | Apenas Google no v1 — simplifica onboarding e elimina gerenciamento de senhas |
| Aplicativo mobile nativo (iOS/Android) | Web mobile-first é suficiente; evita custo de distribuição nas lojas |
| Múltiplas moedas | Apenas BRL; multi-moeda aumentaria complexidade do modelo de dados significativamente |
| Sync automático com bancos (Open Finance/APIs) | Dependência de terceiros pagos; incompatível com filosofia self-hosted e open-source |
| Scan de comprovante/nota fiscal (OCR) | Requer serviço externo de OCR; fora do escopo self-hosted |
| Metas de longo prazo (savings goals) | Diferido para milestones futuros |
| Múltiplos usuários em uma conta (conta compartilhada família) | Aumenta complexidade de permissões; diferido para v2+ |
| Auto-categorização por IA | Dependência de API paga; incompatível com self-hosted puro |
| Integração com Google Sheets / planilhas | Scope creep; exportação CSV cobre o caso de uso básico |

---

## Traceability

*Atualizado em 2026-04-15 após criação do roadmap.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 — Infrastructure & Auth | Pending |
| AUTH-02 | Phase 1 — Infrastructure & Auth | Pending |
| AUTH-03 | Phase 1 — Infrastructure & Auth | Pending |
| AUTH-04 | Phase 1 — Infrastructure & Auth | Pending |
| ACC-01 | Phase 2 — Account Management | Pending |
| ACC-02 | Phase 2 — Account Management | Pending |
| ACC-03 | Phase 2 — Account Management | Pending |
| ACC-04 | Phase 2 — Account Management | Pending |
| ACC-05 | Phase 2 — Account Management | Pending |
| TXN-01 | Phase 3 — Transactions & Tags | Pending |
| TXN-02 | Phase 3 — Transactions & Tags | Pending |
| TXN-03 | Phase 3 — Transactions & Tags | Pending |
| TXN-04 | Phase 3 — Transactions & Tags | Pending |
| TAG-01 | Phase 3 — Transactions & Tags | Pending |
| TAG-02 | Phase 3 — Transactions & Tags | Pending |
| INST-01 | Phase 4 — Installments | Pending |
| INST-02 | Phase 4 — Installments | Pending |
| INST-03 | Phase 4 — Installments | Pending |
| INV-01 | Phase 5 — Credit Card Invoices | Pending |
| INV-02 | Phase 5 — Credit Card Invoices | Pending |
| INV-03 | Phase 5 — Credit Card Invoices | Pending |
| INV-04 | Phase 5 — Credit Card Invoices | Pending |
| DASH-01 | Phase 6 — Dashboard & Reports | Pending |
| DASH-02 | Phase 6 — Dashboard & Reports | Pending |
| DASH-03 | Phase 6 — Dashboard & Reports | Pending |
| DASH-04 | Phase 6 — Dashboard & Reports | Pending |
| IMP-01 | Phase 7 — CSV/OFX Import | Pending |
| IMP-02 | Phase 7 — CSV/OFX Import | Pending |
| IMP-03 | Phase 7 — CSV/OFX Import | Pending |
| IMP-04 | Phase 7 — CSV/OFX Import | Pending |
| IMP-05 | Phase 7 — CSV/OFX Import | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 — traceability preenchida após criação do roadmap (7 fases)*
