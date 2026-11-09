import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Clock, CheckCircle2, Wallet, AlertTriangle } from 'lucide-react'
import { SummaryCard } from '../../components/cards'
import { getAllFinanceiroWithOS } from '../../features/finance/api/financeiro'
import styles from './orcamento.module.css'

export const Route = createFileRoute('/_orcamento/orcamento')({
  component: RouteComponent,
})

const ITEMS_PER_PAGE = 5

export default function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: orcamentos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orcamentos', 'financeiro-com-os'],
    queryFn: getAllFinanceiroWithOS,
  })

  const aguardandoAprovacao = useMemo(
    () =>
      orcamentos.filter(
        o =>
          o.ordem_servico?.status === 'AGUARDANDO_APROVACAO' ||
          o.status_pagamento === 'PENDENTE',
      ),
    [orcamentos],
  )

  const valorAguardando = aguardandoAprovacao.reduce(
    (acc, curr) => acc + Number(curr.valor),
    0,
  )

  const mesAtual = new Date().getMonth()

  const aprovadosMes = useMemo(
    () =>
      orcamentos.filter(o => {
        const isAprovado =
          o.ordem_servico?.status !== 'AGUARDANDO_APROVACAO' &&
          o.ordem_servico?.status !== 'CANCELADA'

        const dataAbertura = new Date(o.data_cadastro)

        return isAprovado && dataAbertura.getMonth() === mesAtual
      }),
    [orcamentos, mesAtual],
  )

  const valorAprovadoMes = aprovadosMes.reduce(
    (acc, curr) => acc + Number(curr.valor),
    0,
  )

  const hojeStr = new Date().toISOString().slice(0, 10)

  const expiramHoje = useMemo(
    () =>
      aguardandoAprovacao.filter(
        o =>
          o.data_vencimento &&
          new Date(o.data_vencimento).toISOString().slice(0, 10) === hojeStr,
      ),
    [aguardandoAprovacao, hojeStr],
  )

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter(orc => {
      const search = searchTerm.toLowerCase().trim()

      const orcNumber = `ORC-${orc.id_financeiro}`.toLowerCase()
      const clientName = orc.descricao.toLowerCase()

      return orcNumber.includes(search) || clientName.includes(search)
    })
  }, [orcamentos, searchTerm])

  const totalPages = Math.ceil(filteredOrcamentos.length / ITEMS_PER_PAGE)

  const paginatedOrcamentos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrcamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrcamentos, currentPage])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return 'Sem validade'
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString))
  }

  const getStatusBadge = (statusOS: string) => {
    if (statusOS === 'AGUARDANDO_APROVACAO') {
      return {
        label: 'Aguardando aprovação',
        style: styles.statusOrange,
        dot: styles.dotOrange,
      }
    }

    if (statusOS === 'CANCELADA') {
      return {
        label: 'Recusado',
        style: styles.statusRed,
        dot: styles.dotRed,
      }
    }

    return {
      label: 'Aprovado',
      style: styles.statusGreen,
      dot: styles.dotGreen,
    }
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
          title="Aprovados no mês"
          icon={<CheckCircle2 size={18} />}
          iconTheme="green"
          value={aprovadosMes.length}
          isLoading={isLoading}
          footerText="92% de aprovação"
          footerTheme="gray"
        />

        <SummaryCard
          title="Valor aprovado"
          icon={<Wallet size={18} />}
          iconTheme="gray"
          valuePrefix="R$ "
          value={
            isLoading
              ? '...'
              : valorAprovadoMes.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })
          }
          isLoading={false}
          footerText="Outubro de 2026"
        />

        <SummaryCard
          title="Expiram hoje"
          icon={<AlertTriangle size={18} />}
          iconTheme="red"
          value={expiramHoje.length}
          isLoading={isLoading}
          footerText={
            expiramHoje.length > 0
              ? `ORC-${expiramHoje[0].id_financeiro} em risco`
              : 'Nenhum orçamento expira hoje'
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
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <button className={styles.newButton} type="button">
            <Plus size={18} /> Novo orçamento
          </button>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>ORÇAMENTO</span>
            <span>CLIENTE / OS</span>
            <span>VALIDADE</span>
            <span>STATUS</span>
            <span>VALOR</span>
            <span></span>
          </div>

          {isLoading ? (
            <div className={styles.emptyMessage}>Carregando orçamentos...</div>
          ) : isError ? (
            <div className={styles.emptyMessage}>Erro ao carregar dados.</div>
          ) : paginatedOrcamentos.length === 0 ? (
            <div className={styles.emptyMessage}>
              Nenhum orçamento encontrado.
            </div>
          ) : (
            <div className={styles.tableList}>
              {paginatedOrcamentos.map(orc => {
                const badge = getStatusBadge(orc.ordem_servico?.status || '')

                return (
                  <div key={orc.id_financeiro} className={styles.tableRow}>
                    <div className={styles.colOrcamento}>
                      <strong>ORC-{orc.id_financeiro}</strong>
                    </div>

                    <div className={styles.colCliente}>
                      <strong>{orc.descricao}</strong>
                      <span>OS-{orc.id_ordem_servico}</span>
                    </div>

                    <div className={styles.colValidade}>
                      {formatDate(orc.data_vencimento)}
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
                      {formatCurrency(Number(orc.valor))}
                    </div>

                    <div className={styles.colActions}>
                      <button className={styles.consultBtn}>
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
              {filteredOrcamentos.length}{' '}
              {filteredOrcamentos.length === 1 ? 'registro' : 'registros'} ·
              Página {filteredOrcamentos.length === 0 ? 0 : currentPage} de{' '}
              {totalPages}
            </span>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ‹
              </button>

              <span className={styles.currentPage}>
                {filteredOrcamentos.length === 0 ? 0 : currentPage}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
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