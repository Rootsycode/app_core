'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import {
  Body,
  Button,
  ButtonIcon,
  ButtonThumb,
  MenuButton,
  MenuItem,
  SearchField,
  Separe,
  Title,
  Utility
} from 'rootsy-feparts'
import { HomeIcon24 } from '@/components/atoms/icons/HomeIcon24'
import { ProfileIcon16 } from '@/components/atoms/icons/ProfileIcon16'
import { HelpIcon16 } from '@/components/atoms/icons/HelpIcon16'
import { CloseSessionIcon16 } from '@/components/atoms/icons/CloseSessionIcon16'
import { AlertIcon24 } from '@/components/atoms/icons/AlertIcon24'
import { MENU } from '@/constant/Menu'
import styles from './page.module.css'

interface ButtonSection {
  icon?: React.ReactNode
  label?: string
  action?: (() => void) | null
  disabled: boolean
}

const ButtonSection = ({ icon, label, action, disabled }: ButtonSection) => (
  <div className={styles.button_section_container}>
    <Button
      onPress={action && action}
      className={`${styles.button_section_button} ${
        disabled && styles.button_section_disabled
      }`}
    >
      {icon}
    </Button>
    <Utility size='md'>{label}</Utility>
  </div>
)

const Page = ({ params }: { params: Promise<{ slug: string }> }) => {
  const pop = params
  const router = useRouter()
  const { user, logOut } = useAuth()
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true })

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit() // Reinitialize if necessary
    }
  }, [emblaApi])

  console.log(pop)

  const popData = {}

  return (
    <>
      <div className={styles.grid}>
        <header className={styles.header}>
          <div className={styles.left}>
            <ButtonIcon className={styles.home_button} icon={<HomeIcon24 />} />
            <Separe width={24} />
            <ButtonThumb src='https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq' />

            <Separe width={12} />
            <div className={styles.pop_text}>
              <Title size='xs'>Rootsy Market</Title>
              <Body size='md'>Dean Funes 25</Body>
            </div>
          </div>

          <div className={styles.center}>
            <SearchField placeholder='Buscar sección' />
          </div>

          <div className={styles.right}>
            <ButtonIcon icon={<AlertIcon24 />} />
            <Separe width={8} />

            <MenuButton iconButton>
              <MenuItem>
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
            <Separe width={12} />

            <ButtonThumb src='https://files.lafm.com.co/assets/public/styles/img_node_706x392/public/2018-06/mia_6_0.jpg.webp?VersionId=5JmTFkYwubURMj1EkAsGiS8U26gBGb7z&itok=BoONFqiq' />
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.section_main}>
            <div className={styles.embla} ref={emblaRef}>
              <div className={styles.embla__container}>
                {MENU.map((groups, index) => (
                  <div className={styles.embla__slide} key={index}>
                    <div className={styles.items__grid}>
                      {groups.map((item, index) => {
                        const isDisabled =
                          item?.label !== 'Vender' &&
                          item?.label !== 'Inventario'

                        return (
                          <div
                            className={styles.embla_inner_slide}
                            key={`carousel-${index}`}
                          >
                            <ButtonSection
                              disabled={isDisabled}
                              label={item?.label}
                              icon={<img src={item?.img} aria-hidden />}
                              action={
                                !isDisabled ? () => console.log('click') : null
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default withAuth(Page)
