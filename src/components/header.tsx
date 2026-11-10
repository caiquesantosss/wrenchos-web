import { Bell, Plus } from "lucide-react"
import { Link } from "@tanstack/react-router"
import styles from "./header.module.css"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const usuarioString = localStorage.getItem("@WrenchOS:usuario")
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  const todayDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const formattedDay = todayDate.charAt(0).toUpperCase() + todayDate.slice(1)

  return (
    <header className={styles.topbar}>
      <div className={styles.textInfo}>
        <h1>{title}</h1>
        <p>{formattedDay}</p>
      </div>

      <div className={styles.actions}>
        <div className={styles.activeOperation}>
          <div className={styles.activeCircle}></div>
          <p>
            OPERAÇÃO <strong>Ativa</strong>
          </p>
        </div>

        <Bell className={styles.bell} />

        <Link to="/nova/nova_ordem" className={styles.newOrderButton}>
          <Plus size={17} strokeWidth={2.5} />
          <span>Nova ordem</span>
        </Link>

        <div className={styles.userAvatar}>
          {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "A"}
        </div>
      </div>
    </header>
  )
}
