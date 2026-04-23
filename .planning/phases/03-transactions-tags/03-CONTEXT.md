# Phase 3: Transactions & Tags - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar o fluxo completo de lancamentos manuais de receitas e despesas, incluindo criacao, edicao, exclusao, status pago/a pagar e filtros por periodo, conta, status e tag.

Tambem cobre o CRUD de tags usadas nas transacoes, dentro do mesmo dominio de organizacao dos lancamentos.

</domain>

<decisions>
## Implementation Decisions

### Fluxo de lancamento
- **D-01:** Criacao e edicao de transacao acontecem em modal (nao em pagina dedicada).
- **D-02:** Defaults no formulario: data de hoje, tipo despesa, status dinamico por data, ultima conta usada.
- **D-03:** Campos obrigatorios para salvar: valor, data, conta e tipo. Descricao e tag ficam opcionais.
- **D-04:** Produtividade priorizada com salvar-e-novo, com opcao no rodape para fechar modal apos salvar.
- **D-05:** Quando houver filtro de conta ativo, o campo conta herda automaticamente esse contexto.
- **D-06:** Validacao com erros inline por campo + erro geral, sem alert bloqueante.

### Status e saldo
- **D-07:** Regra de status inicial: se `date <= hoje`, nasce como `paid`; se data futura, nasce como `pending`.
- **D-08:** Status pago/a pagar aplica-se somente a despesas.
- **D-09:** Usuario pode alternar status livremente entre pago e a pagar (estado reversivel).
- **D-10:** Troca de status acontece direto na lista (chip/toggle inline).
- **D-11:** UI exibe dois KPIs no topo: realizado e previsto, com base no mes corrente.
- **D-12:** Atualizacao de KPI deve ser otimista com revalidacao no servidor.
- **D-13:** Despesas a pagar vencidas recebem badge visual de atraso.
- **D-14:** Nao implementar trilha de auditoria de mudanca de status nesta fase.

### Tags
- **D-15:** Criacao de tag ocorre no proprio seletor de tags do formulario de transacao.
- **D-16:** Cor de tag usa paleta fixa (sem color picker livre).
- **D-17:** Exclusao de tag em uso deve ser bloqueada ate desassociacao.
- **D-18:** Ordenacao do seletor prioriza tags mais usadas recentemente.
- **D-19:** Edicao de nome/cor da tag reflete em todo o historico.
- **D-20:** Quantidade de tags por transacao: uma unica tag por transacao.
- **D-21:** Essa decisao substitui o requisito atual `TAG-02` e deve atualizar REQUIREMENTS/ROADMAP para refletir o novo contrato.

### Filtros e lista
- **D-22:** Lista ordenada por data decrescente (mais recentes primeiro).
- **D-23:** Filtros aplicam automaticamente sem botao "Aplicar".
- **D-24:** Estado de filtros persiste na URL via query params.
- **D-25:** Densidade da lista: compacta no mobile e mais confortavel no desktop.

### Claude's Discretion
- Implementacao exata de componentes de KPI (cards, metricas e microcopy).
- Estrategia de debounce para filtros automaticos.
- Estrutura final de componentes para modal/form/lista mantendo padrao do projeto.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e requisitos da fase
- `.planning/ROADMAP.md` - definicao da Fase 3 (goal, success criteria, dependencias)
- `.planning/REQUIREMENTS.md` - requisitos TXN-01..04 e TAG-01..02 (com ajuste decidido para TAG-02)

### Diretrizes globais de produto
- `.planning/PROJECT.md` - constraints de stack, auth, mobile-first e principio de produto
- `.planning/STATE.md` - decisoes acumuladas (valores em centavos, `date` sem timezone, RLS obrigatorio)

### Decisoes herdadas de fases anteriores
- `.planning/phases/01-infrastructure-auth/01-CONTEXT.md` - padroes base de infraestrutura, RLS e arquitetura de app

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/accounts/actions.ts`: padrao de Server Actions com `safeParse`, auth check e `revalidatePath`.
- `lib/accounts/schema.ts`: padrao de schema Zod e refinements de negocio.
- `components/accounts/account-form.tsx`: padrao de formulario React Hook Form + Zod + estados de erro.
- `components/layout/bottom-nav.tsx`: item `/transactions` ja existe e pode ser habilitado na fase.
- `types/database.ts`: tabela `transactions` base ja existe para expandir comportamentos desta fase.

### Established Patterns
- Fluxo server-first com App Router, Server Components para pagina e Client Components para formulario.
- Validacao unificada com Zod no cliente e no servidor.
- Revalidacao orientada por rota (`revalidatePath`) apos mutacoes.

### Integration Points
- Nova rota de transacoes deve se conectar ao app shell ja existente em `app/(app)/layout.tsx`.
- Operacoes de transacao devem atualizar refletores de saldo e listas usando o mesmo modelo das contas.
- Filtros por URL devem se integrar ao roteamento App Router para manter estado compartilhavel.

</code_context>

<specifics>
## Specific Ideas

- Modal com foco em "lancar rapido", permitindo sequencia de varios lancamentos sem sair do contexto.
- Regra inteligente de status inicial baseada na data evita classificacao manual repetitiva.
- Decisao explicita por uma tag por transacao para simplificar classificacao no v1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-transactions-tags*
*Context gathered: 2026-04-23*
