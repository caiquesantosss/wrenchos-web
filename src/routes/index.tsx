import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Bell,
  CheckCircle,
  ClipboardList,
  FileText,
  Package,
  Wallet,
} from "lucide-react"

import styles from "./index.module.css"
import { getAllOrders } from "../features/orders/api/get-orders"
import { allCatalogItems } from "../features/items/catalogo/api/catalogo_items"
import Cards from "../components/cards"

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
            {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <Cards />
        
      </main>
    </section>
  )
}
