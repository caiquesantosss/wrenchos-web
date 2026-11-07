import { CheckCircle2, Clock, Package } from 'lucide-react'
import styles from './rightColumn.module.css'


export default function RightColumn() {
    return (
        <div className={styles.rightColumn}>
            <div className={styles.financeSummaryCard}>
              <div className={styles.cardHeader}>
                <h2>Resumo financeiro</h2>
                <span className={styles.headerIcon}>↗</span>
              </div>

              <div className={styles.mainValueContainer}>
                <h1>R$ 87.400</h1>
                <span className={styles.subtitle}>
                  recebido neste mês{" "}
                  <span className={styles.positive}>↑ 12,8%</span>
                </span>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>A receber</span>
                  <span className={styles.progressValue}>R$ 34.200</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFillGreen}
                    style={{ width: "39%" }}
                  ></div>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>Custos operacionais</span>
                  <span className={styles.progressValue}>R$ 21.900</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFillOrange}
                    style={{ width: "25%" }}
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