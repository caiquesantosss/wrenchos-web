import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import SideBar from '../components/sidebar'
import styles from './__root.module.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname.includes('/login')

  return (
    <div className={styles.rootLayout}>
      
      {!isLoginPage && <SideBar />} 
      
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}