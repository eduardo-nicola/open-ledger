# Requisitos funcionais — Open Ledger (finanças pessoais)

## 1. Visão e escopo

### 1.1 Objetivo

Aplicação web para gestão de finanças pessoais com multicontas, cartão de crédito, categorização, anexos, relatórios e (futuro) conciliação bancária para assinantes Premium.

### 1.2 Atores

- **Usuário autenticado**: pessoa com conta no sistema (Supabase Auth), dona exclusiva dos seus dados no MVP (um espaço por `auth.users`).

### 1.3 Moeda e valores

- **Moeda única**: Real brasileiro (**BRL**). Não há multi-moeda nem conversão cambial.
- **Representação técnica**: valores monetários persistidos como `numeric(12,2)` em reais (ex.: `10.50` para dez reais e cinquenta centavos), alinhado ao modelo em [data-model.md](./data-model.md) e aos tipos em [`types/finance.entities.ts`](../types/finance.entities.ts).

### 1.4 Fora do escopo do MVP (documentado para roadmap)

- Conciliação automática com instituições financeiras: requisitos em RF Premium; implementação depende de integração regulatória/provedor.

---

## 2. Convenções deste documento

Cada requisito possui identificador estável (`RF-xxx`) para rastreio em backlog e testes. Quando aplicável:

- **Pré-condições**: estado necessário antes da ação.
- **Fluxo principal**: caminho feliz.
- **Fluxos alternativos / erro**: validações, falhas de rede, permissões.
- **Pós-condições**: estado consistente após sucesso.

---

## 3. Contas e saldo

### RF-001 — Cadastrar conta

- **Descrição**: O usuário pode criar uma conta financeira classificada por tipo.
- **Tipos suportados**: conta corrente, poupança, carteira (dinheiro em espécie), investimento.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Sessão válida; nome e tipo informados.
- **Fluxo principal**: Informa nome, tipo opcionalmente instituição/notas; persiste conta vinculada ao usuário; exibe confirmação.
- **Alternativos / erro**: Nome vazio ou tipo inválido → mensagem de validação; falha de persistência → mensagem genérica e retry.
- **Pós-condições**: Conta aparece na listagem e entra no cálculo de saldo consolidado se ativa.

### RF-002 — Editar e arquivar conta

- **Descrição**: Editar metadados da conta; arquivar (soft-delete) para ocultar sem apagar histórico de transações, ou reativar.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Conta pertence ao usuário.
- **Fluxo principal**: Atualiza campos permitidos ou marca `archived_at`.
- **Alternativos / erro**: Conta inexistente ou de outro usuário → 404/forbidden conforme política.
- **Pós-condições**: Contas arquivadas não entram no saldo consolidado por padrão (comportamento documentado na UI).

### RF-003 — Saldo por conta e consolidado

- **Descrição**: Exibir saldo por conta em BRL e **saldo consolidado** (soma dos saldos das contas **ativas e não arquivadas**), derivado das transações e, se aplicável, saldo inicial configurado na conta.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Contas e transações carregadas ou agregação disponível.
- **Fluxo principal**: Calcula saldo = saldo inicial (se houver) + soma algebrica de lançamentos da conta; consolidado = soma sobre contas elegíveis.
- **Alternativos / erro**: Dados parciais → indicar carregamento ou erro.
- **Pós-condições**: Valores consistentes com a mesma regra em relatórios de evolução de saldo.

---

## 4. Cartão de crédito

### RF-010 — Cadastrar cartão

- **Descrição**: Cadastrar cartão com limite de crédito, **dia de fechamento** da fatura, **dia de vencimento** (opcional na UI se o produto fixar como obrigatório), bandeira e instituição opcional.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Dias de fechamento/vencimento válidos (1–31 conforme regra de negócio).
- **Fluxo principal**: Persiste cartão vinculado ao usuário.
- **Alternativos / erro**: Validação de limites/dias; falha de rede.
- **Pós-condições**: Cartão disponível para lançamentos.

### RF-011 — Lançamento à vista no cartão

- **Descrição**: Registrar despesa no cartão integralmente no ciclo de fatura correspondente à data da compra.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Cartão e categoria (se obrigatória) válidos.
- **Fluxo principal**: Cria transação com vínculo ao cartão; associa ao ciclo derivado da data de fechamento.
- **Pós-condições**: Valor entra na fatura do ciclo atual.

### RF-012 — Lançamento parcelado no cartão

- **Descrição**: Registrar compra parcelada; o sistema gera ou representa parcelas com índice `n` de `total`, com datas de competência futuras alocadas às faturas correspondentes.
- **Ator**: Usuário autenticado.
- **Pré-condições**: `total` ≥ 2; valor total e primeira data definidos.
- **Fluxo principal**: Persiste transação “pai” ou linhas de parcela conforme modelo de dados; cada parcela com valor e data esperada na fatura.
- **Pós-condições**: Projeção de “próximas faturas” reflete parcelas futuras.

### RF-013 — Gasto fixo vs parcelado (visualização)

- **Descrição**: Na visão de fatura e relatórios de cartão, separar **fixo** (assinaturas/recorrências com padrão definido no sistema, ex. campo `recurrence_rule` ou flag equivalente) de **parcelado** (compra com `installment_index` / `installment_total`).
- **Ator**: Usuário autenticado.
- **Pré-condições**: Lançamentos classificados conforme regras do modelo.
- **Fluxo principal**: Agrega totais por tipo na fatura selecionada.
- **Pós-condições**: Usuário identifica quanto é recorrente versus parcelado.

### RF-014 — Fatura do ciclo atual e próximas faturas

- **Descrição**: Calcular e exibir o **valor da fatura do ciclo atual** (compras à vista + parcelas com competência naquele ciclo + recorrências naquele ciclo) e **projeção das próximas faturas** com base em parcelas e recorrências futuras.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Cartão com dia de fechamento definido; dados de transações/parcelas consistentes.
- **Fluxo principal**: Determina intervalo do ciclo a partir da data de referência e do dia de fechamento; soma lançamentos elegíveis.
- **Alternativos / erro**: Cartão sem fechamento → bloquear cálculo com mensagem clara.
- **Pós-condições**: Totais alinhados às mesmas regras usadas em exportações/relatórios.

### RF-015 — Limite disponível

- **Descrição**: Exibir limite contratado e uso no ciclo atual (e opcionalmente projetado), sem ultrapassar o limite cadastrado em alertas configuráveis pelo produto.
- **Ator**: Usuário autenticado.
- **Pós-condições**: Cálculo em BRL coerente com RF-014.

---

## 5. Conciliação bancária (Premium)

### RF-020 — Conectar instituição financeira

- **Descrição**: Usuário Premium inicia fluxo de consentimento e conexão com provedor de dados (Open Finance ou integração contratada); credenciais sensíveis não ficam expostas no cliente além do fluxo seguro do provedor.
- **Ator**: Usuário autenticado com plano Premium.
- **Pré-condições**: Feature habilitada; provedor disponível.
- **Fluxo principal**: Cria registro de conexão; armazena tokens apenas de forma segura (servidor/vault — ver RNF).
- **Alternativos / erro**: Consentimento negado ou revogado → estado `revoked` e mensagem ao usuário.

### RF-021 — Sincronizar e importar movimentos

- **Descrição**: Importar lançamentos da instituição; mapear para contas e categorias; **deduplicar** contra lançamentos já existentes (ex.: por hash ou ID externo).
- **Ator**: Usuário Premium.
- **Pré-condições**: Conexão ativa.
- **Fluxo principal**: Lote de importação processado; staging → merge confirmável ou automático conforme produto.
- **Alternativos / erro**: Timeout ou API indisponível → retry e status de erro visível.

### RF-022 — Status de sincronização

- **Descrição**: Exibir última sincronização, sucesso/erro e contagem de novos itens.
- **Ator**: Usuário Premium.

---

## 6. Organização

### RF-030 — Categorias e subcategorias

- **Descrição**: CRUD de categorias hierárquicas (categoria pai e subcategoria com `parent_id`); ordenação exibida na UI.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Não criar ciclos na hierarquia.
- **Fluxo principal**: Cria/edita/remove (ou desativa) categorias.
- **Alternativos / erro**: Exclusão com transações vinculadas → reatribuir ou bloquear, conforme política documentada.
- **Pós-condições**: Filtros e gráficos por categoria refletem a árvore.

### RF-031 — Tags

- **Descrição**: CRUD de tags; associar **N:N** tags a transações; filtrar lista e relatórios por uma ou mais tags.
- **Ator**: Usuário autenticado.

### RF-032 — Anexos de comprovantes

- **Descrição**: Anexar foto ou PDF a uma transação; armazenar arquivo no Storage com metadados na tabela de anexos; visualizar e excluir anexo com permissão do dono.
- **Ator**: Usuário autenticado.
- **Pré-condições**: Tipos MIME e tamanho máximo conforme RNF.
- **Fluxo principal**: Upload → vínculo com `transaction_id` → URL assinada ou rota segura para download.
- **Alternativos / erro**: Falha de upload → rollback de metadados; mensagem ao usuário.

---

## 7. Relatórios e análises

### RF-040 — Gráficos interativos

- **Descrição**:
  - **Pizza**: distribuição de despesas (e opcionalmente receitas) por categoria no período.
  - **Linha**: evolução do saldo consolidado ao longo do tempo (pontos derivados das transações e saldos iniciais).
  - **Barras**: receitas versus despesas por período (ex.: mensal).
- **Ator**: Usuário autenticado.
- **Pré-condições**: Período selecionado; dados suficientes.
- **Pós-condições**: Dados tabulares ou resumo textual disponível para acessibilidade (ver RNF).

### RF-041 — Balanço mensal

- **Descrição**: Para cada mês calendário, exibir total de receitas, total de despesas, **resultado** (sobrou/faltou) e comparativo simples com mês anterior.
- **Ator**: Usuário autenticado.

### RF-042 — Filtros avançados

- **Descrição**: Filtrar lançamentos e bases de relatório por **período**, **categoria** (incluindo subárvore se aplicável), **conta**, **texto livre** (descrição/memorando) e **tags**.
- **Ator**: Usuário autenticado.
- **Pós-condições**: Mesmos filtros reutilizáveis entre lista e exportações, quando existirem.

---

## 8. Autenticação mínima (suporte aos RFs)

### RF-050 — Acesso aos dados apenas do próprio usuário

- **Descrição**: Todas as operações de leitura/escrita restringem dados ao `user_id` da sessão (enforçado também por RLS no banco).
- **Ator**: Sistema e usuário autenticado.

---

## 9. Rastreabilidade de IDs

| ID    | Nome resumido                          |
| ----- | -------------------------------------- |
| RF-001 | Cadastrar conta                        |
| RF-002 | Editar e arquivar conta                |
| RF-003 | Saldo por conta e consolidado          |
| RF-010 | Cadastrar cartão                       |
| RF-011 | Lançamento à vista no cartão           |
| RF-012 | Lançamento parcelado                   |
| RF-013 | Fixo vs parcelado (visualização)       |
| RF-014 | Fatura atual e próximas                |
| RF-015 | Limite disponível                      |
| RF-020 | Conectar instituição (Premium)         |
| RF-021 | Sincronizar movimentos (Premium)       |
| RF-022 | Status de sincronização                |
| RF-030 | Categorias hierárquicas                |
| RF-031 | Tags                                   |
| RF-032 | Anexos                                 |
| RF-040 | Gráficos                               |
| RF-041 | Balanço mensal                         |
| RF-042 | Filtros avançados                      |
| RF-050 | Isolamento por usuário                 |
