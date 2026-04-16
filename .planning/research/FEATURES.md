# Features Research — OPEN-LEDGER

**Domain:** Personal Finance Manager (Gerenciador de Finanças Pessoais)
**Researched:** 2026-04-15
**Confidence:** HIGH (corroborado por análise direta do Mobills, Organizze, Firefly III, Actual Budget, YNAB, Copilot Money + literatura sobre UX de fintech)

---

## Table Stakes (Must Have para v1)

Funcionalidades que qualquer usuário espera. Ausência = produto incompleto, abandono imediato.

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|-------------|-------|
| **Múltiplas contas** (banco, carteira, cartão de crédito) | Usuário típico tem 2-4 contas diferentes | Média | Tipo da conta determina comportamento (cartão vs conta corrente) |
| **Saldo consolidado** | Visão unificada é o valor principal de ter um app | Baixa | Calculado em tempo real sobre as transações |
| **Lançamento manual de receita/despesa** | Core loop do produto — acontece toda vez que há uma transação | Baixa | Fluxo deve ser completado em < 10s |
| **Status pago / a pagar** | Controle de fluxo de caixa futuro — essencial para planejamento | Baixa | Campo booleano; afeta saldo previsto vs realizado |
| **Categorias / tags** | Agrupamento e filtragem de gastos é razão de usar o app | Baixa-Média | Tags por transação (N:N), categorias hierárquicas aumentam complexidade sem valor proporcional para v1 |
| **Gestão de cartão de crédito** (data fechamento + vencimento) | Fatura de cartão é uma das principais "dores" financeiras do brasileiro | Alta | Calendário de fatura depende da data de fechamento — lógica não-trivial |
| **Parcelamento automático** (despesa no cartão → N lançamentos) | Compra parcelada é comportamento central do consumidor brasileiro | Alta | Gera N transações com valor dividido; associadas à fatura correta |
| **Pagamento da fatura** (débita da conta bancária) | Fechar o ciclo do cartão é o que diferencia de uma planilha | Média | Cria transação de saída na conta + marca fatura como paga |
| **Dashboard mensal** (entradas, saídas, saldo do período) | Responde "quanto gastei este mês?" — pergunta #1 do usuário | Média | Agregação por período + comparativo é padrão de mercado |
| **Relatório por categoria/tag** | Responde "onde meu dinheiro vai?" — razão principal de categorizar | Média | Gráfico de pizza/barras por tag é padrão Mobills/Organizze |
| **Fluxo de caixa** (entradas vs saídas por período) | Projeção futura baseada em lançamentos "a pagar" | Média | Mostra saldo previsto além do atual |
| **Importação CSV/OFX** | Evita entrada manual massiva ao começar a usar o app | Média | OFX é padrão dos bancos brasileiros para download de extrato |
| **Multi-usuário com isolamento** | Essencial para self-hosted compartilhado | Média | RLS no Supabase resolve — não é feature de produto mas de infraestrutura |

**Referências:** Mobills (todos os itens acima são presentes), Organizze (idem exceto parcelamento avançado), Firefly III, Actual Budget.

---

## Differentiators (Vantagem Competitiva do OPEN-LEDGER)

Funcionalidades que fazem o OPEN-LEDGER se destacar como alternativa open-source self-hosted.

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| **Propriedade total dos dados** | Dados ficam no servidor do usuário — nenhuma empresa acessa | Baixa (é arquitetural) | Mobills/Organizze hospedam dados do usuário; OPEN-LEDGER não |
| **Zero subscription fees** | Custo único de hospedagem — sem R$9,90-19,90/mês | Baixa (é de modelo) | Público técnico valoriza evitar SaaS lock-in |
| **Sem integração bancária = sem risco de vazamento** | Não exige CPF + senha do banco — elimina vetor de ataque | Baixa (é de design) | Mobills pede CPF + senha; usuário técnico é cético |
| **Importação CSV/OFX como cidadão de primeira classe** | Todos os bancos brasileiros exportam extrato em OFX — fluxo de importação polido substitui bank sync | Média | Deve suportar layouts dos principais bancos (Nubank, Itaú, Bradesco, Caixa) |
| **UX focada, sem feature bloat** | Mobills tem 30+ funcionalidades; OPEN-LEDGER faz 10 muito bem | Baixa (é de decisão) | Anti-padrão confirmado: apps com muitas features têm taxa de abandono > 75% em 30 dias |
| **Mobile-first web** | Funciona no celular sem instalar app — sem dependência de loja | Baixa (é de stack) | Next.js responsivo; PWA pode ser adicionado em v2 |

---

## Brazil-Specific Considerations

Contexto e comportamentos financeiros exclusivos ou predominantes no mercado brasileiro.

### Parcelamento (Compra Parcelada no Cartão)

**Relevância: CRÍTICA — é o comportamento mais diferente do mercado internacional**

- Compras parceladas em 2x, 3x, 6x, 12x são a norma, não exceção — o cartão de crédito brasileiro é estruturalmente diferente do americano
- O valor total da compra é dividido em N parcelas, cada uma caindo na fatura do mês correspondente
- OPEN-LEDGER já decidiu: despesa parcelada → gera N lançamentos automaticamente
- **Cuidado:** A primeira parcela cai na fatura do mês vigente ou do próximo, dependendo da data de fechamento — lógica de atribuição de fatura deve respeitar isso
- Mobills trata isso como feature core; apps internacionais como YNAB/Copilot não têm equivalente

### Fatura do Cartão de Crédito

- Conceito de "dia de fechamento" (fecha o período) e "dia de vencimento" (prazo de pagamento) é culturalmente enraizado
- Usuário brasileiro entende e espera gerenciar por esses dois parâmetros separadamente
- A fatura é um objeto real: tem data, valor total, status (aberta/fechada/paga)
- Pagar fatura = debitar da conta bancária + marcar fatura como paga — é a ação mais crítica do produto

### PIX

- PIX é o meio de pagamento #1 do Brasil (73% dos brasileiros usam, segundo pesquisa 2025)
- No contexto do OPEN-LEDGER: PIX é simplesmente uma **forma de pagamento** para tagging/filtro — não requer integração
- Usuário vai querer classificar transações como "PIX enviado" ou "PIX recebido" para entender fluxo
- **Sem** PIX parcelado no OPEN-LEDGER v1 (é produto de crédito de fintechs, não feature de controle financeiro)

### Boleto

- Boleto bancário é um meio de pagamento com data de vencimento — representa uma obrigação futura
- No OPEN-LEDGER: registrar boleto = despesa "a pagar" com data de vencimento
- Sem integração com boleto real (leitura de código de barras, pagamento) — apenas registro manual
- Feature de lembrete de vencimento (v2) seria valiosa aqui

### Conceitos de Conta Brasileiros

| Tipo de Conta | Equivalente no App | Comportamento Esperado |
|---------------|-------------------|----------------------|
| Conta corrente (Bradesco, Itaú, etc.) | Conta bancária | Débitos e créditos diretos |
| Carteira digital (Nubank, PicPay, etc.) | Carteira / conta digital | Igual a conta corrente para fins de controle |
| Cartão de crédito (Nubank, Santander, etc.) | Cartão de crédito | Gera fatura; despesas são "a pagar" |
| Poupança | Conta bancária (tipo poupança) | Pode ser out-of-scope v1 |
| Vale alimentação/refeição (VR, Sodexo) | Carteira (tipo VA/VR) | Muito comum no Brasil; simples de suportar |

### Open Finance / Sincronização Automática com Bancos

- **Decisão já tomada no PROJECT.md: OUT OF SCOPE para v1**
- Correto: exige dependência de terceiros pagos (Belvo, Pluggy), ou CPF+senha do usuário (risco de segurança)
- Importação CSV/OFX cobre o caso de uso de forma mais segura e compatível com self-hosted

---

## Anti-Features (Evitar Explicitamente)

Funcionalidades que parecem óbvias mas geram complexidade desproporcional ao valor entregue.

| Anti-Feature | Por que Evitar | O que Fazer Ao Invés |
|-------------|---------------|---------------------|
| **Auto-categorização por IA** | Edge cases infinitos (Venmo, cashback, compras multi-propósito) criam correções manuais constantes; usuário passa mais tempo corrigindo que usando | Tags manuais simples — o usuário conhece seus gastos melhor que qualquer ML |
| **Sincronização automática com bancos** | Exige CPF+senha ou dependência de API paga; quebra premissa self-hosted; vetor de ataque enorme | Importação CSV/OFX — todos os bancos brasileiros exportam extrato |
| **Orçamento por categoria (budget envelopes)** | Aumenta complexidade do modelo de dados e do UX significativamente; exige discipline que a maioria abandona | Dashboard mensal com totais por tag cobre 80% do valor sem a complexidade |
| **Notificações push/email** | Requer infraestrutura separada (queue, email service); pode-se usar o app ativamente | Indicadores visuais de vencimento próximo no dashboard (v2) |
| **Rastreamento de investimentos** | Domínio completamente diferente (cotações em tempo real, rentabilidade, taxas); não é finance tracking | Out of scope — produto separado |
| **Score de crédito** | Requer integração com Serasa/SPC ou APIs pagas; não é self-hostável | N/A — produto diferente |
| **Scan de comprovante/nota fiscal** | Requer OCR externo; falha com recibos variados; não funciona self-hosted | Importação CSV/OFX cobre o caso de uso sistemático |
| **Múltiplas moedas** | Aumenta complexidade de todos os cálculos (taxas, conversões, dashboards); edge cases multiplicam | BRL apenas — 99% do público-alvo brasileiro não precisa |
| **App mobile nativo (iOS/Android)** | Custo de manutenção duplicado; distribuição via App Store cria dependência; PWA é suficiente | Web responsiva mobile-first |
| **Planejamento financeiro com metas de longo prazo** | Fora do core de tracking; requer novo modelo de dados (objetivos, prazos, contribuições) | Visibilidade atual é suficiente para v1 |
| **Importação automática de extrato via screen scraping** | Viola ToS dos bancos; frágil a qualquer mudança de UI bancária; risco legal | OFX/CSV exportado pelo próprio banco |

**Fonte do anti-padrão de feature bloat:** Pesquisa mostra que apps de finanças pessoais perdem 75% dos usuários em 30 dias, frequentemente por sobrecarga cognitiva de funcionalidades. Menos features polidas > mais features mediocres.

---

## Feature Dependencies

Dependências entre funcionalidades — ordem de implementação guiada por estas dependências.

```
Autenticação (Google OAuth)
  └── Multi-usuário com isolamento (RLS)
        └── Gestão de Contas (banco, carteira, cartão)
              ├── Lançamento de Transações (receita/despesa)
              │     ├── Tags/Categorias
              │     ├── Status pago/a pagar
              │     └── Importação CSV/OFX
              │
              └── Cartão de Crédito
                    ├── Parcelamento automático (→ N transações)
                    ├── Cálculo de fatura (por período de fechamento)
                    └── Pagamento de fatura (→ débito na conta bancária)
                          │
Dashboard e Relatórios (depende de tudo acima)
  ├── Saldo consolidado
  ├── Dashboard mensal (entradas/saídas/saldo)
  ├── Fluxo de caixa (previsto vs realizado)
  └── Gastos por tag
```

**Caminho crítico para MVP:**
1. Auth + Contas → 2. Transações básicas + Tags → 3. Cartão + Parcelamento + Fatura → 4. Dashboard

---

## UX Flow Notes

Fluxos típicos para as ações mais críticas do produto.

### Fluxo 1: Adicionar Transação Manual

**Meta:** Completar em < 10 segundos, um-mão no celular

```
[+] botão flutuante (sempre visível)
  → Escolhe tipo: Receita | Despesa | Transferência
  → Campo valor (teclado numérico abre automaticamente)
  → Descrição (opcional mas atalha categorização)
  → Conta (mostra última usada como default)
  → Tags (multi-select, busca por texto)
  → Data (default = hoje, calendar picker)
  → Status: Pago (default) | A pagar
  → [Salvar]
```

**Padrão Mobills:** O formulário de transação tem todos esses campos em uma tela única com scroll suave — sem wizard multi-passo.

### Fluxo 2: Adicionar Despesa Parcelada no Cartão

```
[+] → Despesa de cartão de crédito
  → Valor total da compra (ex: R$ 1.200,00)
  → Descrição
  → Cartão (seleção do cartão de crédito)
  → Número de parcelas (ex: 12x)
  → Data da primeira parcela (default = fatura atual com base na data de fechamento)
  → Tags
  → [Salvar] → Gera 12 lançamentos de R$ 100,00 cada
```

**Lógica de atribuição de fatura:**
- Se data da compra <= dia de fechamento do cartão → parcela 1 cai na fatura atual
- Se data da compra > dia de fechamento → parcela 1 cai na próxima fatura

### Fluxo 3: Pagar Fatura do Cartão

```
[Cartões] → Seleciona cartão → Ver fatura do mês
  → Fatura mostra: período, total, lista de despesas
  → [Pagar Fatura]
    → Seleciona conta bancária de origem
    → Valor (pre-preenchido com total da fatura, editável para pagamento parcial)
    → Data do pagamento
    → [Confirmar]
      → Cria transação de saída na conta bancária
      → Marca fatura como "paga"
      → Despesas do cartão mudam de "a pagar" → "pago"
```

**Decisão do PROJECT.md:** Fatura é fechada **manualmente** — evita edge cases de cálculo automático de período.

### Fluxo 4: Visualizar Dashboard Mensal

```
[Home / Dashboard]
  → Seletor de mês (< Março 2026 >)
  → Cards: Receitas | Despesas | Saldo do mês
  → Barra de progresso receitas vs despesas
  → Lista das últimas transações
  → Atalho para [Ver por tag] e [Fluxo de caixa]
```

**Padrão de mercado:** Mobills e Organizze usam cards no topo + lista/gráfico abaixo — usuário aprendeu este padrão.

### Fluxo 5: Importar CSV/OFX

```
[Contas] → Seleciona conta → [Importar extrato]
  → Upload do arquivo (.csv ou .ofx)
  → Preview das transações detectadas
  → Mapeamento de colunas (CSV) ou detecção automática (OFX)
  → Detecção de duplicatas (por data + valor + descrição)
  → Seleção de quais transações importar
  → Atribuição de tags (em lote ou individual)
  → [Importar]
```

**Crítico:** Detecção de duplicatas é obrigatória — usuário vai importar o mesmo arquivo duas vezes por acidente.

---

## MVP Recommendation

**Priorizar para v1 (conforme PROJECT.md):**

1. Auth + Multi-usuário (pré-requisito de tudo)
2. Gestão de contas (banco, carteira, cartão de crédito)
3. Lançamento de transações com tags e status pago/a pagar
4. Gestão de cartão + parcelamento automático + pagamento de fatura
5. Dashboard mensal + relatório por tag + fluxo de caixa
6. Importação CSV/OFX

**Diferir para v2:**
- Orçamentos/limites por categoria (PROJECT.md: Out of Scope)
- Notificações de vencimento (PROJECT.md: Out of Scope)
- Metas financeiras de longo prazo
- Lembretes de boleto próximo do vencimento
- PWA com instalação no celular
- Exportação de dados (PDF/Excel)
- Transferências entre contas (mover dinheiro entre contas do mesmo usuário)

---

## Sources

- **Mobills** (análise direta + blog oficial): https://www.mobills.com.br/blog/mobills/como-utilizar-o-mobills/ — HIGH confidence
- **Comparativo Mobills vs Organizze** (2026): https://www.golivre.com/2026/01/mobills-vs-organizze-comparacao.html — MEDIUM confidence
- **GuiaBolso** (descontinuado, absorvido pelo PicPay em 2021): múltiplas fontes — HIGH confidence
- **YNAB vs Copilot Money** (2026): https://stackswitch.app/compare/ynab-vs-copilot/ — HIGH confidence
- **Firefly III vs Actual Budget self-hosted** (2026): https://selfhostwise.com/posts/self-hosted-personal-finance-management-in-2026-firefly-iii-vs-actual-budget-complete-guide/ — HIGH confidence
- **Anti-patterns em apps de finanças** (pesquisa 2026): https://financialfitnesspassport.com/learn/why-budgeting-apps-fail-most-people — MEDIUM confidence
- **PIX usage stats Brazil 2025**: https://blog.explorenova.com.br/melhor-app-para-pix-parcelado-sem-burocracia-2025/ — MEDIUM confidence
- **UX mistakes fintech**: https://www.pragmaticcoders.com/blog/ux-mistakes-in-fintech-apps — MEDIUM confidence
