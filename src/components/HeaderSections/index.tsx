'use client'

import type { ReactNode } from 'react'
import {
  Menu as RACMenu,
  MenuTrigger,
  Popover
} from 'react-aria-components'
import { Body, ButtonIcon, MenuItem, Title } from 'rootsy-feparts'
import { ChevronLeft24 } from '@/components/atoms/icons/ChevronLeft24'
import { OptionsIcon24 } from '@/components/atoms/icons/OptionsIcon24'
import styles from './HeaderSections.module.css'

export type HeaderSectionsMenuOption = {
  icon: ReactNode
  name: string
  /** Navegación estándar (enlace). */
  href?: string
  /** Acción (p. ej. cerrar sesión); si está definida, tiene prioridad sobre `href`. */
  onAction?: () => void | Promise<void>
}

export type HeaderSectionsProps = {
  popId: string
  sectionName: string
  popName: string
  userImageSrc: string
  userImageAlt?: string
  /** Opciones del menú ⋮: `href` y/o `onAction` por ítem. */
  menuOptions: HeaderSectionsMenuOption[]
}

function popoverInvertedClass ({
  defaultClassName
}: {
  defaultClassName?: string
}): string {
  return [defaultClassName, 'menu-button__popover--inverted']
    .filter(Boolean)
    .join(' ')
}

export function HeaderSections ({
  popId,
  sectionName,
  popName,
  userImageSrc,
  userImageAlt = '',
  menuOptions
}: HeaderSectionsProps) {
  const menuHref = `/${popId}/menu`

  return (
    <header className={styles.shell}>
      <div className={styles.colLeft}>
        <ButtonIcon
          icon={<ChevronLeft24 />}
          inverted
          href={menuHref}
          aria-label='Volver al menú del punto de venta'
        />
      </div>

      <div className={styles.colCenter}>
        <Title color='white' className={styles.sectionTitle}>
          {sectionName}
        </Title>
      </div>

      <div className={styles.colRight}>
        {menuOptions.length > 0 ? (
          <MenuTrigger>
            <ButtonIcon icon={<OptionsIcon24 />} inverted aria-label='Más opciones' />
            <Popover className={popoverInvertedClass}>
              <RACMenu>
                {menuOptions.map((opt) => (
                  <MenuItem
                    key={opt.href ?? opt.name}
                    href={opt.onAction ? undefined : opt.href}
                    onAction={opt.onAction}
                    icon={opt.icon}
                    textValue={opt.name}
                  >
                    {opt.name}
                  </MenuItem>
                ))}
              </RACMenu>
            </Popover>
          </MenuTrigger>
        ) : null}

        <div className={styles.popPill}>
          <Body
            size='sm'
            className={styles.popName}
            style={{ color: 'var(--grayscale-200, #e6e6e6)' }}
          >
            {popName}
          </Body>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL externa / storage */}
          <img
            className={styles.avatar}
            src={userImageSrc}
            alt={userImageAlt}
            width={40}
            height={40}
          />
        </div>
      </div>
    </header>
  )
}
