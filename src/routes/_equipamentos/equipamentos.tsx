import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAllAtivosWithClient } from '../../features/ativo/api/ativos'
import styles from './equipamentos.module.css'

export const Route = createFileRoute('/_equipamentos/equipamentos')({
  component: RouteComponent,
})

const ITEMS_PER_PAGE = 6

export default function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [clientFilter, setClientFilter] = useState('todos')

  const {
    data: equipamentos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['equipamentos', 'com-clientes'],
    queryFn: getAllAtivosWithClient,
  })

  const uniqueClients = useMemo(() => {
    const clientsMap = new Map()
    equipamentos.forEach((eq) => {
      if (eq.cliente && !clientsMap.has(eq.cliente.id_cliente)) {
        clientsMap.set(eq.cliente.id_cliente, eq.cliente.nome)
      }
    })
    return Array.from(clientsMap.entries()).map(([id, nome]) => ({ id, nome }))
  }, [equipamentos])

  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter((eq) => {
      const search = searchTerm.toLowerCase().trim()

      const matchesSearch =
        eq.descricao.toLowerCase().includes(search) ||
        eq.identificacao?.toLowerCase().includes(search) ||
        eq.cliente?.nome.toLowerCase().includes(search)

      const matchesClientFilter =
        clientFilter === 'todos' || eq.cliente?.id_cliente.toString() === clientFilter

      return matchesSearch && matchesClientFilter
    })
  }, [equipamentos, searchTerm, clientFilter])

  const totalPages = Math.ceil(filteredEquipamentos.length / ITEMS_PER_PAGE)

  const paginatedEquipamentos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEquipamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredEquipamentos, currentPage])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleClientFilter = (value: string) => {
    setClientFilter(value)
    setCurrentPage(1)
  }

  const getSimulatedStatus = (id: number) => {
    const mockStatuses = [
      { label: 'Em execução', style: styles.statusOrange, dotStyle: styles.dotOrange },
      { label: 'Aguardando peças', style: styles.statusOrange, dotStyle: styles.dotOrange },
      { label: 'Concluída', style: styles.statusGreen, dotStyle: styles.dotGreen },
      { label: 'Aberta', style: styles.statusGray, dotStyle: styles.dotGray },
      { label: 'Orçamento', style: styles.statusGray, dotStyle: styles.dotGray },
    ]
    return mockStatuses[id % mockStatuses.length]
  }

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
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <select
              className={styles.clientSelect}
              value={clientFilter}
              onChange={(e) => handleClientFilter(e.target.value)}
            >
              <option value="todos">Todos os clientes</option>
              {uniqueClients.map((client) => (
                <option key={client.id} value={client.id.toString()}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>

          <button className={styles.newButton} type="button">
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
            <div className={styles.emptyMessage}>Carregando equipamentos...</div>
          ) : isError ? (
            <div className={styles.emptyMessage}>Não foi possível carregar os equipamentos.</div>
          ) : paginatedEquipamentos.length === 0 ? (
            <div className={styles.emptyMessage}>Nenhum equipamento encontrado.</div>
          ) : (
            <div className={styles.equipamentosList}>
              {paginatedEquipamentos.map((eq) => {
                const manutencao = getSimulatedStatus(eq.id_ativo)

                return (
                  <div key={eq.id_ativo} className={styles.tableRow}>
                    <div className={styles.colEquipamento}>
                      <p>{eq.descricao}</p>
                      <span>
                        {eq.ativo ? 'Ativo em operação' : 'Inativo / Fora de operação'}
                      </span>
                    </div>

                    <div className={styles.colCliente}>
                      <strong>{eq.cliente?.nome || 'Não vinculado'}</strong>
                    </div>

                    <div className={styles.colTipo}>
                      {eq.tipo}
                    </div>

                    <div className={styles.colIdentificacao}>
                      {eq.identificacao || 'Sem ID'}
                    </div>

                    <div className={styles.colStatus}>
                      <span className={`${styles.statusBadge} ${manutencao.style}`}>
                        <span className={`${styles.statusDot} ${manutencao.dotStyle}`} />
                        {manutencao.label}
                      </span>
                    </div>

                    <div className={styles.colActions}>
                      <button className={styles.historyBtn}>
                        Histórico <span>➔</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {filteredEquipamentos.length} {filteredEquipamentos.length === 1 ? 'registro' : 'registros'} · Página {filteredEquipamentos.length === 0 ? 0 : currentPage} de {totalPages}
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
                {filteredEquipamentos.length === 0 ? 0 : currentPage}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
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