'use client'

import { 
  Icon, 
  Paragraph, 
  Text
} from 'pkg-components'
import styles from './styles.module.css'

export const ReportGrid = ({ data }) => {
  return (
    <>
      {data.map((item, index) => {
        const { icon: mainIcon } = item
        const {
          icon,
          color,
          size
        } = mainIcon
        return (
          <div className={`${styles.card} ${item.className}`} key={index}>
            <Text as='h3' className={styles.title}>
              {item.label}
            </Text>
            <Paragraph className={styles.value}>
              {item.value}
            </Paragraph>
            <Icon
              color={color}
              icon={icon}
              size={size}
            />
          </div>
        )
      })}
    </>
  )
}
