'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAccount, updateAccount } from '@/lib/accounts/actions'
import {
  ACCOUNT_COLOR_SWATCHES,
  accountColorSchema,
  accountNameSchema,
  createAccountSchema,
  updateAccountSchema,
  type AccountUiType,
} from '@/lib/accounts/schema'
import { hexToAccountColorToken } from '@/lib/accounts/color-utils'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type AccountRow = Database['public']['Tables']['accounts']['Row']

type AccountFormProps =
  | { mode: 'create'; defaultType: AccountUiType }
  | { mode: 'edit'; account: AccountRow }

export function AccountForm(props: AccountFormProps) {
  if (props.mode === 'create') {
    return <CreateAccountForm defaultType={props.defaultType} />
  }
  return <EditAccountForm account={props.account} />
}

type CreateValues = z.infer<typeof createAccountSchema>

function CreateAccountForm({ defaultType }: { defaultType: AccountUiType }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      type: defaultType,
      color: 'emerald',
      closing_day: undefined,
      due_day: undefined,
    },
  })

  const type = form.watch('type')

  async function onSubmit(values: CreateValues) {
    setServerError(null)
    const res = await createAccount(values)
    if ('error' in res) {
      setServerError(res.error ?? 'Erro ao salvar')
      return
    }
    router.push('/accounts')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="Ex.: Nubank" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div role="radiogroup" aria-label="Cor da conta" className="flex flex-wrap gap-3">
                  {ACCOUNT_COLOR_SWATCHES.map((swatch) => {
                    const selected = field.value === swatch.token
                    return (
                      <button
                        key={swatch.token}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          'h-10 w-10 rounded-full border-2 transition-shadow',
                          selected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-transparent'
                        )}
                        style={{ backgroundColor: swatch.hex }}
                        onClick={() => field.onChange(swatch.token)}
                      />
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'credit_card' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="closing_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de fechamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      inputMode="numeric"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de vencimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      inputMode="numeric"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Salvar
        </Button>
      </form>
    </Form>
  )
}

const editFieldsSchema = z
  .object({
    name: accountNameSchema,
    color: accountColorSchema,
    closing_day: z.number().int().min(1).max(31).optional(),
    due_day: z.number().int().min(1).max(31).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.closing_day != null && data.due_day == null) {
      ctx.addIssue({ code: 'custom', message: 'Informe o vencimento.', path: ['due_day'] })
    }
    if (data.due_day != null && data.closing_day == null) {
      ctx.addIssue({ code: 'custom', message: 'Informe o fechamento.', path: ['closing_day'] })
    }
  })

type EditValues = z.infer<typeof editFieldsSchema>

function EditAccountForm({ account }: { account: AccountRow }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isCreditCard = account.type === 'credit_card'

  const form = useForm<EditValues>({
    resolver: zodResolver(editFieldsSchema),
    defaultValues: {
      name: account.name,
      color: hexToAccountColorToken(account.color),
      closing_day: account.closing_day ?? undefined,
      due_day: account.due_day ?? undefined,
    },
  })

  async function onSubmit(values: EditValues) {
    setServerError(null)
    if (isCreditCard && (values.closing_day == null || values.due_day == null)) {
      setServerError('Informe dia de fechamento e dia de vencimento do cartão.')
      return
    }
    const payload =
      isCreditCard ?
        {
          id: account.id,
          name: values.name,
          color: values.color,
          type: 'credit_card' as const,
          closing_day: values.closing_day ?? null,
          due_day: values.due_day ?? null,
        }
      : {
          id: account.id,
          name: values.name,
          color: values.color,
        }
    const parsed = updateAccountSchema.safeParse(payload)
    if (!parsed.success) {
      setServerError(parsed.error.issues.map((i) => i.message).join(' '))
      return
    }
    const res = await updateAccount(parsed.data)
    if ('error' in res) {
      setServerError(res.error ?? 'Erro ao salvar')
      return
    }
    router.push(`/accounts/${account.id}`)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div role="radiogroup" aria-label="Cor da conta" className="flex flex-wrap gap-3">
                  {ACCOUNT_COLOR_SWATCHES.map((swatch) => {
                    const selected = field.value === swatch.token
                    return (
                      <button
                        key={swatch.token}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          'h-10 w-10 rounded-full border-2 transition-shadow',
                          selected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-transparent'
                        )}
                        style={{ backgroundColor: swatch.hex }}
                        onClick={() => field.onChange(swatch.token)}
                      />
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCreditCard ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="closing_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de fechamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de vencimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Salvar alterações
        </Button>
      </form>
    </Form>
  )
}
