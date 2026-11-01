import { createFileRoute } from '@tanstack/react-router'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>WrenchOS Dashboard</h1>
    </div>
  )
}