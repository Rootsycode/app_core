import { Body, Title } from "rootsy-feparts";
import styles from './index.module.css'

export const LoginLayout = ({ children }) => (
  <div className={styles.container}>
    <section className={styles.section}>
      <Title className={styles.title} size='md'>
        ROOTSY
      </Title>
      <Body className={styles.subtitle} size='xs'>
        Sistema de gestión online
      </Body>

      <div className={styles.card}>
        {children}
      </div>
    </section>
  </div>
)
