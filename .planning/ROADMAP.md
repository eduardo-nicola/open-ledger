# Roadmap: OPEN-LEDGER

## Overview

OPEN-LEDGER é construído em ordem de dependência estrita: infraestrutura e autenticação primeiro, depois gestão de contas, lançamentos manuais com tags, parcelamento automático (diferencial central do mercado brasileiro), ciclo completo de fatura de cartão, dashboard consolidado e, por último, importação CSV/OFX. Cada fase entrega uma capacidade verificável e independente — o produto já é utilizável a partir da Fase 3.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- **Phase 1: Infrastructure & Auth** - Supabase, Google OAuth, RLS, layout base Next.js mobile-first
- **Phase 01.1: E2E clarity and test confidence (TST)** (INSERTED) - Documentação, tags e contrato de execução dos testes E2E
- **Phase 2: Account Management** - CRUD de contas (banco/carteira/cartão), saldo consolidado em tempo real
- **Phase 3: Transactions & Tags** - Lançamentos manuais, status pago/a pagar, tags com filtros
- **Phase 4: Installments** - Compras parceladas geram N transações automaticamente com arredondamento correto
- **Phase 5: Credit Card Invoices** - Fatura calculada dinamicamente, fechamento manual, pagamento via conta bancária
- **Phase 6: Dashboard & Reports** - Resumo mensal, fluxo de caixa, despesas próximas, faturas abertas
- **Phase 7: CSV/OFX Import** - Importação com preview, deduplicação e perfis de banco pré-configurados

## Phase Details

### Phase 1: Infrastructure & Auth

**Goal**: Usuário pode fazer login com Google e acessar o app com seus dados totalmente isolados dos demais usuários
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):

1. Usuário pode fazer login via Google OAuth e ser redirecionado para o app
2. Sessão persiste após recarregar o navegador — usuário não precisa fazer login novamente
3. Dois usuários distintos na mesma instância não conseguem ver dados um do outro (RLS ativo)
4. Usuário pode visualizar seu nome e avatar sincronizados via Google
5. Usuário não autenticado é redirecionado para a tela de login ao acessar qualquer rota protegida
**Plans**: 6 planos em 6 waves

Plans:
- [x] 01-01-PLAN.md — Inicialização do projeto Next.js 16 + shadcn/ui zinc/dark + providers (Wave 1)
- [x] 01-02-PLAN.md — Supabase backend: CLI + schema inicial (profiles/accounts/transactions) + RLS + trigger (Wave 2)
- [x] 01-03-PLAN.md — Auth layer: clientes Supabase tipados + middleware de refresh + callback OAuth (Wave 3)
- [x] 01-04-PLAN.md — UI screens: tela de login + app shell mobile-first + tela de perfil read-only (Wave 4)
- [x] 01-05-PLAN.md — Playwright config (3 projetos) + seed SQL + stubs de teste por @auth-XX (Wave 5)
- [ ] 01-06-PLAN.md — Implementação e execução dos testes E2E + checkpoint de verificação Google OAuth (Wave 6)
**UI hint**: yes

---

### Phase 01.1: E2E clarity and test confidence (TST) (INSERTED)

**Goal:** Reduzir variações confusas nos testes E2E; documentar **Google OAuth real** (conta de teste sem 2FA) com **duas variações** (Google já logado vs login completo); em seguida executar a suíte já existente; alinhar tags com rastreabilidade (ver `.planning/TESTING-INITIATIVE.md` e `01.1-CONTEXT.md`).
**Requirements**: TST-01 … TST-07 (definidos na iniciativa; formalizar no `REQUIREMENTS.md` ao planejar)
**Depends on:** Phase 1
**Plans:** 0 plans

Plans:
- [ ] TBD (executar `/gsd-plan-phase 01.1` para detalhar)

### Phase 2: Account Management

**Goal**: Usuário pode criar e gerenciar suas contas bancárias, carteiras e cartões de crédito, vendo o saldo consolidado em tempo real
**Depends on**: Phase 01.1
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04, ACC-05
**Success Criteria** (what must be TRUE):

1. Usuário pode criar conta bancária, carteira digital ou cartão de crédito com nome, tipo e cor personalizada
2. Usuário pode editar nome/cor e arquivar uma conta existente
3. Cartão de crédito pode ser configurado com dia de fechamento e dia de vencimento
4. Tela principal exibe saldo consolidado em tempo real (soma de contas bancárias e carteiras, excluindo cartões)
5. Usuário pode visualizar o histórico de evolução de saldo por conta em gráfico de linha
**Plans**: TBD
**UI hint**: yes

---

### Phase 3: Transactions & Tags

**Goal**: Usuário pode lançar, filtrar e gerenciar receitas e despesas manualmente, organizando-as com tags personalizadas
**Depends on**: Phase 2
**Requirements**: TXN-01, TXN-02, TXN-03, TXN-04, TAG-01, TAG-02
**Success Criteria** (what must be TRUE):

1. Usuário pode lançar despesa ou receita com valor, data, descrição, conta e tags em menos de 10 segundos
2. Usuário pode marcar uma transação como paga ou a pagar, e o saldo realizado vs previsto reflete a mudança
3. Usuário pode editar e excluir qualquer transação individual
4. Usuário pode criar, editar e excluir tags com nome e cor personalizada
5. Usuário pode filtrar a lista de transações por período, conta, status (pago/a pagar) e tag
**Plans**: TBD
**UI hint**: yes

---

### Phase 4: Installments

**Goal**: Usuário pode registrar uma compra parcelada no cartão de crédito e o sistema gera automaticamente as N parcelas com os valores corretos
**Depends on**: Phase 3
**Requirements**: INST-01, INST-02, INST-03
**Success Criteria** (what must be TRUE):

1. Ao lançar compra parcelada em N vezes, N transações são criadas com o valor dividido corretamente (resto na primeira parcela) e cada uma cai na fatura correta via data calculada
2. Usuário pode cancelar uma compra parcelada inteira, removendo todas as parcelas de uma vez
3. Usuário pode editar descrição e tags de uma compra parcelada e a alteração se propaga para todas as parcelas
4. A soma das parcelas geradas é sempre exatamente igual ao valor total da compra (sem perda de centavos)
**Plans**: TBD
**UI hint**: yes

---

### Phase 5: Credit Card Invoices

**Goal**: Usuário pode visualizar a fatura atual de cada cartão, fechá-la manualmente e pagar usando saldo de uma conta bancária
**Depends on**: Phase 4
**Requirements**: INV-01, INV-02, INV-03, INV-04
**Success Criteria** (what must be TRUE):

1. Usuário vê o total da fatura atual de cada cartão calculado dinamicamente com base nas transações do período
2. Usuário pode visualizar o histórico de faturas passadas de cada cartão com seus totais
3. Usuário pode fechar a fatura manualmente, mudando seu status para "fechada"
4. Usuário pode pagar a fatura usando saldo de uma conta bancária; o saldo da conta é debitado e todas as despesas da fatura são marcadas como pagas atomicamente
5. Despesas do cartão aparecem como "a pagar" até o pagamento da fatura, sem double-counting no dashboard
**Plans**: TBD
**UI hint**: yes

---

### Phase 6: Dashboard & Reports

**Goal**: Usuário tem visão consolidada e em tempo real da saúde financeira do mês: resumo de entradas/saídas, fluxo de caixa, despesas próximas e faturas abertas
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):

1. Dashboard exibe total de entradas, total de saídas e saldo do mês atual
2. Gráfico de fluxo de caixa mostra entradas vs saídas mês a mês no histórico
3. Usuário vê lista de despesas "a pagar" com vencimento nos próximos dias para não perder nenhuma
4. Usuário vê resumo de faturas abertas e próximas de vencer de todos os cartões em um só lugar
**Plans**: TBD
**UI hint**: yes

---

### Phase 7: CSV/OFX Import

**Goal**: Usuário pode importar extratos bancários via CSV ou OFX com preview antes de confirmar, deduplicação automática e perfis de banco pré-configurados
**Depends on**: Phase 3
**Requirements**: IMP-01, IMP-02, IMP-03, IMP-04, IMP-05
**Success Criteria** (what must be TRUE):

1. Usuário pode fazer upload de arquivo CSV e importar transações para uma conta selecionada
2. Usuário pode fazer upload de arquivo OFX (extrato bancário padrão brasileiro) e importar transações
3. Antes de confirmar, usuário vê preview das transações que serão importadas
4. Transações duplicadas (mesmo account + data + valor + descrição) são detectadas e descartadas automaticamente
5. Usuário pode selecionar perfil de banco pré-configurado (Nubank, Itaú, Bradesco, Santander) para mapeamento automático de colunas CSV
**Plans**: TBD
**UI hint**: yes

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 01.1 → 2 → 3 → 4 → 5 → 6 → 7


| Phase                    | Plans Complete | Status      | Completed |
| ------------------------ | -------------- | ----------- | --------- |
| 1. Infrastructure & Auth | 0/5            | Not started | -         |
| 01.1. E2E clarity (TST)  | 0/?            | Not started | -         |
| 2. Account Management    | 0/?            | Not started | -         |
| 3. Transactions & Tags   | 0/?            | Not started | -         |
| 4. Installments          | 0/?            | Not started | -         |
| 5. Credit Card Invoices  | 0/?            | Not started | -         |
| 6. Dashboard & Reports   | 0/?            | Not started | -         |
| 7. CSV/OFX Import        | 0/?            | Not started | -         |


