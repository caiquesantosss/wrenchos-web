import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

import { SummaryCard } from '../../components/cards'
import { getAllOrders } from '../../features/orders/api/orders-request'
import { getAllFinanceiroWithOS } from '../../features/finance/api/financeiro'
import styles from './indicadores.module.css'

export const Route = createFileRoute('/_indicadores/indicadores')({
  component: RouteComponent,
})

type Periodo = '6meses' | '3meses' | '30dias'

interface ItemOS {
  quantidade: number | string
  valor_unitario: number | string
  valor_total?: number | string
}

interface OrdemServico {
  data_abertura: string
  status: string
  valor_total: number | string
  itens_os?: ItemOS[]
}

interface LancamentoFinanceiro {
  tipo_lancamento: 'RECEITA' | 'DESPESA'
  status_pagamento: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO'
  data_pagamento?: string | null
  data_vencimento?: string | null
  valor: number | string
}

interface StatusData {
  name: string
  value: number
  color: string
}

interface AreaData {
  name: string
  receita: number
  despesa: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ABERTA: { label: 'Aberta', color: '#dc2626' },
  EM_DIAGNOSTICO: { label: 'Em diagnóstico', color: '#7c3aed' },
  AGUARDANDO_APROVACAO: {
    label: 'Aguardando aprovação',
    color: '#64748b',
  },
  REVISAO_ORCAMENTO: {
    label: 'Revisão de orçamento',
    color: '#a855f7',
  },
  EM_EXECUCAO: { label: 'Em execução', color: '#0d9488' },
  AGUARDANDO_PECA: { label: 'Aguardando peça', color: '#0284c7' },
  CONCLUIDA: { label: 'Concluída', color: '#d97706' },
  ENCERRADA: { label: 'Encerrada', color: '#16a34a' },
  CANCELADA: { label: 'Cancelada', color: '#94a3b8' },
}

const STATUS_PADRAO = {
  label: 'Outros',
  color: '#94a3b8',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numberFormatter = new Intl.NumberFormat('pt-BR')

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStatus(status: string): string {
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

function getDate(value?: string | null): Date | null {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function getPeriodStart(periodo: Periodo): Date {
  const date = new Date()

  if (periodo === '30dias') {
    date.setDate(date.getDate() - 29)
  } else {
    date.setMonth(date.getMonth() - (periodo === '3meses' ? 2 : 5))
    date.setDate(1)
  }

  date.setHours(0, 0, 0, 0)

  return date
}

function isWithinPeriod(date: Date | null, startDate: Date): boolean {
  if (!date) return false

  return date >= startDate && date <= new Date()
}

function normalizeArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[]
  }

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: T[] }).data
  }

  return []
}

function getFinancialDate(financeiro: LancamentoFinanceiro): Date | null {
  return getDate(
    financeiro.data_pagamento ?? financeiro.data_vencimento,
  )
}

function getPeriodLabel(date: Date, periodo: Periodo): string {
  if (periodo === '30dias') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  return date.toLocaleDateString('pt-BR', {
    month: 'short',
  }).replace('.', '')
}

function getChartData(
  financeiro: LancamentoFinanceiro[],
  periodo: Periodo,
  startDate: Date,
): AreaData[] {
  const buckets = new Map<string, AreaData>()

  if (periodo === '30dias') {
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const key = date.toISOString().slice(0, 10)

      buckets.set(key, {
        name: getPeriodLabel(date, periodo),
        receita: 0,
        despesa: 0,
      })
    }
  } else {
    const months = periodo === '3meses' ? 3 : 6

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate)
      date.setMonth(startDate.getMonth() + i)

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`

      buckets.set(key, {
        name: getPeriodLabel(date, periodo),
        receita: 0,
        despesa: 0,
      })
    }
  }

  financeiro.forEach((lancamento) => {
    if (lancamento.status_pagamento !== 'PAGO') return

    const date = getFinancialDate(lancamento)

    if (!isWithinPeriod(date, startDate) || !date) return

    const key =
      periodo === '30dias'
        ? date.toISOString().slice(0, 10)
        : `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}`

    const bucket = buckets.get(key)

    if (!bucket) return

    const value = toNumber(lancamento.valor)

    if (lancamento.tipo_lancamento === 'RECEITA') {
      bucket.receita += value
    }

    if (lancamento.tipo_lancamento === 'DESPESA') {
      bucket.despesa += value
    }
  })

  return Array.from(buckets.values())
}

export default function RouteComponent() {
  const [periodo, setPeriodo] = useState<Periodo>('6meses')

  const {
    data: ordensResponse,
    isLoading: loadingOrdens,
    isError: errorOrdens,
  } = useQuery({
    queryKey: ['ordens', 'todas'],
    queryFn: getAllOrders,
  })

  const {
    data: financeiroResponse,
    isLoading: loadingFinanceiro,
    isError: errorFinanceiro,
  } = useQuery({
    queryKey: ['financeiro', 'com-os'],
    queryFn: getAllFinanceiroWithOS,
  })

  const ordens = useMemo(
    () => normalizeArray<OrdemServico>(ordensResponse),
    [ordensResponse],
  )

  const financeiro = useMemo(
    () => normalizeArray<LancamentoFinanceiro>(financeiroResponse),
    [financeiroResponse],
  )

  const indicadores = useMemo(() => {
    const startDate = getPeriodStart(periodo)

    const ordensPeriodo = ordens.filter((ordem) =>
      isWithinPeriod(getDate(ordem.data_abertura), startDate),
    )

    const lancamentosPeriodo = financeiro.filter((lancamento) =>
      isWithinPeriod(getFinancialDate(lancamento), startDate),
    )

    const lancamentosPagos = lancamentosPeriodo.filter(
      (lancamento) => lancamento.status_pagamento === 'PAGO',
    )

    const receitas = lancamentosPagos
      .filter((lancamento) => lancamento.tipo_lancamento === 'RECEITA')
      .reduce((total, lancamento) => total + toNumber(lancamento.valor), 0)

    const despesas = lancamentosPagos
      .filter((lancamento) => lancamento.tipo_lancamento === 'DESPESA')
      .reduce((total, lancamento) => total + toNumber(lancamento.valor), 0)

    const ordensConcluidas = ordensPeriodo.filter((ordem) =>
      ['CONCLUIDA', 'ENCERRADA'].includes(normalizeStatus(ordem.status)),
    ).length

    const ticketMedio =
      ordensPeriodo.length > 0
        ? ordensPeriodo.reduce(
            (total, ordem) => total + toNumber(ordem.valor_total),
            0,
          ) / ordensPeriodo.length
        : 0

    const taxaConclusao =
      ordensPeriodo.length > 0
        ? (ordensConcluidas / ordensPeriodo.length) * 100
        : 0

    const statusMap = new Map<string, StatusData>()

    ordens.forEach((ordem) => {
      const status = normalizeStatus(ordem.status)
      const config = STATUS_CONFIG[status] ?? STATUS_PADRAO

      const current = statusMap.get(status)

      statusMap.set(status, {
        name: config.label,
        value: (current?.value ?? 0) + 1,
        color: config.color,
      })
    })

    const statusData = Array.from(statusMap.values()).filter(
      (item) => item.value > 0,
    )

    const areaData = getChartData(financeiro, periodo, startDate)

    const financeiroStatus = [
      {
        name: 'Pagos',
        quantidade: lancamentosPeriodo.filter(
          (item) => item.status_pagamento === 'PAGO',
        ).length,
      },
      {
        name: 'Pendentes',
        quantidade: lancamentosPeriodo.filter(
          (item) => item.status_pagamento === 'PENDENTE',
        ).length,
      },
      {
        name: 'Atrasados',
        quantidade: lancamentosPeriodo.filter(
          (item) => item.status_pagamento === 'ATRASADO',
        ).length,
      },
      {
        name: 'Cancelados',
        quantidade: lancamentosPeriodo.filter(
          (item) => item.status_pagamento === 'CANCELADO',
        ).length,
      },
    ]

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      ticketMedio,
      totalOrdens: ordensPeriodo.length,
      ordensConcluidas,
      taxaConclusao,
      statusData,
      areaData,
      financeiroStatus,
      startDate,
    }
  }, [ordens, financeiro, periodo])

  const isLoading = loadingOrdens || loadingFinanceiro
  const hasError = errorOrdens || errorFinanceiro

  const periodoLabel =
    periodo === '30dias'
      ? 'Últimos 30 dias'
      : periodo === '3meses'
        ? 'Últimos 3 meses'
        : 'Últimos 6 meses'

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <select
          className={styles.timeFilter}
          value={periodo}
          onChange={(event) => setPeriodo(event.target.value as Periodo)}
          aria-label="Filtrar indicadores por período"
        >
          <option value="6meses">Últimos 6 meses</option>
          <option value="3meses">Últimos 3 meses</option>
          <option value="30dias">Últimos 30 dias</option>
        </select>
      </div>

      {hasError && (
        <div role="alert" className={styles.chartCard}>
          Não foi possível carregar os dados dos indicadores. Verifique a
          conexão com o servidor e tente novamente.
        </div>
      )}

      <section className={styles.cardsGrid}>
        <SummaryCard
          title="Receita recebida"
          icon={<DollarSign size={18} />}
          iconTheme="gray"
          value={formatCurrency(indicadores.receitas)}
          isLoading={isLoading}
          footerText={periodoLabel}
        />

        <SummaryCard
          title="Ticket médio por OS"
          icon={<ClipboardList size={18} />}
          iconTheme="gray"
          value={formatCurrency(indicadores.ticketMedio)}
          isLoading={isLoading}
          footerText={`${numberFormatter.format(indicadores.totalOrdens)} ordens no período`}
        />

        <SummaryCard
          title="Taxa de conclusão"
          icon={<TrendingUp size={18} />}
          iconTheme="gray"
          value={`${indicadores.taxaConclusao.toFixed(1).replace('.', ',')}%`}
          isLoading={isLoading}
          footerText={`${numberFormatter.format(indicadores.ordensConcluidas)} ordens concluídas`}
        />

        <SummaryCard
          title="Saldo financeiro"
          icon={<Wallet size={18} />}
          iconTheme="gray"
          value={formatCurrency(indicadores.saldo)}
          isLoading={isLoading}
          footerText={`Receitas: ${formatCurrency(indicadores.receitas)}`}
        />
      </section>

      <section className={styles.chartsRow2}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Receitas x despesas</span>
            <span className={styles.chartSubtitle}>{periodoLabel}</span>
          </div>

          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={indicadores.areaData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorReceita"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient
                    id="colorDespesa"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={(value) => `${value / 1000}k`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />

                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receitas"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />

                <Area
                  type="monotone"
                  dataKey="despesa"
                  name="Despesas"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDespesa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Ordens por status</span>
            <span className={styles.chartSubtitle}>Situação atual</span>
          </div>

          <div className={styles.chartBodyPie}>
            {indicadores.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={indicadores.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {indicadores.statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      numberFormatter.format(Number(value ?? 0)),
                      'Ordens',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span>Nenhuma ordem cadastrada.</span>
            )}
          </div>

          <div className={styles.pieLegend}>
            {indicadores.statusData.map((entry) => (
              <div key={entry.name} className={styles.legendItem}>
                <div className={styles.legendLeft}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={styles.legendLabel}>{entry.name}</span>
                </div>

                <span className={styles.legendValue}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.chartsRow3}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Movimentações financeiras</span>
            <span className={styles.chartSubtitle}>{periodoLabel}</span>
          </div>

          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={indicadores.areaData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={(value) => `${value / 1000}k`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />

                <Bar
                  dataKey="receita"
                  name="Receitas"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="despesa"
                  name="Despesas"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Lançamentos por situação</span>
            <span className={styles.chartSubtitle}>Financeiro no período</span>
          </div>

          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={indicadores.financeiroStatus}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [
                    numberFormatter.format(Number(value ?? 0)),
                    'Lançamentos',
                  ]}
                />

                <Bar
                  dataKey="quantidade"
                  name="Lançamentos"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}