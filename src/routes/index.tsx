import { createFileRoute } from "@tanstack/react-router"
import styles from "./index.module.css"
import { Bell, CheckCircle, ClipboardList, FileText, Package, Wallet } from "lucide-react"

export const Route = createFileRoute("/")({
  component: Dashboard,
})

function Dashboard() {
  const usuarioString = localStorage.getItem("@WrenchOS:usuario")
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  const todayDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const formatedDay = todayDate.charAt(0).toUpperCase() + todayDate.slice(1)

  return (
    <section className={styles.mainContent}>
      <header className={styles.topbar}>
        <div className={styles.textInfo}>
          <h1>Painel operacional</h1>
          <p>{formatedDay}</p>
        </div>

        <div className={styles.actions}>
          <div className={styles.activeOperation}>
            <div className={styles.activeCircle}></div>
            <p>
              OPERAÇÃO <strong>Ativa</strong>
            </p>
          </div>
          <Bell className={styles.bell} />
          <button className={styles.newOrderButton}>
            <p>+</p> Nova ordem
          </button>

          <div className={styles.userAvatar}>
            {usuario ? usuario.nome.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>OS em andamento</span>
              <div className={`${styles.iconWrapper} ${styles.iconGray}`}>
                <ClipboardList size={18} />
              </div>
            </div>
            <h2 className={styles.cardValue}>12</h2>
            <p className={styles.cardFooter}>4 críticas · 2 atrasadas</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Orçamentos pendentes</span>
              <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                <FileText size={18} />
              </div>
            </div>
            <h2 className={styles.cardValue}>5</h2>
            <p className={`${styles.cardFooter} ${styles.textOrange}`}>
              R$ 12.400 aguardando
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Estoque baixo</span>
              <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                <Package size={18} />
              </div>
            </div>
            <h2 className={styles.cardValue}>8</h2>
            <p className={`${styles.cardFooter} ${styles.textRed}`}>
              2 itens sem reserva
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>A receber</span>
              <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                <Wallet size={18} />
              </div>
            </div>
            <h2 className={styles.cardValue}>R$ 34.200</h2>
            <p className={styles.cardFooter}>6 notas em aberto</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>OS Concluídas hoje</span>
              <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                <CheckCi'rcle size={18} />
              </div>
            </div>
            <h2 className={styles.cardValue}>7</h2>
            <p className={`${styles.cardFooter} ${styles.textBlue}`}>
              +2 em relação a ontem
            </p>
          </div>
        </section>
      </main>
    </section>
  )
}
