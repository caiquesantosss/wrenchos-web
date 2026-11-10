import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronRight, ArrowLeft, Loader2 } from "lucide-react"

import styles from "./nova_ordem.module.css"

import { getAllClientes } from "../../../features/clients/api/clients"
import { createOrder } from "../../../features/orders/api/orders-request"
import {
  getAtivosByCliente,
  type AtivoDTO,
} from "../../../features/ativo/api/ativos"

export const Route = createFileRoute("/_ordem_servico/nova/nova_ordem")({
  component: RouteComponent,
})

export default function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)

  const [idCliente, setIdCliente] = useState<number | "">("")
  const [idAtivo, setIdAtivo] = useState<number | "">("")
  const [descricaoProblema, setDescricaoProblema] = useState("")

  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: clientes = [],
    isLoading: isLoadingClientes,
    isError: isErrorClientes,
  } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: getAllClientes,
  })

  const {
    data: ativos = [],
    isLoading: isLoadingAtivos,
    isError: isErrorAtivos,
  } = useQuery<AtivoDTO[]>({
    queryKey: ["ativos", "cliente", idCliente],
    queryFn: () => getAtivosByCliente(Number(idCliente)),
    enabled: idCliente !== "",
  })

  const createOrderMutation = useMutation({
    mutationFn: createOrder,

    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["orders", "todas"],
      })

      navigate({
        to: "/descricao/$id",
        params: {
          id: String(data.id_ordem_servico),
        },
      })
    },

    onError: (error: Error) => {
      setFormError(
        error.message || "Não foi possível criar a Ordem de Serviço.",
      )
    },
  })

  const handleClienteChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value

    setIdCliente(value ? Number(value) : "")

    setIdAtivo("")
    setFormError(null)
  }

  const handleAtivoChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value

    setIdAtivo(value ? Number(value) : "")
    setFormError(null)
  }

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (idCliente === "") {
      setFormError("Selecione um cliente.")
      return
    }

    if (idAtivo === "") {
      setFormError("Selecione um equipamento.")
      return
    }

    if (!descricaoProblema.trim()) {
      setFormError("Informe a descrição do problema.")
      return
    }

    createOrderMutation.mutate({
      id_cliente: idCliente,
      id_ativo: idAtivo,
      descricao_problema: descricaoProblema.trim(),
    })
  }

  const handleBack = () => {
    navigate({ to: "/ordemServico" })
  }

  const isSubmitDisabled =
    idCliente === "" ||
    idAtivo === "" ||
    !descricaoProblema.trim() ||
    createOrderMutation.isPending

  const ativoPlaceholder = () => {
    if (idCliente === "") {
      return "Selecione um cliente primeiro"
    }

    if (isLoadingAtivos) {
      return "Carregando equipamentos..."
    }

    if (isErrorAtivos) {
      return "Erro ao carregar equipamentos"
    }

    if (ativos.length === 0) {
      return "Nenhum equipamento encontrado"
    }

    return "Selecione o equipamento"
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={createOrderMutation.isPending}
        >
          <ArrowLeft size={20} />
          Ordens de serviço
        </button>
      </div>

      {/* Indicador de etapas */}
      <div className={styles.stepperContainer}>
        <div
          className={`${styles.step} ${
            currentStep >= 1 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepCircle}>
            {currentStep > 1 ? <Check size={16} /> : 1}
          </div>

          <span className={styles.stepLabel}>Abertura</span>
        </div>

        <div className={styles.stepDivider} />

        <div
          className={`${styles.step} ${
            currentStep >= 2 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepCircle}>2</div>

          <span className={styles.stepLabel}>Diagnóstico e orçamento</span>
        </div>

        <div className={styles.stepDivider} />

        <div
          className={`${styles.step} ${
            currentStep >= 3 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepCircle}>3</div>

          <span className={styles.stepLabel}>Execução</span>
        </div>
      </div>

      <div className={styles.formCard}>
        {/* ETAPA 1 — ABERTURA */}
        {currentStep === 1 && (
          <form onSubmit={handleCreateOrder}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Cliente e equipamento</h3>

              <div className={styles.grid2}>
                {/* Seleção do cliente */}
                <div className={styles.inputGroup}>
                  <label htmlFor="cliente">Cliente *</label>

                  <select
                    id="cliente"
                    value={idCliente}
                    onChange={handleClienteChange}
                    disabled={
                      isLoadingClientes || createOrderMutation.isPending
                    }
                    className={styles.select}
                    required
                  >
                    <option value="">
                      {isLoadingClientes
                        ? "Carregando clientes..."
                        : isErrorClientes
                          ? "Erro ao carregar clientes"
                          : "Selecione o cliente"}
                    </option>

                    {clientes.map((cliente) => (
                      <option
                        key={cliente.id_cliente}
                        value={cliente.id_cliente}
                      >
                        {cliente.nome}
                      </option>
                    ))}
                  </select>

                  {isErrorClientes && (
                    <span className={styles.errorMessage}>
                      Não foi possível carregar os clientes.
                    </span>
                  )}
                </div>

                {/* Seleção do equipamento */}
                <div className={styles.inputGroup}>
                  <label htmlFor="ativo">Equipamento *</label>

                  <select
                    id="ativo"
                    value={idAtivo}
                    onChange={handleAtivoChange}
                    disabled={
                      idCliente === "" ||
                      isLoadingAtivos ||
                      isErrorAtivos ||
                      ativos.length === 0 ||
                      createOrderMutation.isPending
                    }
                    className={styles.select}
                    required
                  >
                    <option value="">{ativoPlaceholder()}</option>

                    {ativos.map((ativo: AtivoDTO) => (
                      <option key={ativo.id_ativo} value={ativo.id_ativo}>
                        {ativo.descricao}
                        {ativo.identificacao ? ` - ${ativo.identificacao}` : ""}
                      </option>
                    ))}
                  </select>

                  {isErrorAtivos && idCliente !== "" && (
                    <span className={styles.errorMessage}>
                      Não foi possível carregar os equipamentos.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição do problema */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Informações do serviço</h3>

              <div className={styles.inputGroup}>
                <label htmlFor="descricaoProblema">
                  Problema / serviço solicitado *
                </label>

                <textarea
                  id="descricaoProblema"
                  rows={5}
                  placeholder="Descreva o relato do cliente e o problema apresentado pelo equipamento..."
                  value={descricaoProblema}
                  onChange={(event) => {
                    setDescricaoProblema(event.target.value)
                    setFormError(null)
                  }}
                  disabled={createOrderMutation.isPending}
                  className={styles.textarea}
                  required
                />
              </div>
            </div>

            {/* Mensagem de erro */}
            {formError && (
              <div className={styles.errorMessage} role="alert">
                {formError}
              </div>
            )}

            {/* Ações */}
            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={handleBack}
                disabled={createOrderMutation.isPending}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={isSubmitDisabled}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Criando ordem...
                  </>
                ) : (
                  <>
                    Criar ordem de serviço
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 2 — DIAGNÓSTICO E ORÇAMENTO */}
        {currentStep === 2 && (
          <div className={styles.stepSuccessContainer}>
            <div className={styles.successCircle}>
              <Check size={32} />
            </div>

            <h2>Ordem de Serviço criada com sucesso!</h2>

            <p>
              A OS <strong>#{createdOrderId}</strong> foi registrada no sistema.
            </p>

            <div className={styles.nextStepsBox}>
              <p>
                A abertura foi concluída. O próximo passo será realizar o
                diagnóstico do equipamento e elaborar o orçamento.
              </p>
            </div>

            <button
              type="button"
              className={styles.btnSubmit}
              onClick={handleBack}
            >
              Voltar para a lista
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
