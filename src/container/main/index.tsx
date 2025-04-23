'use client'

import PropTypes from 'prop-types'
import { 
  useStore, 
  useUser, 
  useUpsertGoal, 
  useLocalBackendIp, 
  useGetSalesAmountToday, 
  useAmountInput, 
  useFormTools, 
  useColorByLetters
} from 'npm-pkg-hook'
import { 
  AmountInput,
  AwesomeModal,
  Button,
  Column, 
  Divider, 
  getGlobalStyle, 
  Icon, 
  ImageQRCode, 
  InputHooks, 
  KmhGoalChart, 
  numberFormat, 
  Row, 
  CounterAnimation, 
  Text
} from 'pkg-components'
import styles from './styles.module.css'
import { useRouter } from 'next/navigation'
import { useCallback, useContext, useState } from 'react'
import { ChatStatistic } from '../ChatStatistic'
import { Context } from '@/context/Context'
import { AnimatedCounter } from './text'

interface User {
  email?: string;
}

export const Main = ({ user = {} as User }) => {
    const { sendNotification } = useContext(Context)
    const router = useRouter()
  const [dataUser] = useUser()
  const { urlBackend } = useLocalBackendIp()
  const [data, { loading }] = useGetSalesAmountToday()
  const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({ sendNotification })
  const [upsertGoal, { data: dataGoal, loading: loadingGoal }] = useUpsertGoal({ sendNotification })
  const { email } = dataUser || {}
  const [dataStore] = useStore({ callback : (data: any) => {
    if (data) {
      setDataValue({
        dailyGoal: data?.dailyGoal
      })
    }
  }})

  const { 
    storeName, 
    idStore,
    dailyGoal
  } = dataStore || {}

  const nameStore = storeName?.replace(/\s/g, '-').toLowerCase()
  const userEmail = email || user?.email
  const { 
    color,
    bgColor,
    borderColor
  } = useColorByLetters({
    value: nameStore
  })

  const displayText = String(nameStore).substring(0, 2).toUpperCase()

  const handleCardClick = useCallback(() => {
    if (nameStore && idStore) {
      router.push(`/dashboard/${nameStore}/${idStore}`)
    } else {
      router.push('/dashboard')
    }
  }, [router, nameStore, idStore])

  const [openModalGoal, setopenModalGoal] = useState(false)
  const handleOpenEditgoal = () => {
    return setopenModalGoal(!openModalGoal)
  }

  interface HandleFormEvent {
    preventDefault: () => void;
  }

  const handleForm = (e: HandleFormEvent): void => {
    return handleSubmit({
      event: e,
      action: () => {
        upsertGoal({ dailyGoal: Number(dataForm.dailyGoal) })
      }
    });
  };
  const [count, setCount] = useState(1910)
  function random() {
    setCount(Math.ceil(Math.random() * 0.432 * 10000));
  }
  return (
    <Column>
    <AwesomeModal 
      show={openModalGoal}
      onHide={handleOpenEditgoal}
      title="Meta de ventas del día"
      size='small'
      padding={getGlobalStyle('--spacing-md')}
      height='200px'
      footer={false}
      onCancel={handleOpenEditgoal}
    >
      <form onSubmit={handleForm}>
        <AmountInput
                allowDecimals={true}
                decimalSeparator=','
                decimalsLimit={2}
                disabled={false}
                groupSeparator='.'
                label='Monto de meta diaria *'
                name='dailyGoal'
                placeholder={numberFormat(dataForm?.dailyGoal)}
                onChange={(value) => {
                  handleChange({
                    target: {
                      name: 'dailyGoal',
                      value: value
                    }
                  })
                }}
                prefix='$'
                useAmountInput={useAmountInput}
                value={dataForm?.dailyGoal}
              />
        <Button
          type='submit'
          width='100%'
          disabled={loading}
          loading={loading || loadingGoal}
          primary={true}
        >
          Guardar           
        </Button>
      </form>
    </AwesomeModal>
      <Row
        style={{
          flexWrap: 'wrap'
        }}
      >
       <Row>
  <Row className={styles.main}>
    <div className={styles.main__card} onClick={handleCardClick}>
      <div className={styles.iconWrapper}>
        <Icon
          color={getGlobalStyle('--color-icons-primary')}
          height={50}
          icon="IconArrowRight"
          size={50}
          width={50}
        />
      </div>
      <div className={styles['main__user-email']}>
        <div
          className={styles.image_profile}
          style={{
            backgroundColor: bgColor,
            fontSize: `${Math.round(60 / 100 * 37)}px`,
            color: color,
            boxShadow: '0px 3px 8px rgba(18, 18, 18, 0.04), 0px 1px 1px rgba(18, 18, 18, 0.02)',
            borderColor: `${borderColor}50`,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          {displayText}
        </div>
        <Column>
          <Row>
            <Text size="xl" weight="bold">
              Bienvenido,{' '}
              <Text size="md" weight="light">
                {storeName || ''}
              </Text>
            </Text>
          </Row>
          <Divider marginTop={getGlobalStyle('--spacing-sm')} />
          <Text color="gray">{userEmail ?? email}</Text>
        </Column>
      </div>

    </div>
    <Column>
      <Text size="lg" weight="normal">
        Ventas del dia: <strong>{numberFormat(data?.total)}</strong>
      </Text>
      <CounterAnimation number={Number(data?.total)} size="1rem" />
    </Column>

    <Column style={{ width: 'min-content' }}>
    <Text size="lg" weight="normal">
    Tu meta de <strong>ventas del dia</strong>  propuesta es de: <strong>{numberFormat(dailyGoal)}</strong>
      </Text>
      <Column className={styles.goal_chart_action}>
      <button onClick={handleOpenEditgoal} className={styles.goal_chart_action_button}>
          <Icon icon='IconDost'  />
      </button>
      </Column>
    <KmhGoalChart 
    current={loading ? 0 : data?.total} goal={loading ? 0 : dailyGoal} 
    moneyFormat 
    numberFormat={numberFormat} 
    orientation='vertical'
    fontSize='12px'
     />
          </Column>
    <Column style={{ width: 'min-content' }}>
    <Text size="lg" weight="normal">
    Escanea o comparte este <strong>código QR</strong> con tu celular para iniciar sesión:
      </Text>
      <div className={styles.qrCard}> 
        <ImageQRCode value={urlBackend} size={256} />
      </div>
    </Column>
   
  </Row>
</Row>
      </Row>
      <ChatStatistic />
    </Column>
  )
}

Main.propTypes = {
  user: PropTypes.object
}
