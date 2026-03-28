'use client'

import styles from '../page.module.css'

export function SaleArticleSearch ({ value, submit, resultsQty }) {
  return (
    <div className={styles.searchRow}>
      <input
        className={styles.searchInput}
        type='search'
        placeholder='Buscar'
        value={value}
        onChange={(e) => submit(e.target.value)}
        aria-label='Buscar artículos'
      />
      <span className={styles.searchMeta}>
        {resultsQty != null ? `${resultsQty} resultado(s)` : ''}
      </span>
    </div>
  )
}
