'use client'
import { memo } from 'react'

import type { SaleCalculatedLine } from '../../types/order'
import { isPositiveMoney } from '../helpers/order-financials'
import { formatCOP } from '../helpers/order-format'
import type { OrderItemCart } from './order-item.types'
import {
    recordedExtras, recordedOptions, visibleSubOptions
} from './order-item.utils'
import styles from './order-item-details.module.css'
import { OrderItemExtras } from './order-item-extras'
import { OrderItemOptions } from './order-item-options'
import { Icon, Row } from 'pkg-components'

export const OrderItemDetails = memo(function OrderItemDetails({ item, line, currency = 'COP' }: { item: OrderItemCart; line?: SaleCalculatedLine; currency?: string }) {
    const extras = recordedExtras(item.products), options = recordedOptions(item.products), comments = item.comments?.trim()
    if (!line && !extras.length && !options.some(o => visibleSubOptions(o).length) && !comments) { return null }
    return <div className={styles.details}>
        <OrderItemExtras extras={extras} line={line} currency={currency} /><OrderItemOptions options={options} />
        {comments
            &&
            <section className={styles.section}>
                <Row>
                    <Icon icon='IconComment' />
                    <h4 className={styles.title}>
                        Nota del artículo
                    </h4>
                </Row>

                <p className={styles.comment}>{comments}</p>
            </section>
        }
        {line && <dl className={styles.ledger}>{isPositiveMoney(line.commercialDiscountAmount) && <div className={styles.ledgerRow}><dt>Descuento comercial de la línea</dt><dd className={styles.saving}>− {formatCOP(line.commercialDiscountAmount, currency)}</dd></div>}{isPositiveMoney(line.vatAmount) && <div className={styles.ledgerRow}><dt>Impuestos</dt><dd>{formatCOP(line.vatAmount, currency)}</dd></div>}<div className={styles.subtotal}><dt>Neto de la línea</dt><dd>{formatCOP(line.netTotal, currency)}</dd></div></dl>}
    </div>
})
