'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { PopScreenLayout } from '@/components/layouts/PopScreenLayout'
import { HeaderSections } from '@/components/HeaderSections'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { SaleProvider, useSaleContext } from './context/SaleContext'
import { SaleLayout } from './components/SaleLayout'
import { SaleSummary } from './components/SaleSummary'
import { SaleCategoryList } from './components/SaleCategoryList'
import { SaleArticleSearch } from './components/SaleArticleSearch'
import { SaleArticleList } from './components/SaleArticleList'
import { SaleControls } from './components/SaleControls'
import { getSaleCategories, getSaleProducts } from './actions'
import styles from './page.module.css'

function PageContent () {
  const params = useParams()
  const router = useRouter()
  const { user, logOut } = useAuth()
  const popId = params?.pop
  const [activeCategory, setActiveCategory] = useState('')
  const [activeViewType, setActiveViewType] = useState('grid')
  const [search, setSearch] = useState('')
  const [openPanel, setOpenPanel] = useState(true)
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [searchResultQty, setSearchResultQty] = useState(0)
  const [dataWarning, setDataWarning] = useState(null)
  const [popName, setPopName] = useState('')

  const previousCategory = useRef('')
  const { addItem } = useSaleContext()

  const categoryFilter = search ? '' : activeCategory

  useEffect(() => {
    if (!popId) return
    let cancelled = false
    ;(async () => {
      const res = await getSaleCategories(popId)
      if (cancelled) return
      if (res.redirect) {
        router.push(res.redirect)
        return
      }
      if (typeof res.popName === 'string') setPopName(res.popName)
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
  }, [popId, router])

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
      if (res.redirect) {
        router.push(res.redirect)
        return
      }
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
  }, [popId, search, categoryFilter, router])

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

  const menuOptions = [
    {
      icon: <ProfileIcon16 />,
      name: 'Ver perfil',
      href: '/profile'
    },
    {
      icon: <HelpIcon16 />,
      name: 'Ayuda',
      href: '/home'
    },
    {
      icon: <CloseSessionIcon16 />,
      name: 'Cerrar sesión',
      onAction: async () => {
        await logOut()
        router.push('/auth/login')
      }
    }
  ]

  const userAvatarSrc = user?.user_metadata?.avatar_url || ''

  if (!popId) {
    return (
      <div className={styles.summaryEmpty}>POP no encontrado.</div>
    )
  }

  return (
    <PopScreenLayout
      header={
        <HeaderSections
          popId={popId}
          sectionName='Vender'
          popName={popName}
          userImageSrc={userAvatarSrc}
          userImageAlt={
            user?.user_metadata?.full_name ||
            user?.email ||
            'Usuario'
          }
          menuOptions={menuOptions}
        />
      }
      body={
        <SaleLayout
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
