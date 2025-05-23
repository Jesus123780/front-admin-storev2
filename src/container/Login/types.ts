export interface GoogleUserBody {
    user: {
        name: string
        username: string
        lastName: string
        email: string
        id: string
        image: string
        locationFormat: any[]
        useragent: string | null
        deviceid?: string | null
        imageUrl: string
    }
}
