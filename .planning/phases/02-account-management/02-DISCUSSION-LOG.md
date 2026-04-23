# Phase 2: Account Management — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md`.

**Date:** 2026-04-22
**Phase:** 02-account-management
**Areas discussed:** Tipos na UI, Saldo consolidado, Arquivar, Cartão (datas), Cor, Gráfico ACC-05

---

## Tipos de conta na UI

| Option | Description | Selected |
|--------|-------------|----------|
| Duas opções corrente/poupança desde o início | checking / savings explícitos | |
| Fluxo em dois passos | Banco → subtipo | |
| Banco único centralizador | checking como único tipo bancário na prática do produto | ✓ (via resposta livre) |
| Claude decide | Priorizar simplicidade | |

**User's choice:** Conta bancária como **centralizador** (corrente como modelo único de “banco”); poupança não como decisão de produto — organização por **nome/uso** do cliente.

**Notes:** savings removido totalmente da UI nesta fase (próxima pergunta).

---

## Poupança (`savings`) na interface

| Option | Description | Selected |
|--------|-------------|----------|
| Ocultar na criação | Expor só Banco (=checking), Carteira, Cartão | |
| Fluxo avançado | savings só em “outro tipo” | |
| Não usar savings em lugar nenhum da UI | Fase 2 não promove nem grava savings pela UI | ✓ |

**User's choice:** Não usar `savings` na UI nesta fase.

---

## Rótulos carteira / cartão

| Option | Description | Selected |
|--------|-------------|----------|
| PT-BR longos | “Carteira digital”, “Cartão de crédito” | |
| PT-BR curtos | “Carteira”, “Cartão” | |
| Claude decide | Alinhado Mobills / app shell | ✓ |

---

## Saldo consolidado (“tempo real”)

| Option | Description | Selected |
|--------|-------------|----------|
| Após mutação | Server Actions + revalidação/refetch | |
| Supabase Realtime | Subscrição em `accounts` | |
| Híbrido | Mutação + Realtime extra | |
| Claude decide | Simplicidade, menos WebSocket na v1 | ✓ |

---

## Arquivar — visibilidade

| Option | Description | Selected |
|--------|-------------|----------|
| Ocultar + aba Arquivadas | Lista separada | |
| Lista única estilo arquivada | Mesma lista, dimmed; fora do consolidado | ✓ |
| Ocultar sem aba | “Mostrar arquivadas” toggle | |
| Claude decide | | |

---

## Arquivar — edição

| Option | Description | Selected |
|--------|-------------|----------|
| Edição permitida | Nome/cor/dias do cartão | ✓ |
| Somente leitura até reativar | | |
| Edição limitada | | |
| Claude decide | | |

---

## Cartão — quando informar dias

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo wizard de criação | Campos ao escolher tipo Cartão | ✓ |
| Após criar | Detalhe / completar depois | |
| Opcional com badge | | |
| Claude decide | | |

---

## Cartão — validação dos dias

| Option | Description | Selected |
|--------|-------------|----------|
| 1–31 com último dia do mês | | |
| 1–28 na Fase 2 | | |
| Claude decide | Alinhado Fase 5 fatura | ✓ |

---

## Cor da conta

| Option | Description | Selected |
|--------|-------------|----------|
| Paleta fixa | 8–12 cores | ✓ |
| Paleta + hex custom | | |
| Só hex / picker livre | | |
| Claude decide | | |

---

## Gráfico ACC-05 — escopo na UI

| Option | Description | Selected |
|--------|-------------|----------|
| Só detalhe da conta | | |
| Lista + detalhe | Mini sparkline na lista | |
| Claude decide | Começar pelo detalhe; lista só se não poluir mobile | ✓ |

---

## Gráfico — período padrão

| Option | Description | Selected |
|--------|-------------|----------|
| 30 dias | | ✓ |
| 90 dias | | |
| YTD | | |
| Claude decide | | |

---

## Gráfico — sem dados

| Option | Description | Selected |
|--------|-------------|----------|
| Linha flat + copy | | |
| Empty + CTA primeira transação | | ✓ |
| Ocultar bloco | | |
| Claude decide | | |

---

## Claude's Discretion

- Rótulos PT-BR exatos (carteira/cartão/banco).
- Mecanismo técnico de atualização de saldo (sem Realtime por padrão).
- Biblioteca e granularidade do gráfico; sparkline na lista se couber.
- Regras finas de validação de dia do cartão coerentes com Fase 5.

## Deferred Ideas

- Realtime multi-dispositivo como melhoria futura.
- Expor `savings` na UI em milestone futuro.
