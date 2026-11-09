import {
  Wrench,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  FileText,
  Package,
  Wallet,
  Receipt,
  History,
  ShieldCheck,
  Settings,
  LogOut,
  Circle,
} from "lucide-react"
import { logout } from "../features/auth/api/login"
import styles from "./sidebar.module.css"
import { Link } from "@tanstack/react-router"

export default function SideBar() {
  const usuarioString = localStorage.getItem("@WrenchOS:usuario")
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  return (
    <aside className={styles.sidebar}>
      <header className={styles.sidebarHeader}>
        <div className={styles.logoIcon}>
          <Wrench size={21} strokeWidth={2.5} />
        </div>

        <div className={styles.logoText}>
          <span className={styles.logoTitle}>WrenchOS</span>
          <span className={styles.logoSubtitle}>Gestão de manutenção</span>
        </div>
      </header>

      <button className={styles.companySelector} type="button">
        <div className={styles.companyAvatar}>MF</div>

        <div className={styles.companyInfo}>
          <span className={styles.companyName}>Oficina central</span>
          <span className={styles.companyUnit}>Unidade São Paulo</span>
        </div>

        <ChevronRight size={17} className={styles.companyArrow} />
      </button>

      <nav className={styles.navigation}>
        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>OPERAÇÃO</span>

          <Link
            to="/"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <LayoutDashboard size={17} />
            <span>Painel</span>
          </Link>

          <Link
            to="/ordemServico"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <ClipboardList size={17} />
            <span>Ordens de serviço</span>
            <span className={styles.navBadge}>5</span>
          </Link>

          <Link
            to="/clientes"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <Users size={17} />
            <span>Clientes</span>
          </Link>

          <Link
            to="/equipamentos"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <Truck size={17} />
            <span>Equipamentos</span>
          </Link>

          <Link
            to="/orcamento"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <FileText size={17} />
            <span>Orçamentos</span>
          </Link>

          <button className={styles.navItem} type="button">
            <Package size={17} />
            <span>Estoque</span>
          </button>

          <button className={styles.navItem} type="button">
            <Wallet size={17} />
            <span>Financeiro</span>
          </button>

          <button className={styles.navItem} type="button">
            <Receipt size={17} />
            <span>Fiscal</span>
          </button>

          <button className={styles.navItem} type="button">
            <History size={17} />
            <span>Histórico de manutenção</span>
          </button>
        </div>

        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>ADMINISTRAÇÃO</span>

          <button className={styles.navItem} type="button">
            <ShieldCheck size={17} />
            <span>Usuários e permissões</span>
          </button>

          <button className={styles.navItem} type="button">
            <Settings size={17} />
            <span>Configurações</span>
          </button>
        </div>
      </nav>

      <div className={styles.shiftCard}>
        <div className={styles.shiftStatus}>
          <Circle size={7} fill="currentColor" />
          <span>Turno atual</span>
        </div>

        <strong>Manhã · 07:00–13:00</strong>
        <span className={styles.shiftDescription}>4 técnicos em campo</span>
      </div>

      <footer className={styles.sidebarFooter}>
        <div className={styles.userAvatar}>
          {usuario ? usuario.nome.charAt(0).toUpperCase() : "A"}
        </div>

        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {usuario ? usuario.nome : "Administrador"}
          </span>
          <span className={styles.userRole}>
            {usuario ? usuario.perfil : "Administrador"}
          </span>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          aria-label="Sair"
          onClick={logout}
        >
          <LogOut size={19} />
        </button>
      </footer>
    </aside>
  )
}
