'use client'

import { useSaleContext } from '../context/SaleContext'
import styles from '../page.module.css'

export function SaleControls ({
  openPanel,
  toggleOpenPanel
}) {
  const { saleTotal, confirmPurchase, discardSale } = useSaleContext()
  const t = saleTotal()

  return (
    <div className={styles.controlsInner}>
      <div className={styles.totals}>
        <span>Total: ${t.totalValue.toFixed(2)}</span>
        {t.totalDiscountValue > 0 ? (
          <span>Desc.: −${t.totalDiscountValue.toFixed(2)}</span>
        ) : null}
      </div>
      <div className={styles.controlBtns}>
        <button
          type='button'
          className={`${styles.controlBtn} ${styles.controlBtnGhost}`}
          onClick={toggleOpenPanel}
        >
          {openPanel ? 'Ocultar panel' : 'Mostrar panel'}
        </button>
        <button
          type='button'
          className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
          onClick={discardSale}
        >
          Descartar
        </button>
        <button
          type='button'
          className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
          onClick={() => confirmPurchase()}
        >
          Confirmar (pendiente)
        </button>
      </div>
    </div>
  )
}
