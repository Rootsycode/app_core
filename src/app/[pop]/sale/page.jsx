'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { SaleProvider, useSaleContext } from './context/SaleContext'
import { SaleLayout } from './SaleLayout'
import { ToolBox } from './components/ToolBox'
import { SaleSummary } from './components/SaleSummary'
import { SaleCategoryList } from './components/SaleCategoryList'
import { SaleArticleSearch } from './components/SaleArticleSearch'
import { SaleArticleList } from './components/SaleArticleList'
import { SaleControls } from './components/SaleControls'
import { getSaleCategories, getSaleProducts } from './actions'
import styles from './page.module.css'

function PageContent () {
  const params = useParams()
  const popId = params?.pop
  const [activeCategory, setActiveCategory] = useState('')
  const [activeViewType, setActiveViewType] = useState('grid')
  const [search, setSearch] = useState('')
  const [openPanel, setOpenPanel] = useState(true)
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [searchResultQty, setSearchResultQty] = useState(0)
  const [dataWarning, setDataWarning] = useState(null)

  const previousCategory = useRef('')
  const { addItem } = useSaleContext()

  const categoryFilter = search ? '' : activeCategory

  useEffect(() => {
    if (!popId) return
    let cancelled = false
    ;(async () => {
      const res = await getSaleCategories(popId)
      if (cancelled) return
      if (res.success) {
        setCategories(res.categories || [])
        if (res.warning) setDataWarning(res.warning)
      } else {
        setCategories([])
        setDataWarning(res.error || 'No se pudieron cargar categorías')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId])

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  useEffect(() => {
    if (!popId) return
    let cancelled = false
    ;(async () => {
      const res = await getSaleProducts(popId, {
        search,
        categoryId: categoryFilter
      })
      if (cancelled) return
      if (res.success) {
        setArticles(res.articles || [])
        setSearchResultQty(
          typeof res.count === 'number' ? res.count : (res.articles || []).length
        )
        if (res.warning) setDataWarning(res.warning)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, search, categoryFilter])

  const handleSearchChange = (newSearch) => {
    const previousSearch = search
    setSearch(newSearch)
    if (
      newSearch.length > previousSearch.length &&
      previousSearch.length === 0
    ) {
      previousCategory.current = activeCategory
      setActiveCategory('')
    }
    if (newSearch.length === 0 && previousSearch.length > 0) {
      setActiveCategory(previousCategory.current)
    }
  }

  const toggleOpenPanel = () => setOpenPanel((o) => !o)

  if (!popId) {
    return (
      <div className={styles.summaryEmpty}>POP no encontrado.</div>
    )
  }

  return (
    <SaleLayout
      toolbox={<ToolBox popId={popId} sectionName='Vender' />}
      summary={<SaleSummary />}
      summaryClassName={`${styles.summary} ${!openPanel ? styles.summaryHidden : ''}`}
      categories={
        <SaleCategoryList
          categoryList={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeViewType={activeViewType}
          setActiveViewType={setActiveViewType}
          hasSearch={search.length > 0}
        />
      }
      articles={
        <div>
          {dataWarning ? (
            <div className={styles.banner} role='status'>
              {dataWarning}
            </div>
          ) : null}
          <SaleArticleSearch
            value={search}
            submit={handleSearchChange}
            resultsQty={searchResultQty}
          />
          <SaleArticleList
            articleList={articles}
            search={search}
            activeViewType={activeViewType}
            addItem={addItem}
          />
        </div>
      }
      controls={
        <SaleControls
          openPanel={openPanel}
          toggleOpenPanel={toggleOpenPanel}
        />
      }
    />
  )
}

function Page () {
  const params = useParams()
  const popId = params?.pop

  return (
    <SaleProvider persistedName={`${popId || 'pop'}-saleItems`}>
      <PageContent />
    </SaleProvider>
  )
}

export default withAuth(Page)
