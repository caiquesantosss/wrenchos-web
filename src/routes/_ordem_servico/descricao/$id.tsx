import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Pencil,
  Trash2,
  Loader2,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

import {
  addDiagnostic,
  addItemsToOrder,
  defineOrcamento,
  finishExecution,
  getOrderById,
  StartExecution,
  updateOrdemServico,
  cancelOrdemServico,
  type AddItemsOsDTO,
  type UpdateOrdemServicoDTO,
} from "../../../features/orders/api/orders-request"

import { allCatalogItems } from "../../../features/items/catalogo/api/catalogo_items"
import { getAtivosByCliente } from '../../../features/ativo/api/ativos'
import { getAllClientes } from "../../../features/clients/api/clients"

import {
  createFinanceToOS,
  getAllFinanceiro,
  type CreateFinanceiroDTO,
} from "../../../features/finance/api/financeiro"

import styles from "./descricaoOrdem.module.css"

export const Route = createFileRoute("/_ordem_servico/descricao/$id")({
  component: RouteComponent,
})

type CatalogItem = Awaited<ReturnType<typeof allCatalogItems>>[number]

type AddedItem = CatalogItem & {
  quantidade: number
  valor_total_item: number
}

type PrimaryActionType =
  | "diagnostic"
  | "budget"
  | "approval"
  | "completion"
  | "billing"
  | "parts"
  | "closed"
  | "cancelled"
  | "none"

interface PrimaryAction {
  label: string
  action: PrimaryActionType
  enabled: boolean
}

const ORDER_STAGES: Record<string, number> = {
  ABERTA: 0,
  AGUARDANDO_DIAGNOSTICO: 0,
  EM_DIAGNOSTICO: 0,
  AGUARDANDO_ORCAMENTO: 1,
  ORCAMENTO_PENDENTE: 1,
  ORCAMENTO_EM_ELABORACAO: 1,
  REVISAO_ORCAMENTO: 1,
  AGUARDANDO_APROVACAO: 2,
  EM_EXECUCAO: 3,
  AGUARDANDO_PECA: 3,
  CONCLUIDA: 4,
  ENCERRADA: 5,
}

const DIAGNOSTIC_STATUSES = [
  "ABERTA",
  "AGUARDANDO_DIAGNOSTICO",
  "EM_DIAGNOSTICO",
]

const BUDGET_STATUSES = [
  "ABERTA",
  "EM_DIAGNOSTICO",
  "AGUARDANDO_ORCAMENTO",
  "ORCAMENTO_PENDENTE",
  "ORCAMENTO_EM_ELABORACAO",
  "REVISAO_ORCAMENTO",
]

const INACTIVE_ACTIONS: Record<string, PrimaryAction> = {
  AGUARDANDO_PECA: {
    label: "Aguardando peça",
    action: "parts",
    enabled: false,
  },
  ENCERRADA: {
    label: "OS encerrada",
    action: "closed",
    enabled: false,
  },
  CANCELADA: {
    label: "OS cancelada",
    action: "cancelled",
    enabled: false,
  },
}

const ORDER_STEPS = [
  "Abertura",
  "Orçamento",
  "Aprovação",
  "Execução",
  "Conclusão",
  "Financeiro",
]

function normalizeStatus(status: string): string {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
}

function getCurrentStepIndex(status: string, hasFinanceiro: boolean): number {
  const normalizedStatus = normalizeStatus(status)
  if (normalizedStatus === "CONCLUIDA" && hasFinanceiro) return 5
  return ORDER_STAGES[normalizedStatus] ?? 0
}

function getPrimaryAction(
  status: string,
  hasDiagnostic: boolean,
  hasFinanceiro: boolean,
): PrimaryAction {
  const normalizedStatus = normalizeStatus(status)

  if (DIAGNOSTIC_STATUSES.includes(normalizedStatus) && !hasDiagnostic) {
    return { label: "Gerar diagnóstico", action: "diagnostic", enabled: true }
  }

  if (BUDGET_STATUSES.includes(normalizedStatus)) {
    return { label: "Definir orçamento", action: "budget", enabled: true }
  }

  if (normalizedStatus === "AGUARDANDO_APROVACAO") {
    return { label: "Iniciar execução", action: "approval", enabled: true }
  }

  if (normalizedStatus === "EM_EXECUCAO") {
    return { label: "Concluir serviço", action: "completion", enabled: true }
  }

  if (normalizedStatus === "CONCLUIDA") {
    return hasFinanceiro
      ? { label: "Faturamento gerado", action: "none", enabled: false }
      : { label: "Gerar faturamento", action: "billing", enabled: true }
  }

  return (
    INACTIVE_ACTIONS[normalizedStatus] ?? {
      label: "Ação indisponível",
      action: "none",
      enabled: false,
    }
  )
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "---"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "---"
  return new Intl.DateTimeFormat("pt-BR").format(date)
}

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0)
}

export default function RouteComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const orderId = Number(id)

  const [activeTab, setActiveTab] = useState("visao_geral")
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [diagnosticoInput, setDiagnosticoInput] = useState("")
  const [diagError, setDiagError] = useState<string | null>(null)
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false)

  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetStep, setBudgetStep] = useState(1)
  const [selectedItemId, setSelectedItemId] = useState<number | "">("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [addedItems, setAddedItems] = useState<AddedItem[]>([])
  const [laborCostInput, setLaborCostInput] = useState("")
  const [budgetError, setBudgetError] = useState<string | null>(null)

  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [solucaoInput, setSolucaoInput] = useState("")
  const [completionError, setCompletionError] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editIdCliente, setEditIdCliente] = useState<number | "">("")
  const [editIdAtivo, setEditIdAtivo] = useState<number | "">("")
  const [editDescricao, setEditDescricao] = useState("")
  const [editPrevisao, setEditPrevisao] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

  // Estado para o Modal de Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false)

  const {
    data: ordem,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Number.isInteger(orderId) && orderId > 0,
  })

  const { data: catalogoItems = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalogo-itens", "todos"],
    queryFn: allCatalogItems,
    enabled: showBudgetModal,
  })

  const { data: financeiroList = [], isLoading: isLoadingFinanceiro } =
    useQuery({
      queryKey: ["financeiro", "todos"],
      queryFn: getAllFinanceiro,
    })

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: getAllClientes,
    enabled: showEditModal,
  })

  const { data: ativos = [], isFetching: isFetchingAtivos } = useQuery({
    queryKey: ["ativos", "cliente", editIdCliente],
    queryFn: () => getAtivosByCliente(Number(editIdCliente)),
    enabled: showEditModal && !!editIdCliente,
  })

  const financeiroDaOS = financeiroList.find(
    (financeiro) => financeiro.id_ordem_servico === orderId,
  )
  const hasFinanceiro = Boolean(financeiroDaOS)

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] })
  }

  const diagnosticMutation = useMutation({
    mutationFn: (diagnostico: string) =>
      addDiagnostic({ diagnostico }, orderId),
    onSuccess: async () => {
      setDiagError(null)
      setDiagnosticoInput("")
      setShowDiagnosticModal(false)
      await invalidateOrders()
    },
    onError: (error: Error) =>
      setDiagError(error.message || "Erro ao registrar diagnóstico."),
  })

  const budgetMutation = useMutation({
    mutationFn: async () => {
      if (addedItems.length > 0) {
        const itemsPayload: AddItemsOsDTO = addedItems.map((item) => ({
          id_catalogo_item: item.id_catalogo_item,
          quantidade: item.quantidade,
        }))

        await addItemsToOrder(orderId, itemsPayload)
      }

      const valorMaoObra = Number.parseFloat(laborCostInput.replace(",", "."))

      await defineOrcamento(orderId, {
        valor_mao_obra: valorMaoObra,
      })
    },

    onSuccess: async () => {
      setBudgetError(null)
      setShowBudgetModal(false)
      setAddedItems([])
      setLaborCostInput("")
      setSelectedItemId("")
      setItemQuantity(1)
      setBudgetStep(1)

      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      })
    },

    onError: (error: Error) => {
      setBudgetError(error.message || "Erro ao salvar o orçamento.")
    },
  })

  const startExecutionMutation = useMutation({
    mutationFn: () => StartExecution(orderId),
    onSuccess: async () => {
      setGlobalError(null)
      await invalidateOrders()
    },
    onError: (error: Error) =>
      setGlobalError(error.message || "Erro ao iniciar a execução da OS."),
  })

  const completionMutation = useMutation({
    mutationFn: (solucao: string) =>
      finishExecution(orderId, { appliedSolution: solucao }),
    onSuccess: async () => {
      setCompletionError(null)
      setSolucaoInput("")
      setShowCompletionModal(false)
      await invalidateOrders()
    },
    onError: (error: Error) =>
      setCompletionError(error.message || "Erro ao concluir serviço."),
  })

  const faturarMutation = useMutation({
    mutationFn: () => {
      if (!ordem) throw new Error("Ordem de serviço não encontrada.")
      const payload: CreateFinanceiroDTO = {
        id_ordem_servico: orderId,
        descricao: `Faturamento OS-${orderId}`,
        tipo_lancamento: "RECEITA",
        status_pagamento: "PENDENTE",
        valor: Number(ordem.valor_total),
        data_vencimento: new Date().toISOString(),
      }
      return createFinanceToOS(orderId, payload)
    },
    onSuccess: async () => {
      setGlobalError(null)
      setActiveTab("financeiro")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
        invalidateOrders(),
      ])
    },
    onError: (error: Error) =>
      setGlobalError(error.message || "Erro ao gerar faturamento."),
  })

  const editMutation = useMutation({
    mutationFn: (data: UpdateOrdemServicoDTO) =>
      updateOrdemServico(orderId, data),
    onSuccess: async () => {
      setEditError(null)
      setShowEditModal(false)
      await invalidateOrders()
    },
    onError: (error: Error) =>
      setEditError(error.message || "Erro ao atualizar a ordem de serviço."),
  })

  // Mutation para Cancelar a OS
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrdemServico(orderId),
    onSuccess: async () => {
      setGlobalError(null)
      setShowCancelModal(false)
      await invalidateOrders()
    },
    onError: (error: Error) =>
      setGlobalError(error.message || "Erro ao cancelar a Ordem de Serviço."),
  })

  const handleOpenEdit = () => {
    if (ordem) {
      setEditIdCliente(ordem.cliente?.id_cliente || "")
      setEditIdAtivo(ordem.ativo?.id_ativo || "")
      setEditDescricao(ordem.descricao_problema || "")
      let dataPrev = ""
      if (ordem.data_previsao) {
        const dateObj = new Date(ordem.data_previsao)
        if (!isNaN(dateObj.getTime())) {
          dataPrev = dateObj.toISOString().split("T")[0]
        }
      }
      setEditPrevisao(dataPrev)
      setEditError(null)
      setShowEditModal(true)
    }
  }

  const handleSaveEdit = () => {
    if (!editIdCliente || !editIdAtivo || !editDescricao.trim()) {
      setEditError("Preencha todos os campos obrigatórios.")
      return
    }

    let dataISO: string | null = null
    if (editPrevisao) {
      const dateObj = new Date(editPrevisao)
      if (!isNaN(dateObj.getTime())) {
        dataISO = dateObj.toISOString()
      }
    }

    editMutation.mutate({
      id_cliente: Number(editIdCliente),
      id_ativo: Number(editIdAtivo),
      descricao_problema: editDescricao,
      data_previsao: dataISO,
    })
  }

  const handleSaveDiagnostic = () => {
    if (diagnosticoInput.trim().length < 5) {
      setDiagError("O diagnóstico deve ser mais descritivo.")
      return
    }
    diagnosticMutation.mutate(diagnosticoInput.trim())
  }

  const handleSaveCompletion = () => {
    if (solucaoInput.trim().length < 5) {
      setCompletionError("A solução aplicada deve ser mais descritiva.")
      return
    }
    completionMutation.mutate(solucaoInput.trim())
  }

  const handleAddItem = () => {
    if (
      selectedItemId === "" ||
      !Number.isInteger(itemQuantity) ||
      itemQuantity <= 0
    )
      return
    const selectedItem = catalogoItems.find(
      (item) => item.id_catalogo_item === selectedItemId,
    )
    if (!selectedItem) return

    setAddedItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id_catalogo_item === selectedItem.id_catalogo_item,
      )
      if (existingItem) {
        return currentItems.map((item) => {
          if (item.id_catalogo_item !== selectedItem.id_catalogo_item)
            return item
          const quantidade = item.quantidade + itemQuantity
          return {
            ...item,
            quantidade,
            valor_total_item: Number(item.valor_unitario) * quantidade,
          }
        })
      }
      return [
        ...currentItems,
        {
          ...selectedItem,
          quantidade: itemQuantity,
          valor_total_item: Number(selectedItem.valor_unitario) * itemQuantity,
        },
      ]
    })
    setSelectedItemId("")
    setItemQuantity(1)
  }

  const handleRemoveItem = (itemId: number) => {
    setAddedItems((items) =>
      items.filter((item) => item.id_catalogo_item !== itemId),
    )
  }

  const handleSaveBudget = () => {
    const laborValue = Number.parseFloat(laborCostInput.replace(",", "."))
    if (!Number.isFinite(laborValue) || laborValue < 0) {
      setBudgetError("Informe um valor válido para a mão de obra.")
      return
    }
    budgetMutation.mutate()
  }

  const totalPecas = addedItems.reduce(
    (total, item) => total + item.valor_total_item,
    0,
  )
  const totalMaoObra = Number.parseFloat(laborCostInput.replace(",", ".")) || 0
  const valorTotalOrcamento = totalPecas + totalMaoObra

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return <div className={styles.errorState}>Identificador inválido.</div>
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>Carregando detalhes da OS...</div>
    )
  }

  if (isError || !ordem) {
    return (
      <div className={styles.errorState}>Não foi possível carregar a OS.</div>
    )
  }

  const currentStepIndex = getCurrentStepIndex(ordem.status, hasFinanceiro)

  const primaryAction = getPrimaryAction(
    ordem.status,
    Boolean(ordem.diagnostico),
    hasFinanceiro,
  )

  const isGlobalLoading =
    diagnosticMutation.isPending ||
    budgetMutation.isPending ||
    startExecutionMutation.isPending ||
    completionMutation.isPending ||
    faturarMutation.isPending ||
    editMutation.isPending ||
    cancelMutation.isPending

  const isPrimaryActionDisabled =
    !primaryAction.enabled ||
    isGlobalLoading ||
    (primaryAction.action === "billing" && isLoadingFinanceiro)

  const isOSClosedOrCanceled =
    normalizeStatus(ordem.status) === "CANCELADA" ||
    normalizeStatus(ordem.status) === "CONCLUIDA" ||
    normalizeStatus(ordem.status) === "ENCERRADA"

  const handlePrimaryAction = () => {
    setGlobalError(null)
    switch (primaryAction.action) {
      case "diagnostic":
        setShowDiagnosticModal(true)
        break
      case "budget":
        setShowBudgetModal(true)
        break
      case "approval":
        startExecutionMutation.mutate()
        break
      case "completion":
        setShowCompletionModal(true)
        break
      case "billing":
        faturarMutation.mutate()
        break
    }
  }

  return (
    <div className={styles.container}>
      {globalError && (
        <div
          className={styles.errorText}
          style={{
            marginBottom: "1rem",
            backgroundColor: "#fef2f2",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          {globalError}
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerTitleArea}>
          <div className={styles.titleRow}>
            <h1>OS-{ordem.id_ordem_servico}</h1>
            <span className={styles.statusBadgeEmExecucao}>
              <span className={styles.dotOrange} />
              {ordem.status}
            </span>
          </div>

          <p className={styles.subtitle}>
            {ordem.ativo?.descricao} • {ordem.cliente?.nome}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnIcon}
            onClick={handleOpenEdit}
            disabled={isGlobalLoading || isOSClosedOrCanceled}
            title="Editar OS"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className={styles.btnIcon}
            onClick={() => setShowCancelModal(true)}
            disabled={isGlobalLoading || isOSClosedOrCanceled}
            title="Cancelar OS"
          >
            <X size={16} />
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            disabled={isPrimaryActionDisabled}
            onClick={handlePrimaryAction}
          >
            {isGlobalLoading ||
            (primaryAction.action === "billing" && isLoadingFinanceiro) ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <Check size={16} />
            )}
            {primaryAction.label}
          </button>
        </div>
      </header>

      <div className={styles.stepperBox}>
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex

          return (
            <div
              key={step}
              className={`${styles.step} ${
                isCompleted
                  ? styles.stepCompleted
                  : isCurrent
                    ? styles.stepCurrent
                    : ""
              }`}
            >
              <div className={styles.stepCircle}>
                {isCompleted ? <Check size={14} /> : index + 1}
              </div>

              <span className={styles.stepLabel}>{step}</span>
            </div>
          )
        })}
      </div>

      <nav className={styles.tabsWrapper}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "visao_geral" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("visao_geral")}
        >
          Visão geral
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "servicos" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("servicos")}
        >
          Serviços e peças
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "orcamento" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("orcamento")}
        >
          Orçamento
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "financeiro" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("financeiro")}
        >
          Financeiro
        </button>
      </nav>

      {/* ABA: VISÃO GERAL */}
      {activeTab === "visao_geral" && (
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <h2 className={styles.sectionTitle}>Informações do atendimento</h2>

            <div className={styles.infoGrid}>
              <div className={styles.infoBlock}>
                <label>Cliente</label>
                <span className={styles.linkText}>
                  {ordem.cliente?.nome || "---"}
                </span>
              </div>

              <div className={styles.infoBlock}>
                <label>Equipamento</label>
                <span className={styles.linkText}>
                  {ordem.ativo?.descricao || "---"}
                </span>
              </div>

              <div className={styles.infoBlock}>
                <label>Responsável</label>
                <span>{ordem.usuario?.nome || "Não atribuído"}</span>
              </div>

              <div className={styles.infoBlock}>
                <label>Prioridade</label>
                <span className={styles.priorityBadge}>
                  <span className={styles.dotOrange} />
                  Alta
                </span>
              </div>

              <div className={styles.infoBlock}>
                <label>Abertura</label>
                <span>{formatDate(ordem.data_abertura)}</span>
              </div>

              <div className={styles.infoBlock}>
                <label>Previsão</label>
                <span>{formatDate(ordem.data_previsao)}</span>
              </div>
            </div>

            <div className={styles.divider} />

            <section className={styles.textSection}>
              <h3>Problema relatado</h3>
              <p>{ordem.descricao_problema}</p>
            </section>

            <div className={styles.divider} />

            <section className={styles.textSection}>
              <h3>Diagnóstico técnico</h3>

              {ordem.diagnostico ? (
                <p className={styles.diagnosticText}>{ordem.diagnostico}</p>
              ) : (
                <p className={styles.diagnosticEmpty}>
                  Diagnóstico não registrado. Utilize a ação correspondente no
                  topo.
                </p>
              )}
            </section>

            {ordem.solucao_aplicada && (
              <>
                <div className={styles.divider} />

                <section className={styles.textSection}>
                  <h3>Solução aplicada</h3>
                  <p className={styles.diagnosticText}>
                    {ordem.solucao_aplicada}
                  </p>
                </section>
              </>
            )}
          </div>

          <aside className={styles.rightCol}>
            <div className={styles.summaryBox}>
              <h2 className={styles.sectionTitle}>Resumo da ordem</h2>

              <div className={styles.summaryRow}>
                <span>Serviços e peças</span>
                <strong>{formatCurrency(ordem.valor_total || 0)}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Pagamento</span>

                <span className={styles.paymentBadge}>
                  <span className={styles.dotOrange} />

                  {hasFinanceiro
                    ? financeiroDaOS?.status_pagamento
                    : "Pendente"}
                </span>
              </div>
            </div>

            <div className={styles.timelineBox}>
              <h2 className={styles.sectionTitle}>Últimas atualizações</h2>

              {hasFinanceiro && financeiroDaOS && (
                <div className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ backgroundColor: "#0d9488" }}
                  />

                  <div className={styles.timelineContent}>
                    <h4>Faturamento gerado</h4>
                    <p>Lançamento financeiro registrado com sucesso</p>
                    <span>{formatDate(financeiroDaOS.data_cadastro)}</span>
                  </div>
                </div>
              )}

              <div className={styles.timelineItem}>
                <div
                  className={styles.timelineDot}
                  style={{ backgroundColor: "#0d9488" }}
                />

                <div className={styles.timelineContent}>
                  <h4>{ordem.status}</h4>
                  <p>Atualizado por {ordem.usuario?.nome || "Sistema"}</p>
                  <span>{formatDate(ordem.data_atualizacao)}</span>
                </div>
              </div>

              {ordem.diagnostico && (
                <div className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ backgroundColor: "#0d9488" }}
                  />

                  <div className={styles.timelineContent}>
                    <h4>Inspeção técnica registrada</h4>
                    <p>Diagnóstico técnico concluído</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ABA: SERVIÇOS E PEÇAS */}
      {activeTab === "servicos" && (
        <div className={styles.fullCol}>
          <h2 className={styles.sectionTitle}>Itens e Serviços Vinculados</h2>

          {ordem.itens_os && ordem.itens_os.length > 0 ? (
            <div className={styles.servicesTable}>
              <div className={styles.servicesTableHeader}>
                <span>ITEM / SERVIÇO</span>
                <span>QUANTIDADE</span>
                <span>VALOR UNITÁRIO</span>
                <span>VALOR TOTAL</span>
              </div>

              <div className={styles.servicesTableBody}>
                {ordem.itens_os.map((item: any) => (
                  <div
                    key={item.id_item_os}
                    className={styles.servicesTableRow}
                  >
                    <div className={styles.servicesColInfo}>
                      <strong>
                        {item.catalogo_item?.descricao || "Item sem descrição"}
                      </strong>

                      <span>{item.catalogo_item?.tipo_item || "-"}</span>
                    </div>

                    <div>{Number(item.quantidade)} un</div>

                    <div>{formatCurrency(item.valor_unitario)}</div>

                    <div>
                      <strong>{formatCurrency(item.valor_total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyServicesState}>
              <p>
                Não há peças ou serviços registrados nesta Ordem de Serviço.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA: ORÇAMENTO */}
      {activeTab === "orcamento" && (
        <div className={styles.fullCol}>
          {(!ordem.itens_os || ordem.itens_os.length === 0) &&
          !ordem.valor_mao_obra ? (
            <div className={styles.emptyServicesState}>
              <p>
                O orçamento ainda não foi definido para esta Ordem de Serviço.
              </p>
            </div>
          ) : (
            <div className={styles.orcamentoWrapper}>
              <div className={styles.servicesTable}>
                <div className={styles.servicesTableHeader}>
                  <span>DESCRIÇÃO</span>
                  <span>QTD.</span>
                  <span>UNITÁRIO</span>
                  <span>TOTAL</span>
                </div>

                <div className={styles.servicesTableBody}>
                  {Number(ordem.valor_mao_obra) > 0 && (
                    <div className={styles.servicesTableRow}>
                      <div className={styles.servicesColInfo}>
                        <strong>Manutenção corretiva / mão de obra</strong>
                      </div>
                      <div>1</div>
                      <div>{formatCurrency(ordem.valor_mao_obra)}</div>
                      <div>
                        <strong>{formatCurrency(ordem.valor_mao_obra)}</strong>
                      </div>
                    </div>
                  )}

                  {ordem.itens_os?.map((item: any) => (
                    <div
                      key={item.id_item_os}
                      className={styles.servicesTableRow}
                    >
                      <div className={styles.servicesColInfo}>
                        <strong>
                          {item.catalogo_item?.descricao ||
                            "Item sem descrição"}
                        </strong>
                      </div>
                      <div>{Number(item.quantidade)}</div>
                      <div>{formatCurrency(item.valor_unitario)}</div>
                      <div>
                        <strong>{formatCurrency(item.valor_total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.orcamentoTotalRow}>
                <span>Total</span>
                <strong>{formatCurrency(ordem.valor_total || 0)}</strong>
              </div>

              <div className={styles.orcamentoActionRow}>
                <button className={styles.btnSecondaryOutline}>
                  Consultar orçamento <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA: FINANCEIRO */}
      {activeTab === "financeiro" && (
        <div className={styles.fullCol}>
          <h2 className={styles.sectionTitle}>Resumo financeiro</h2>

          {isLoadingFinanceiro ? (
            <div className={styles.emptyServicesState}>
              Carregando dados financeiros...
            </div>
          ) : financeiroDaOS ? (
            <div className={styles.financeCard}>
              <div className={styles.financeRow}>
                <div className={styles.financeColBlock}>
                  <label>Valor do serviço</label>
                  <strong>{formatCurrency(financeiroDaOS.valor)}</strong>
                </div>

                <div
                  className={styles.financeColBlock}
                  style={{ alignItems: "flex-end" }}
                >
                  <label>Situação</label>

                  <span className={styles.paymentBadge}>
                    <span className={styles.dotOrange} />

                    {financeiroDaOS.status_pagamento.charAt(0).toUpperCase() +
                      financeiroDaOS.status_pagamento.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              <div className={styles.divider} style={{ margin: "1.5rem 0" }} />

              <div className={styles.financeDetails}>
                <div className={styles.financeActionsRow}>
                  <button className={styles.btnTextAction}>
                    Registrar pagamento <ArrowRight size={16} />
                  </button>
                  <button className={styles.btnTextLink}>
                    Documento fiscal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyServicesState}>
              <p>
                O faturamento ainda não foi gerado para esta Ordem de Serviço.
                Aguarde a conclusão da ordem e utilize o botão{" "}
                <strong>Gerar faturamento</strong>
                no topo da página.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CANCELAMENTO */}
      {showCancelModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !cancelMutation.isPending && setShowCancelModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Cancelar Ordem de Serviço</h2>
                <p>OS-{ordem.id_ordem_servico}</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                disabled={cancelMutation.isPending}
                onClick={() => setShowCancelModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ color: "#0f172a", fontSize: "0.875rem", margin: 0 }}>
                Tem certeza que deseja cancelar esta Ordem de Serviço? Esta ação
                não poderá ser desfeita.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                disabled={cancelMutation.isPending}
                onClick={() => setShowCancelModal(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ backgroundColor: "#ef4444" }}
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 size={16} className={styles.spinner} />
                ) : (
                  <Trash2 size={16} />
                )}
                Sim, Cancelar OS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DIAGNÓSTICO */}
      {showDiagnosticModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !diagnosticMutation.isPending && setShowDiagnosticModal(false)
          }
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Gerar diagnóstico técnico</h2>
                <p>OS-{ordem.id_ordem_servico}</p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                disabled={diagnosticMutation.isPending}
                onClick={() => setShowDiagnosticModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalInfo}>
                <span>Cliente</span>
                <strong>{ordem.cliente?.nome}</strong>
              </div>

              <div className={styles.modalProblem}>
                <label>Problema relatado</label>
                <p>{ordem.descricao_problema}</p>
              </div>

              <div className={styles.modalField}>
                <label htmlFor="diagnostico">Diagnóstico técnico</label>

                <textarea
                  id="diagnostico"
                  placeholder="Descreva as causas identificadas..."
                  value={diagnosticoInput}
                  onChange={(event) => {
                    setDiagnosticoInput(event.target.value)
                    setDiagError(null)
                  }}
                  disabled={diagnosticMutation.isPending}
                  autoFocus
                />

                {diagError && (
                  <span className={styles.errorText}>{diagError}</span>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                disabled={diagnosticMutation.isPending}
                onClick={() => setShowDiagnosticModal(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveDiagnostic}
                disabled={diagnosticMutation.isPending}
              >
                {diagnosticMutation.isPending ? (
                  <Loader2 size={16} className={styles.spinner} />
                ) : (
                  <Check size={16} />
                )}
                Salvar diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONCLUSÃO */}
      {showCompletionModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !completionMutation.isPending && setShowCompletionModal(false)
          }
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Concluir serviço</h2>
                <p>OS-{ordem.id_ordem_servico}</p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                disabled={completionMutation.isPending}
                onClick={() => setShowCompletionModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalInfo}>
                <span>Cliente</span>
                <strong>{ordem.cliente?.nome}</strong>
              </div>

              <div className={styles.modalField}>
                <label htmlFor="solucao">Solução aplicada</label>

                <textarea
                  id="solucao"
                  placeholder="Descreva a solução aplicada e os serviços realizados..."
                  value={solucaoInput}
                  onChange={(event) => {
                    setSolucaoInput(event.target.value)
                    setCompletionError(null)
                  }}
                  disabled={completionMutation.isPending}
                  autoFocus
                />

                {completionError && (
                  <span className={styles.errorText}>{completionError}</span>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                disabled={completionMutation.isPending}
                onClick={() => setShowCompletionModal(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveCompletion}
                disabled={completionMutation.isPending}
              >
                {completionMutation.isPending ? (
                  <Loader2 size={16} className={styles.spinner} />
                ) : (
                  <Check size={16} />
                )}
                Finalizar OS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ORÇAMENTO */}
      {showBudgetModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !budgetMutation.isPending && setShowBudgetModal(false)}
        >
          <div
            className={`${styles.modal} ${styles.modalLarge}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Definir Orçamento</h2>
                <p>
                  OS-{ordem.id_ordem_servico} • Passo {budgetStep} de 2
                </p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                disabled={budgetMutation.isPending}
                onClick={() => setShowBudgetModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {budgetStep === 1 && (
                <div className={styles.budgetStepContainer}>
                  <h3>Adicionar Peças e Serviços do Catálogo</h3>

                  <div className={styles.addItemRow}>
                    <div className={styles.formGroup} style={{ flex: 3 }}>
                      <label htmlFor="catalogo-item">Buscar Item</label>

                      <select
                        id="catalogo-item"
                        value={selectedItemId}
                        onChange={(event) => {
                          const value = event.target.value

                          setSelectedItemId(value ? Number(value) : "")
                        }}
                        disabled={isLoadingCatalog}
                      >
                        <option value="">
                          {isLoadingCatalog
                            ? "Carregando catálogo..."
                            : "Selecione um item..."}
                        </option>

                        {catalogoItems.map((item) => (
                          <option
                            key={item.id_catalogo_item}
                            value={item.id_catalogo_item}
                          >
                            {item.descricao} -{" "}
                            {formatCurrency(item.valor_unitario)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label htmlFor="item-quantity">Qtd.</label>

                      <input
                        id="item-quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={itemQuantity}
                        onChange={(event) => {
                          setItemQuantity(Number(event.target.value))
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleAddItem}
                      disabled={
                        selectedItemId === "" ||
                        !Number.isInteger(itemQuantity) ||
                        itemQuantity < 1 ||
                        isLoadingCatalog
                      }
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  <div className={styles.addedItemsList}>
                    {addedItems.length === 0 ? (
                      <p className={styles.emptyListText}>
                        Nenhum item adicionado ainda.
                      </p>
                    ) : (
                      addedItems.map((item) => (
                        <div
                          key={item.id_catalogo_item}
                          className={styles.addedItemRow}
                        >
                          <div className={styles.addedItemInfo}>
                            <strong>{item.descricao}</strong>

                            <span>
                              {item.quantidade}x{" "}
                              {formatCurrency(item.valor_unitario)}
                            </span>
                          </div>

                          <div className={styles.addedItemTotal}>
                            <strong>
                              {formatCurrency(item.valor_total_item)}
                            </strong>

                            <button
                              type="button"
                              className={styles.btnIconSm}
                              aria-label={`Remover ${item.descricao}`}
                              onClick={() =>
                                handleRemoveItem(item.id_catalogo_item)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={styles.totalPecasRow}>
                    <span>Total em peças/serviços:</span>
                    <strong>{formatCurrency(totalPecas)}</strong>
                  </div>
                </div>
              )}

              {budgetStep === 2 && (
                <div className={styles.budgetStepContainer}>
                  <h3>Custo de Mão de Obra e Resumo</h3>

                  <div className={styles.formGroup}>
                    <label htmlFor="labor-cost">
                      Valor da Mão de Obra (R$)
                    </label>

                    <input
                      id="labor-cost"
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 150,00"
                      value={laborCostInput}
                      onChange={(event) => {
                        setLaborCostInput(
                          event.target.value.replace(/[^0-9,]/g, ""),
                        )

                        setBudgetError(null)
                      }}
                    />
                  </div>

                  <div className={styles.budgetSummaryCard}>
                    <div className={styles.budgetSummaryRow}>
                      <span>Peças e Itens ({addedItems.length})</span>

                      <span>{formatCurrency(totalPecas)}</span>
                    </div>

                    <div className={styles.budgetSummaryRow}>
                      <span>Mão de Obra</span>
                      <span>{formatCurrency(totalMaoObra)}</span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.budgetSummaryTotal}>
                      <strong>Valor Total Estimado</strong>

                      <strong className={styles.totalHighlight}>
                        {formatCurrency(valorTotalOrcamento)}
                      </strong>
                    </div>
                  </div>

                  {budgetError && (
                    <span className={styles.errorText}>{budgetError}</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {budgetStep === 1 ? (
                <>
                  <button
                    type="button"
                    className={styles.btnModalCancel}
                    onClick={() => setShowBudgetModal(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      setBudgetError(null)
                      setBudgetStep(2)
                    }}
                  >
                    Avançar
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.btnModalCancel}
                    onClick={() => setBudgetStep(1)}
                    disabled={budgetMutation.isPending}
                  >
                    <ArrowLeft size={16} /> Voltar
                  </button>

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleSaveBudget}
                    disabled={
                      budgetMutation.isPending || !laborCostInput.trim()
                    }
                  >
                    {budgetMutation.isPending ? (
                      <Loader2 size={16} className={styles.spinner} />
                    ) : (
                      <Check size={16} />
                    )}
                    Salvar orçamento
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {showEditModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !editMutation.isPending && setShowEditModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Editar Ordem de Serviço</h2>
                <p>OS-{ordem.id_ordem_servico}</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                disabled={editMutation.isPending}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Cliente *</label>
                <select
                  value={editIdCliente}
                  onChange={(e) =>
                    setEditIdCliente(Number(e.target.value) || "")
                  }
                  disabled={isLoadingClientes || editMutation.isPending}
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Equipamento *</label>
                <select
                  value={editIdAtivo}
                  onChange={(e) => setEditIdAtivo(Number(e.target.value) || "")}
                  disabled={
                    !editIdCliente || isFetchingAtivos || editMutation.isPending
                  }
                >
                  <option value="">
                    {!editIdCliente
                      ? "Selecione o cliente primeiro"
                      : "Selecione o equipamento..."}
                  </option>
                  {ativos.map((a) => (
                    <option key={a.id_ativo} value={a.id_ativo}>
                      {a.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalField}>
                <label>Problema relatado *</label>
                <textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  disabled={editMutation.isPending}
                  placeholder="Descreva o problema..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Data de Previsão</label>
                <input
                  type="date"
                  value={editPrevisao}
                  onChange={(e) => setEditPrevisao(e.target.value)}
                  disabled={editMutation.isPending}
                />
              </div>

              {editError && (
                <span className={styles.errorText}>{editError}</span>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                disabled={editMutation.isPending}
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveEdit}
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? (
                  <Loader2 size={16} className={styles.spinner} />
                ) : (
                  <Check size={16} />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
