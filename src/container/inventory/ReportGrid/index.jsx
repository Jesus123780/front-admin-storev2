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
 * A card becomes interactive (keyboard-accessible button) when it declares an
 * `onClick` handler. In that case a secondary "action" icon (arrow/link) is
 * shown as an affordance that the card drills down into a detail view.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} [props.data] - KPI descriptors. Each item may define a
 *   label, numeric value, number-format flag, an icon descriptor, a layout
 *   className used by the parent grid, an optional `onClick` handler and an
 *   optional `actionIcon` (defaults to a link/arrow icon) rendered when the
 *   card is interactive.
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

        const isInteractive = typeof item?.onClick === 'function'
        const actionIcon = item?.actionIcon ?? 'IconUpRightArrow'

        const handleKeyDown = (event) => {
          if (!isInteractive) {return}
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            item.onClick(event)
          }
        }

        return (
          <section
            aria-label={item.label}
            className={`${styles.card} ${isInteractive ? styles.cardInteractive : ''} ${item.className ?? ''}`}
            key={index}
            onClick={isInteractive ? item.onClick : undefined}
            onKeyDown={isInteractive ? handleKeyDown : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
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
              <span className={styles.iconGroup}>
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
                {isInteractive
                  ? (
                    <span aria-hidden='true' className={styles.actionIcon}>
                      <Icon
                        color={getGlobalStyle('--color-icons-primary')}
                        icon={actionIcon}
                        size={18}
                      />
                    </span>
                    )
                  : null}
              </span>
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
