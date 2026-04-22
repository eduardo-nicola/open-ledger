# OPEN-LEDGER

## What This Is

OPEN-LEDGER é um gerenciador de finanças pessoais open-source e self-hosted, construído com Next.js full-stack e Supabase. Ele permite que o usuário controle múltiplas contas bancárias, cartões de crédito e carteiras, visualize o saldo consolidado, gerencie despesas (pagas e a pagar) e pague a fatura do cartão com o saldo da conta bancária — tudo com visual moderno e mobile-first, inspirado no Mobills.

## Core Value

Visão completa e em tempo real das finanças pessoais: saldo atual consolidado de todas as contas + despesas pagas e pendentes em um único lugar.

## Requirements

### Validated

- **Contrato E2E e iniciativa TST (Phase 01.1)** — README em `tests/e2e/`, requisitos TST-01…TST-07 em `REQUIREMENTS.md`, tags AUTH 1:1, mensagens de setup acionáveis e portão de PR documentado. Validado em Phase 01.1: e2e-clarity-and-test-confidence-tst.

### Active

**Contas e Carteiras**
- [ ] Usuário pode criar e gerenciar múltiplas contas bancárias, carteiras digitais e cartões de crédito
- [ ] Saldo de cada conta é exibido em tempo real com total consolidado
- [ ] Cada conta tem tipo (banco, carteira, cartão de crédito) e moeda (BRL)

**Transações**
- [ ] Usuário pode lançar despesas e receitas manualmente com valor, data, descrição, conta e tags
- [ ] Usuário pode importar transações via arquivo CSV ou OFX (extrato bancário)
- [ ] Transações podem ser marcadas como pagas ou a pagar
- [ ] Despesas parceladas no cartão de crédito geram automaticamente N lançamentos com o valor dividido

**Cartão de Crédito e Fatura**
- [ ] Cada cartão tem data de fechamento e data de vencimento configuráveis
- [ ] Fatura do cartão é calculada automaticamente com base nas transações do período
- [ ] Usuário fecha a fatura manualmente e registra o pagamento com saldo de uma conta bancária
- [ ] Despesas do cartão aparecem como "a pagar" até o pagamento da fatura

**Tags e Categorização**
- [ ] Usuário pode criar, editar e excluir tags personalizadas
- [ ] Transações podem ter múltiplas tags
- [ ] Gastos são agrupados e filtrados por tag

**Dashboard e Relatórios**
- [ ] Dashboard mensal com resumo de entradas, saídas e saldo do período
- [ ] Visão de fluxo de caixa (entradas vs saídas por período)
- [ ] Relatório de gastos agrupados por tag/categoria

**Autenticação e Multi-usuário**
- [ ] Login exclusivamente via Google OAuth
- [ ] Múltiplos usuários podem usar a mesma instância com dados totalmente isolados
- [ ] Supabase Row Level Security (RLS) garante isolamento por usuário

### Out of Scope

- **Orçamento/limite por categoria** — diferido para v2; foco do v1 é visibilidade e controle
- **Notificações de vencimento (email/push)** — diferido para v2; usuário consulta o app ativamente
- **Login por email/senha ou GitHub** — apenas Google no v1 para simplicidade e segurança
- **Suporte a múltiplas moedas** — apenas BRL; multi-moeda aumentaria complexidade significativamente
- **Integração com Open Banking ou APIs bancárias** — self-hosted e open-source, sem dependência de terceiros pagos
- **Aplicativo mobile nativo (iOS/Android)** — web mobile-first é suficiente, evita custo de distribuição nas lojas
- **Scan de comprovante/nota fiscal** — dependeria de OCR externo, fora do escopo de self-hosted

## Context

- **Inspiração visual:** Mobills (https://www.mobills.com.br/) — UX de finanças pessoais brasileiro, mobile-first
- **Público-alvo:** Desenvolvedores e usuários técnicos que querem controle total dos dados financeiros sem depender de apps SaaS
- **Modelo de distribuição:** Open-source (GitHub), self-hosted — o único custo operacional é a hospedagem própria
- **Nome:** OPEN-LEDGER — referência ao conceito de "livro-razão aberto", transparência total nos dados pessoais

## Constraints

- **Tech Stack:** Next.js App Router (full-stack) + Supabase (Postgres + Auth + RLS) — decisão do usuário, não negociável no v1
- **Auth:** Apenas Google OAuth via Supabase Auth — simplifica onboarding e elimina gerenciamento de senhas
- **Plataforma:** Web apenas (browser) com responsividade mobile-first obrigatória — sem app nativo
- **Moeda:** BRL (Real brasileiro) apenas no v1
- **Self-hosted:** Nenhuma dependência de serviços pagos além da hospedagem — arquitetura deve ser deployável via Vercel/Railway/VPS
- **Open-source:** Código 100% público — nada de chaves hardcoded, segredos em variáveis de ambiente

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router como full-stack | Monolito simplifica deploy self-hosted; Server Actions mantêm lógica no servidor com segurança | — Pending |
| Supabase como backend | Postgres + Auth + RLS prontos; self-hostável via Supabase CE; elimina backend separado | — Pending |
| RLS no Supabase para isolamento multi-usuário | Segurança garantida no banco, sem risco de vazamento entre usuários via bugs de aplicação | — Pending |
| Google OAuth como único método de login | Remove complexidade de gerenciamento de senhas; adequado para público técnico self-hosted | — Pending |
| Parcelamento automático no cartão | Funcionalidade core de gerenciamento de crédito no Brasil — N parcelas geradas automaticamente | — Pending |
| Fatura fechada manualmente pelo usuário | Mais controle e previsibilidade; evita edge cases de cálculo automático de período | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-22 after Phase 01.1 (E2E clarity and test confidence)*
