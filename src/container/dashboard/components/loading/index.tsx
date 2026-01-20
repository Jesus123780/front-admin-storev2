import {
  Column,
  getGlobalStyle,
  Row,
  Skeleton
} from 'pkg-components'
import React, { JSX } from 'react'

const skeletonGroups = [
  { count: 8, height: 50, width: '95%', numberObject: 1 },
  { count: 3, height: 350, width: '95%', numberObject: 1 },
  { count: 1, height: 500, width: '98%', numberObject: 1 },
  { count: 1, height: 100, width: '98%', numberObject: 3 },
  { count: 3, height: 400, width: '95%', numberObject: 1 },
  { count: 3, height: 200, width: '95%', numberObject: 3 },
  { count: 1, height: 200, width: '98%', numberObject: 1 },
  { count: 3, height: 300, width: '95%', numberObject: 1 }
]

/**
 * Loading skeleton that renders a configurable set of skeleton blocks.
 *
 * @returns {JSX.Element} A flexible loading UI.
 */
export const Loading = (): JSX.Element => {
  return (
    <Column style={{
      marginTop: getGlobalStyle('--spacing-md')
    }}>
      {skeletonGroups.map((group, groupIndex) => (
        <Row key={`group-${groupIndex}`}>
          {Array.from({ length: group.count }).map((_, i) => (
            <Skeleton
              key={`skeleton-${groupIndex}-${i}`}
              borderRadius="1%"
              height={group.height}
              margin="10px 0"
              numberObject={group.numberObject}
              width={group.width}
            />
          ))}
        </Row>
      ))}
    </Column>
  )
}
