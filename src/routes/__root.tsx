import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import styles from './__root.module.css'

export const Route = createRootRoute({
  component: () => (
    <div className={styles.rootLayout}>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  ),
})