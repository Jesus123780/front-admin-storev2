import { AwesomeModal, getGlobalStyle } from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'

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
                footer={false}
                header={true}
                onCancel={() => { return false }}
                onConfirm={() => { return setOpenModalStatusTypes(false) }}
                onHide={() => { return setOpenModalStatusTypes(false) }}
                padding={20}
                title='Tipos de estado de orden'
                question={false}
                show={openModalStatusTypes}
                size={MODAL_SIZES.large}
                zIndex={getGlobalStyle('--z-index-high')}
            >
                <OrderTypesContextProviders />
            </AwesomeModal>
        </div>
    )
}
