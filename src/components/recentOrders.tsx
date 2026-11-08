import { useState } from "react"
import styles from "./recentOrders.module.css"
import { useQuery } from "@tanstack/react-query"
import { getAllOrders } from "../features/orders/api/get-orders"

export default function RecentOrders() {
  const [selectedFilter, setSelectedFilter] = useState("abertas")

  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const orders = allOrders ?? []

  const filteredOrders = orders
    .filter((order) => {
      if (selectedFilter === "abertas") {
        return order.status !== "CONCLUIDA" && order.status !== "CANCELADA"
      }
      return order.status === "CONCLUIDA"
    })
    .sort(
      (a, b) =>
        new Date(b.data_abertura).getTime() -
        new Date(a.data_abertura).getTime(),
    )
    .slice(0, 5)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const statusLabels: Record<string, string> = {
    ABERTA: "Aberta",
    ORCAMENTO_PENDENTE: "Orçamento",
    AGUARDANDO_APROVACAO: "Aguardando aprovação",
    EM_EXECUCAO: "Em execução",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "EM_EXECUCAO":
      case "AGUARDANDO_APROVACAO":
        return styles.statusOrange
      case "CONCLUIDA":
        return styles.statusGreen
      case "CANCELADA":
        return styles.statusRed
      case "ORCAMENTO_PENDENTE":
        return styles.statusBlue
      case "ABERTA":
      default:
        return styles.statusGray
    }
  }

  return (
    <div className={styles.recentOrdersContainer}>
      <div className={styles.filterOrders}>
        <h4>Ordens de serviço</h4>

        <div className={styles.filterButtons}>
          <button
            className={selectedFilter === "abertas" ? styles.active : ""}
            onClick={() => setSelectedFilter("abertas")}
          >
            Abertas
          </button>

          <button
            className={selectedFilter === "concluidas" ? styles.active : ""}
            onClick={() => setSelectedFilter("concluidas")}
          >
            Concluídas
          </button>
        </div>
      </div>

      <div className={styles.tableHeader}>
        <span>Ordem</span>
        <span>Cliente / Equipamento</span>
        <span>Status</span>
        <span>Valor</span>
        <span></span>
      </div>

      {isLoadingOrders ? (
        <p style={{ padding: "1.5rem" }}>Carregando ordens de serviço...</p>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <p style={{ padding: "1.5rem" }}>
              Nenhuma ordem de serviço encontrada.
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id_ordem_servico} className={styles.orderRow}>
                <div>
                  <span className={styles.osNumber}>
                    OS - {order.id_ordem_servico}
                  </span>
                  <span className={styles.subText}>Normal</span>
                </div>

                <div>
                  <strong>{order.cliente.nome}</strong>
                  <span className={styles.subText}>
                    {order.ativo.descricao}
                  </span>
                </div>

                <div className={styles.statusWrapper}>
                  <div
                    className={`${styles.status} ${getStatusStyle(order.status)}`}
                  >
                    <span className={styles.statusDot}></span>
                    {statusLabels[order.status]}
                  </div>
                </div>

                <div>
                  <strong>{formatCurrency(Number(order.valor_total))}</strong>
                </div>

                <div className={styles.actionIcon}>↗</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.footerText}>
          {filteredOrders.length}{" "}
          {filteredOrders.length === 1 ? "ordem" : "ordens"} em acompanhamento
        </span>
        <span className={styles.footerLink}>Ver todas as ordens ➔</span>
      </div>
    </div>
  )
}
