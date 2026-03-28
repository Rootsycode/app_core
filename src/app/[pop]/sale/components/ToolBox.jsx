'use client'

import { useRouter } from 'next/navigation'
import { ButtonIcon, MenuButton, MenuItem } from 'rootsy-feparts'
import { useAuth } from '@/context/AuthContextSupabase'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { AlertIcon24 } from '@/components/atoms/icons/AlertIcon24'
import { ArrowLeftIcon24 } from '@/components/atoms/icons/ArrowLeftIcon24'
import styles from '../page.module.css'

export function ToolBox ({ popId, sectionName }) {
  const router = useRouter()
  const { logOut } = useAuth()

  return (
    <div className={styles.toolbox}>
      <div className={styles.toolboxLeft}>
        <ButtonIcon
          inverted
          icon={<ArrowLeftIcon24 />}
          onPress={() => router.push(`/${popId}/menu`)}
          aria-label='Volver al menú'
        />
        <h1 className={styles.sectionTitle}>{sectionName}</h1>
      </div>
      <div className={styles.toolboxRight}>
        <ButtonIcon inverted icon={<AlertIcon24 />} aria-label='Alertas' />
        <MenuButton iconButton inverted>
          <MenuItem onAction={() => router.push('/profile')}>
            <ProfileIcon16 />
            Ver perfil
          </MenuItem>
          <MenuItem>
            <HelpIcon16 />
            Ayuda
          </MenuItem>
          <MenuItem onAction={logOut}>
            <CloseSessionIcon16 />
            Cerrar sesión
          </MenuItem>
        </MenuButton>
      </div>
    </div>
  )
}
