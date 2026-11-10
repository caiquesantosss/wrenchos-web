import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import SideBar from "../components/sidebar"
import styles from "./__root.module.css"
import Header from "../components/header"

export const Route = createRootRoute({
  component: RootLayout,
})

const PAGE_TITLES: Record<string, string> = {
  "/": "Painel operacional",
  "/ordemServico": "Ordens de serviço",
  "/clientes": "Clientes",
  "/estoque": "Estoque",
  "/financeiro": "Financeiro",
  "/indicadores": "Indicadores"
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "WrenchOS"
}

function RootLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname.includes("/login")

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className={styles.rootLayout}>
      {!isLoginPage && <SideBar />}

      <main className={styles.mainContent}>
        {!isLoginPage && <Header title={pageTitle} />}

        <Outlet />
      </main>

      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </div>
  )
}
