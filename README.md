# OpenLedger

App **Next.js** (App Router) chamado **OpenLedger**, para uso familiar: cartões de crédito com limite e fatura, **saldo em conta** separado e **pagamento de fatura** debitando a conta. Interface **mobile-first**, com coluna central no desktop (estilo “app no centro da tela”).

- **UI:** [HeroUI](https://www.heroui.com/) (ex-NextUI) + Tailwind CSS v4  
- **Auth + dados:** Firebase Authentication (Google) + Firestore  
- **Hospedagem sugerida:** Vercel (variáveis de ambiente no painel, sem commit de segredos)

## Requisitos

- [Bun](https://bun.com/docs/installation) 
- Conta Firebase com projeto em modo gratuito (Spark) e Firestore ativado

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   bun install
   ```

2. Copie [`.env.example`](.env.example) para `.env.local` e preencha com os valores do Firebase (*Project settings → Your apps → Firebase SDK snippet*).

3. No **Firebase Console**:

   - Ative **Google** como provedor de login (*Authentication → Sign-in method*).
   - Crie o banco **Firestore** (modo produção ou teste, conforme sua preferência).
   - Cole as **Security Rules** do arquivo [`firestore.rules`](firestore.rules) (aba *Firestore → Rules* → Publicar).
   - Em *Authentication → Settings → Authorized domains*, adicione `localhost` e o domínio da Vercel em produção.

4. Rode o projeto:

   ```bash
   bun run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

**Nota (Firestore):** o app usa `onSnapshot` em tempo real com **três listeners estáveis** (carteira, cartões, transações recentes) enquanto estás autenticado — trocar de ecrã não recria esses listeners. Cada alteração nos dados gera leituras conforme a [tabela de preços/cotas](https://firebase.google.com/docs/firestore/quotas) do Firebase. Acesso a dados e mutações estão em [`services/finance/`](services/finance/) e [`services/firebase/`](services/firebase/).

## Scripts

| Comando        | Descrição        |
|----------------|------------------|
| `bun run dev`  | Desenvolvimento  |
| `bun run build`| Build produção   |
| `bun run start`| Servidor produção|
| `bun run lint` | ESLint           |

## Deploy na Vercel

1. Conecte o repositório GitHub ao painel da Vercel (*Add New Project*).
2. Em *Environment Variables*, cadastre as mesmas chaves de `.env.example` (valores do Firebase), marcando *Production* (e *Preview* se quiser).
3. Após o primeiro deploy, copie o domínio (ex.: `seu-app.vercel.app`) e adicione em *Firebase → Authentication → Settings → Authorized domains*.
4. Publique as regras do Firestore ([`firestore.rules`](firestore.rules)) no console do Firebase (não dependem da Vercel).

## Documentação

- [Segurança e repositório público](docs/SECURITY.md)
- [Modelo de dados Firestore](docs/DATA_MODEL.md)

## Licença

Uso pessoal / código aberto conforme o repositório. Não há garantias; use por sua conta e risco.
