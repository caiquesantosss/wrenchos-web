import styles from "./activity.module.css"

export default function Activity() {
  return (
    <div className={styles.activityContainer}>
        <div className={styles.textContainer}>
            <h4>Atividades recentes</h4>
            <p>Hoje</p>
        </div>
    </div>
  )
}
