
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"

import { getAllClientes } from "../../features/clients/api/clients"
import { getAllAtivos } from "../../features/ativo/api/ativos"
import styles from "./clientes.module.css"

const ITEMS_PER_PAGE = 5

export const Route = createFileRoute("/_clientes/clientes")({
  component: RouteComponent,
})

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

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

      return (
        matchesName ||
        matchesDocument ||
        matchesPhone ||
        matchesEmail
      )
    })
  }, [clientes, searchTerm])

  const totalPages = Math.ceil(
    filteredClientes.length / ITEMS_PER_PAGE,
  )

  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    return filteredClientes.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    )
  }, [filteredClientes, currentPage])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const formatDocument = (documento: string) => {
    if (documento.length === 11) {
      return documento.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        "$1.$2.$3-$4",
      )
    }

    if (documento.length === 14) {
      return documento.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
      )
    }

    return documento
  }

  const getContact = (telefone?: string, email?: string | null) => {
    return telefone || email || "Contato não informado"
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
            disabled
            title="Cadastro de clientes ainda não implementado"
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
            <div className={styles.emptyMessage}>
              Carregando clientes...
            </div>
          ) : isErrorClientes ? (
            <div className={styles.emptyMessage}>
              Não foi possível carregar os clientes.
            </div>
          ) : paginatedClientes.length === 0 ? (
            <div className={styles.emptyMessage}>
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className={styles.clientsList}>
              {paginatedClientes.map((cliente) => {
                const quantidadeAtivos =
                  ativosPorCliente[Number(cliente.id_cliente)] ?? 0

                return (
                  <div
                    key={cliente.id_cliente}
                    className={styles.clientRow}
                  >
                    <div className={styles.colClient}>
                      <strong>{cliente.nome}</strong>
                      <span>{formatDocument(cliente.documento)}</span>
                    </div>

                    <div className={styles.colContact}>
                      <strong>
                        {getContact(cliente.telefone, null)}
                      </strong>

                      <span>
                        {cliente.email || "Email não informado"}
                      </span>
                    </div>

                    <div className={styles.colEquipment}>
                      {isLoadingAtivos
                        ? "Carregando..."
                        : isErrorAtivos
                          ? "Indisponível"
                          : `${quantidadeAtivos} ${
                              quantidadeAtivos === 1
                                ? "vinculado"
                                : "vinculados"
                            }`}
                    </div>

                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.status} ${
                          cliente.ativo
                            ? styles.statusActive
                            : styles.statusInactive
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
                        disabled
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        className={styles.actionButton}
                        title="Alterar status do cliente"
                        disabled
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
              {filteredClientes.length}{" "}
              {filteredClientes.length === 1
                ? "registro"
                : "registros"}{" "}
              · Página {filteredClientes.length === 0 ? 0 : currentPage} de{" "}
              {totalPages}
            </span>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
                aria-label="Página anterior"
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
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
                aria-label="Próxima página"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
