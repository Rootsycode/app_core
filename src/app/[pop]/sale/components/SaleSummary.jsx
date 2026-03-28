'use client'

import { useSaleContext } from '../context/SaleContext'
import styles from '../page.module.css'

export function SaleSummary () {
  const { saleItems, setItemQty, removeItem } = useSaleContext()

  return (
    <>
      <div className={styles.summaryHead}>Resumen de venta</div>
      <div className={styles.summaryList}>
        {saleItems.length === 0 ? (
          <div className={styles.summaryEmpty}>Sin ítems</div>
        ) : (
          saleItems.map((item) => (
            <div
              key={`${item.order}-${item.id}`}
              className={styles.summaryItem}
            >
              <div className={styles.qtyControl}>
                <button
                  type='button'
                  className={styles.qtyBtn}
                  aria-label='Menos'
                  onClick={() =>
                    setItemQty(item.order, Math.max(1, item.qty - 1))
                  }
                >
                  −
                </button>
                <span>{item.qty}</span>
                <button
                  type='button'
                  className={styles.qtyBtn}
                  aria-label='Más'
                  onClick={() => setItemQty(item.order, item.qty + 1)}
                >
                  +
                </button>
              </div>
              <div>
                <strong>{item.title}</strong>
                <div style={{ opacity: 0.85, fontSize: '0.8rem' }}>
                  ${((item.price || 0) * (item.qty || 0)).toFixed(2)}
                </div>
              </div>
              <button
                type='button'
                className={styles.removeBtn}
                onClick={() => removeItem(item.order)}
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}
