# Segurança

## Repositório público

Este projeto é pensado para **GitHub aberto**. Nenhum segredo pode ser versionado.

- Use **`.env.local`** no desenvolvimento (já listado no `.gitignore`).
- Na **Vercel**, configure as mesmas chaves em *Settings → Environment Variables*.
- **Não** commite: `.env`, `.env*.local`, JSON de *service account* do Firebase Admin, tokens ou senhas.

## Variáveis `NEXT_PUBLIC_*`

A configuração web do Firebase (`apiKey`, `projectId`, etc.) costuma ir em variáveis públicas (`NEXT_PUBLIC_`). Isso é **esperado** no modelo Firebase Web: o controle de acesso vem de **Firebase Authentication** + **Firestore Security Rules**, não do “segredo” da API key.

Ainda assim:

- Restrinja **domínios autorizados** no Firebase Console (*Authentication → Settings → Authorized domains*), incluindo o domínio de produção da Vercel e `localhost` para dev.
- Publique as regras deste repositório ([`firestore.rules`](../firestore.rules)) no Firestore e **teste** no simulador quando possível.

### Checklist: publicar Firestore Rules

1. Abra o **mesmo projeto** Firebase usado no `.env.local` (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
2. **Firestore → Rules** → cole o conteúdo de [`firestore.rules`](../firestore.rules) → **Publicar**.
3. Confirme que não há rascunho antigo só salvo localmente sem publicar.
4. (Opcional) Use a aba **Rules playground** / simulador: autenticação com `uid` de teste e operação `list` ou `get` em `users/{uid}/cards/{id}`.
5. Se aparecer `permission-denied` no app: confira se o utilizador está logado e se o `uid` na path é o do token (não misturar projetos Firebase).

## Firestore

Os dados ficam em `users/{uid}/cards`, `users/{uid}/wallet`, `users/{uid}/transactions`. As regras permitem **read/write** apenas quando `request.auth.uid == userId`.

A lógica de negócio (limite de cartão, saldo, pagamento atômico) é aplicada no **cliente com transações** do Firestore. Para um app só familiar isso é aceitável **desde que as rules impeçam acesso cruzado entre usuários**. Evoluções futuras podem mover mutações sensíveis para o servidor com Firebase Admin (credenciais só na Vercel, nunca no repositório).

## Tier gratuito

Vercel (Hobby) e Firebase (Spark) têm limites de uso. Para dois usuários o uso típico costuma ficar dentro do gratuito; monitore quotas no console se o volume de dados crescer.
