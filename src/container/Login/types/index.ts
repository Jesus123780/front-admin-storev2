export interface GoogleUserBody {
    user: {
        name: string
        username: string
        lastName: string
        email: string
        id: string
        image: string
        locationFormat: unknown[]
        useragent: string | null
        deviceid?: string | null
        imageUrl: string
    }
}
