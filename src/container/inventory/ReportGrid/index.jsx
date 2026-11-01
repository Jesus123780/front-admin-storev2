'use client'

import {
  CounterAnimation,
  getGlobalStyle,
  Icon,
  Paragraph,
  Text
} from 'pkg-components'

import styles from './styles.module.css'

/**
 * Renders a responsive set of KPI cards for the inventory dashboard.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} [props.data] - KPI descriptors. Each item may define a
 *   label, numeric value, number-format flag, an icon descriptor and a layout
 *   className used by the parent grid.
 * @returns {JSX.Element} The KPI cards.
 */
export const ReportGrid = ({ data = [] }) => {
  return (
    <>
      {data.map((item, index) => {
        const mainIcon = item?.icon ?? {}
        const {
          icon,
          color = getGlobalStyle('--color-icons-gray'),
          size = 28
        } = mainIcon

        return (
          <section
            aria-label={item.label}
            className={`${styles.card} ${item.className ?? ''}`}
            key={index}
          >
            <div className={styles.header}>
              <Text
                as='h3'
                className={styles.title}
                size='md'
                weight={600}
              >
                {item.label}
              </Text>
              {icon
                ? (
                  <span aria-hidden='true' className={styles.iconWrap}>
                    <Icon
                      color={color}
                      icon={icon}
                      size={size}
                    />
                  </span>
                  )
                : null}
            </div>
            <Paragraph className={styles.value}>
              <CounterAnimation
                number={item?.value ?? 0}
                numberformat={item.numberformat ?? false}
                size='1.75rem'
              />
            </Paragraph>
          </section>
        )
      })}
    </>
  )
}
