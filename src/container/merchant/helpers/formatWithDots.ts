export const formatWithDots = (value: string): string => {
    if (!value) {
        return ''
    }
    const digits = value?.replaceAll(/\D/g, '') // solo números
    return digits.replaceAll(/\B(?=(\d{3})+(?!\d))/g, '.')
}
