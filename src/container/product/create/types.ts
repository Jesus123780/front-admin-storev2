export interface FoodComponentMemoProps {
    alt?: string
    check: {
        availability: boolean
        noAvailability: boolean
        [key: string]: any
    }
    data: any[]
    dataCategoriesProducts: any[]
    dataFree: any[]
    fetchMore?: () => void
    fileInputRef?: RefObject<HTMLInputElement>
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    handleChangeFilter?: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleCheckFreeShipping?: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleRegister: () => Promise<any>
    handleDelete?: (id: string) => void
    image?: string
    loading?: boolean
    setErrors: (errors: any) => void
    names: string
    onClickClear?: () => void
    onTargetClick?: (e: React.MouseEvent) => void
    search?: string
    tagsProps?: {
        dataTags: { id: string; tag: string }[]
        handleAddTag: (id: string, tag: string) => void
        tags: {
            tag: string
            id: number
        }
    }
    setActive: React.Dispatch<React.SetStateAction<number>>
    setName: (name: string) => void
    setShowMore: React.Dispatch<React.SetStateAction<boolean>>
    showMore: boolean
    handleDecreaseStock?: () => void
    handleCheckStock?: () => void
    handleIncreaseStock?: () => void
    checkStock?: boolean
    stock?: number
    active: number
    src?: string
    errors: any
    STEPS: { [key: string]: number }
    state: any
    setShowComponentModal: React.Dispatch<React.SetStateAction<boolean | number>>
    handleClick: (value: boolean) => void
    pId?: string
    open: boolean
    values?: {
        ProDescription?: string
        ProDescuento?: string
        ProPrice?: number
        ValueDelivery?: string
        carProId?: string
        [key: string]: any
    }
    handleCheck: (e: React.ChangeEvent<HTMLInputElement>) => void
    setCheck: React.Dispatch<React.SetStateAction<any>>
    [key: string]: any
}