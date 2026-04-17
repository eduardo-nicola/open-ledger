# Iniciativa: confiança e clareza nos testes (OPEN-LEDGER)

**Criado:** 2026-04-17  
**Relaciona-se a:** Fase 1 (Playwright + auth), mas pode ser executado em paralelo aos planos restantes da Fase 1.

## O que é (mini projeto)

Um escopo fechado para **reduzir variações confusas**, **documentar um único caminho “oficial” de execução** e **alinhar tags de teste com os requisitos** — para que `npm run test:e2e:*` e o CI signifiquem sempre a mesma coisa.

## Problema hoje (diagnóstico objetivo)

- **Dois modos de autenticação no setup** (`E2E_AUTH_MODE=password` padrão vs `google`), com comportamentos bem diferentes — o padrão atual sugere “atalho” por API, enquanto o produto é **Google OAuth**.
- **Três entradas de script** (`test:e2e:smoke`, `test:e2e:auth`, `test:e2e:google`) sem uma matriz documentada de “quando uso qual”.
- **Tags misturadas**: `@smoke` + `@auth-XX` onde o mesmo `@auth-04` aparece em vários testes com asserções diferentes (dificulta rastrear exigência ↔ teste ↔ roadmap).
- **Projetos Playwright**: `setup` → `chromium` (autenticado) e `chromium-unauth` — correto, mas falta uma página “como rodar” que amarre **env + duas variações Google** (sessão já presente vs login completo).

## Valor central (o que não pode falhar)

> O caminho **definitivo** de confiança é **login Google real** (OAuth na UI), usando **uma conta de teste dedicada sem 2FA**. A suíte cobre explicitamente **duas variações**: (A) Google **já logado** no browser; (B) Google **ainda não logado** — após o setup bem-sucedido, rodam-se **os demais testes E2E já existentes** com o mesmo contrato documentado e **mapeamento 1:1** entre requisito de auth e tag de teste.

## Requisitos (TST-IDs) — v1 desta iniciativa

### Documentação e contrato de execução

- [ ] **TST-01**: Existe documentação curta (README ou `tests/e2e/README.md`) com: pré-requisitos (`supabase db reset`, `.env.local`), variáveis obrigatórias, e **matriz** “modo × comando × quando usar”.
- [ ] **TST-02**: O caminho **padrão** (local + documentação de PR) está explícito: auth por **Google OAuth real** com conta de teste **sem 2FA** (segredos em env); **Variação A** (sessão Google já presente) e **Variação B** (login completo até `/profile`) descritas passo a passo.
- [ ] **TST-03**: O caminho por **email/senha + API Supabase** (injeção de sessão sem OAuth) está explícito como **secundário ou só debug**, nunca como substituto silencioso do login Google quando se fala em “teste de confiança”.

### Tags e rastreabilidade

- [ ] **TST-04**: Cada teste `@smoke` usa **no máximo um** identificador de requisito de roadmap (`@auth-01` …) **sem reutilizar o mesmo ID** para cenários diferentes; ou os IDs são renomeados para granularidade (ex.: `@auth-04a`, `@auth-04b`) com tabela no README.
- [ ] **TST-05**: `npm run test:e2e:auth` e `test:e2e:smoke` têm semântica documentada (subconjunto vs conjunto; grep atual `@auth` vs `@smoke`).

### Estabilidade e confiança

- [ ] **TST-06**: Falhas comuns do setup (`auth.setup`, seed, cookies) produzem mensagens que apontam **uma** correção (ex.: “rode seed”, “falta env X”).
- [ ] **TST-07**: Lista mínima de “definição de pronto” para PR: quais jobs E2E rodam no CI e qual modo de auth.

## Fora de escopo (por ora)

- Cobertura E2E de Fases 2+ (contas, transações, etc.).
- Substituir Playwright por outra ferramenta.
- Testes de carga ou visual regression.

## Mini roadmap (fases curtas)

| # | Fase | Meta | Requisitos |
|---|------|------|------------|
| 1 | **Contrato de execução** | README + matriz (Variação A/B Google, env, CI) | TST-01, TST-02, TST-03 |
| 2 | **Higiene de tags** | Renomear/documentar tags 1:1 com AUTH-XX | TST-04, TST-05 |
| 3 | **Mensagens e DX** | Erros de setup mais acionáveis | TST-06 |
| 4 | **Portão de PR** | Checklist / job CI alinhado ao TST-07 | TST-07 |

## Próximos passos no GSD

1. **Não** rode `/gsd-new-project` de novo neste repo (projeto já inicializado).
2. Para planejar e executar esta iniciativa como trabalho formal: **`/gsd-insert-phase 1.1`** (ou decimal que couber) com título tipo *E2E clarity & confidence*, colando o bloco de requisitos acima como escopo; em seguida **`/gsd-plan-phase 1.1`**.
3. Alternativa rápida: tratar como tarefas dentro do plano **`01-06-PLAN.md`** (Wave 6) se preferir não abrir fase decimal.

## Evolution

Atualize este arquivo quando TST-* forem concluídos ou quando novos modos de teste forem introduzidos (ex.: staging dedicado, service role em teste isolado).

---
*Última atualização: 2026-04-17 — iniciativa derivada de pedido de mini projeto de testes.*
