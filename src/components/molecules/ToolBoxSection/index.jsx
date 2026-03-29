import { Body, ButtonIcon, ButtonThumb, Title } from 'rootsy-feparts'
import { ChevronLeft24 } from '@/components/atoms/icons/ChevronLeft24'
import styles from './index.module.css'

export const ToolBoxSection = ({ sectionName, leftContent, rightContent }) => {
  const user = {
    first_name: 'John',
    last_name: 'Doe',
    image_url: 'https://via.placeholder.com/150'
  }
  const popId = '123'

  return (
    <div className={styles.container}>
      <div className={styles.leftContent}>
        {leftContent === 'back' ? (
          <ButtonIcon icon={<ChevronLeft24 />} onPress={() => navigate(`/menu/${popId}`)} />
        ) : (
          leftContent
        )}
      </div>
      <div className={styles.sectionName}>
        <Title>{sectionName}</Title>
      </div>
      <div className={styles.rightContent}>
        {rightContent}
        <div className={styles.userContainer}>
          <Body size='sm'>{user ? `${user?.first_name} ${user?.last_name}` : ''}</Body>
          { user?.image_url && <ButtonThumb size="md" src={user?.image_url} /> }
          {/* <img src={user ? user?.image_url : ''} alt={`Foto de perfil de ${user?.first_name}`} /> */}
        </div>
      </div>
    </div>
  )
}
