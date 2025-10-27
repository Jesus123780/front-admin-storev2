'use client'

import { 
  CounterAnimation,
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
              <CounterAnimation 
                number={item?.value ?? 0} 
                size='2rem'
                numberformat={item.numberformat ?? false}
              />
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
