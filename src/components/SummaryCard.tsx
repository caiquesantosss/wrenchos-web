import { type ReactNode } from "react"
import styles from "./cards.module.css"

type ColorTheme = "gray" | "orange" | "red" | "green" | "blue" | "default"

interface SummaryCardProps {
  title: string
  icon: ReactNode
  iconTheme?: ColorTheme
  value: string | number
  valuePrefix?: string
  isLoading?: boolean
  footerText: string
  footerTheme?: ColorTheme
}

export function SummaryCard({
  title,
  icon,
  iconTheme = "gray",
  value,
  valuePrefix = "",
  isLoading = false,
  footerText,
  footerTheme = "default",
}: SummaryCardProps) {
  const iconColorClass = {
    gray: styles.iconGray,
    orange: styles.iconOrange,
    red: styles.iconRed,
    green: styles.iconGreen,
    blue: styles.iconBlue,
    default: styles.iconGray,
  }[iconTheme]

  const footerColorClass = {
    gray: "", 
    orange: styles.textOrange,
    red: styles.textRed,
    green: "", 
    blue: styles.textBlue,
    default: "",
  }[footerTheme]

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>

        <div className={`${styles.iconWrapper} ${iconColorClass}`}>
          {icon}
        </div>
      </div>

      <h2 className={styles.cardValue}>
        {isLoading ? "..." : `${valuePrefix}${value}`}
      </h2>

      <p className={`${styles.cardFooter} ${footerColorClass}`}>
        {footerText}
      </p>
    </div>
  )
}