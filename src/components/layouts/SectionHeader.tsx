'use client'

import classNames from 'classnames'
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
  const classes = classNames(styles.container, className)

  return (
    <header className={classes}>
      {/* column 1 */}
      <div className={styles.column}>{buttonsLeft || null}</div>

      {/* column 2 */}
      <Title component='h1' size='sm'>
        {sectionName}
      </Title>

      {/* column 3 */}
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

