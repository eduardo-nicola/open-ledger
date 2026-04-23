import { z } from 'zod'

/** Tipos expostos na UI (D-02: sem `savings`). */
export const accountUiType = z.enum(['checking', 'digital_wallet', 'credit_card'])

export type AccountUiType = z.infer<typeof accountUiType>

export const accountNameSchema = z.string().min(1).max(120)

/** Dez swatches estáveis (D-11); valor persistido em `accounts.color` como hex. */
export const ACCOUNT_COLOR_SWATCHES = [
  { token: 'emerald', hex: '#059669' },
  { token: 'sky', hex: '#0284c7' },
  { token: 'violet', hex: '#7c3aed' },
  { token: 'amber', hex: '#d97706' },
  { token: 'rose', hex: '#e11d48' },
  { token: 'cyan', hex: '#0891b2' },
  { token: 'fuchsia', hex: '#c026d3' },
  { token: 'lime', hex: '#65a30d' },
  { token: 'orange', hex: '#ea580c' },
  { token: 'indigo', hex: '#4f46e5' },
] as const

export type AccountColorToken = (typeof ACCOUNT_COLOR_SWATCHES)[number]['token']

export const accountColorSchema = z.enum([
  'emerald',
  'sky',
  'violet',
  'amber',
  'rose',
  'cyan',
  'fuchsia',
  'lime',
  'orange',
  'indigo',
])

export function accountColorTokenToHex(token: AccountColorToken): string {
  const row = ACCOUNT_COLOR_SWATCHES.find((s) => s.token === token)
  return row?.hex ?? '#059669'
}

/** Dias do cartão — obrigatórios apenas quando o tipo efetivo for `credit_card` (D-09). */
export const creditCardDaysSchema = z.object({
  closing_day: z.number().int().min(1).max(31),
  due_day: z.number().int().min(1).max(31),
})

export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    type: accountUiType,
    color: accountColorSchema,
    closing_day: z.number().int().min(1).max(31).optional(),
    due_day: z.number().int().min(1).max(31).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'credit_card') {
      if (data.closing_day == null || data.due_day == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe dia de fechamento e dia de vencimento do cartão.',
          path: ['closing_day'],
        })
        ctx.addIssue({
          code: 'custom',
          message: 'Informe dia de fechamento e dia de vencimento do cartão.',
          path: ['due_day'],
        })
      }
    }
  })

export const updateAccountSchema = z
  .object({
    id: z.string().uuid(),
    name: accountNameSchema.optional(),
    type: accountUiType.optional(),
    color: accountColorSchema.optional(),
    closing_day: z.number().int().min(1).max(31).nullable().optional(),
    due_day: z.number().int().min(1).max(31).nullable().optional(),
    archived_at: z.union([z.string().min(1), z.null()]).optional(),
  })
  .superRefine((data, ctx) => {
    const effectiveType = data.type
    if (effectiveType === 'credit_card') {
      if (data.closing_day == null || data.due_day == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe dia de fechamento e dia de vencimento do cartão.',
          path: ['closing_day'],
        })
      }
    }
  })
