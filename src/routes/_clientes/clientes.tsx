import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react"

import {
  getAllClientes,
  createCliente,
  updateCliente,
  deactivateCliente
} from "../../features/clients/api/clients"
import { getAllAtivos } from "../../features/ativo/api/ativos"
import styles from "./clientes.module.css"

const ITEMS_PER_PAGE = 5

export const Route = createFileRoute("/_clientes/clientes")({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<any>(null)
  const [clientToDeactivate, setClientToDeactivate] = useState<any>(null)

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
  } = useQuery({
    queryKey: ["ativos", "todos"],
    queryFn: getAllAtivos,
  })

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", "todos"] })
      setIsCreateModalOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", "todos"] })
      setClientToEdit(null)
    }
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", "todos"] })
      setClientToDeactivate(null)
    }
  })

  const ativosPorCliente = useMemo(() => {
    return ativos.reduce(
      (acc, ativo) => {
        const idCliente = Number(ativo.id_cliente)
        acc[idCliente] = (acc[idCliente] ?? 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )
  }, [ativos])

  const filteredClientes = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()
    const documentSearch = search.replace(/\D/g, "")

    return clientes.filter((cliente) => {
      const matchesName = cliente.nome.toLowerCase().includes(search)
      const matchesDocument =
        documentSearch.length > 0 &&
        cliente.documento.includes(documentSearch)
      const matchesPhone =
        cliente.telefone?.toLowerCase().includes(search) ?? false
      const matchesEmail =
        cliente.email?.toLowerCase().includes(search) ?? false

      return matchesName || matchesDocument || matchesPhone || matchesEmail
    })
  }, [clientes, searchTerm])

  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE)

  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredClientes.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredClientes, currentPage])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const formatDocument = (documento: string) => {
    if (documento.length === 11) {
      return documento.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
    }
    if (documento.length === 14) {
      return documento.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    }
    return documento
  }

  const getContact = (telefone?: string, email?: string | null) => {
    return telefone || email || "Contato não informado"
  }

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      nome: formData.get("nome") as string,
      documento: formData.get("documento") as string,
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientToEdit) return
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      id: clientToEdit.id_cliente,
      data: {
        nome: formData.get("nome") as string,
        documento: formData.get("documento") as string,
        telefone: formData.get("telefone") as string,
        email: formData.get("email") as string,
      }
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.clientsContainer}>
        <div className={styles.searchContainer}>
          <div className={styles.search}>
            <Search size={17} />
            <input
              type="text"
              placeholder="Pesquisar nome, contato ou CNPJ"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <button
            className={styles.newClientButton}
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Novo cliente
          </button>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>CLIENTE</span>
            <span>CONTATO</span>
            <span>EQUIPAMENTOS</span>
            <span>STATUS</span>
            <span>AÇÕES</span>
          </div>

          {isLoadingClientes ? (
            <div className={styles.emptyMessage}>Carregando clientes...</div>
          ) : isErrorClientes ? (
            <div className={styles.emptyMessage}>Não foi possível carregar os clientes.</div>
          ) : paginatedClientes.length === 0 ? (
            <div className={styles.emptyMessage}>Nenhum cliente encontrado.</div>
          ) : (
            <div className={styles.clientsList}>
              {paginatedClientes.map((cliente) => {
                const quantidadeAtivos = ativosPorCliente[Number(cliente.id_cliente)] ?? 0

                return (
                  <div key={cliente.id_cliente} className={styles.clientRow}>
                    <div className={styles.colClient}>
                      <strong>{cliente.nome}</strong>
                      <span>{formatDocument(cliente.documento)}</span>
                    </div>

                    <div className={styles.colContact}>
                      <strong>{getContact(cliente.telefone, null)}</strong>
                      <span>{cliente.email || "Email não informado"}</span>
                    </div>

                    <div className={styles.colEquipment}>
                      {isLoadingAtivos
                        ? "Carregando..."
                        : isErrorAtivos
                          ? "Indisponível"
                          : `${quantidadeAtivos} ${quantidadeAtivos === 1 ? "vinculado" : "vinculados"}`}
                    </div>

                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.status} ${
                          cliente.ativo ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className={styles.colActions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        title="Editar cliente"
                        onClick={() => setClientToEdit(cliente)}
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        className={styles.actionButton}
                        title={quantidadeAtivos > 0 ? "Não é possível desativar cliente com vínculos" : "Desativar cliente"}
                        disabled={quantidadeAtivos > 0 || !cliente.ativo}
                        onClick={() => setClientToDeactivate(cliente)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {filteredClientes.length} {filteredClientes.length === 1 ? "registro" : "registros"} · Página {filteredClientes.length === 0 ? 0 : currentPage} de {totalPages}
            </span>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                ‹
              </button>

              <span className={styles.currentPage}>
                {filteredClientes.length === 0 ? 0 : currentPage}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Cliente</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome</label>
                  <input name="nome" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Documento (CPF/CNPJ)</label>
                  <input name="documento" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input name="telefone" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input name="email" type="email" />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToEdit && (
        <div className={styles.modalOverlay} onClick={() => setClientToEdit(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Cliente</h2>
              <button onClick={() => setClientToEdit(null)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome</label>
                  <input name="nome" defaultValue={clientToEdit.nome} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Documento</label>
                  <input name="documento" defaultValue={clientToEdit.documento} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input name="telefone" defaultValue={clientToEdit.telefone} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={clientToEdit.email} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setClientToEdit(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToDeactivate && (
        <div className={styles.modalOverlay} onClick={() => setClientToDeactivate(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Desativar Cliente</h2>
              <button onClick={() => setClientToDeactivate(null)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.alertContent}>
                <AlertTriangle size={32} color="#c0392b" />
                <p>Tem certeza que deseja desativar o cliente <strong>{clientToDeactivate.nome}</strong>?</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setClientToDeactivate(null)}>Cancelar</button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => deactivateMutation.mutate(clientToDeactivate.id_cliente)}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending ? "Desativando..." : "Desativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}