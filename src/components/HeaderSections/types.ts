import type { ReactNode } from 'react'

export type HeaderSectionsMenuOption = {
  icon: ReactNode
  name: string
  href?: string
  onAction?: () => void | Promise<void>
}

export type HeaderSectionsProps = {
  popId: string
  sectionName: string
  popName: string
  userImageSrc: string
  userImageAlt?: string
  menuOptions: HeaderSectionsMenuOption[]
}
