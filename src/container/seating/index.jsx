'use client'

import {
  RandomCode,
  useFormTools,
  useStoreTableCreate,
  useStoreTables
} from 'npm-pkg-hook'
import {
  AlertInfo,
  Carousel,
  Column,
  Divider,
  getGlobalStyle,
  HeaderSteps,
  Icon,
  InputHooks,
  RippleButton,
  Row,
  Text
} from 'pkg-components'
import React, {
  useContext,
  useEffect,
  useState
} from 'react'

import { Context } from '../../context/Context'
import styles from './style.module.css'
import { TableSetting } from './TableSetting'

export const TableSeating = () => {
  // HOOKS
  const { sendNotification } = useContext(Context)
  const [selectedSeats, setSelectedSeats] = useState(4)
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm }] = useFormTools({ sendNotification })
  const [storeTableCreate, { loading }] = useStoreTableCreate({ sendNotification })
  const [data, { loading: loadingData }] = useStoreTables()
  const steps = ['CREA UNA MESA PARA TU COMERCIO', `LISTAR DE MESAS (${Number(data?.storeTables?.length) || 0})`]
  const list = [1, 2, 4, 6, 8, 10, 12, 14, 12, 16]

  const handleForm = (e) => {
    const tableName = RandomCode(10)
    return handleSubmit({
      event: e,
      action: async () => {
        await storeTableCreate(
          dataForm.tableName || tableName,
          selectedSeats,
          dataForm.section,
          1
        )
      }
    })
  }


  // Función para manejar la selección del número de asientos
  const handleSeatSelection = (numSeats) => {
    setSelectedSeats(numSeats)
  }

  const breakpoints = {
    767: {
      slidesPerView: 1,
      spaceBetween: 5
    },
    991: {
      slidesPerView: 2,
      spaceBetween: 10
    },
    1199: {
      slidesPerView: 3,
      spaceBetween: 15
    }
  }
  // EFFECTS
  useEffect(() => {
    const tableName = RandomCode(10)
    setDataValue({
      ...dataForm,
      tableName,
      oldTableName: tableName
    })
  }, [])

  const [active, setActive] = useState(0)
  const [overActive, setOverActive] = useState(false)
  const handleOverActive = () => {
    setOverActive(!overActive)
  }

  return (
    <>
      <Column
        style={{
          position: 'sticky',
          top: 0,
          zIndex: getGlobalStyle('--z-index-99999'),
          backgroundColor: getGlobalStyle('--color-base-white')
        }}
      >
        <HeaderSteps
          active={active}
          handleOverActive={handleOverActive}
          overActive={overActive}
          setActive={setActive}
          steps={steps}
          style={{
            marginBottom: 'none'
          }}
        />
      </Column>
      {active === 0
        ? <>
          <Column
            alignItems='center'
            as='form'
            justifyContent='center'
            onSubmit={(e) => {
              handleForm(e)
            }}
            style={{
              width: '50%',
              margin: '0 auto'
            }}
          >
            <InputHooks
              error={errorForm?.tableName}
              margin='none'
              marginBottom={getGlobalStyle('--spacing-lg')}
              name='tableName'
              onChange={handleChange}
              placeholder={dataForm?.oldTableName}
              required={true}
              title='Nombre de la mesa'
              value={dataForm?.tableName}
              width='100%'
            />
            <InputHooks
              error={errorForm?.section}
              margin='none'
              marginBottom='none'
              name='section'
              onChange={handleChange}
              title='Sección'
              value={dataForm?.section}
              width='100%'
            />
            <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
            <RippleButton
              loading={loading}
              type='submit'
            >
              Subir Mesa
            </RippleButton>
            <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
          </Column>

          <div
            style={{
              width: '50%',
              margin: '0 auto'

            }}
          >
            <AlertInfo message='Aquí puedes seleccionar el número de asiento para la mesa que vas a crear, luego que crees la mesa no puedes eliminarla' type='warning' />
            <ul className={styles.seatList}>
              <Carousel breakpoints={breakpoints} pagination={false}>
                {list.map((seatsOption) => {
                  return (
                    <li
                      className={styles.seatOption}
                      key={seatsOption}
                      onClick={() => { return handleSeatSelection(seatsOption) }}
                      style={selectedSeats === seatsOption ? { backgroundColor: '#ddd' } : {}}
                    >
                      <Column alignItems='center' justifyContent='center'>
                        <Icon
                          icon='IconChair'
                          size={25}
                        />
                        {seatsOption} Asientos
                      </Column>

                    </li>
                  )
                })}
              </Carousel>
            </ul>
          </div>
          <Column alignItems='center' justifyContent='center'>
            <TableSetting
              list={list}
              loading={loadingData}
              number={selectedSeats}
            />
          </Column>
        </> :

        <>
          {data?.storeTables?.length > 0 ? <>
            <Row
              style={{
                margin: '0 auto',
                flexWrap: 'wrap',
                display: 'flex',
                gap: getGlobalStyle('--spacing-4xl')
              }}
            >
              {data?.storeTables?.map((table, index) => {
                return (
                  <TableSetting
                    key={index}
                    list={list}
                    index={index}
                    loading={loadingData}
                    number={table.seats}
                  />
                )
              })}
            </Row>

          </> : <Text>No hay mesas creadas</Text>}
        </>
      }
    </>
  )
}