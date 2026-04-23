# Phase 3: Transactions & Tags - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23T00:00:00Z
**Phase:** 03-transactions-tags
**Areas discussed:** Fluxo de lancamento, Status e saldo, Tags, Filtros e lista

---

## Fluxo de lancamento

| Option | Description | Selected |
|--------|-------------|----------|
| Formulario inline no topo | Menos navegacao | |
| Pagina dedicada `/transactions/new` | Mais foco em tela cheia | |
| Modal de criacao | Equilibrio entre foco e velocidade | ✓ |

**User's choice:** Modal para criacao/edicao.
**Notes:** Defaults inteligentes; obrigatorios = valor/data/conta/tipo; salvar-e-novo com controle para fechar modal.

---

## Status e saldo

| Option | Description | Selected |
|--------|-------------|----------|
| Pago por padrao fixo | Menos interacao | |
| A pagar por padrao fixo | Conservador | |
| Regra por data | Pago ate hoje, futuro a pagar | ✓ |

**User's choice:** Status inicial por data (<= hoje pago; futuro a pagar).
**Notes:** Status so para despesas; toggle inline na lista; KPI realizado/previsto com update otimista; sem auditoria detalhada nesta fase.

---

## Tags

| Option | Description | Selected |
|--------|-------------|----------|
| Multiplas tags por transacao | Alinha TAG-02 atual | |
| Uma tag por transacao | Simplifica classificacao no v1 | ✓ |
| Fase 3 com uma, multi no futuro | Transicao gradual | |

**User's choice:** Uma tag por transacao e ajuste do requisito atual.
**Notes:** Criacao inline no seletor; paleta fixa; bloquear exclusao de tag em uso; ordenar por uso recente; edicao reflete historico.

---

## Filtros e lista

| Option | Description | Selected |
|--------|-------------|----------|
| Botao "Aplicar" | Controle explicito | |
| Aplicacao automatica | Menor friccao | ✓ |
| Hibrido por dispositivo | Comportamento misto | |

**User's choice:** Filtros auto-aplicados, persistidos em query params.
**Notes:** Ordenacao por data desc; densidade compacta mobile/confortavel desktop.

---

## Claude's Discretion

- Componente final dos KPIs de realizado/previsto.
- Debounce dos filtros auto-aplicados.
- Estrutura tecnica de componentes e estados.

## Deferred Ideas

Nenhuma fora de escopo foi registrada nesta sessao.
