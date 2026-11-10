
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
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
  type AddItemsOsDTO,
} from "../../../features/orders/api/orders-request"

import { allCatalogItems } from "../../../features/items/catalogo/api/catalogo_items"

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

function getCurrentStepIndex(
  status: string,
  hasFinanceiro: boolean,
): number {
  const normalizedStatus = normalizeStatus(status)

  if (normalizedStatus === "CONCLUIDA" && hasFinanceiro) {
    return 5
  }

  return ORDER_STAGES[normalizedStatus] ?? 0
}

function getPrimaryAction(
  status: string,
  hasDiagnostic: boolean,
  hasFinanceiro: boolean,
): PrimaryAction {
  const normalizedStatus = normalizeStatus(status)

  if (
    DIAGNOSTIC_STATUSES.includes(normalizedStatus) &&
    !hasDiagnostic
  ) {
    return {
      label: "Gerar diagnóstico",
      action: "diagnostic",
      enabled: true,
    }
  }

  if (BUDGET_STATUSES.includes(normalizedStatus)) {
    return {
      label: "Definir orçamento",
      action: "budget",
      enabled: true,
    }
  }

  if (normalizedStatus === "AGUARDANDO_APROVACAO") {
    return {
      label: "Iniciar execução",
      action: "approval",
      enabled: true,
    }
  }

  if (normalizedStatus === "EM_EXECUCAO") {
    return {
      label: "Concluir serviço",
      action: "completion",
      enabled: true,
    }
  }

  if (normalizedStatus === "CONCLUIDA") {
    return hasFinanceiro
      ? {
          label: "Faturamento gerado",
          action: "none",
          enabled: false,
        }
      : {
          label: "Gerar faturamento",
          action: "billing",
          enabled: true,
        }
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

  const {
    data: ordem,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Number.isInteger(orderId) && orderId > 0,
  })

  const {
    data: catalogoItems = [],
    isLoading: isLoadingCatalog,
  } = useQuery({
    queryKey: ["catalogo-itens", "todos"],
    queryFn: allCatalogItems,
    enabled: showBudgetModal,
  })

  const {
    data: financeiroList = [],
    isLoading: isLoadingFinanceiro,
  } = useQuery({
    queryKey: ["financeiro", "todos"],
    queryFn: getAllFinanceiro,
  })

  const financeiroDaOS = financeiroList.find(
    (financeiro) => financeiro.id_ordem_servico === orderId,
  )

  const hasFinanceiro = Boolean(financeiroDaOS)

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["orders"],
    })
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

    onError: (error: Error) => {
      setDiagError(
        error.message || "Erro ao registrar diagnóstico.",
      )
    },
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

      const valorMaoObra = Number.parseFloat(
        laborCostInput.replace(",", "."),
      )

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

      await invalidateOrders()
    },

    onError: (error: Error) => {
      setBudgetError(
        error.message || "Erro ao salvar o orçamento.",
      )
    },
  })

  const startExecutionMutation = useMutation({
    mutationFn: () => StartExecution(orderId),

    onSuccess: async () => {
      setGlobalError(null)

      await invalidateOrders()
    },

    onError: (error: Error) => {
      setGlobalError(
        error.message || "Erro ao iniciar a execução da OS.",
      )
    },
  })

  const completionMutation = useMutation({
    mutationFn: (solucao: string) =>
      finishExecution(orderId, {
        appliedSolution: solucao,
      }),

    onSuccess: async () => {
      setCompletionError(null)
      setSolucaoInput("")
      setShowCompletionModal(false)

      await invalidateOrders()
    },

    onError: (error: Error) => {
      setCompletionError(
        error.message || "Erro ao concluir serviço.",
      )
    },
  })

  const faturarMutation = useMutation({
    mutationFn: () => {
      if (!ordem) {
        throw new Error("Ordem de serviço não encontrada.")
      }

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
        queryClient.invalidateQueries({
          queryKey: ["financeiro"],
        }),
        invalidateOrders(),
      ])
    },

    onError: (error: Error) => {
      setGlobalError(
        error.message || "Erro ao gerar faturamento.",
      )
    },
  })

  const handleSaveDiagnostic = () => {
    if (diagnosticoInput.trim().length < 5) {
      setDiagError("O diagnóstico deve ser mais descritivo.")
      return
    }

    diagnosticMutation.mutate(diagnosticoInput.trim())
  }

  const handleSaveCompletion = () => {
    if (solucaoInput.trim().length < 5) {
      setCompletionError(
        "A solução aplicada deve ser mais descritiva.",
      )
      return
    }

    completionMutation.mutate(solucaoInput.trim())
  }

  const handleAddItem = () => {
    if (
      selectedItemId === "" ||
      !Number.isInteger(itemQuantity) ||
      itemQuantity <= 0
    ) {
      return
    }

    const selectedItem = catalogoItems.find(
      (item) => item.id_catalogo_item === selectedItemId,
    )

    if (!selectedItem) return

    setAddedItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.id_catalogo_item === selectedItem.id_catalogo_item,
      )

      if (existingItem) {
        return currentItems.map((item) => {
          if (
            item.id_catalogo_item !== selectedItem.id_catalogo_item
          ) {
            return item
          }

          const quantidade = item.quantidade + itemQuantity

          return {
            ...item,
            quantidade,
            valor_total_item:
              Number(item.valor_unitario) * quantidade,
          }
        })
      }

      return [
        ...currentItems,
        {
          ...selectedItem,
          quantidade: itemQuantity,
          valor_total_item:
            Number(selectedItem.valor_unitario) * itemQuantity,
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
    const laborValue = Number.parseFloat(
      laborCostInput.replace(",", "."),
    )

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

  const totalMaoObra =
    Number.parseFloat(laborCostInput.replace(",", ".")) || 0

  const valorTotalOrcamento = totalPecas + totalMaoObra

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return (
      <div className={styles.errorState}>
        Identificador inválido.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        Carregando detalhes da OS...
      </div>
    )
  }

  if (isError || !ordem) {
    return (
      <div className={styles.errorState}>
        Não foi possível carregar a OS.
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex(
    ordem.status,
    hasFinanceiro,
  )

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
    faturarMutation.isPending

  const isPrimaryActionDisabled =
    !primaryAction.enabled ||
    isGlobalLoading ||
    (primaryAction.action === "billing" && isLoadingFinanceiro)

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
            className={styles.btnPrimary}
            disabled={isPrimaryActionDisabled}
            onClick={handlePrimaryAction}
          >
            {isGlobalLoading || (
              primaryAction.action === "billing" &&
              isLoadingFinanceiro
            ) ? (
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

              <span className={styles.stepLabel}>
                {step}
              </span>
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

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "historico" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("historico")}
        >
          Histórico
        </button>
      </nav>

      {activeTab === "visao_geral" && (
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <h2 className={styles.sectionTitle}>
              Informações do atendimento
            </h2>

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
                <span>
                  {ordem.usuario?.nome || "Não atribuído"}
                </span>
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
                <p className={styles.diagnosticText}>
                  {ordem.diagnostico}
                </p>
              ) : (
                <p className={styles.diagnosticEmpty}>
                  Diagnóstico não registrado. Utilize a ação
                  correspondente no topo.
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
              <h2 className={styles.sectionTitle}>
                Resumo da ordem
              </h2>

              <div className={styles.summaryRow}>
                <span>Serviços e peças</span>
                <strong>
                  {formatCurrency(ordem.valor_total || 0)}
                </strong>
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
              <h2 className={styles.sectionTitle}>
                Últimas atualizações
              </h2>

              {hasFinanceiro && financeiroDaOS && (
                <div className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ backgroundColor: "#0d9488" }}
                  />

                  <div className={styles.timelineContent}>
                    <h4>Faturamento gerado</h4>
                    <p>
                      Lançamento financeiro registrado com sucesso
                    </p>
                    <span>
                      {formatDate(financeiroDaOS.data_cadastro)}
                    </span>
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
                  <p>
                    Atualizado por {ordem.usuario?.nome || "Sistema"}
                  </p>
                  <span>
                    {formatDate(ordem.data_atualizacao)}
                  </span>
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

      {activeTab === "servicos" && (
        <div className={styles.fullCol}>
          <h2 className={styles.sectionTitle}>
            Itens e Serviços Vinculados
          </h2>

          {ordem.itens_os && ordem.itens_os.length > 0 ? (
            <div className={styles.servicesTable}>
              <div className={styles.servicesTableHeader}>
                <span>ITEM / SERVIÇO</span>
                <span>QUANTIDADE</span>
                <span>VALOR UNITÁRIO</span>
                <span>VALOR TOTAL</span>
              </div>

              <div className={styles.servicesTableBody}>
                {ordem.itens_os.map((item) => (
                  <div
                    key={item.id_item_os}
                    className={styles.servicesTableRow}
                  >
                    <div className={styles.servicesColInfo}>
                      <strong>
                        {item.catalogo_item?.descricao ||
                          "Item sem descrição"}
                      </strong>

                      <span>
                        {item.catalogo_item?.tipo_item || "-"}
                      </span>
                    </div>

                    <div>
                      {Number(item.quantidade)} un
                    </div>

                    <div>
                      {formatCurrency(item.valor_unitario)}
                    </div>

                    <div>
                      <strong>
                        {formatCurrency(item.valor_total)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyServicesState}>
              <p>
                Não há peças ou serviços registrados nesta
                Ordem de Serviço.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "financeiro" && (
        <div className={styles.fullCol}>
          <h2 className={styles.sectionTitle}>
            Resumo financeiro
          </h2>

          {isLoadingFinanceiro ? (
            <div className={styles.emptyServicesState}>
              Carregando dados financeiros...
            </div>
          ) : financeiroDaOS ? (
            <div className={styles.financeCard}>
              <div className={styles.financeRow}>
                <div className={styles.financeColBlock}>
                  <label>Valor do serviço</label>
                  <strong>
                    {formatCurrency(financeiroDaOS.valor)}
                  </strong>
                </div>

                <div className={styles.financeColBlock}>
                  <label>Situação</label>

                  <span className={styles.paymentBadge}>
                    <span className={styles.dotOrange} />

                    {financeiroDaOS.status_pagamento
                      .charAt(0)
                      .toUpperCase() +
                      financeiroDaOS.status_pagamento
                        .slice(1)
                        .toLowerCase()}
                  </span>
                </div>
              </div>

              <div
                className={styles.divider}
                style={{ margin: "1.5rem 0" }}
              />

              <div className={styles.financeDetails}>
                <div className={styles.summaryRow}>
                  <span>Descrição</span>
                  <strong>{financeiroDaOS.descricao}</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Vencimento</span>
                  <strong>
                    {formatDate(financeiroDaOS.data_vencimento)}
                  </strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Data de cadastro</span>
                  <strong>
                    {formatDate(financeiroDaOS.data_cadastro)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyServicesState}>
              <p>
                O faturamento ainda não foi gerado para esta
                Ordem de Serviço. Aguarde a conclusão da ordem
                e utilize o botão <strong>Gerar faturamento</strong>
                no topo da página.
              </p>
            </div>
          )}
        </div>
      )}

      {(activeTab === "orcamento" || activeTab === "historico") && (
        <div className={styles.fullCol}>
          <div className={styles.emptyServicesState}>
            <p>
              O conteúdo desta aba (
              {activeTab.replace("_", " ")}) será implementado
              em breve.
            </p>
          </div>
        </div>
      )}

      {showDiagnosticModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !diagnosticMutation.isPending &&
            setShowDiagnosticModal(false)
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
                <label htmlFor="diagnostico">
                  Diagnóstico técnico
                </label>

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
                  <span className={styles.errorText}>
                    {diagError}
                  </span>
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
                  <Loader2
                    size={16}
                    className={styles.spinner}
                  />
                ) : (
                  <Check size={16} />
                )}

                Salvar diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompletionModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !completionMutation.isPending &&
            setShowCompletionModal(false)
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
                <label htmlFor="solucao">
                  Solução aplicada
                </label>

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
                  <span className={styles.errorText}>
                    {completionError}
                  </span>
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
                  <Loader2
                    size={16}
                    className={styles.spinner}
                  />
                ) : (
                  <Check size={16} />
                )}

                Finalizar OS
              </button>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !budgetMutation.isPending &&
            setShowBudgetModal(false)
          }
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
                    <div
                      className={styles.formGroup}
                      style={{ flex: 3 }}
                    >
                      <label htmlFor="catalogo-item">
                        Buscar Item
                      </label>

                      <select
                        id="catalogo-item"
                        value={selectedItemId}
                        onChange={(event) => {
                          const value = event.target.value

                          setSelectedItemId(
                            value ? Number(value) : "",
                          )
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

                    <div
                      className={styles.formGroup}
                      style={{ flex: 1 }}
                    >
                      <label htmlFor="item-quantity">
                        Quantidade
                      </label>

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
                      <span>
                        Peças e Itens ({addedItems.length})
                      </span>

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
                    <span className={styles.errorText}>
                      {budgetError}
                    </span>
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
                    <ArrowLeft size={16} />
                    Voltar
                  </button>

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleSaveBudget}
                    disabled={
                      budgetMutation.isPending ||
                      !laborCostInput.trim()
                    }
                  >
                    {budgetMutation.isPending ? (
                      <Loader2
                        size={16}
                        className={styles.spinner}
                      />
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
    </div>
  )
}
