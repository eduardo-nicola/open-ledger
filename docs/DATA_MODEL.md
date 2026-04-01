# Modelo de dados (Firestore)

Estrutura sob `users/{uid}/` (alinhada às Security Rules em [`firestore.rules`](../firestore.rules)):

## `wallet/main`

Documento único com o **saldo em conta** (separado dos cartões).

| Campo           | Tipo   | Descrição                          |
|-----------------|--------|------------------------------------|
| `balanceCents`  | number | Saldo em centavos (inteiro)        |
| `updatedAt`     | number | Timestamp simples (ms), opcional   |

Criado automaticamente na primeira sessão ou ao lançar movimentação na conta.

## `cards/{cardId}`

| Campo          | Tipo   | Descrição                                |
|----------------|--------|-------------------------------------------|
| `name`         | string | Nome do cartão                            |
| `limitCents`   | number | Limite de crédito em centavos             |
| `usedCents`    | number | Fatura atual (quanto já foi usado)        |
| `createdAt`    | number | Ordenação / exibição                      |

- **Despesa no cartão** aumenta `usedCents` (respeitando `limitCents`).
- **Pagamento com saldo em conta** diminui `usedCents` e debita `wallet/main.balanceCents` na mesma transação.

## `transactions/{txId}`

| Campo           | Tipo   | Descrição                                                                 |
|-----------------|--------|---------------------------------------------------------------------------|
| `type`          | string | Ver tipos abaixo                                                          |
| `amountCents`   | number | Valor em centavos                                                         |
| `date`          | string | Data ISO `YYYY-MM-DD` (ou string de data escolhida na UI)                  |
| `description`   | string | Texto livre                                                               |
| `creditCardId`  | string | ID do cartão quando aplicável; `null` para movimentos só de conta        |
| `createdAt`     | number | Ordenação                                                                 |
| `userId`        | string | Redundante com o path; útil para auditoria                              |

### Tipos (`type`)

| Valor                         | Significado                                      |
|-------------------------------|--------------------------------------------------|
| `expense_card`                | Compra/despesa no cartão                         |
| `account_credit`              | Entrada de dinheiro na conta                     |
| `account_debit`               | Saída da conta (não cartão)                      |
| `card_payment_from_account`   | Pagamento da fatura usando saldo em conta      |

## Fluxo: pagar cartão com a conta

1. Lê `wallet/main` e `cards/{id}`.
2. Valida: `amountCents <= balanceCents` e `amountCents <= usedCents`.
3. Atualiza ambos e grava um `transactions` com `type: card_payment_from_account`.

Implementado com **`runTransaction`** do Firestore para atomicidade.
