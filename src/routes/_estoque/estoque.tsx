
import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { SummaryCard } from '../../components/cards'
import { allCatalogItems } from '../../features/items/catalogo/api/catalogo_items'
import styles from './estoque.module.css'

export const Route = createFileRoute('/_estoque/estoque')({
  component: RouteComponent,
})

export default function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'pecas' | 'movimentacoes'>('pecas')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 5

  const {
    data: itensCatalogo = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['catalogo-itens', 'todos'],
    queryFn: allCatalogItems,
  })

  const produtos = useMemo(
    () => itensCatalogo.filter(item => item.tipo_item === 'PRODUTO'),
    [itensCatalogo],
  )

  const totalItens = itensCatalogo.length

  const semEstoque = useMemo(
    () => produtos.filter(item => item.estoque_atual <= 0),
    [produtos],
  )

  const abaixoDoMinimo = useMemo(
    () =>
      produtos.filter(
        item =>
          item.estoque_atual > 0 &&
          item.estoque_atual < item.estoque_minimo,
      ),
    [produtos],
  )

  const valorTotalEstoque = useMemo(
    () =>
      produtos.reduce(
        (acc, item) =>
          acc +
          Number(item.valor_unitario) * Number(item.estoque_atual),
        0,
      ),
    [produtos],
  )

  const filteredItems = useMemo(() => {
    return itensCatalogo.filter(item => {
      const search = searchTerm.toLowerCase().trim()

      const codigoSimulado = `PC-${item.id_catalogo_item
        .toString()
        .padStart(3, '0')}`.toLowerCase()

      const matchesSearch =
        item.descricao.toLowerCase().includes(search) ||
        codigoSimulado.includes(search)

      const matchesFilter =
        filterType === 'todos' || item.tipo_item === filterType

      return matchesSearch && matchesFilter
    })
  }, [itensCatalogo, searchTerm, filterType])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage

    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage])

  const firstItem = filteredItems.length === 0
    ? 0
    : (currentPage - 1) * itemsPerPage + 1

  const lastItem = Math.min(
    currentPage * itemsPerPage,
    filteredItems.length,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (
    atual: number,
    minimo: number,
    tipo: string,
  ) => {
    if (tipo === 'SERVICO') {
      return {
        label: 'Não aplicável',
        style: styles.statusBlue,
        dot: styles.dotBlue,
      }
    }

    if (atual <= 0 || atual < minimo) {
      return {
        label: 'Estoque baixo',
        style: styles.statusRed,
        dot: styles.dotRed,
      }
    }

    return {
      label: 'Disponível',
      style: styles.statusGreen,
      dot: styles.dotGreen,
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.cardsGrid}>
        <SummaryCard
          title="Itens cadastrados"
          icon={<Package size={18} />}
          iconTheme="gray"
          value={totalItens}
          isLoading={isLoading}
          footerText="Peças e produtos"
        />

        <SummaryCard
          title="Abaixo do mínimo"
          icon={<AlertTriangle size={18} />}
          iconTheme="orange"
          value={abaixoDoMinimo.length}
          isLoading={isLoading}
          footerText="Reposição necessária"
          footerTheme="orange"
        />

        <SummaryCard
          title="Sem estoque"
          icon={<Package size={18} />}
          iconTheme="red"
          value={semEstoque.length}
          isLoading={isLoading}
          footerText="Prioridade de compra"
          footerTheme="red"
        />

        <SummaryCard
          title="Valor em estoque"
          icon={<Wallet size={18} />}
          iconTheme="green"
          valuePrefix="R$ "
          value={
            isLoading
              ? '...'
              : valorTotalEstoque.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })
          }
          isLoading={false}
          footerText="Custo dos itens disponíveis"
        />
      </section>

      <div className={styles.mainContent}>
        <div className={styles.topActions}>
          <div className={styles.tabsWrapper}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'pecas' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('pecas')}
            >
              Peças e produtos
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'movimentacoes' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('movimentacoes')}
            >
              Movimentações
            </button>
          </div>

          <button className={styles.newButton} type="button">
            <Plus size={18} />
            Novo produto
          </button>
        </div>

        {activeTab === 'pecas' ? (
          <div className={styles.tabContent}>
            <div className={styles.searchContainer}>
              <div className={styles.search}>
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Pesquisar peça ou código"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="todos">Todos os itens</option>
                <option value="PRODUTO">Produtos</option>
                <option value="SERVICO">Serviços</option>
              </select>
            </div>

            <div className={styles.tableContainer}>
              <div className={styles.tableHeaderPecas}>
                <span>PRODUTO / PEÇA</span>
                <span>TIPO</span>
                <span>DISPONÍVEL</span>
                <span>MÍNIMO</span>
                <span>SITUAÇÃO</span>
                <span></span>
              </div>

              {isLoading ? (
                <div className={styles.emptyMessage}>
                  Carregando catálogo...
                </div>
              ) : isError ? (
                <div className={styles.emptyMessage}>
                  Erro ao carregar dados do catálogo.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className={styles.emptyMessage}>
                  Nenhum item encontrado.
                </div>
              ) : (
                <>
                  <div className={styles.tableList}>
                    {paginatedItems.map(item => {
                      const badge = getStatusBadge(
                        item.estoque_atual,
                        item.estoque_minimo,
                        item.tipo_item,
                      )

                      const codigo = `PC-${item.id_catalogo_item
                        .toString()
                        .padStart(3, '0')}`

                      return (
                        <div
                          key={item.id_catalogo_item}
                          className={styles.tableRowPecas}
                        >
                          <div className={styles.colProduto}>
                            <strong>{item.descricao}</strong>
                            <span>{codigo}</span>
                          </div>

                          <div className={styles.colCategoria}>
                            {item.tipo_item}
                          </div>

                          <div className={styles.colQtd}>
                            {item.tipo_item === 'SERVICO'
                              ? '—'
                              : `${item.estoque_atual} ${item.unidade}`}
                          </div>

                          <div className={styles.colQtd}>
                            {item.tipo_item === 'SERVICO'
                              ? '—'
                              : `${item.estoque_minimo} ${item.unidade}`}
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

                          <div className={styles.colActions}>
                            {item.tipo_item === 'PRODUTO' && (
                              <button
                                type="button"
                                className={styles.movimentarBtn}
                              >
                                Movimentar
                                <ArrowRight size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                      Exibindo {firstItem}–{lastItem} de {filteredItems.length} itens
                    </span>

                    <div className={styles.paginationControls}>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage(page => page - 1)}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1,
                      ).map(page => (
                        <button
                          key={page}
                          type="button"
                          className={`${styles.paginationButton} ${
                            currentPage === page
                              ? styles.paginationActive
                              : ''
                          }`}
                          onClick={() => setCurrentPage(page)}
                          aria-current={
                            currentPage === page ? 'page' : undefined
                          }
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage(page => page + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Próxima página"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.tabContent}>
            <div className={styles.tableContainer}>
              <div className={styles.tableHeaderMovimentacoes}>
                <span>PRODUTO</span>
                <span>TIPO</span>
                <span>QUANTIDADE</span>
                <span>DATA</span>
              </div>

              <div className={styles.emptyStateBox}>
                <Search size={32} className={styles.emptyIcon} />
                <strong>Nenhum resultado encontrado</strong>
                <p>
                  Não há registros para os filtros selecionados.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
