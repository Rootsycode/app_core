'use client'

import styles from '../page.module.css'

export function SaleCategoryList ({
  categoryList,
  activeCategory,
  setActiveCategory,
  activeViewType,
  setActiveViewType,
  hasSearch
}) {
  const list = categoryList?.length ? categoryList : []

  return (
    <>
      <div className={styles.categoryList}>
        {list.map((cat) => {
          const id = typeof cat === 'string' ? cat : cat.id
          const label = typeof cat === 'string' ? cat : cat.name
          return (
            <button
              key={id}
              type='button'
              className={`${styles.categoryBtn} ${
                !hasSearch && activeCategory === id ? styles.categoryBtnActive : ''
              }`}
              onClick={() => setActiveCategory(id)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className={styles.viewToggle}>
        <button
          type='button'
          className={`${styles.viewBtn} ${
            activeViewType === 'grid' ? styles.viewBtnActive : ''
          }`}
          onClick={() => setActiveViewType('grid')}
        >
          Grilla
        </button>
        <button
          type='button'
          className={`${styles.viewBtn} ${
            activeViewType === 'list' ? styles.viewBtnActive : ''
          }`}
          onClick={() => setActiveViewType('list')}
        >
          Lista
        </button>
      </div>
    </>
  )
}
