'use client'

import { useMobile,useUpdateDashboardComponent } from 'npm-pkg-hook'
import { 
    Column, 
    getGlobalStyle,
    Layout, 
    Layouts, 
    Responsive, 
    Text, 
    ToggleSwitch, 
    WidthProvider
} from 'pkg-components'
import React, {
 FunctionComponent,useContext, useEffect, useState 
} from 'react'

import { ChatStatistic } from '@/container/ChatStatistic'
import { Devices } from '@/container/Devices'
import { DishStore } from '@/container/main/components/main.dishStore'
import { Goal } from '@/container/main/components/main.goal'
import { QrCode } from '@/container/main/components/main.qr'
import { SalesDay } from '@/container/main/components/main.salesDay'
import { TeamStore } from '@/container/TeamStore'
import { Context } from '@/context/Context'

import { Loading } from '../components'
import { useComponents } from '../context'
import styles from './styles.module.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

/**
 * Map of available dashboard components
 * Key is now the same as component name
 */
export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
    DishStore,
    Goal,
    QrCode,
    SalesDay,
    ChatStatistic,
    TeamStore,
    Devices,
}
interface ItemProps {
    id: string
    component?: Record<string, any>
}

const Item: FunctionComponent<ItemProps> = ({ id, component }) => {
    const View = COMPONENT_MAP[id]
    if (!View) {return null}

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <View {...(component || {})} />
        </div>
    )
}

interface ControlledGridProps {
    items: any[]
    setComponents: React.Dispatch<React.SetStateAction<any[]>>
}
const ControlledGrid: FunctionComponent<ControlledGridProps> = ({ items, setComponents }) => {
    const { isMobile } = useMobile()
    const [skipUpdate, setSkipUpdate] = useState(false)
    const { updateComponent } = useUpdateDashboardComponent()
    const { sendNotification } = useContext(Context)
    const [editMode, setEditMode] = useState(false)
    const [layouts, setLayouts] = useState<Layouts>({ lg: [] })

    // Convertimos los items en layout para RGL
    useEffect(() => {
        const newLayout: Layout[] = items.map((item) => ({
            i: item.id, // ahora el id ya es el nombre del componente
            x: item.x ?? 0,
            y: item.y ?? 0,
            w: item.w ?? 3,
            h: item.h ?? 4,
            title: item.title ?? '',
            moved: !!item.moved,
            static: !!item.static,
        }))
        setLayouts({
            lg: newLayout
        })
    }, [])

    /**
     * Handle changes in layout (drag / resize)
     */
    const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
        if (!editMode || skipUpdate) {return}
        setLayouts(allLayouts)
        setComponents((prev) =>
            prev.map((comp) => {
                const newLayout = layout.find((l) => l.i === comp.id)
                return newLayout
                    ? { ...comp, x: newLayout.x, y: newLayout.y, w: newLayout.w, h: newLayout.h }
                    : comp
            })
        )

        // Verifica si algún dato ha cambiado en coordinates
        const hasChanged = layout.some((node) => {
            const prevComp = items.find((comp) => comp.id === node.i)
            return (
                prevComp &&
                (prevComp.x !== node.x ||
                    prevComp.y !== node.y ||
                    prevComp.w !== node.w ||
                    prevComp.h !== node.h)
            )
        })

        if (hasChanged) {
            updateComponent([
                ...layout.map((node) => ({
                    id: node.i,
                    coordinates: { x: node.x, y: node.y, w: node.w, h: node.h },
                }))
            ])
        }
    }

    const handleEditMode = () => {
        setEditMode((prev) => {
            const newMode = !prev
            if (!newMode) {
                sendNotification({
                    title: 'Changes saved',
                    description: 'Your dashboard changes were saved successfully',
                    backgroundColor: 'success',
                })
            }
            return newMode
        })
    }

    const handleBreakpointChange = () => {
        // 👇 activamos un flag para evitar que handleLayoutChange dispare updateComponent
        setSkipUpdate(true)
        // lo reseteamos en el siguiente ciclo
        setTimeout(() => setSkipUpdate(false), 0)
    }
    return (
        <div style={{ width: '100%', marginRight: '10px' }}>
            <ToggleSwitch
                checked={editMode}
                id='edit_mode'
                label='Edit Mode'
                onChange={handleEditMode}
                successColor='green'
            />

            <ResponsiveGridLayout
                className='layout'
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }}
                rowHeight={30}
                margin={[20, 20]}
                isDraggable={editMode}
                isResizable={editMode}
                preventCollision={!editMode}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                useCSSTransforms={true}
            >
                {items
                    .filter((item) => !(isMobile && item.mobile === false))
                    .map((item) => (
                        <div
                            key={item.id}
                            className={styles.gridItems}
                            style={{
                                background: '#fff',
                                margin: '16px', // Agrega más separación entre items
                                borderRadius: '8px', // Opcional: mejora visual
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // Opcional: mejora visual
                            }}
                        >
                            <Column
                                className={styles['grid-stack-item-header']}
                                style={{
                                    position: 'absolute',
                                    top: -20,
                                    left: 10,
                                    width: '100%',
                                }}
                            >
                                <Text as='h2' size='2xl'>
                                    {item.title}
                                </Text>
                            </Column>
                            <div className={styles['grid-stack-item-content']}>
                                <Item {...item} />
                            </div>
                        </div>
                    ))}
            </ResponsiveGridLayout>

        </div>
    )
}

export const GridStackWrapper: FunctionComponent = () => {
    const { components: items, setComponents, loading } = useComponents()
    if (loading) {return <Loading />}
    return (
        <div style={{
            maxWidth: getGlobalStyle('--width-max-desktop'),
            margin: 'auto',
            display: 'flex'
        }}>
            <ControlledGrid items={items} setComponents={setComponents} />
        </div>
    )
}
