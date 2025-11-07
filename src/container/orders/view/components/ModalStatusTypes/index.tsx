import { AwesomeModal, getGlobalStyle } from 'pkg-components'

import OrderTypesContextProviders from '@/container/StatusTypeOrder/providers'

interface IModalStatusTypes {
    openModalStatusTypes: boolean
    setOpenModalStatusTypes: (open: boolean) => void
}
export const ModalStatusTypes: React.FC<IModalStatusTypes> = ({
    openModalStatusTypes,
    setOpenModalStatusTypes
}: IModalStatusTypes) => {
    return (
        <div>
            <AwesomeModal
                customHeight='70vh'
                footer={false}
                header={true}
                onCancel={() => { return false }}
                onConfirm={() => { return setOpenModalStatusTypes(false) }}
                onHide={() => { return setOpenModalStatusTypes(false) }}
                padding='20px'
                title='Tipos de estado de orden'
                question={false}
                show={openModalStatusTypes}
                size='medium'
                zIndex={getGlobalStyle('--z-index-high')}
            >
                <OrderTypesContextProviders />
            </AwesomeModal>
        </div>
    )
}
