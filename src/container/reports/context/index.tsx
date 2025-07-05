import {
    createContext,
    useState,
    useContext
} from 'react'

const DEFAULT = {
    handleAddComponent: () => { },
    setActive: () => { },
    COMPONENTS_STEPS: [],
    active: 0,
    descriptionHeaders: {}
} as {
    handleAddComponent: () => void
    setActive: React.Dispatch<React.SetStateAction<number>>
    active: number
    COMPONENTS_STEPS: string[],
    descriptionHeaders: {
        [key: number]: {
            title: string
            description: string
        }
    }
}

const ComponentAnalyticsContext = createContext(DEFAULT)

export const useComponentAnalytics = () => useContext(ComponentAnalyticsContext)

export const ComponentAnalyticsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [active, setActive] = useState(0)
    const COMPONENTS_STEPS = ['METRICAS', 'REPORTES']

    const descriptionHeaders = {
        0: {
            title: 'Analiza las Graficas',
            description: 'Visualiza las métricas de tus interacciones y rendimiento.'
        },
        1: {
            title: 'Descarga reportes',
            description: 'Selecciona el tipo de reporte que deseas descargar.'
        },
        2: {
            title: 'Gestiona reportes personalizados',
            description: 'Crea y gestiona reportes adaptados a tus necesidades.'
        },
        3: {
            title: 'Analítica Avanzada',
            description: 'Explora más componentes en desarrollo para un análisis más profundo.'
        }
    }
    return (
        <ComponentAnalyticsContext.Provider
            value={{
                handleAddComponent: () => {
                    setActive((prev) => prev + 1)
                },
                setActive,
                active,
                COMPONENTS_STEPS,
                descriptionHeaders
            }}
        >
            {children}
        </ComponentAnalyticsContext.Provider>
    )
}
