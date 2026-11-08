
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Package,
  Wallet,
} from "lucide-react"

import { allCatalogItems } from "../features/items/catalogo/api/catalogo_items"
import { getAllOrders } from "../features/orders/api/get-orders"
import { getAllFinanceiro } from "../features/finance/api/financeiro"

import { SummaryCard } from "../components/cards"
import RecentOrders from "../components/recentOrders"
import RightColumn from "../components/rightColumn"
import Activity from "../components/activity"

import cardStyle from "../components/cards.module.css"
import styles from "./index.module.css"

export const Route = createFileRoute("/")({
  component: Dashboard,
})

function getDateKey(date: string | Date): string {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return ""

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function Dashboard() {
  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const { data: allCatalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalog-items", "todos"],
    queryFn: allCatalogItems,
  })

  const { data: allFinanceiro = [], isLoading: isLoadingFinance } = useQuery({
    queryKey: ["financeiro", "todos"],
    queryFn: getAllFinanceiro,
  })

  const today = new Date()
  const yesterday = new Date(today)

  yesterday.setDate(yesterday.getDate() - 1)

  const todayKey = getDateKey(today)
  const yesterdayKey = getDateKey(yesterday)

  const ordersSummary = allOrders.reduce(
    (summary, os) => {
      const osDate = getDateKey(os.data_abertura)

      if (os.status === "EM_EXECUCAO") {
        summary.inExecution++
      }

      if (os.status === "AGUARDANDO_APROVACAO") {
        summary.pendingBudgets.quantity++
        summary.pendingBudgets.total += Number(os.valor_total ?? 0)
      }

      if (os.status === "CONCLUIDA") {
        if (osDate === todayKey) {
          summary.concludedToday++
        }

        if (osDate === yesterdayKey) {
          summary.concludedYesterday++
        }
      }

      return summary
    },
    {
      inExecution: 0,
      pendingBudgets: {
        quantity: 0,
        total: 0,
      },
      concludedToday: 0,
      concludedYesterday: 0,
    },
  )

  const lowStockItems = allCatalog.filter(
    (item) =>
      item.tipo_item === "PRODUTO" &&
      item.estoque_atual <= item.estoque_minimo,
  ).length

  const financeSummary = allFinanceiro.reduce(
    (summary, lancamento) => {
      const isPendingRevenue =
        lancamento.tipo_lancamento === "RECEITA" &&
        ["PENDENTE", "ATRASADO"].includes(lancamento.status_pagamento)

      if (isPendingRevenue) {
        summary.quantity++
        summary.total += Number(lancamento.valor ?? 0)
      }

      return summary
    },
    {
      quantity: 0,
      total: 0,
    },
  )

  const concludedDifference =
    ordersSummary.concludedToday - ordersSummary.concludedYesterday

  return (
    <section className={styles.mainContent}>
      <main className={styles.content}>
        <section className={cardStyle.cards}>
          <SummaryCard
            title="OS em andamento"
            icon={<ClipboardList size={18} />}
            iconTheme="gray"
            value={ordersSummary.inExecution}
            isLoading={isLoadingOrders}
            footerText="Ordens de serviço em execução"
          />

          <SummaryCard
            title="Orçamentos pendentes"
            icon={<FileText size={18} />}
            iconTheme="orange"
            value={ordersSummary.pendingBudgets.quantity}
            isLoading={isLoadingOrders}
            footerText={
              `R$ ${formatCurrency(ordersSummary.pendingBudgets.total)} aguardando`
            }
            footerTheme="orange"
          />

          <SummaryCard
            title="Estoque baixo"
            icon={<Package size={18} />}
            iconTheme="red"
            value={lowStockItems}
            isLoading={isLoadingCatalog}
            footerText="Itens no mínimo ou abaixo dele"
            footerTheme="red"
          />

          <SummaryCard
            title="A receber"
            icon={<Wallet size={18} />}
            iconTheme="green"
            valuePrefix="R$ "
            value={formatCurrency(financeSummary.total)}
            isLoading={isLoadingFinance}
            footerText={`${financeSummary.quantity} ${
              financeSummary.quantity === 1
                ? "lançamento pendente"
                : "lançamentos pendentes"
            }`}
          />

          <SummaryCard
            title="OS concluídas hoje"
            icon={<CheckCircle2 size={18} />}
            iconTheme="blue"
            value={ordersSummary.concludedToday}
            isLoading={isLoadingOrders}
            footerText={
              isLoadingOrders
                ? "Calculando..."
                : concludedDifference > 0
                  ? `+${concludedDifference} em relação a ontem`
                  : concludedDifference < 0
                    ? `${concludedDifference} em relação a ontem`
                    : "Mesmo resultado de ontem"
            }
            footerTheme="blue"
          />
        </section>

        <div className={styles.rowContainers}>
          <div className={styles.leftColumn}>
            <RecentOrders />
            <Activity />
          </div>

          <RightColumn />
        </div>
      </main>
    </section>
  )
}
