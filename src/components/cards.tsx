import { useQuery } from "@tanstack/react-query"
import { allCatalogItems } from "../features/items/catalogo/api/catalogo_items"
import { getAllOrders } from "../features/orders/api/get-orders"

import styles from "./cards.module.css"
import { CheckCircle, ClipboardList, FileText, Package, Wallet } from "lucide-react"

export default function Cards() {
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
    <section className={styles.cards}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>OS em andamento</span>

          <div className={`${styles.iconWrapper} ${styles.iconGray}`}>
            <ClipboardList size={18} />
          </div>
        </div>

        <h2 className={styles.cardValue}>
          {isLoadingOrders ? "..." : quantityInExecution}
        </h2>

        <p className={styles.cardFooter}>Ordens de serviço em execução</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Orçamentos pendentes</span>

          <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
            <FileText size={18} />
          </div>
        </div>

        <h2 className={styles.cardValue}>
          {isLoadingOrders ? "..." : quantityOsPendentAndTotal.quantity}
        </h2>

        <p className={`${styles.cardFooter} ${styles.textOrange}`}>
          {isLoadingOrders
            ? "Calculando..."
            : `R$ ${quantityOsPendentAndTotal.total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} aguardando`}
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Estoque baixo</span>

          <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
            <Package size={18} />
          </div>
        </div>

        <h2 className={styles.cardValue}>
          {isLoadingCatalog ? "..." : itemsLowStock}
        </h2>

        <p className={`${styles.cardFooter} ${styles.textRed}`}>
          Itens no mínimo ou abaixo dele
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>A receber</span>

          <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
            <Wallet size={18} />
          </div>
        </div>

        <h2 className={styles.cardValue}>
          R${" "}
          {isLoadingOrders
            ? "..."
            : calcTotalOpenOs.total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
        </h2>

        <p className={styles.cardFooter}>
          {calcTotalOpenOs.quantity} notas que não foram concluídas
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>OS Concluídas hoje</span>

          <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
            <CheckCircle size={18} />
          </div>
        </div>

        <h2 className={styles.cardValue}>
          {isLoadingOrders ? "..." : osConcludedToday}
        </h2>

        <p className={`${styles.cardFooter} ${styles.textBlue}`}>
          {isLoadingOrders
            ? "Calculando..."
            : osConcludedToday > osConcludedYesterday
              ? `+${osConcludedToday - osConcludedYesterday} em relação a ontem`
              : "Sem aumento em relação a ontem"}
        </p>
      </div>
    </section>
  )
}
