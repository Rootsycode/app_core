import styles from './SaleLayout.module.css'

export const SaleLayout = ({
  summary,
  articles,
  categories,
  controls,
  summaryClassName
}) => (
  <div className={styles.container}>
    <aside className={styles.categories}>{categories}</aside>
    <div className={styles.articles}>{articles}</div>
    <main className={summaryClassName ?? styles.summary}>{summary}</main>
    <footer className={styles.controls}>{controls}</footer>
  </div>
)
