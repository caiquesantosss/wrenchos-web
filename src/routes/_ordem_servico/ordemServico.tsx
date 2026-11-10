import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { SummaryCard } from "../../components/cards"
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Package,
  Search,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getAllOrders } from "../../features/orders/api/orders-request"
import styles from "./ordemServico.module.css"
import cardStyles from "../../components/cards.module.css"

export const Route = createFileRoute("/_ordem_servico/ordemServico")({
  component: RouteComponent,
})

const ITEMS_PER_PAGE = 6

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function getDateKey(date: string | Date) {
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

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("TODOS")
  const [selectedClient, setSelectedClient] = useState("TODOS")
  const [selectedDate, setSelectedDate] = useState("")

  const [currentPage, setCurrentPage] = useState(1)

  const navigate = useNavigate()

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const ordersByStatus = allOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getInitial = (name?: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const statusLabels: Record<string, string> = {
    ABERTA: "Aberta",
    ABERTAS: "Aberta",
    ORCAMENTO_PENDENTE: "Orçamento",
    AGUARDANDO_APROVACAO: "Aguardando aprovação",
    EM_EXECUCAO: "Em execução",
    AGUARDANDO_PECA: "Aguardando peças",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "EM_EXECUCAO":
      case "AGUARDANDO_APROVACAO":
      case "AGUARDANDO_PECA":
        return styles.statusOrange

      case "CONCLUIDA":
        return styles.statusGreen

      case "CANCELADA":
        return styles.statusRed

      default:
        return styles.statusGray
    }
  }

  const clients = [
    ...new Set(
      allOrders
        .map((order) => order.cliente?.nome)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"))

  const filteredOrders = allOrders
    .filter((order) => {
      const search = normalizeText(searchTerm)

      const matchesSearch =
        !search ||
        normalizeText(String(order.id_ordem_servico)).includes(search) ||
        normalizeText(order.cliente?.nome ?? "").includes(search) ||
        normalizeText(order.ativo?.descricao ?? "").includes(search)

      const matchesStatus =
        selectedStatus === "TODOS" ||
        (selectedStatus === "ABERTA"
          ? ["ABERTA", "ABERTAS"].includes(order.status)
          : order.status === selectedStatus)

      const matchesClient =
        selectedClient === "TODOS" || order.cliente?.nome === selectedClient

      const matchesDate =
        !selectedDate || getDateKey(order.data_abertura) === selectedDate

      return matchesSearch && matchesStatus && matchesClient && matchesDate
    })
    .sort(
      (a, b) =>
        new Date(b.data_abertura).getTime() -
        new Date(a.data_abertura).getTime(),
    )

  const totalOrders = filteredOrders.length

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE)

  const safeCurrentPage =
    totalPages === 0 ? 1 : Math.min(currentPage, totalPages)

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE

  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  const firstOrder = totalOrders === 0 ? 0 : startIndex + 1
  const lastOrder = Math.min(endIndex, totalOrders)

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages))
  }

  const resetPage = () => setCurrentPage(1)

  return (
    <div className={styles.container}>
      <div className={cardStyles.cards}>
        <SummaryCard
          title="Abertas"
          icon={<ClipboardList size={18} />}
          iconTheme="gray"
          value={ordersByStatus["ABERTA"] ?? 0}
          isLoading={isLoading}
          footerText="Aguardando atendimento"
        />

        <SummaryCard
          title="Orçamento pendente"
          icon={<ClipboardCheck size={18} />}
          iconTheme="orange"
          value={ordersByStatus["ORCAMENTO_PENDENTE"] ?? 0}
          isLoading={isLoading}
          footerText="Aguardando orçamento"
        />

        <SummaryCard
          title="Em execução"
          icon={<ClipboardCheck size={18} />}
          iconTheme="orange"
          value={ordersByStatus["EM_EXECUCAO"] ?? 0}
          isLoading={isLoading}
          footerText="Serviços em andamento"
        />

        <SummaryCard
          title="Aguardando aprovação"
          icon={<Package size={18} />}
          iconTheme="red"
          value={ordersByStatus["AGUARDANDO_APROVACAO"] ?? 0}
          isLoading={isLoading}
          footerText="Aguardando autorização do cliente"
        />

        <SummaryCard
          title="Concluídas"
          icon={<CheckCircle2 size={18} />}
          iconTheme="green"
          value={ordersByStatus["CONCLUIDA"] ?? 0}
          isLoading={isLoading}
          footerText="Serviços finalizados"
        />
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.filtersRow}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} />

            <input
              type="text"
              placeholder="Pesquisar ordem, cliente ou equipamento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                resetPage()
              }}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              resetPage()
            }}
          >
            <option value="TODOS">Todos os status</option>
            <option value="ABERTA">Aberta</option>
            <option value="ORCAMENTO_PENDENTE">Orçamento</option>
            <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
            <option value="EM_EXECUCAO">Em execução</option>
            <option value="AGUARDANDO_PECA">Aguardando peças</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={selectedClient}
            onChange={(e) => {
              setSelectedClient(e.target.value)
              resetPage()
            }}
          >
            <option value="TODOS">Todos os clientes</option>

            {clients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dateFilter}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              resetPage()
            }}
            aria-label="Filtrar por data de abertura"
          />
        </div>
      </div>

      <div className={styles.ordersContainer}>
        <div className={styles.tableHeader}>
          <span>ORDEM</span>
          <span>CLIENTE / EQUIPAMENTO</span>
          <span>RESPONSÁVEL</span>
          <span>STATUS</span>
          <span>VALOR</span>
          <span></span>
        </div>

        {isLoading ? (
          <p className={styles.emptyMessage}>Carregando ordens de serviço...</p>
        ) : (
          <div className={styles.ordersList}>
            {paginatedOrders.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhuma ordem de serviço encontrada.
              </p>
            ) : (
              paginatedOrders.map((order) => (
                <div key={order.id_ordem_servico} className={styles.orderRow}>
                  <div className={styles.colOrdem}>
                    <span className={styles.osNumber}>
                      OS - {order.id_ordem_servico}
                    </span>
                  </div>

                  <div className={styles.colCliente}>
                    <strong>
                      {order.cliente?.nome || "Cliente não informado"}
                    </strong>

                    <span className={styles.subText}>
                      {order.ativo?.descricao || "Equipamento não informado"}
                    </span>
                  </div>

                  <div className={styles.colResponsavel}>
                    <div className={styles.avatar}>
                      {getInitial(order.usuario?.nome)}
                    </div>

                    <span>{order.usuario?.nome || "Não atribuído"}</span>
                  </div>

                  <div className={styles.statusWrapper}>
                    <div
                      className={`${styles.status} ${getStatusStyle(
                        order.status,
                      )}`}
                    >
                      <span className={styles.statusDot}></span>

                      {statusLabels[order.status] || order.status}
                    </div>
                  </div>

                  {/* Valor */}
                  <div className={styles.colValor}>
                    <strong>
                      {formatCurrency(Number(order.valor_total || 0))}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={styles.actionIcon}
                    aria-label={`Visualizar OS ${order.id_ordem_servico}`}
                    onClick={() =>
                      navigate({
                        to: "/descricao/$id",
                        params: {
                          id: String(order.id_ordem_servico),
                        },
                      })
                    }
                  >
                    ↗
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerText}>
            {firstOrder}–{lastOrder} registros · Página{" "}
            {totalOrders === 0 ? 0 : safeCurrentPage} de {totalPages}
          </span>

          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={goToPreviousPage}
              disabled={safeCurrentPage === 1 || totalPages === 0}
              aria-label="Página anterior"
            >
              ‹
            </button>

            <span className={styles.pageNumber}>
              {totalOrders === 0 ? 0 : safeCurrentPage}
            </span>

            <button
              className={styles.pageBtn}
              onClick={goToNextPage}
              disabled={safeCurrentPage >= totalPages}
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
