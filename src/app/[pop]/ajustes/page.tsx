'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { ButtonIcon } from 'rootsy-feparts'
import { SectionHeader } from '@/components/layouts/SectionHeader'
import { ArrowLeftIcon24 } from '@/components/atoms/icons/ArrowLeftIcon24'
import { getPopMenuData } from '../menu/actions'
import styles from './page.module.css'

const Page = () => {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const popId = params?.pop as string | undefined
  const [popData, setPopData] = useState<{
    id: string
    name: string
    imageUrl: string | null
    address: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError('ID de POP no encontrado')
      return
    }

    const loadPopData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getPopMenuData(popId)

        if (!result.success) {
          setError(result.error || 'Error al cargar datos')
          return
        }

        setPopData(result.pop!)
      } catch (err: any) {
        console.error('Error loading POP data:', err)
        setError('Error inesperado al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    loadPopData()
  }, [popId])

  const handleBackClick = () => {
    if (popId) {
      router.push(`/${popId}/menu`)
    }
  }

  if (loading) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--invalid-color, #ef4444)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!popData) {
    return (
      <div className={styles.grid}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>No se encontraron datos del POP</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      <SectionHeader
        sectionName='Ajustes'
        popName={popData.name}
        userImg={{
          src: user?.user_metadata?.avatar_url || 'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq',
          alt: 'Usuario'
        }}
        buttonsLeft={
          <ButtonIcon
            icon={<ArrowLeftIcon24 />}
            onPress={handleBackClick}
          />
        }
      />
      <main className={styles.main}>
        {/* Contenido de ajustes - vacío por ahora */}
      </main>
    </div>
  )
}

export default withAuth(Page)

