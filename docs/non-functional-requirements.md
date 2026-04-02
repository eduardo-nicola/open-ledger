# Requisitos não funcionais — Open Ledger

Este documento complementa [functional-requirements.md](./functional-requirements.md). Identificadores `RNF-xxx` servem para rastreio e critérios de aceite.

---

## 1. Segurança

### RNF-001 — Autenticação

- Autenticação via **Supabase Auth** (sessão JWT ou fluxo suportado pelo stack).
- No **MVP**, o produto **deve** expor **login com Google** como provedor social (OAuth 2.0), em conformidade com **RF-048** em [functional-requirements.md](./functional-requirements.md).
- Sessão expira conforme política do projeto; renovação transparente quando aplicável.

### RNF-006 — OAuth Google (configuração e plataformas)

- **Painel Supabase**: provedor **Google** habilitado; **Client ID** e **Client Secret** do projeto Google Cloud (OAuth consent screen e credenciais do tipo “Web application” / cliente adequado ao app).
- **Redirect URLs**: cadastrar no Supabase e no Google Cloud todas as URLs de callback exigidas pelo **web** (ex.: `https://<ref>.supabase.co/auth/v1/callback` e a rota da SPA, conforme documentação atual do Supabase) e pelo **mobile** (scheme customizado ou universal links, alinhado ao stack Expo/React Native quando existir).
- **Cliente**: usar a API recomendada pelo Supabase (`signInWithOAuth` no web com PKCE quando aplicável; fluxo equivalente no mobile) — ver [.cursor/rules/supabase-specific-rules.mdc](../.cursor/rules/supabase-specific-rules.mdc).
- **Dados de perfil**: nome/foto podem vir dos metadados do Google; persistência em `profiles` segue [data-model.md](./data-model.md).

### RNF-002 — Autorização e RLS

- **Row Level Security (RLS)** habilitada em todas as tabelas com dados do usuário.
- Políticas garantem que cada linha só seja visível/modificável pelo `user_id` dono (ou por `workspace_id` futuro, se introduzido de forma consistente).
- Operações administrativas que ignorem RLS restringem-se a **service role** apenas no backend, nunca expostas no cliente.

### RNF-003 — Storage de arquivos

- Bucket(s) do **Supabase Storage** com políticas por pasta ou prefixo por `user_id`.
- URLs públicas desabilitadas por padrão para comprovantes; acesso via URL assinada ou proxy autenticado.

### RNF-004 — Dados sensíveis (Premium / Open Finance)

- Tokens de acesso a instituições financeiras **não** armazenados em texto puro no cliente.
- Preferência por **Edge Functions** / backend com segredos em variáveis de ambiente ou vault; detalhes de implementação fora do escopo deste documento, mas o requisito é **confidencialidade** e **menor privilégio**.

### RNF-005 — Transporte e headers

- Aplicação servida sobre **HTTPS** em ambientes geridos.
- Cabeçalhos de segurança recomendados (CSP, etc.) conforme stack de deploy.

---

## 2. Privacidade e conformidade (LGPD)

### RNF-010 — Princípios

- Tratamento de dados pessoais e financeiros alinhado à **LGPD** em nível de requisito de produto (este texto **não** substitui parecer jurídico).

### RNF-011 — Direitos do titular (requisitos de produto)

- Mecanismo para **exportar** dados do usuário (quando priorizado no roadmap).
- Mecanismo para **excluir conta** e dados associados, com prazos e confirmações definidos pelo produto.

### RNF-012 — Retenção

- Política de retenção de **anexos** e logs de sincronização documentada; exclusão em cascata ou anonimização ao remover conta.

### RNF-013 — Base legal e transparência

- Política de privacidade e termos acessíveis na aplicação (conteúdo legal fora deste repositório).

---

## 3. Performance e escalabilidade

### RNF-020 — Listagens

- Listas de transações e relatórios paginados (**cursor ou offset** com limite máximo por página, ex.: 50–100 itens).
- Índices no banco alinhados a [data-model.md](./data-model.md).

### RNF-021 — Agregações

- Consultas pesadas (balanço mensal, gráficos) podem usar **views** ou **materialized views** no PostgreSQL, com estratégia de refresh documentada.

### RNF-022 — Metas orientativas

- Tempo de resposta percebido para telas principais: meta de **até 2 segundos** em condições normais de rede (ajustável por ambiente); não é SLA contratual.

---

## 4. Disponibilidade e backup

### RNF-030 — Infraestrutura

- Disponibilidade depende do **SLA do provedor Supabase** e do provedor de hospedagem do front.

### RNF-031 — Backup

- Backups gerenciados pelo Postgres/Supabase; política de restore testada em ambientes não produtivos quando o produto exigir.

---

## 5. Usabilidade e UI/UX

### RNF-040 — Responsividade

- Layout utilizável em **desktop** e **viewport móvel** comuns; componentes críticos (lançamento, filtros, totais em BRL) acessíveis sem scroll excessivo onde possível.

### RNF-041 — Feedback

- Estados de **carregamento**, **vazio** e **erro** explícitos; mensagens em português claro.

### RNF-042 — Dados e gráficos

- Valores monetários formatados em **BRL** (locale `pt-BR`) de forma consistente.
- Gráficos possuem **alternativa textual** ou **tabela resumida** quando exigido por acessibilidade (RNF-050).

---

## 6. Acessibilidade

### RNF-050 — Conformidade com diretrizes do projeto

A implementação da interface deve seguir [.cursor/rules/accessibility-guidelines.mdc](../.cursor/rules/accessibility-guidelines.mdc), incluindo:

- HTML **semântico** e hierarquia correta de headings (`h1`–`h6`).
- Contraste mínimo **4.5:1** (texto normal) e **3:1** (texto grande), salvo exceções justificadas.
- Navegação por **teclado** e gestão de **foco**; botões apenas com ícone com `aria-label` ou texto visível associado.
- Formulários: cada controle com **label** (`htmlFor` / `id`).
- Atualizações dinâmicas de erro/sucesso em região **`aria-live`** quando apropriado.
- **`tabindex`**: preferir `0` ou `-1` apenas quando necessário.
- **Landmarks** (`main`, `nav`, etc.) e **modais** com foco preso e retorno de foco ao fechar.
- **`prefers-reduced-motion`** respeitado para animações não essenciais.
- Tabelas de dados com `thead`/`tbody`, `th` e `scope` quando aplicável.

### RNF-051 — Verificação

- Uso de **axe-core** (ou equivalente) no fluxo de desenvolvimento ou CI.
- Testes manuais periódicos com leitor de tela (NVDA, VoiceOver, JAWS conforme plataforma alvo).

---

## 7. Observabilidade

### RNF-060 — Logs e métricas

- Logs de **sincronização Premium** com nível adequado (sem dados sensíveis em claro).
- Métricas ou contadores de falha de importação para diagnóstico.

---

## 8. Licenciamento e feature flags

### RNF-070 — Premium

- Recursos Premium (ex.: RF-020 a RF-022) condicionados a flag no **perfil** ou serviço de assinatura; UI deve degradar com mensagem clara para plano gratuito.

---

## 9. Qualidade e internacionalização

### RNF-080 — Idioma

- **pt-BR** como idioma principal da interface e mensagens de validação.

### RNF-081 — Consistência de domínio

- **BRL** único; sem campos de moeda ou câmbio no MVP (alinhado aos RFs).

---

## 10. Rastreabilidade de IDs

| ID     | Tema                    |
| ------ | ----------------------- |
| RNF-001–006 | Segurança          |
| RNF-010–013 | Privacidade / LGPD |
| RNF-020–022 | Performance        |
| RNF-030–031 | Disponibilidade    |
| RNF-040–042 | UI/UX              |
| RNF-050–051 | Acessibilidade     |
| RNF-060     | Observabilidade    |
| RNF-070     | Premium            |
| RNF-080–081 | Idioma / domínio   |
