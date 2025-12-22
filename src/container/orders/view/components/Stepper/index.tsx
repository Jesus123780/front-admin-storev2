import { Button, Stepper } from 'pkg-components'
import { JSX } from 'react'

interface IStepperOrderStatus {
    active: number
    steps: string[] | JSX.Element[]
    callBack?: () => void
    setActive: (step: number) => void
}

export const StepperOrderStatus: React.FC<IStepperOrderStatus> = ({
    active,
    steps,
    setActive,
    callBack = () => { }
}) => {
    const allStep = [
        ...steps,
        <Button
            key='add-step'
            iconPosition='left'
            iconName='IconPlus'
            border='none'
        >
            Agregar
        </Button>
    ] as IStepperOrderStatus['steps']
    return (
        <div>
            <Stepper
                mode='simple'
                active={active}
                key={1}
                onClick={(index) => {
                    if (index === steps.length) {
                        callBack()
                    }
                    return setActive(index)
                }}
                steps={allStep}
            />
        </div>
    )
}
