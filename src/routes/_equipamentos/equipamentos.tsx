
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState, type FormEvent } from "react"
import { Search, Plus, X, Loader2, ArrowRight } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import {
  getAllAtivosWithClient,
  createAtivo,
  type CreateAtivoDTO,
  type AtivoWithClientDTO,
} from "../../features/ativo/api/ativos"

import { getAllClientes } from "../../features/clients/api/clients"

import {
  getAllOrders,
  type OrdemServicoDTO,
} from "../../features/orders/api/orders-request"

import styles from "./equipamentos.module.css"

export const Route = createFileRoute("/_equipamentos/equipamentos")({
  component: RouteComponent,
})

const ITEMS_PER_PAGE = 6

type MaintenanceStatus = {
  label: string
  style: string
  dotStyle: string
  hasOrder: boolean
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao cadastrar equipamento."
}

function getMaintenanceStatus(
  ordem?: OrdemServicoDTO
): MaintenanceStatus {
  if (!ordem) {
    return {
      label: "Sem OS vinculada",
      style: styles.statusGray,
      dotStyle: styles.dotGray,
      hasOrder: false,
    }
  }

  const status = ordem.status.toUpperCase()

  switch (status) {
    case "ABERTA":
      return {
        label: "Aberta",
        style: styles.statusGray,
        dotStyle: styles.dotGray,
        hasOrder: true,
      }

    case "EM_DIAGNOSTICO":
    case "EM DIAGNÓSTICO":
    case "EM DIAGNOSTICO":
      return {
        label: "Em diagnóstico",
        style: styles.statusBlue,
        dotStyle: styles.dotBlue,
        hasOrder: true,
      }

    case "AGUARDANDO_APROVACAO":
    case "AGUARDANDO APROVAÇÃO":
    case "AGUARDANDO APROVACAO":
      return {
        label: "Aguardando aprovação",
        style: styles.statusYellow,
        dotStyle: styles.dotYellow,
        hasOrder: true,
      }

    case "REVISAO_ORCAMENTO":
    case "REVISÃO DE ORÇAMENTO":
    case "REVISAO DE ORCAMENTO":
      return {
        label: "Revisão de orçamento",
        style: styles.statusYellow,
        dotStyle: styles.dotYellow,
        hasOrder: true,
      }

    case "EM_EXECUCAO":
    case "EM EXECUÇÃO":
    case "EM EXECUCAO":
      return {
        label: "Em execução",
        style: styles.statusOrange,
        dotStyle: styles.dotOrange,
        hasOrder: true,
      }

    case "AGUARDANDO_PECA":
    case "AGUARDANDO_PEÇAS":
    case "AGUARDANDO PEÇA":
    case "AGUARDANDO PEÇAS":
    case "AGUARDANDO PECA":
    case "AGUARDANDO PECAS":
      return {
        label: "Aguardando peças",
        style: styles.statusOrange,
        dotStyle: styles.dotOrange,
        hasOrder: true,
      }

    case "CONCLUIDA":
    case "CONCLUÍDA":
      return {
        label: "Concluída",
        style: styles.statusGreen,
        dotStyle: styles.dotGreen,
        hasOrder: true,
      }

    case "ENCERRADA":
      return {
        label: "Encerrada",
        style: styles.statusGreen,
        dotStyle: styles.dotGreen,
        hasOrder: true,
      }

    case "CANCELADA":
      return {
        label: "Cancelada",
        style: styles.statusGray,
        dotStyle: styles.dotGray,
        hasOrder: true,
      }

    default:
      return {
        label: ordem.status,
        style: styles.statusGray,
        dotStyle: styles.dotGray,
        hasOrder: true,
      }
  }
}

export default function RouteComponent() {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [clientFilter, setClientFilter] = useState("todos")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formIdCliente, setFormIdCliente] = useState("")
  const [formTipo, setFormTipo] = useState("MAQUINA")
  const [formDescricao, setFormDescricao] = useState("")
  const [formMarca, setFormMarca] = useState("")
  const [formModelo, setFormModelo] = useState("")
  const [formIdentificacao, setFormIdentificacao] = useState("")
  const [formObservacoes, setFormObservacoes] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: equipamentos = [],
    isLoading: isLoadingEquipamentos,
    isError: isErrorEquipamentos,
  } = useQuery<AtivoWithClientDTO[]>({
    queryKey: ["equipamentos", "com-clientes"],
    queryFn: getAllAtivosWithClient,
  })

  const {
    data: clientes = [],
    isLoading: isLoadingClientes,
    isError: isErrorClientes,
  } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: getAllClientes,
  })

  const {
    data: ordens = [],
    isLoading: isLoadingOrdens,
    isError: isErrorOrdens,
  } = useQuery<OrdemServicoDTO[]>({
    queryKey: ["ordens-servico"],
    queryFn: getAllOrders,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAtivoDTO) => createAtivo(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["equipamentos", "com-clientes"],
      })

      closeModal()
    },

    onError: (error: unknown) => {
      setFormError(getErrorMessage(error))
    },
  })

  const openModal = () => {
    setFormError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)

    setFormIdCliente("")
    setFormTipo("MAQUINA")
    setFormDescricao("")
    setFormMarca("")
    setFormModelo("")
    setFormIdentificacao("")
    setFormObservacoes("")
    setFormError(null)
  }

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    if (!formIdCliente) {
      setFormError("Selecione um cliente.")
      return
    }

    if (!formDescricao.trim()) {
      setFormError("Informe o nome do equipamento.")
      return
    }

    const data: CreateAtivoDTO = {
      id_cliente: Number(formIdCliente),
      descricao: formDescricao.trim(),
      tipo: formTipo,
      marca: formMarca.trim(),
      modelo: formModelo.trim(),
      identificacao: formIdentificacao.trim(),
      observacoes: formObservacoes.trim(),
    }

    createMutation.mutate(data)
  }

  const ordensPorAtivo = useMemo(() => {
    const mapa = new Map<number, OrdemServicoDTO>()

    const ordensOrdenadas = [...ordens].sort(
      (a, b) =>
        new Date(b.data_abertura).getTime() -
        new Date(a.data_abertura).getTime()
    )

    for (const ordem of ordensOrdenadas) {
      if (!mapa.has(ordem.id_ativo)) {
        mapa.set(ordem.id_ativo, ordem)
      }
    }

    return mapa
  }, [ordens])

  const filteredEquipamentos = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return equipamentos.filter((eq) => {
      const matchesSearch =
        eq.descricao.toLowerCase().includes(search) ||
        (eq.identificacao?.toLowerCase().includes(search) ?? false) ||
        (eq.cliente?.nome.toLowerCase().includes(search) ?? false)

      const matchesClientFilter =
        clientFilter === "todos" ||
        eq.cliente?.id_cliente.toString() === clientFilter

      return matchesSearch && matchesClientFilter
    })
  }, [equipamentos, searchTerm, clientFilter])

  const totalPages = Math.ceil(
    filteredEquipamentos.length / ITEMS_PER_PAGE
  )

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  )

  const paginatedEquipamentos = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE

    return filteredEquipamentos.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    )
  }, [filteredEquipamentos, safeCurrentPage])

  const isLoading = isLoadingEquipamentos || isLoadingOrdens
  const isError = isErrorEquipamentos || isErrorOrdens

  return (
    <div className={styles.container}>
      <div className={styles.mainWrapper}>
        <div className={styles.searchContainer}>
          <div className={styles.filtersGroup}>
            <div className={styles.search}>
              <Search size={17} />

              <input
                type="text"
                placeholder="Pesquisar equipamento ou cliente"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <select
              className={styles.clientSelect}
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="todos">Todos os clientes</option>

              {clientes.map((client) => (
                <option
                  key={client.id_cliente}
                  value={client.id_cliente.toString()}
                >
                  {client.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            className={styles.newButton}
            type="button"
            onClick={openModal}
          >
            <Plus size={18} />
            Novo equipamento
          </button>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>EQUIPAMENTO</span>
            <span>CLIENTE</span>
            <span>TIPO</span>
            <span>IDENTIFICAÇÃO</span>
            <span>MANUTENÇÃO</span>
            <span></span>
          </div>

          {isLoading ? (
            <div className={styles.emptyMessage}>
              Carregando equipamentos e ordens...
            </div>
          ) : isError ? (
            <div className={styles.emptyMessage}>
              Não foi possível carregar os equipamentos ou as ordens de serviço.
            </div>
          ) : paginatedEquipamentos.length === 0 ? (
            <div className={styles.emptyMessage}>
              Nenhum equipamento encontrado.
            </div>
          ) : (
            <div className={styles.equipamentosList}>
              {paginatedEquipamentos.map((eq) => {
                const ordem = ordensPorAtivo.get(eq.id_ativo)
                const manutencao = getMaintenanceStatus(ordem)

                return (
                  <div key={eq.id_ativo} className={styles.tableRow}>
                    <div className={styles.colEquipamento}>
                      <strong>{eq.descricao}</strong>

                      <span>
                        {eq.ativo
                          ? "Ativo em operação"
                          : "Inativo / Fora de operação"}
                      </span>
                    </div>

                    <div className={styles.colCliente}>
                      <strong>
                        {eq.cliente?.nome || "Não vinculado"}
                      </strong>
                    </div>

                    <div className={styles.colTipo}>
                      {eq.tipo}
                    </div>

                    <div className={styles.colIdentificacao}>
                      {eq.identificacao ||
                        `EQ-${String(eq.id_ativo).padStart(3, "0")}`}
                    </div>

                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.statusBadge} ${manutencao.style}`}
                      >
                        <span
                          className={`${styles.statusDot} ${manutencao.dotStyle}`}
                        />

                        {manutencao.label}
                      </span>
                    </div>

                    <div className={styles.colActions}>
                      <button
                        type="button"
                        className={`${styles.ordersBtn} ${
                          !manutencao.hasOrder
                            ? styles.ordersBtnDisabled
                            : ""
                        }`}
                        disabled={!manutencao.hasOrder}
                        onClick={() => {
                          if (manutencao.hasOrder) {
                            window.location.href = "/ordens-servico"
                          }
                        }}
                      >
                        Ordens
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {filteredEquipamentos.length}{" "}
              {filteredEquipamentos.length === 1
                ? "registro"
                : "registros"}{" "}
              · Página {totalPages === 0 ? 0 : safeCurrentPage} de{" "}
              {totalPages}
            </span>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={safeCurrentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
              >
                ‹
              </button>

              <span className={styles.currentPage}>
                {totalPages === 0 ? 0 : safeCurrentPage}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={
                  totalPages === 0 || safeCurrentPage >= totalPages
                }
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Novo equipamento</h2>
                <p>Vincule o ativo ao cliente responsável.</p>
              </div>

              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={closeModal}
                disabled={createMutation.isPending}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={styles.modalForm}
              onSubmit={handleCreateSubmit}
            >
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cliente">Cliente *</label>

                  <select
                    id="cliente"
                    value={formIdCliente}
                    onChange={(e) =>
                      setFormIdCliente(e.target.value)
                    }
                    disabled={
                      isLoadingClientes ||
                      isErrorClientes ||
                      createMutation.isPending
                    }
                    required
                  >
                    <option value="" disabled>
                      {isLoadingClientes
                        ? "Carregando clientes..."
                        : "Selecione um cliente"}
                    </option>

                    {clientes.map((client) => (
                      <option
                        key={client.id_cliente}
                        value={client.id_cliente}
                      >
                        {client.nome}
                      </option>
                    ))}
                  </select>

                  {isErrorClientes && (
                    <span className={styles.errorMessage}>
                      Não foi possível carregar os clientes.
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tipo">Tipo *</label>

                  <select
                    id="tipo"
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    disabled={createMutation.isPending}
                    required
                  >
                    <option value="MAQUINA">Máquina</option>
                    <option value="VEICULO">Veículo</option>
                    <option value="FERRAMENTA">Ferramenta</option>
                    <option value="EQUIPAMENTO_INDUSTRIAL">
                      Equipamento industrial
                    </option>
                    <option value="MAQUINA_PNEUMATICA">
                      Máquina pneumática
                    </option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="descricao">
                    Nome do equipamento *
                  </label>

                  <input
                    id="descricao"
                    type="text"
                    value={formDescricao}
                    onChange={(e) =>
                      setFormDescricao(e.target.value)
                    }
                    disabled={createMutation.isPending}
                    placeholder="Ex.: Compressor de ar industrial"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="identificacao">
                    Identificação
                  </label>

                  <input
                    id="identificacao"
                    type="text"
                    value={formIdentificacao}
                    onChange={(e) =>
                      setFormIdentificacao(e.target.value)
                    }
                    disabled={createMutation.isPending}
                    placeholder="Ex.: COMP-001"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="marca">Marca</label>

                  <input
                    id="marca"
                    type="text"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    disabled={createMutation.isPending}
                    placeholder="Ex.: Schulz"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="modelo">Modelo</label>

                  <input
                    id="modelo"
                    type="text"
                    value={formModelo}
                    onChange={(e) => setFormModelo(e.target.value)}
                    disabled={createMutation.isPending}
                    placeholder="Ex.: MSV 20 MAX"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="observacoes">
                    Observações
                  </label>

                  <textarea
                    id="observacoes"
                    value={formObservacoes}
                    onChange={(e) =>
                      setFormObservacoes(e.target.value)
                    }
                    disabled={createMutation.isPending}
                    placeholder="Informações adicionais sobre o equipamento..."
                    rows={3}
                  />
                </div>
              </div>

              {formError && (
                <div className={styles.errorMessage}>
                  {formError}
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={closeModal}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={
                    createMutation.isPending ||
                    isLoadingClientes ||
                    isErrorClientes ||
                    !formIdCliente ||
                    !formDescricao.trim()
                  }
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2
                        size={16}
                        className={styles.spinner}
                      />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar equipamento"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
