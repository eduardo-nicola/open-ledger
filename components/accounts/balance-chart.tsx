'use client'

import Link from 'next/link'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrencyBRLFromCents } from '@/lib/format-currency'

/** Mesmo formato de pontos que `getBalanceHistoryForAccount` retorna no servidor. */
export type BalanceChartSeriesPoint = { date: string; balanceCents: number }

const chartConfig = {
  saldo: {
    label: 'Saldo',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

type BalanceChartProps = {
  series: BalanceChartSeriesPoint[]
}

export function BalanceChart({ series }: BalanceChartProps) {
  const total = series.reduce((s, p) => s + p.balanceCents, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Sem movimentação neste período.</p>
        <ButtonLink />
      </div>
    )
  }

  const data = series.map((p) => ({
    ...p,
    label: p.date,
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[21/9] min-h-[220px] w-full"
      role="img"
      aria-label="Gráfico de saldo nos últimos 30 dias"
    >
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => formatCurrencyBRLFromCents(Number(v))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => String(payload?.[0]?.payload?.date ?? '')}
              formatter={(value) => (
                <span className="font-medium tabular-nums">
                  {formatCurrencyBRLFromCents(Number(value))}
                </span>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="balanceCents"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={false}
          name="Saldo"
        />
      </LineChart>
    </ChartContainer>
  )
}

function ButtonLink() {
  return (
    <Link
      href="/transactions"
      className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Lançar primeira transação
    </Link>
  )
}
