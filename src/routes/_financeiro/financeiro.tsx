
import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Wallet,
  FileText,
  Clock,
  Package,
} from 'lucide-react'
import { SummaryCard } from '../../components/cards'
import { getAllFinanceiroWithOS } from '../../features/finance/api/financeiro'
import { getAllOrders } from '../../features/orders/api/orders-request'
import styles from './financeiro.module.css'

export const Route = createFileRoute('/_financeiro/financeiro')({
  component: RouteComponent,
})

export default function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'RECEITA' | 'DESPESA'>('RECEITA')
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: financeiro = [],
    isLoading: isLoadingFinanceiro,
    isError: isErrorFinanceiro,
  } = useQuery({
    queryKey: ['financeiro', 'com-os'],
    queryFn: getAllFinanceiroWithOS,
  })

  const {
    data: allOrders = [],
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
  } = useQuery({
    queryKey: ['orders', 'todas'],
    queryFn: getAllOrders,
  })

  const orders = allOrders ?? []

  const mesAtual = new Date().getMonth()
  const anoAtual = new Date().getFullYear()

  const receitasMes = useMemo(
    () =>
      financeiro.filter(f => {
        if (
          f.tipo_lancamento !== 'RECEITA' ||
          f.status_pagamento !== 'PAGO' ||
          !f.data_pagamento
        ) {
          return false
        }

        const dataPagamento = new Date(f.data_pagamento)

        return (
          dataPagamento.getMonth() === mesAtual &&
          dataPagamento.getFullYear() === anoAtual
        )
      }),
    [financeiro, mesAtual, anoAtual],
  )

  const valorRecebido = useMemo(
    () =>
      receitasMes.reduce(
        (acc, curr) => acc + Number(curr.valor || 0),
        0,
      ),
    [receitasMes],
  )

  const aReceber = useMemo(
    () =>
      financeiro.filter(
        f =>
          f.tipo_lancamento === 'RECEITA' &&
          f.status_pagamento === 'PENDENTE',
      ),
    [financeiro],
  )

  const valorAReceber = useMemo(
    () =>
      aReceber.reduce(
        (acc, curr) => acc + Number(curr.valor || 0),
        0,
      ),
    [aReceber],
  )

  const vencidos = useMemo(
    () =>
      financeiro.filter(
        f =>
          f.tipo_lancamento === 'RECEITA' &&
          f.status_pagamento === 'ATRASADO',
      ),
    [financeiro],
  )

  const valorVencidos = useMemo(
    () =>
      vencidos.reduce(
        (acc, curr) => acc + Number(curr.valor || 0),
        0,
      ),
    [vencidos],
  )

  const totalCustosOperacionais = useMemo(
    () =>
      orders.reduce((accOS, os) => {
        const custoItens =
          os.itens_os?.reduce((accItem, item) => {
            const quantidade = Number(item.quantidade ?? 1)
            const valorUnitario = Number(
              item.valor_unitario ?? item.valor_total ?? 0,
            )

            return accItem + quantidade * valorUnitario
          }, 0) ?? 0

        return accOS + custoItens
      }, 0),
    [orders],
  )

  const filteredList = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return financeiro.filter(f => {
      if (f.tipo_lancamento !== activeTab) {
        return false
      }

      const descricao = String(f.descricao ?? '').toLowerCase()
      const osNumber = `os-${f.id_ordem_servico}`.toLowerCase()

      return (
        descricao.includes(search) ||
        osNumber.includes(search)
      )
    })
  }, [financeiro, activeTab, searchTerm])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Não definida'

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return 'Data inválida'
    }

    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return {
          label: 'Pendente',
          style: styles.statusOrange,
          dot: styles.dotOrange,
        }

      case 'PAGO':
        return {
          label: 'Pago',
          style: styles.statusGreen,
          dot: styles.dotGreen,
        }

      case 'ATRASADO':
        return {
          label: 'Vencido',
          style: styles.statusRed,
          dot: styles.dotRed,
        }

      case 'CANCELADO':
      default:
        return {
          label: 'Cancelado',
          style: styles.statusGray,
          dot: styles.dotGray,
        }
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.cardsGrid}>
        <SummaryCard
          title="Recebido no mês"
          icon={<Wallet size={18} />}
          iconTheme="green"
          valuePrefix="R$ "
          value={valorRecebido.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
          isLoading={isLoadingFinanceiro}
          footerText="Receitas pagas no mês"
        />

        <SummaryCard
          title="A receber"
          icon={<FileText size={18} />}
          iconTheme="gray"
          valuePrefix="R$ "
          value={valorAReceber.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
          isLoading={isLoadingFinanceiro}
          footerText="Títulos em aberto"
        />

        <SummaryCard
          title="Vencidos"
          icon={<Clock size={18} />}
          iconTheme="red"
          valuePrefix="R$ "
          value={valorVencidos.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
          isLoading={isLoadingFinanceiro}
          footerText={
            vencidos.length === 1
              ? '1 pagamento em atraso'
              : `${vencidos.length} pagamentos em atraso`
          }
          footerTheme="red"
        />

        <SummaryCard
          title="Custos operacionais"
          icon={<Package size={18} />}
          iconTheme="orange"
          valuePrefix="R$ "
          value={totalCustosOperacionais.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
          isLoading={isLoadingOrders}
          footerText="Custos dos itens das OS"
          footerTheme="orange"
        />
      </section>

      <div className={styles.mainWrapper}>
        <div className={styles.topActions}>
          <div className={styles.tabsWrapper}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'RECEITA' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('RECEITA')}
            >
              Contas a receber
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'DESPESA' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('DESPESA')}
            >
              Contas a pagar
            </button>
          </div>

          <div className={styles.search}>
            <Search size={17} />

            <input
              type="text"
              placeholder="Pesquisar cliente ou ordem"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>CLIENTE / OS</span>
            <span>VENCIMENTO</span>
            <span>VALOR</span>
            <span>SITUAÇÃO</span>
            <span></span>
          </div>

          {isLoadingFinanceiro ? (
            <div className={styles.emptyMessage}>
              Carregando dados financeiros...
            </div>
          ) : isErrorFinanceiro ? (
            <div className={styles.emptyMessage}>
              Erro ao carregar dados financeiros.
            </div>
          ) : filteredList.length === 0 ? (
            <div className={styles.emptyMessage}>
              Nenhum lançamento encontrado.
            </div>
          ) : (
            <div className={styles.tableList}>
              {filteredList.map(item => {
                const badge = getStatusBadge(item.status_pagamento)
                const isPago = item.status_pagamento === 'PAGO'

                return (
                  <div
                    key={item.id_financeiro}
                    className={styles.tableRow}
                  >
                    <div className={styles.colCliente}>
                      <strong>{item.descricao}</strong>
                      <span>OS-{item.id_ordem_servico}</span>
                    </div>

                    <div className={styles.colVencimento}>
                      {formatDate(item.data_vencimento)}
                    </div>

                    <div className={styles.colValor}>
                      {formatCurrency(Number(item.valor))}
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
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${
                          isPago ? styles.actionBtnDisabled : ''
                        }`}
                        disabled={isPago}
                      >
                        Registrar pagamento
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {isErrorOrders && (
            <div className={styles.warningMessage}>
              Não foi possível carregar os custos operacionais das ordens de serviço.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
