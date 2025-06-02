import React, { useContext, useState } from 'react'
import { AmountInput, AwesomeModal, Button, Column, getGlobalStyle, Icon, KmhGoalChart, numberFormat, Text } from 'pkg-components'
import { useStore, useGetSalesAmountToday, useFormTools, useAmountInput, useUpsertGoal } from 'npm-pkg-hook'
import { Context } from '@/context/Context'
import styles from '../styles.module.css'

export const Goal = () => {
    const { sendNotification } = useContext(Context)

    const [dataStore] = useStore()
    const { dailyGoal } = dataStore || {}
    const [data, { loading }] = useGetSalesAmountToday()
    const [upsertGoal, { data: dataGoal, loading: loadingGoal }] = useUpsertGoal({ sendNotification })

    const [openModalGoal, setopenModalGoal] = useState(false)

    const handleOpenEditgoal = () => {
        return setopenModalGoal(!openModalGoal)
    }
    interface HandleFormEvent {
        preventDefault: () => void;
    }
    const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({ sendNotification })

    const handleForm = (e: HandleFormEvent): void => {
        return handleSubmit({
            event: e,
            action: () => {
                upsertGoal({ dailyGoal: Number(dataForm.dailyGoal) })
            }
        });
    };

    return (
        <Column style={{ width: '100%', padding: getGlobalStyle('--spacing-md') }} justifyContent='center' alignItems='center'>
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
                        onValueChange={(value) => {
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

            <Column className={styles.goal_chart_action}>
                <button onClick={handleOpenEditgoal} className={styles.goal_chart_action_button}>
                    <Icon icon='IconDost' />
                </button>
            </Column>
            <KmhGoalChart
                size={250}
                current={loading ? 0 : data?.total} goal={loading ? 0 : dailyGoal}
                moneyFormat
                numberFormat={numberFormat}
                orientation='vertical'
                fontSize='12px'
            />
        </Column>
    )
}
