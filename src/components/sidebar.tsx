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
  ShieldCheck,
  Settings,
  LogOut,
  ChartNoAxesCombined,
} from "lucide-react"
import { logout } from "../features/auth/api/login"
import styles from "./sidebar.module.css"
import { Link } from "@tanstack/react-router"
import { getAllOrders } from "../features/orders/api/orders-request"
import { useQuery } from "@tanstack/react-query"

export default function SideBar() {
  const usuarioString = localStorage.getItem("@WrenchOS:usuario")
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const countNumber = allOrders?.length


  

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
            <span className={styles.navBadge}>{countNumber}</span>
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

          <Link
            to="/estoque"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <Package size={17} />
            <span>Estoque</span>
          </Link>

          <Link
            to="/financeiro"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <Wallet size={17} />
            <span>Financeiro</span>
          </Link>

          <Link
            to="/indicadores"
            className={styles.navItem}
            activeProps={{ className: styles.active }}
          >
            <ChartNoAxesCombined size={17} />
            <span>Indicadores</span>
          </Link>
        </div>

        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>ADMINISTRAÇÃO</span>

          <button className={styles.navItem} type="button">
            <ShieldCheck size={17} />
            <span>Usuários e permissões</span>
          </button>
        </div>
      </nav>

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
