import { AwesomeModal, getGlobalStyle } from 'pkg-components'

import { StatusTypeOrderView } from '@/container/StatusTypeOrder'

interface IModalStatusTypes {
    openModalStatusTypes: boolean
    setModalStatusTypes: (open: boolean) => void
}
export const ModalStatusTypes: React.FC<IModalStatusTypes> = ({
    openModalStatusTypes,
    setModalStatusTypes
}: IModalStatusTypes) => {
    return (
        <div>
            <AwesomeModal
                customHeight='70vh'
                footer={false}
                header={false}
                onCancel={() => { return false }}
                onConfirm={() => { return setModalStatusTypes(false) }}
                onHide={() => { return setModalStatusTypes(false) }}
                padding='20px'
                title=''
                question={false}
                show={openModalStatusTypes}
                size='medium'
                zIndex={getGlobalStyle('--z-index-high')}
            >
                <StatusTypeOrderView />
            </AwesomeModal>
        </div>
    )
}
