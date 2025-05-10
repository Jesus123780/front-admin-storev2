export interface GoogleUserBody {
    user: {
        name: string
        username: string
        lastName: string
        email: string
        id: string
        locationFormat: any[]
        useragent: string | null
        deviceid: Promise<string>
        imageUrl: string
    }
}