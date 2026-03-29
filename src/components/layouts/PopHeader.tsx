'use client'

import { useRouter } from 'next/navigation'
import {
  Body,
  ButtonIcon,
  ButtonThumb,
  MenuButton,
  MenuItem,
  SearchField,
  Separe,
  Title
} from 'rootsy-feparts'
import { useAuth } from '@/context/AuthContextSupabase'
import { HomeIcon24 } from '@/components/atoms/icons/HomeIcon24'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { AlertIcon24 } from '@/components/atoms/icons/AlertIcon24'
import styles from './PopHeader.module.css'

interface PopHeaderProps {
  popData: {
    id: string
    name: string
    imageUrl: string | null
    address: string | null
  }
  showSearch?: boolean
  searchPlaceholder?: string
}

export function PopHeader({ popData, showSearch = true, searchPlaceholder = 'Buscar sección' }: PopHeaderProps) {
  const router = useRouter()
  const { user, logOut } = useAuth()

  const handleHomeClick = () => {
    router.push(`/${popData.id}/menu`)
  }

  const handleLogOut = async () => {
    await logOut()
    window.location.href = '/auth/login'
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <ButtonIcon 
          className={styles.home_button} 
          icon={<HomeIcon24 />} 
          onPress={handleHomeClick}
        />
        <Separe width={24} />
        <ButtonThumb 
          src={popData.imageUrl || 'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'} 
        />

        <Separe width={12} />
        <div className={styles.pop_text}>
          <Title size='xs'>{popData.name}</Title>
          <Body size='md'>{popData.address || 'Sin dirección'}</Body>
        </div>
      </div>

      {showSearch && (
        <div className={styles.center}>
          <SearchField placeholder={searchPlaceholder} />
        </div>
      )}

      <div className={styles.right}>
        <ButtonIcon icon={<AlertIcon24 />} />
        <Separe width={8} />

        <MenuButton iconButton>
          <MenuItem onAction={() => router.push('/profile')}>
            <ProfileIcon16 />
            Mi cuenta
          </MenuItem>
          <MenuItem>
            <HelpIcon16 />
            Ayuda
          </MenuItem>
          <MenuItem onAction={handleLogOut}>
            <CloseSessionIcon16 />
            Cerrar sesión
          </MenuItem>
        </MenuButton>
        <Separe width={12} />

        <ButtonThumb src={user?.user_metadata?.avatar_url || 'https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq'} />
      </div>
    </header>
  )
}

