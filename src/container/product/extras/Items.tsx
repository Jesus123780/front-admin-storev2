import {
  AmountInput,
  EColor,
  getGlobalStyle,
  Icon,
  numberFormat,
  QuantityButton,
  RippleButton,
  ToggleSwitch
} from 'pkg-components'
import React, {
  useEffect,
  useLayoutEffect,
  useRef
} from 'react'

import styles from './items.module.css'

interface ExtraItem {
  exPid?: string | number | null
  extraName?: string | null
  quantity?: number | string | null
  extraPrice?: number | string | null
  manageStock?: boolean | null
  stock?: number | string | null
}

/** Editable line shape managed by the useDessertWithPrice hook. */
interface EditableLine {
  exPid?: string | number | null
  extraName?: string | null
  extraPrice?: number | string | null
  manageStock?: boolean | null
  stock?: number | string | null
}

interface RemoveExtraPayload<T extends ExtraItem> {
  Adicionales: T
  exPid?: T['exPid']
}

interface ChangeExtraQuantityPayload<T extends ExtraItem> {
  Adicionales: T
  index: number
}

interface ItemsProps<T extends ExtraItem = ExtraItem> {
  editing: boolean
  dataExtra?: T[]
  disabled?: boolean
  handleRemove?: (index: number, exPid?: T['exPid']) => void
  handleRemoveExtra?: (payload: RemoveExtraPayload<T>) => void
  handleIncrementExtra?: (payload: ChangeExtraQuantityPayload<T>) => void
  handleDecrementExtra?: (payload: ChangeExtraQuantityPayload<T>) => void
  // Inline-edit wiring provided by useDessertWithPrice (product edit screen).
  // When present, each row in `editing` mode can be edited in place: name,
  // price, stock control toggle and stock quantity, then saved via handleEdit.
  LineItems?: { Lines: EditableLine[] }
  selected?: { loading?: boolean; exPid?: string | number | null }
  loading?: boolean
  handleSelect?: (item: EditableLine, index: number) => void
  handleLineChange?: (index: number, field: string, value: string | number | boolean) => void
  handleEdit?: (index: number, exPid: string) => void
}

/**
 * Evita el warning de useLayoutEffect durante SSR.
 * En el navegador permite calcular las posiciones antes del pintado.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

const Items = <T extends ExtraItem = ExtraItem>({
  editing,
  dataExtra = [],
  disabled = false,
  handleRemove = () => {},
  handleRemoveExtra = () => {},
  handleIncrementExtra = () => {},
  handleDecrementExtra = () => {},
  LineItems,
  selected,
  handleSelect,
  handleLineChange,
  handleEdit
}: ItemsProps<T>) => {
  // Inline editing is available only when the hook wiring is provided.
  const canInlineEdit = Boolean(handleLineChange && handleEdit && handleSelect)
  /**
   * Referencias de los elementos renderizados.
   * Se utilizan para calcular los cambios de posición.
   */
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  /**
   * Almacena la posición anterior de cada elemento.
   */
  const previousPositions = useRef<Map<string, number>>(new Map())

  /**
   * Animación FLIP:
   *
   * First: posición anterior.
   * Last: posición actual.
   * Invert: compensamos temporalmente el desplazamiento.
   * Play: animamos hasta la posición original.
   */
  useIsomorphicLayoutEffect(() => {
    const currentPositions = new Map<string, number>()

    itemRefs.current.forEach((element, key) => {
      const currentTop = element.getBoundingClientRect().top
      const previousTop = previousPositions.current.get(key)

      currentPositions.set(key, currentTop)

      if (previousTop === undefined) return

      const difference = previousTop - currentTop

      if (Math.abs(difference) < 1) return

      // Desactiva temporalmente la transición para establecer
      // la posición inicial de la animación.
      element.style.transition = 'none'

      element.style.setProperty('--flip-y', `${difference}px`)

      // Fuerza el cálculo del layout antes de iniciar la transición.
      element.getBoundingClientRect()

      window.requestAnimationFrame(() => {
        element.style.transition = ''
        element.style.setProperty('--flip-y', '0px')
      })
    })

    previousPositions.current = currentPositions
  })

  return (
    <div className={styles.container}>
      {dataExtra.map((extra, index) => {
        const itemKey = String(extra?.exPid ?? index)

        // Editable snapshot for this row (hook state), used only in edit mode.
        const editLine: EditableLine =
          (LineItems?.Lines && LineItems.Lines[index]) || (extra as EditableLine)
        const isRowSelected =
          canInlineEdit && selected?.exPid != null && selected.exPid === extra?.exPid
        // Only disable THIS row's button while THIS row is being saved.
        // Using a row-scoped flag (not the global hook loading) prevents every
        // row's Edit button from being disabled during a save.
        const rowSaving = Boolean(selected?.loading) && selected?.exPid === extra?.exPid

        // Stock floor for inline editing. For an ALREADY-CREATED complement
        // (it has an exPid), the stock can only be increased/replenished from
        // the edit screen — never reduced below its currently persisted stock.
        // Lowering existing inventory must go through a sale or an inventory
        // adjustment flow, not a silent edit. New (not-yet-saved) lines have a
        // minimum floor of 1.
        const isPersisted = Boolean(extra?.exPid)
        const persistedStock = Number(extra?.stock) || 0
        const stockFloor = isPersisted ? Math.max(persistedStock, 1) : 1

        const quantity = Number(extra?.quantity) || 0
        const extraPrice = Number(extra?.extraPrice) || 0

        // Inventario del extra.
        const managesStock = Boolean(extra?.manageStock)
        const availableStock = Number(extra?.stock) || 0

        const isSoldOut = managesStock && availableStock <= 0
        const reachedStockLimit =
          managesStock && quantity >= availableStock

        const canIncrement = !disabled && !reachedStockLimit

        // Precio y cantidad.
        const isFree = extraPrice === 0
        const isAdded = quantity > 0

        const displayPrice =
          quantity > 0 ? extraPrice * quantity : extraPrice

        const showUnitPrice = !isFree && quantity > 1

        // Clases dinámicas.
        const itemClassName = [
          styles.item,
          editing && styles.itemEditing,
          isAdded && styles.itemAdded,
          isSoldOut && styles.itemSoldOut
        ]
          .filter(Boolean)
          .join(' ')

        // Eliminar extra del catálogo.
        const handleRemoveItem = () => {
          handleRemove(index, extra?.exPid)
        }

        // Quitar extra del carrito.
        const handleRemoveAdded = () => {
          handleRemoveExtra({
            Adicionales: extra,
            exPid: extra?.exPid
          })
        }

        // Disminuir cantidad.
        const handleDecrease = () => {
          handleDecrementExtra({
            Adicionales: extra,
            index
          })
        }

        // Incrementar cantidad.
        const handleIncrease = () => {
          handleIncrementExtra({
            Adicionales: extra,
            index
          })
        }

        return (
          <article
            key={itemKey}
            ref={(node) => {
              if (node) {
                itemRefs.current.set(itemKey, node)
              } else {
                itemRefs.current.delete(itemKey)
              }
            }}
            className={itemClassName}
          >
            {editing && isRowSelected ? (
              /* Inline editor (product edit screen). Edits write to the hook
                 state via handleLineChange; Save commits with handleEdit which
                 persists name, price, manageStock and stock to the backend. */
              <div className={styles.editor}>
                <label className={styles.editorField}>
                  <span className={styles.editorLabel}>Nombre</span>
                  <input
                    className={styles.editorInput}
                    type='text'
                    value={String(editLine?.extraName ?? '')}
                    onChange={(e) =>
                      handleLineChange?.(index, 'extraName', e.target.value)
                    }
                    placeholder='Nombre del complemento'
                  />
                </label>

                <div className={styles.editorField}>
                  <span className={styles.editorLabel}>Precio</span>
                  <AmountInput
                    allowDecimals={true}
                    decimalSeparator=','
                    decimalsLimit={2}
                    groupSeparator='.'
                    name={`extraPrice-${index}`}
                    defaultValue={editLine?.extraPrice ?? ''}
                    onValueChange={(value?: string | number) =>
                      handleLineChange?.(index, 'extraPrice', value ?? '')
                    }
                    placeholder='Precio'
                    prefix='$'
                  />
                </div>

                <ToggleSwitch
                  checked={Boolean(editLine?.manageStock)}
                  id={`edit-manageStock-${index}`}
                  name='manageStock'
                  label='Controlar disponibilidad por stock'
                  onChange={() => {
                    const next = !editLine?.manageStock
                    handleLineChange?.(index, 'manageStock', next)
                    if (next && (!editLine?.stock || Number(editLine?.stock) < 1)) {
                      handleLineChange?.(index, 'stock', 1)
                    }
                  }}
                  successColor='green'
                />

                {Boolean(editLine?.manageStock) && (
                  <div className={styles.editorField}>
                    <span className={styles.editorLabel}>Stock disponible</span>
                    <QuantityButton
                      handleDecrement={() => {
                        const current = Number(editLine?.stock) || stockFloor
                        // Never drop below the floor: the persisted stock for a
                        // created complement, or 1 for a new one.
                        const next = current - 1
                        handleLineChange?.(
                          index,
                          'stock',
                          next < stockFloor ? stockFloor : next
                        )
                      }}
                      handleIncrement={() => {
                        const current = Number(editLine?.stock) || 0
                        handleLineChange?.(index, 'stock', current + 1)
                      }}
                      // Disable the "-" once the floor is reached so existing
                      // stock cannot be reduced from the edit screen.
                      showNegativeButton={(Number(editLine?.stock) || stockFloor) <= stockFloor}
                      quantity={Number(editLine?.stock) || stockFloor}
                    />
                    {isPersisted && (
                      <span className={styles.editorLabel}>
                        No puedes bajar el stock por debajo de {stockFloor}. Para disminuirlo, usa una venta o un ajuste de inventario.
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.info}>
                <div className={styles.nameWrapper}>
                  <h3 className={styles.title}>
                    {extra?.extraName || 'Sin nombre'}

                    {isSoldOut && (
                      <span className={styles.soldOutBadge}>
                        Agotado
                      </span>
                    )}
                  </h3>

                  {managesStock && !isSoldOut && (
                    <span
                      className={styles.stockHint}
                      title='Stock disponible'
                    >
                      Disponibles: {availableStock}
                    </span>
                  )}

                  {showUnitPrice && (
                    <span
                      className={styles.unitPrice}
                      title='Precio unitario'
                    >
                      Precio unitario: {numberFormat(extraPrice)}
                    </span>
                  )}
                </div>

                <div className={styles.priceWrapper}>
                  <span
                    className={`${styles.price} ${
                      isFree ? styles.priceFree : ''
                    }`.trim()}
                  >
                    {isFree ? 'Gratis' : numberFormat(displayPrice)}
                  </span>

                  {!isFree && showUnitPrice && (
                    <span className={styles.priceSuffix}>
                      c/u
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              {editing ? (
                <>
                  {canInlineEdit && extra?.exPid && (
                    <RippleButton
                      aria-label={
                        isRowSelected
                          ? `Guardar ${extra?.extraName || 'complemento'}`
                          : `Editar ${extra?.extraName || 'complemento'}`
                      }
                      bgColor='transparent'
                      disabled={rowSaving}
                      margin='0'
                      onClick={() => {
                        if (isRowSelected) {
                          handleEdit?.(index, String(extra?.exPid))
                        } else {
                          handleSelect?.(editLine, index)
                        }
                      }}
                      type='button'
                      widthButton='min-content'
                      className={styles.deleteButton}
                    >
                      <Icon
                        icon={isRowSelected ? 'IconMiniCheck' : 'IconEdit'}
                        color={
                          isRowSelected
                            ? getGlobalStyle('--color-feedback-success-dark')
                            : getGlobalStyle('--color-icons-primary')
                        }
                        size={22}
                      />
                    </RippleButton>
                  )}
                  <RippleButton
                    aria-label={`Eliminar ${
                      extra?.extraName || 'complemento'
                    }`}
                    bgColor='transparent'
                    margin='0'
                    onClick={handleRemoveItem}
                    type='button'
                    widthButton='min-content'
                    className={styles.deleteButton}
                  >
                    <Icon
                      icon='IconDelete'
                      color={EColor}
                      size={22}
                    />
                  </RippleButton>
                </>
              ) : (
                <>
                  <div className={styles.quantityWrapper}>
                    <QuantityButton
                      border='none'
                      disabled={disabled}
                      handleDecrement={handleDecrease}
                      handleIncrement={handleIncrease}
                      padding='5px'
                      quantity={quantity}
                      showNegativeButton={!quantity}
                      showPositiveButton={!canIncrement}
                      validationZero={false}
                      width='min-content'
                    />
                  </div>

                  {isAdded && (
                    <div className={styles.deleteWrapper}>
                      <RippleButton
                        aria-label={`Quitar ${
                          extra?.extraName || 'complemento'
                        } del producto`}
                        bgColor='transparent'
                        disabled={disabled}
                        margin='0'
                        onClick={handleRemoveAdded}
                        type='button'
                        widthButton='min-content'
                        className={styles.deleteButton}
                      >
                        <Icon
                          icon='IconDelete'
                          color={EColor}
                          size={20}
                        />
                      </RippleButton>
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default Items