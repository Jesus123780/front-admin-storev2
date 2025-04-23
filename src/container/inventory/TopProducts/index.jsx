'use client'

import React from 'react'
import PropTypes from 'prop-types'
import { useTopProductsMovements } from 'npm-pkg-hook'
import { 
  Column, 
  getGlobalStyle, 
  Section, 
  Table, 
  Text
} from 'pkg-components'
import Image from 'next/image'

export const TopProductsList = ({
  className = ''
}) => {
  const [topProducts, { error }] = useTopProductsMovements()

  if (error) return <p>Error: {error.message}</p>

  return (
    <div
      className={className}
      style={{
        width: '100%'
      }}
    >
      <Table
        data={topProducts ?? []}
        header={false}
        renderBody={(data, titles) => {
          return (
            data?.map((product) => {
              const {
                idProduct,
                productName,
                totalMovements
              } = product || {}
              return (
                <Section
                  columnWidth={titles}
                  key={idProduct}
                  odd={true}
                  padding={getGlobalStyle('--spacing-sm')}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Image
                      height={50}
                      objectFit='cover'
                      src={'/images/DEFAULTBANNER.png'}
                      width={50}
                    />
                    <span>{`${productName}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Column alignItems='center' justifyContent='center'>
                      <Text>{`${totalMovements}`}</Text>
                      <Text>Ventas</Text>
                    </Column>
                  </div>
                </Section>
              )
            })
          )
        }}
        titles={[
          {
            key: '',
            justify: 'flex-start',
            width: '30%'
          },
          {
            key: '',
            justify: 'flex-start',
            width: '30%'
          }
        ]}
      />
    </div>
  )
}

TopProductsList.propTypes = {
  className: PropTypes.string
}