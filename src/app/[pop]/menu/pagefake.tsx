import { useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContext'
import { ButtonIcon, ButtonThumb, Subtitle, Title } from 'rootsy-feparts'
import styles from './page.module.css'

export const Root = ({
  children,
  backgroundImg = 'https://res.cloudinary.com/dbjqkboeb/image/upload/f_auto,q_auto/szfwp72ptcjb3h3w9yxx'
}: {
  children: React.ReactNode
  backgroundImg?: string
}) => (
  <div className={styles.content}>
    <img
      className={styles.background}
      src={
        backgroundImg ??
        'https://i0.wp.com/yoshyra.com/wp-content/uploads/2020/12/Image-Placeholder-Dark.png?w=2000&ssl=1'
      }
      aria-hidden
    />
    {children}
  </div>
)

interface HeaderProps {
  userImg: string
  popData: {
    name: string
    address: string
    image_url?: string
  }
}

export const Header = ({
  userImg,
  popData,
  actionHomeButton,
  actionProfile,
  actionHelp,
  signOut
}: HeaderProps) => (
  <header className={styles.container1}>
    <div className={styles.col1}>
      <ButtonIcon
        icon={
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M3 9.00003L12 2.00003L21 9.00003V20C21 20.5305 20.7893 21.0392 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0392 3 20.5305 3 20V9.00003Z'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            ></path>
            <path
              d='M9 22V12H15V22'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            ></path>
          </svg>
        }
        action={actionHomeButton}
      />
      <ButtonThumb
        src={
          popData?.image_url ??
          'https://i0.wp.com/yoshyra.com/wp-content/uploads/2020/12/Image-Placeholder-Dark.png?w=100&ssl=1'
        }
      />
      <div className={styles.textPop}>
        <Title size='xs'>{popData?.name ?? ''}</Title>
        <Subtitle size='sm'>{popData?.address ?? ''}</Subtitle>
      </div>
    </div>

    {/* Espacio 2 */}
    <div className={styles.col2}></div>
  </header>
)

export const Content = ({ actionButton }) => (
  <section className={styles.container2}>
    {/* <Slider infinite arrows={false} dots={true} className={styles.slider}>
      {MENU.map(groups => (
        <div className={styles.slideContainer}>
          <div className={styles.buttonsContainer}>
            {groups.map((item, index) => {
              const isDisabled =
                item?.label !== 'Vender' && item?.label !== 'Inventario'

              return (
                <div key={`carousel-${index}`}>
                  <ButtonSection
                    // aria-disabled={isDisabled && true}
                    disabled={isDisabled}
                    label={item?.label}
                    icon={<img src={item?.img} aria-hidden />}
                    action={!isDisabled ? () => actionButton(item?.link) : null}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </Slider> */}
  </section>
)

const Page = ({ params }: { params: Record<string, string> }) => {
  const { pop } = params
  const router = useRouter()
  const { user, signOut } = useAuth()

  const popData = {}

  return (
    <Root>
      <Header
        userImg={user ? user[0]?.image_url : null}
        popData={popData}
        actionHomeButton={() => router.push('/profile')}
        actionProfile={() => router.push('/profile')}
        actionHelp={() => router.push('/profile')}
        signOut={signOut}
      />
      <Content actionButton={link => router.push(`/${popID}/${link}`)} />
    </Root>
  )
}

export default withAuth(Page)
