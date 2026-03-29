'use client'

import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import type { HeaderSectionsMenuOption } from './types'

export function createPopHeaderMenuOptions (
  router: { push: (href: string) => void },
  logOut: () => Promise<void>
): HeaderSectionsMenuOption[] {
  return [
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
}
