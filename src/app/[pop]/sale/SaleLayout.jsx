import styles from './page.module.css'

export function SaleLayout ({
  toolbox,
  summary,
  summaryClassName,
  articles,
  categories,
  controls
}) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>{toolbox}</header>
      <aside className={styles.categories}>{categories}</aside>
      <div className={styles.articles}>{articles}</div>
      <main className={summaryClassName || styles.summary}>{summary}</main>
      <footer className={styles.controls}>{controls}</footer>
    </div>
  )
}
