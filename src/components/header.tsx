import { Bell } from "lucide-react"
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

  const formatedDay = todayDate.charAt(0).toUpperCase() + todayDate.slice(1)
  
  return (
    <header className={styles.topbar}>
      <div className={styles.textInfo}>
        <h1>{title}</h1>
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
  )
}