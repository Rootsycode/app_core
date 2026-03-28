'use client'

import { createContext, useContext, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export const SaleContext = createContext(null)

export function SaleProvider ({ children, persistedName }) {
  const [saleItems, setSaleItems] = useLocalStorage(persistedName, [])
  const [selectedClient, setSelectedClient] = useState(null)

  const saleTotal = () => {
    return saleItems.reduce(
      (accumulate, item) => {
        const { qty, price, discountType, discountValue, iva } = item

        let itemPrice = price
        let discountAmount = 0
        let ivaAmount = 0

        if (discountValue > 0) {
          if (discountType === 'fixed') {
            discountAmount = discountValue
          } else if (discountType === 'percentage') {
            discountAmount = (price * discountValue) / 100
          }
        }

        itemPrice = Math.max(0, price - discountAmount)

        if (iva) {
          ivaAmount = itemPrice / (1 + iva / 100)
        }

        const totalItemValue = itemPrice * qty
        const totalItemDiscount = discountAmount * qty
        const totalItemIva = ivaAmount * qty

        return {
          totalValue: accumulate.totalValue + totalItemValue,
          totalValueWithoutIva:
            accumulate.totalValueWithoutIva + (totalItemValue - totalItemIva),
          totalDiscountValue: accumulate.totalDiscountValue + totalItemDiscount,
          totalIva: accumulate.totalIva + totalItemIva
        }
      },
      {
        totalValue: 0,
        totalValueWithoutIva: 0,
        totalDiscountValue: 0,
        totalIva: 0
      }
    )
  }

  const setItemGeneral = (order, newData) => {
    setSaleItems((prevItems) =>
      prevItems.map((item) =>
        item.order === order ? { ...item, ...newData } : item
      )
    )
  }

  const removeItem = (order) => {
    setSaleItems((prevItems) => prevItems.filter((item) => item.order !== order))
  }

  const setItemQty = (order, qty) => {
    setItemGeneral(order, { qty })
  }

  const addItem = ({
    qty = 1,
    title = '',
    description = '',
    sale_price = 0,
    id = '',
    iva = 0,
    discountType = 'percentage',
    discountValue = 0
  }) => {
    let newOrder = 1
    const lastItem =
      saleItems.length > 0 ? saleItems[saleItems.length - 1] : null

    if (lastItem) {
      if (lastItem.id === id) {
        setItemQty(lastItem.order, lastItem.qty + 1)
        return null
      }
      newOrder = lastItem.order + 1
    }

    const newItem = {
      order: newOrder,
      qty,
      title,
      description,
      price: sale_price,
      comment: '',
      id,
      iva,
      discountType,
      discountValue,
      isOpen: false
    }

    setSaleItems((prevItems) => [...prevItems, { ...newItem }])
  }

  const setItemComment = (order, comment) => {
    setItemGeneral(order, { comment })
  }

  const toggleOpenCloseItem = (order, isOpen) => {
    setItemGeneral(order, { isOpen })
  }

  const setClient = (client) => {
    setSelectedClient(client)
  }

  const removeClient = () => {
    setSelectedClient(null)
  }

  const confirmPurchase = () => {
    return ''
  }

  const discardSale = () => {
    setSaleItems([])
    setSelectedClient(null)
  }

  const value = {
    saleItems,
    selectedClient,
    saleTotal,
    addItem,
    setItemQty,
    setItemComment,
    toggleOpenCloseItem,
    removeItem,
    setClient,
    removeClient,
    confirmPurchase,
    discardSale
  }

  return (
    <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
  )
}

export function useSaleContext () {
  const context = useContext(SaleContext)
  if (!context) {
    throw new Error('useSaleContext debe usarse dentro de SaleProvider')
  }
  return context
}
