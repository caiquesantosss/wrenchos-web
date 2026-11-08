import { CheckCircle2, Clock, Package } from "lucide-react"
import styles from "./rightColumn.module.css"
import { getAllFinanceiro } from "../features/finance/api/financeiro"
import { useQuery } from "@tanstack/react-query"
import { getAllOrders } from "../features/orders/api/get-orders"

export default function RightColumn() {
  const { data: allFinanceiro, isLoading: isLoadingFinance } = useQuery({
    queryKey: ["financeiro", "todos"],
    queryFn: getAllFinanceiro,
  })

  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const financeiro = allFinanceiro ?? []
  const orders = allOrders ?? []

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1
  const anoMesPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual

  const recebidoMesAtual = financeiro
    .filter((f) => {
      if (f.tipo_lancamento !== "RECEITA" || f.status_pagamento !== "PAGO" || !f.data_pagamento) return false
      const dataPag = new Date(f.data_pagamento)
      return dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual
    })
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const recebidoMesPassado = financeiro
    .filter((f) => {
      if (f.tipo_lancamento !== "RECEITA" || f.status_pagamento !== "PAGO" || !f.data_pagamento) return false
      const dataPag = new Date(f.data_pagamento)
      return dataPag.getMonth() === mesPassado && dataPag.getFullYear() === anoMesPassado
    })
    .reduce((acc, f) => acc + Number(f.valor), 0)

  let variacao = 0
  if (recebidoMesPassado > 0) {
    variacao = ((recebidoMesAtual - recebidoMesPassado) / recebidoMesPassado) * 100
  } else if (recebidoMesAtual > 0) {
    variacao = 100
  }

  const isPositive = variacao >= 0
  const variacaoFormatada = Math.abs(variacao).toLocaleString("pt-BR", { maximumFractionDigits: 1 })

  const totalFaturamento = financeiro
    .filter((f) => f.tipo_lancamento === "RECEITA")
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const totalAReceber = financeiro
    .filter((f) => f.tipo_lancamento === "RECEITA" && f.status_pagamento !== "PAGO")
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const totalCustosOperacionais = orders.reduce((accOS, os) => {
    const custoItens = os.itens_os?.reduce((accItem, item) => {
      return accItem + (Number(item.quantidade || 1) * Number(item.valor_unitario || item.valor_total || 0))
    }, 0) || 0
    return accOS + custoItens
  }, 0)

  const pctAReceber = totalFaturamento > 0 ? (totalAReceber / totalFaturamento) * 100 : 0
  const pctCustos = totalFaturamento > 0 ? (totalCustosOperacionais / totalFaturamento) * 100 : 0

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const isLoading = isLoadingFinance || isLoadingOrders

  return (
    <div className={styles.rightColumn}>
      <div className={styles.financeSummaryCard}>
        <div className={styles.cardHeader}>
          <h2>Resumo financeiro</h2>
          <span className={styles.headerIcon}>↗</span>
        </div>

        <div className={styles.mainValueContainer}>
          <h1>{isLoading ? "..." : formatCurrency(recebidoMesAtual)}</h1>

          <span className={styles.subtitle}>
            <span
              className={isPositive ? styles.positive : ''}
              style={!isPositive ? { color: "#dc2626", fontWeight: 500 } : {}}
            >
              {isPositive ? "↑" : "↓"} {variacaoFormatada}%
            </span>{" "}
            em relação ao mês passado
          </span>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>A receber</span>
            <span className={styles.progressValue}>
              {isLoading ? "..." : formatCurrency(totalAReceber)}
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFillGreen}
              style={{ width: `${pctAReceber}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Custos operacionais</span>
            <span className={styles.progressValue}>
              {isLoading ? "..." : formatCurrency(totalCustosOperacionais)}
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFillOrange}
              style={{ width: `${Math.min(pctCustos, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className={styles.alertsCard}>
        <div className={styles.cardHeader}>
          <h2>Alertas da operação</h2>
          <span className={styles.badge}>
            <span className={styles.dot}></span> 3 ativos
          </span>
        </div>

        <div className={styles.alertList}>
          <div className={styles.alertItem}>
            <div className={`${styles.iconBox} ${styles.iconRed}`}>
              <Package size={20} strokeWidth={2} />
            </div>

            <div className={styles.alertContent}>
              <strong>Falta de peça</strong>
              <p>
                Rolamento SKF 6205 sem estoque.
                <br />
                OS-2040 aguarda reposição.
              </p>
              <span>Estoque • Ação necessária</span>
            </div>
          </div>

          <div className={styles.alertItem}>
            <div className={`${styles.iconBox} ${styles.iconOrange}`}>
              <Clock size={20} strokeWidth={2} />
            </div>

            <div className={styles.alertContent}>
              <strong>Orçamento vence hoje</strong>
              <p>
                ORC-118 - Metalúrgica Ferraz
                <br />
                Validade até às 18:00.
              </p>
              <span>Orçamentos • Há 35 min</span>
            </div>
          </div>

          <div className={styles.alertItem}>
            <div className={`${styles.iconBox} ${styles.iconGreen}`}>
              <CheckCircle2 size={20} strokeWidth={2} />
            </div>

            <div className={styles.alertContent}>
              <strong>Pagamento registrado</strong>
              <p>Condomínio Aurora quitou R$ 2.350.</p>
              <span>Financeiro • Há 1 hora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}