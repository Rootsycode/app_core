'use client'

import { ButtonThumb, Title, Body } from 'rootsy-feparts'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  className?: string
  userImg?: {
    src: string
    alt?: string
  }
  popName?: string
  sectionName: string
  buttonsLeft?: React.ReactNode
  buttonsRight?: React.ReactNode
}

export const SectionHeader = ({
  className = '',
  userImg,
  popName = '',
  sectionName,
  buttonsLeft,
  buttonsRight
}: SectionHeaderProps) => {
  const classes = [styles.container, className].filter(Boolean).join(' ')

  return (
    <header className={classes}>
      <div className={styles.column}>{buttonsLeft || null}</div>

      <Title component='h1' size='sm'>
        {sectionName}
      </Title>

      <div className={styles.column}>
        {buttonsRight ? <div className={styles.buttons_group}>{buttonsRight}</div> : null}

        <div className={styles.user_info}>
          {popName ? (
            <Body size='sm'>
              {popName}
            </Body>
          ) : null}

          {userImg?.src ? (
            <ButtonThumb
              size='sm'
              src={userImg.src}
              alt={userImg.alt || ''}
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}

