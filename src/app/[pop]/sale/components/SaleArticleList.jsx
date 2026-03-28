'use client'

import styles from '../page.module.css'

export function SaleArticleList ({
  articleList,
  search,
  activeViewType,
  addItem
}) {
  const list = articleList || []
  const gridClass =
    activeViewType === 'list' ? styles.articleGridList : styles.articleGrid

  if (!list.length) {
    return (
      <div className={styles.summaryEmpty}>
        {search
          ? 'No hay artículos para esta búsqueda.'
          : 'No hay artículos en esta categoría.'}
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {list.map((article) => (
        <div key={article.id} className={styles.articleCard}>
          <p className={styles.articleTitle}>{article.title}</p>
          {article.description ? (
            <p className={styles.articleDesc}>{article.description}</p>
          ) : null}
          <p className={styles.articlePrice}>
            ${article.sale_price?.toFixed?.(2) ?? article.sale_price}
          </p>
          <button
            type='button'
            className={styles.addBtn}
            onClick={() =>
              addItem({
                title: article.title,
                description: article.description,
                sale_price: article.sale_price,
                id: article.id,
                iva: article.iva ?? 0
              })
            }
          >
            Agregar
          </button>
        </div>
      ))}
    </div>
  )
}
