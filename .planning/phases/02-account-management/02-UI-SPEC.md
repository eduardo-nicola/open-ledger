---
phase: 2
slug: account-management
status: draft
extends: .planning/phases/01-infrastructure-auth/01-UI-SPEC.md
created: 2026-04-22
---

# Phase 2 — UI Design Contract: Account Management

> Contrato visual e de interação para contas bancárias, carteiras digitais e cartões. **Tokens, tipografia, cores base e app shell** permanecem os da Fase 1 (`01-UI-SPEC.md`).

---

## Screens em Escopo — Fase 2

| Screen | Rota | Requisito | Descrição |
|--------|------|-----------|-----------|
| Lista de contas | `/accounts` | ACC-01, ACC-02, ACC-04 | Lista unificada (ativas + arquivadas na mesma lista). Topo: **saldo consolidado** (soma checking + digital_wallet, exclui credit_card e `archived_at` não nulo). Itens arquivados: opacidade reduzida + badge “Arquivada” ou equivalente PT-BR. |
| Nova conta | `/accounts/new` | ACC-01, ACC-03 | Fluxo por tipo: **Conta bancária** → `checking`; **Carteira digital** → `digital_wallet`; **Cartão de crédito** → `credit_card` + campos **dia de fechamento** e **dia de vencimento** no mesmo formulário. |
| Editar conta | `/accounts/[id]/edit` | ACC-02, ACC-03 | Nome, cor (paleta), dias do cartão se aplicável; permitir edição mesmo com conta arquivada (D-08). |
| Detalhe da conta | `/accounts/[id]` | ACC-05 | **Gráfico de linha** — período padrão **últimos 30 dias**; seletor de intervalo opcional (implementação em Claude's Discretion). Empty state amigável + CTA “Lançar primeira transação” (rota pode ser stub `#` ou `/transactions` placeholder até Fase 3). |

**Não escopo UI:** tipo `savings` em qualquer seletor ou rótulo (D-02).

---

## Navegação

- Item **Contas** (`Landmark`) no bottom nav e sidebar: **ativo** e navega para `/accounts`.
- Demais itens fora da Fase 2 podem permanecer desabilitados com tooltip “Em breve”, como na Fase 1.

---

## Paleta de cor da conta (D-11)

- **8 a 12 cores pré-definidas** em círculos/swatches (sem input hex obrigatório).
- Valor persistido: alinhar ao schema (ex.: token Tailwind ou string enum estável) — o plano técnico define o formato exato.
- Cor selecionada: anel `ring-2 ring-primary` ou borda `border-primary` no swatch ativo.

---

## Lista — hierarquia visual

1. Bloco **Consolidado** (ACC-04): tipografia **Display** ou **Heading** da escala Fase 1 para o valor monetário; label em **Body** muted (“Saldo total” ou microcopy equivalente).
2. Lista: por item — ícone por tipo, nome (**Heading** truncado se necessário), saldo da conta em **Body** alinhado à direita.
3. Cartão de crédito: pode exibir saldo da conta ou “—” conforme decisão de produto no plano; **nunca** incluir cartão no número do consolidado.

---

## Formulários — cartão (ACC-03)

- Dois campos numéricos inteiros **fechamento** e **vencimento** (1–31 ou regra escolhida no plano, documentada).
- `FormDescription` curto explicando o uso (fatura futura).
- Erros inline via componentes shadcn (`FormMessage`).

---

## Gráfico (ACC-05)

- Biblioteca: **Recharts** via bloco **chart** do shadcn (`ChartContainer`, `ChartTooltip`, tema `--chart-*`), dark/zinc consistente com Fase 1.
- Eixo X: datas; eixo Y: saldo em BRL formatado (valores internos em centavos).
- **Sparkline** na lista: apenas se não comprometer densidade mobile (D-12); caso omitido, apenas ícone ou nada.

---

## Componentes shadcn sugeridos — Fase 2

| Componente | Uso |
|------------|-----|
| `Card` | Bloco consolidado, cards de conta |
| `Form` + `Input` + `Select` | Criação/edição |
| `Button` | Salvar, cancelar, arquivar |
| `DropdownMenu` | Ações por conta (editar, arquivar) |
| `Badge` | “Arquivada” |
| `AlertDialog` | Confirmar arquivar (recomendado) |
| `Chart*` (registry chart) | Gráfico de evolução |

---

## Copywriting — Fase 2 (PT-BR)

| Elemento | Copy sugerida (ajustável mantendo tom Mobills/financeiro BR) |
|----------|----------------------------------------------------------------|
| Título lista | Contas |
| CTA nova conta | Nova conta |
| Tipos (cards de escolha) | Conta bancária · Carteira digital · Cartão de crédito |
| Arquivar | Arquivar conta |
| Reativar (se existir ação) | Desarquivar |
| Empty lista | Nenhuma conta ainda — CTA Nova conta |
| CTA gráfico vazio | Lançar primeira transação |

---

## Acessibilidade — adições

- Swatches de cor: `role="radiogroup"` + `aria-checked` por opção.
- Gráfico: texto alternativo ou `aria-label` resumindo tendência quando possível.

---

## Checker Sign-Off

- [ ] Dimensões herdadas da Fase 1 (tipografia, cor, espaçamento): consistentes
- [ ] ACC-01 a ACC-05 cobertos por telas/copy acima
- [ ] Mobile-first e touch 44px nos CTAs principais

**Approval:** pending
