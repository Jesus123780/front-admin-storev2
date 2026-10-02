'use client'

import {
  Icon,
  Text
} from 'pkg-components'
import React, {
  CSSProperties,
  useMemo
} from 'react'

import styles from './style.module.css'
import { TopViewChairIcon } from '../components/Chair'

const MIN_ALLOWED_SEATS = 1
const MAX_ALLOWED_SEATS = 30

type TableVariant =
  | 'round'
  | 'oval'
  | 'rectangle'
  | 'banquet'

type SeatSide =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'radial'

interface TableSettingProps {
  loading?: boolean
  number?: number | null
  index?: number | null
  list?: number[]
}

interface SeatDescriptor {
  seatNumber: number
  top: number
  left: number
  rotation: number
  side: SeatSide
}

interface TableLayout {
  variant: TableVariant
  width: number
  height: number
  seats: SeatDescriptor[]
}

type TableStyle = CSSProperties & {
  '--seat-width': string
  '--seat-height': string
}

/**
 * Restricts a numeric value between a minimum and maximum.
 *
 * @param {number} value - Value to restrict.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Restricted value.
 */
const clamp = (
  value: number,
  min: number,
  max: number
): number => {
  return Math.max(
    min,
    Math.min(max, value)
  )
}

/**
 * Converts an unknown value into a positive integer.
 *
 * @param {unknown} value - Value to normalize.
 * @returns {number | null} Positive integer or null.
 */
const toPositiveInteger = (
  value: unknown
): number | null => {
  const parsedValue =
    Number(value)

  if (
    !Number.isFinite(
      parsedValue
    ) ||
    parsedValue <= 0
  ) {
    return null
  }

  return Math.trunc(
    parsedValue
  )
}

/**
 * Creates seats distributed around a circular or oval table.
 *
 * This strategy is ideal for 1 to 12 seats because every
 * seat follows the perimeter of the table instead of being
 * artificially assigned to four rectangular sides.
 *
 * @param {number} count - Number of seats.
 * @param {number} radiusX - Horizontal radius as percentage.
 * @param {number} radiusY - Vertical radius as percentage.
 * @returns {SeatDescriptor[]} Radial seat descriptors.
 */
const createRadialSeats = (
  count: number,
  radiusX: number,
  radiusY: number
): SeatDescriptor[] => {
  if (
    count <= 0
  ) {
    return []
  }

  /**
   * The first seat starts at the top.
   *
   * Special cases:
   *
   * 1 => one seat at the top.
   * 2 => opposite positions.
   * 3 => triangle.
   * 4 => cardinal points.
   *
   * From 5 onward the same radial strategy remains natural.
   */
  const startAngle = -90

  return Array.from(
    {
      length: count
    },
    (_, seatIndex) => {
      const angle =
        startAngle +
        (360 / count) *
          seatIndex

      const radians =
        (angle * Math.PI) /
        180

      const left =
        50 +
        Math.cos(radians) *
          radiusX

      const top =
        50 +
        Math.sin(radians) *
          radiusY

      let side: SeatSide =
        'radial'

      if (
        top < 35
      ) {
        side = 'top'
      } else if (
        top > 65
      ) {
        side = 'bottom'
      } else if (
        left < 35
      ) {
        side = 'left'
      } else if (
        left > 65
      ) {
        side = 'right'
      }

      return {
        seatNumber:
          seatIndex + 1,
        top,
        left,
        rotation:
          angle + 90,
        side
      }
    }
  )
}

/**
 * Creates seats across one horizontal side of a rectangular table.
 *
 * The first and last seat are kept away from the corners in
 * order to prevent collision with chairs located at the heads
 * of the table.
 *
 * @param {number} count - Number of seats.
 * @param {number} start - Start position as percentage.
 * @param {number} end - End position as percentage.
 * @param {number} startSeatNumber - First seat number.
 * @param {'top'|'bottom'} side - Horizontal table side.
 * @returns {SeatDescriptor[]} Horizontal seat descriptors.
 */
const createHorizontalSeats = (
  count: number,
  start: number,
  end: number,
  startSeatNumber: number,
  side: 'top' | 'bottom'
): SeatDescriptor[] => {
  if (
    count <= 0
  ) {
    return []
  }

  return Array.from(
    {
      length: count
    },
    (_, index) => {
      const progress =
        count === 1
          ? 0.5
          : index /
            (count - 1)

      const left =
        start +
        (end - start) *
          progress

      return {
        seatNumber:
          startSeatNumber +
          index,
        top:
          side === 'top'
            ? -8
            : 108,
        left,
        rotation:
          side === 'top'
            ? 180
            : 0,
        side
      }
    }
  )
}

/**
 * Creates seats across one vertical side of a rectangular table.
 *
 * The vertical position is centered because the head seats are
 * already placed independently on the horizontal axis.
 *
 * @param {number} seatNumber - Seat number.
 * @param {'left'|'right'} side - Vertical table side.
 * @returns {SeatDescriptor} Generated side seat.
 */
const createHeadSeat = (
  seatNumber: number,
  side: 'left' | 'right'
): SeatDescriptor => {
  return {
    seatNumber,
    top: 50,
    left:
      side === 'left'
        ? -8
        : 108,
    rotation:
      side === 'left'
        ? 90
        : -90,
    side
  }
}

/**
 * Creates a rectangular restaurant table layout.
 *
 * This geometry is used for 13 to 30 seats.
 *
 * The long sides carry most of the capacity while one seat
 * is placed at each head of the table.
 *
 * @param {number} count - Number of seats.
 * @returns {SeatDescriptor[]} Rectangular seat descriptors.
 */
const createRectangleSeats = (
  count: number
): SeatDescriptor[] => {
  if (
    count < 2
  ) {
    return createRadialSeats(
      count,
      43,
      43
    )
  }

  const seatsPerLongSide =
    count - 2

  const topCount =
    Math.ceil(
      seatsPerLongSide / 2
    )

  const bottomCount =
    Math.floor(
      seatsPerLongSide / 2
    )

  const topSeats =
    createHorizontalSeats(
      topCount,
      10,
      90,
      1,
      'top'
    )

  const bottomSeats =
    createHorizontalSeats(
      bottomCount,
      10,
      90,
      topSeats.length + 1,
      'bottom'
    )

  const seats: SeatDescriptor[] =
    [
      ...topSeats,
      ...bottomSeats
    ]

  let nextSeatNumber =
    seats.length + 1

  seats.push(
    createHeadSeat(
      nextSeatNumber,
      'left'
    )
  )

  nextSeatNumber += 1

  seats.push(
    createHeadSeat(
      nextSeatNumber,
      'right'
    )
  )

  /**
   * Re-sort by seat number so the returned collection is
   * always numerically ordered regardless of the side.
   */
  return seats.sort(
    (
      first,
      second
    ) =>
      first.seatNumber -
      second.seatNumber
  )
}

/**
 * Creates the appropriate table geometry for a capacity.
 *
 * Geometry strategy:
 *
 * 1        => round
 * 2 - 4    => round
 * 5 - 8    => round
 * 9 - 12   => oval
 * 13 - 20  => rectangular
 * 21 - 30  => banquet rectangular
 *
 * @param {number} count - Number of seats.
 * @returns {TableLayout} Complete table layout.
 */
const createTableLayout = (
  count: number
): TableLayout => {
  const seats =
    clamp(
      count,
      MIN_ALLOWED_SEATS,
      MAX_ALLOWED_SEATS
    )

  if (
    seats <= 8
  ) {
    return {
      variant:
        'round',
      width:
        seats <= 4
          ? 172
          : 214,
      height:
        seats <= 4
          ? 172
          : 184,
      seats:
        createRadialSeats(
          seats,
          seats <= 4
            ? 42
            : 43,
          seats <= 4
            ? 42
            : 41
        )
    }
  }

  if (
    seats <= 12
  ) {
    return {
      variant:
        'oval',
      width: 286,
      height: 170,
      seats:
        createRadialSeats(
          seats,
          45,
          39
        )
    }
  }

  if (
    seats <= 20
  ) {
    return {
      variant:
        'rectangle',
      width: 350,
      height: 150,
      seats:
        createRectangleSeats(
          seats
        )
    }
  }

  return {
    variant:
      'banquet',
    width: 445,
    height: 140,
    seats:
      createRectangleSeats(
        seats
      )
  }
}

/**
 * Calculates the visual width of a chair based on table capacity.
 *
 * Larger tables progressively reduce chair size so neighboring
 * chairs retain enough visual separation.
 *
 * @param {number} seatCount - Number of seats.
 * @returns {number} Chair width.
 */
const getSeatWidth = (
  seatCount: number
): number => {
  if (
    seatCount <= 4
  ) {
    return 36
  }

  if (
    seatCount <= 8
  ) {
    return 33
  }

  if (
    seatCount <= 12
  ) {
    return 30
  }

  if (
    seatCount <= 20
  ) {
    return 28
  }

  return 23
}

/**
 * Calculates the visual height of a chair.
 *
 * @param {number} seatCount - Number of seats.
 * @returns {number} Chair height.
 */
const getSeatHeight = (
  seatCount: number
): number => {
  if (
    seatCount <= 4
  ) {
    return 41
  }

  if (
    seatCount <= 8
  ) {
    return 39
  }

  if (
    seatCount <= 12
  ) {
    return 37
  }

  if (
    seatCount <= 20
  ) {
    return 34
  }

  return 30
}

/**
 * Returns the CSS class associated with the table geometry.
 *
 * @param {TableVariant} variant - Table geometry.
 * @returns {string} CSS module class.
 */
const getTableVariantClass = (
  variant: TableVariant
): string => {
  const variants:
    Record<
      TableVariant,
      string
    > = {
    round:
      styles.tableRound,
    oval:
      styles.tableOval,
    rectangle:
      styles.tableRectangle,
    banquet:
      styles.tableBanquet
  }

  return variants[
    variant
  ]
}

/**
 * Returns a human-readable capacity label.
 *
 * @param {number} seatCount - Number of seats.
 * @returns {string} Capacity label.
 */
const getCapacityLabel = (
  seatCount: number
): string => {
  return `${seatCount} ${
    seatCount === 1
      ? 'asiento'
      : 'asientos'
  }`
}

/**
 * TableSetting renders a visual representation of a restaurant
 * table with a capacity from 1 to 30 seats.
 *
 * @param {TableSettingProps} props - Component properties.
 * @returns {JSX.Element} Visual table representation.
 */
export const TableSetting = ({
  loading = false,
  number = null,
  index = null,
  list = []
}: TableSettingProps): JSX.Element => {
  const maxFromList =
    Array.isArray(list) &&
    list.length > 0
      ? Math.max(
          ...list.map(
            value =>
              toPositiveInteger(
                value
              ) ?? 0
          )
        )
      : 0

  const requestedSeats =
    toPositiveInteger(
      number
    ) ??
    maxFromList ??
    4

  const seatCount =
    clamp(
      requestedSeats,
      MIN_ALLOWED_SEATS,
      MAX_ALLOWED_SEATS
    )

  const layout =
    useMemo(
      () =>
        createTableLayout(
          seatCount
        ),
      [seatCount]
    )

  const seatWidth =
    getSeatWidth(
      seatCount
    )

  const seatHeight =
    getSeatHeight(
      seatCount
    )

  const tableStyle:
    TableStyle = {
    width:
      `min(100%, ${layout.width}px)`,
    aspectRatio:
      `${layout.width} / ${layout.height}`,
    '--seat-width':
      `${seatWidth}px`,
    '--seat-height':
      `${seatHeight}px`
  }

  const tableVariantClass =
    getTableVariantClass(
      layout.variant
    )

  const isExistingTable =
    index !== null &&
    Number.isFinite(
      Number(index)
    )

  return (
    <div
      aria-busy={loading}
      aria-live='polite'
      className={
        styles.container
      }
    >
      <div
        className={
          styles.stage
        }
      >
        <div
          className={
            styles.tableWrapper
          }
        >
          {isExistingTable &&
            !loading && (
              <div
                aria-label={`Mesa ${
                  Number(index) + 1
                }`}
                className={
                  styles.tableNumber
                }
              >
                {Number(index) + 1}
              </div>
            )}

          <div
            aria-label={`Mesa con ${getCapacityLabel(
              seatCount
            )}`}
            className={`${styles.table} ${tableVariantClass}`}
            role='img'
            style={
              tableStyle
            }
          >
            <div
              className={
                styles.tableShadow
              }
            />

            <div
              className={
                styles.tableSurface
              }
            >
              <div
                className={
                  styles.tableHighlight
                }
              />

              <div
                className={
                  styles.tableInnerBorder
                }
              />

              <div
                className={
                  styles.tableCenter
                }
              >
                {loading ? (
                  <>
                    <span
                      className={
                        styles.loadingCenterLine
                      }
                    />

                    <span
                      className={
                        styles.loadingCenterCircle
                      }
                    />
                  </>
                ) : (
                  <>
                    <span
                      className={
                        styles.tableCenterLabel
                      }
                    >
                      {isExistingTable
                        ? 'MESA'
                        : 'NUEVA MESA'}
                    </span>

                    <strong
                      className={
                        styles.tableCenterNumber
                      }
                    >
                      {seatCount}
                    </strong>

                    <span
                      className={
                        styles.tableCenterSeats
                      }
                    >
                      {seatCount ===
                      1
                        ? 'ASIENTO'
                        : 'ASIENTOS'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {layout.seats.map(
              (
                seat,
                seatIndex
              ) => {
                const anchorStyle:
                  CSSProperties =
                  {
                    top:
                      `${seat.top}%`,
                    left:
                      `${seat.left}%`,
                    animationDelay:
                      `${seatIndex * 18}ms`
                  }

                return (
                  <div
                    aria-label={`Asiento ${seat.seatNumber} en la mesa`}
                    className={
                      styles.seatAnchor
                    }
                    key={
                      `seat-${seat.seatNumber}`
                    }
                    style={
                      anchorStyle
                    }
                  >
                    {loading ? (
                      <div
                        aria-hidden='true'
                        className={
                          styles.seatSkeleton
                        }
                      />
                    ) : (
                      <div
                        className={
                          styles.seat
                        }
                      >
                        <span
                          aria-hidden='true'
                          className={
                            styles.seatChair
                          }
                          style={{
                            transform:
                              `rotate(${seat.rotation}deg)`
                          }}
                        >
                          <TopViewChairIcon />
                        </span>

                        <span
                          className={
                            styles.seatNumber
                          }
                        >
                          {
                            seat.seatNumber
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </div>
      </div>

      <div
        className={
          styles.meta
        }
      >
        <div
          className={
            styles.metaCapacity
          }
        >
          <strong>
            {seatCount}
          </strong>

          <span>
            {seatCount ===
            1
              ? 'asiento'
              : 'asientos'}
          </span>
        </div>

        {!loading && (
          <span
            className={
              styles.metaDistribution
            }
          >
            Distribución equilibrada
          </span>
        )}
      </div>
    </div>
  )
}