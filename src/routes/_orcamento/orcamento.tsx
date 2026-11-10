import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  X,
  Check,
} from "lucide-react"

import { SummaryCard } from "../../components/cards"
import {
  getAllOrders,
  StartExecution,
  type OrdemServicoDTO,
} from "../../features/orders/api/orders-request"

import styles from "./orcamento.module.css"

export const Route = createFileRoute("/_orcamento/orcamento")({
  component: RouteComponent,
})

const ITEMS_PER_PAGE = 5

export default function RouteComponent() {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedOrcamento, setSelectedOrcamento] =
    useState<OrdemServicoDTO | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: todasOrdens = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ordens", "todas"],
    queryFn: getAllOrders,
  })

  // Mutation para iniciar a execução da Ordem de Serviço
  const startExecutionMutation = useMutation({
    mutationFn: (idOrdem: number) => StartExecution(idOrdem),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ordens", "todas"],
      })

      handleCloseModal()
    },
  })

  const orcamentos = useMemo(() => {
    return todasOrdens.filter(
      (os) =>
        os.status === "AGUARDANDO_APROVACAO" ||
        os.status === "EM_EXECUCAO",
    )
  }, [todasOrdens])

  const aguardandoAprovacao = useMemo(
    () => orcamentos.filter((o) => o.status === "AGUARDANDO_APROVACAO"),
    [orcamentos],
  )

  const valorAguardando = aguardandoAprovacao.reduce(
    (acc, curr) => acc + Number(curr.valor_total),
    0,
  )

  const orcamentosAprovados = useMemo(
    () => orcamentos.filter((o) => o.status === "EM_EXECUCAO"),
    [orcamentos],
  )

  const valorAprovadoTotal = orcamentosAprovados.reduce(
    (acc, curr) => acc + Number(curr.valor_total),
    0,
  )

  const hojeStr = new Date().toISOString().slice(0, 10)

  const expiramHoje = useMemo(
    () =>
      aguardandoAprovacao.filter(
        (o) =>
          o.data_previsao &&
          new Date(o.data_previsao).toISOString().slice(0, 10) === hojeStr,
      ),
    [aguardandoAprovacao, hojeStr],
  )

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter((orc) => {
      const search = searchTerm.toLowerCase().trim()
      const orcNumber = `ORC-${orc.id_ordem_servico}`.toLowerCase()
      const clientName = orc.cliente?.nome.toLowerCase() || ""

      return (
        orcNumber.includes(search) ||
        clientName.includes(search)
      )
    })
  }, [orcamentos, searchTerm])

  const totalPages = Math.ceil(
    filteredOrcamentos.length / ITEMS_PER_PAGE,
  )

  const paginatedOrcamentos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    return filteredOrcamentos.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    )
  }, [filteredOrcamentos, currentPage])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Sem validade"

    return new Intl.DateTimeFormat("pt-BR").format(
      new Date(dateString),
    )
  }

  const getStatusBadge = (statusOS: string) => {
    if (statusOS === "AGUARDANDO_APROVACAO") {
      return {
        label: "Aguardando aprovação",
        style: styles.statusOrange,
        dot: styles.dotOrange,
      }
    }

    return {
      label: "Aprovado",
      style: styles.statusGreen,
      dot: styles.dotGreen,
    }
  }

  const handleOpenModal = (orcamento: OrdemServicoDTO) => {
    setSelectedOrcamento(orcamento)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)

    setTimeout(() => {
      setSelectedOrcamento(null)
    }, 200)
  }

  return (
    <div className={styles.container}>
      <section className={styles.cardsGrid}>
        <SummaryCard
          title="Aguardando aprovação"
          icon={<Clock size={18} />}
          iconTheme="orange"
          value={aguardandoAprovacao.length}
          isLoading={isLoading}
          footerText={`${formatCurrency(valorAguardando)} em propostas`}
          footerTheme="orange"
        />

        <SummaryCard
          title="Orçamentos Aprovados"
          icon={<CheckCircle2 size={18} />}
          iconTheme="green"
          value={orcamentosAprovados.length}
          isLoading={isLoading}
          footerText="Propostas aceitas"
          footerTheme="gray"
        />

        <SummaryCard
          title="Valor aprovado"
          icon={<Wallet size={18} />}
          iconTheme="gray"
          valuePrefix="R$ "
          value={
            isLoading
              ? "..."
              : valorAprovadoTotal.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })
          }
          isLoading={false}
          footerText="Total acumulado"
        />

        <SummaryCard
          title="Expiram hoje"
          icon={<AlertTriangle size={18} />}
          iconTheme="red"
          value={expiramHoje.length}
          isLoading={isLoading}
          footerText={
            expiramHoje.length > 0
              ? `ORC-${expiramHoje[0].id_ordem_servico} em risco`
              : "Nenhum orçamento expira hoje"
          }
          footerTheme="red"
        />
      </section>

      <div className={styles.mainWrapper}>
        <div className={styles.searchContainer}>
          <div className={styles.search}>
            <Search size={17} />

            <input
              type="text"
              placeholder="Pesquisar orçamento ou cliente"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <button className={styles.newButton} type="button">
            <Plus size={18} />
            Novo orçamento
          </button>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>ORÇAMENTO</span>
            <span>CLIENTE / EQUIPAMENTO</span>
            <span>VALIDADE</span>
            <span>STATUS</span>
            <span>VALOR</span>
            <span></span>
          </div>

          {isLoading ? (
            <div className={styles.emptyMessage}>
              Carregando orçamentos...
            </div>
          ) : isError ? (
            <div className={styles.emptyMessage}>
              Erro ao carregar dados.
            </div>
          ) : paginatedOrcamentos.length === 0 ? (
            <div className={styles.emptyMessage}>
              Nenhum orçamento encontrado.
            </div>
          ) : (
            <div className={styles.tableList}>
              {paginatedOrcamentos.map((orc) => {
                const badge = getStatusBadge(orc.status)

                return (
                  <div
                    key={orc.id_ordem_servico}
                    className={styles.tableRow}
                  >
                    <div className={styles.colOrcamento}>
                      <strong>
                        ORC-{orc.id_ordem_servico}
                      </strong>
                    </div>

                    <div className={styles.colCliente}>
                      <strong>
                        {orc.cliente?.nome || "Cliente não informado"}
                      </strong>

                      <span>
                        {orc.ativo?.descricao ||
                          `OS-${orc.id_ordem_servico}`}
                      </span>
                    </div>

                    <div className={styles.colValidade}>
                      {formatDate(orc.data_previsao)}
                    </div>

                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.statusBadge} ${badge.style}`}
                      >
                        <span
                          className={`${styles.statusDot} ${badge.dot}`}
                        />

                        {badge.label}
                      </span>
                    </div>

                    <div className={styles.colValor}>
                      {formatCurrency(Number(orc.valor_total))}
                    </div>

                    <div className={styles.colActions}>
                      <button
                        className={styles.consultBtn}
                        onClick={() => handleOpenModal(orc)}
                      >
                        Consultar ↗
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {filteredOrcamentos.length}{" "}
              {filteredOrcamentos.length === 1
                ? "registro"
                : "registros"}{" "}
              · Página{" "}
              {filteredOrcamentos.length === 0 ? 0 : currentPage} de{" "}
              {totalPages}
            </span>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹
              </button>

              <span className={styles.currentPage}>
                {filteredOrcamentos.length === 0 ? 0 : currentPage}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={
                  currentPage >= totalPages || totalPages === 0
                }
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de consulta do orçamento */}
      {isModalOpen && selectedOrcamento && (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseModal}
        >
          <div
            className={styles.orcamentoModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.orcamentoHeader}>
              <div>
                <h2>
                  Orçamento • OS-{selectedOrcamento.id_ordem_servico}
                </h2>

                <p>
                  {selectedOrcamento.cliente?.nome} •{" "}
                  {selectedOrcamento.ativo?.descricao}
                </p>
              </div>

              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.orcamentoBody}>
              <table className={styles.orcamentoTable}>
                <thead>
                  <tr>
                    <th>DESCRIÇÃO</th>
                    <th>QTD.</th>
                    <th>UNITÁRIO</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>

                <tbody>
                  {Number(selectedOrcamento.valor_mao_obra) > 0 && (
                    <tr>
                      <td>Mão de obra</td>
                      <td>1</td>

                      <td>
                        {formatCurrency(
                          Number(selectedOrcamento.valor_mao_obra),
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          Number(selectedOrcamento.valor_mao_obra),
                        )}
                      </td>
                    </tr>
                  )}

                  {selectedOrcamento.itens_os?.map((item) => (
                    <tr key={item.id_item_os}>
                      <td>
                        {item.catalogo_item?.descricao || "Peça/Item"}
                      </td>

                      <td>{item.quantidade}</td>

                      <td>
                        {formatCurrency(Number(item.valor_unitario))}
                      </td>

                      <td>
                        {formatCurrency(Number(item.valor_total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.orcamentoTotal}>
                Total{" "}
                {formatCurrency(
                  Number(selectedOrcamento.valor_total),
                )}
              </div>
            </div>

            <div className={styles.orcamentoFooter}>
              <button
                className={styles.btnSecondary}
                onClick={handleCloseModal}
              >
                Fechar
              </button>

              <button
                className={styles.btnApprove}
                onClick={() =>
                  startExecutionMutation.mutate(
                    selectedOrcamento.id_ordem_servico,
                  )
                }
                disabled={
                  startExecutionMutation.isPending ||
                  selectedOrcamento.status === "EM_EXECUCAO"
                }
              >
                <Check size={16} />

                {startExecutionMutation.isPending
                  ? "Iniciando execução..."
                  : selectedOrcamento.status === "EM_EXECUCAO"
                    ? "Execução iniciada"
                    : "Iniciar execução"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}