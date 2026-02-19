import { StepCero } from './components/Forms/StepCero'
import { StepOne } from './components/Forms/StepOne'
import { StepThree } from './components/Forms/StepThree'
import { StepTow } from './components/Forms/StepTow'

export const STEPS_HEADER = ['Crea una tienda', 'Ingresa como invitado']


export const STEP_TITLES = [
    'Datos iniciales',
    'Información Básica de la Tienda',
    'Contacto e info',
    'Finalizar registro',
]

export const STEP_COMPONENTS = [
    StepCero,
    StepOne,
    StepTow,
    StepThree,
    () => null,
]
