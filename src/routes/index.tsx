import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Bell, CheckCircle2, ClipboardList, FileText, Package, Wallet } from "lucide-react"

import { allCatalogItems } from "../features/items/catalogo/api/catalogo_items"
import { getAllOrders } from "../features/orders/api/get-orders"
import { SummaryCard } from "../components/SummaryCard" 

import cardStyle from "../components/cards.module.css"

import styles from "./index.module.css"
import RecentOrders from "../components/recentOrders"
import RightColumn from "../components/rightColumn"

export const Route = createFileRoute("/")({
  component: Dashboard,
})

function Dashboard() {
  const usuarioString = localStorage.getItem("@WrenchOS:usuario")
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  const todayDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const formatedDay = todayDate.charAt(0).toUpperCase() + todayDate.slice(1)

  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const { data: allCatalog, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalog-items", "todos"],
    queryFn: allCatalogItems,
  })

  const quantityInExecution =
    allOrders?.filter((os) => os.status === "EM_EXECUCAO").length ?? 0

  const pendingBudgets =
    allOrders?.filter((os) => os.status === "AGUARDANDO_APROVACAO") ?? []

  const quantityOsPendentAndTotal = {
    quantity: pendingBudgets.length,
    total: pendingBudgets.reduce((acc, os) => acc + Number(os.valor_total), 0),
  }

  const itemsLowStock =
    allCatalog?.filter(
      (item) =>
        item.tipo_item === "PRODUTO" &&
        item.estoque_atual <= item.estoque_minimo,
    ).length ?? 0

  const calcTotalOpenOs = {
    total:
      allOrders?.reduce(
        (acc, os) =>
          os.status !== "CONCLUIDA" ? acc + Number(os.valor_total) : acc,
        0,
      ) ?? 0,
    quantity: allOrders?.filter((os) => os.status !== "CONCLUIDA").length ?? 0,
  }

  const today = new Date()
  const formattedDate = today.toISOString().slice(0, 10)

  const osConcludedToday =
    allOrders?.filter((os) => {
      const osDate = new Date(os.data_abertura).toISOString().slice(0, 10)
      return os.status === "CONCLUIDA" && osDate === formattedDate
    }).length ?? 0

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formattedDateYesterday = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1,
  ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`

  const osConcludedYesterday =
    allOrders?.filter((os) => {
      const osDate = new Date(os.data_abertura).toISOString().slice(0, 10)
      return os.status === "CONCLUIDA" && osDate === formattedDateYesterday
    }).length ?? 0

  return (
    <section className={styles.mainContent}>
      <header className={styles.topbar}>
        <div className={styles.textInfo}>
          <h1>Painel operacional</h1>
          <p>{formatedDay}</p>
        </div>

        <div className={styles.actions}>
          <div className={styles.activeOperation}>
            <div className={styles.activeCircle}></div>
            <p>
              OPERAÇÃO <strong>Ativa</strong>
            </p>
          </div>

          <Bell className={styles.bell} />

          <button className={styles.newOrderButton}>
            <p>+</p> Nova ordem
          </button>

          <div className={styles.userAvatar}>
            {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <section className={cardStyle.cards}>
          <SummaryCard
            title="OS em andamento"
            icon={<ClipboardList size={18} />}
            iconTheme="gray"
            value={quantityInExecution}
            isLoading={isLoadingOrders}
            footerText="Ordens de serviço em execução"
          />

          <SummaryCard
            title="Orçamentos pendentes"
            icon={<FileText size={18} />}
            iconTheme="orange"
            value={quantityOsPendentAndTotal.quantity}
            isLoading={isLoadingOrders}
            footerText={
              isLoadingOrders
                ? "Calculando..."
                : `R$ ${quantityOsPendentAndTotal.total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} aguardando`
            }
            footerTheme="orange"
          />

          <SummaryCard
            title="Estoque baixo"
            icon={<Package size={18} />}
            iconTheme="red"
            value={itemsLowStock}
            isLoading={isLoadingCatalog}
            footerText="Itens no mínimo ou abaixo dele"
            footerTheme="red"
          />

          <SummaryCard
            title="A receber"
            icon={<Wallet size={18} />}
            iconTheme="green"
            valuePrefix="R$ "
            value={
              isLoadingOrders
                ? "..."
                : calcTotalOpenOs.total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
            }
            isLoading={false}
            footerText={`${calcTotalOpenOs.quantity} notas que não foram concluídas`}
          />

          <SummaryCard
            title="OS Concluídas hoje"
            icon={<CheckCircle2 size={18} />}
            iconTheme="blue"
            value={osConcludedToday}
            isLoading={isLoadingOrders}
            footerText={
              isLoadingOrders
                ? "Calculando..."
                : osConcludedToday > osConcludedYesterday
                  ? `+${osConcludedToday - osConcludedYesterday} em relação a ontem`
                  : "Sem aumento em relação a ontem"
            }
            footerTheme="blue"
          />
        </section>

        <div className={styles.rowContainers}>
          <RecentOrders />
          <RightColumn />
        </div>
      </main>
    </section>
  )
}