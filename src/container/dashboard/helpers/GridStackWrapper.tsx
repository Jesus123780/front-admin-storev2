'use client'

import { useMobile, useUpdateDashboardComponent } from 'npm-pkg-hook'
import {
    Divider,
    getGlobalStyle,
    Text,
    ToggleSwitch
} from 'pkg-components'
import GridStack from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/components/GridStack/GridStack'
import React, {
    FunctionComponent,
    useContext,
    useEffect,
    useState
} from 'react'

/**
 * IMPORT OUR GridStack component
 * Ajusta la ruta si tu proyecto no hace resolve de '@' hacia 'src'
 */
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

/**
 * onLayoutChange receives an array of nodes from GridStack (each node has .i, x,y,w,h)
 * We update setComponents and call updateComponent (remote persistence) only when editMode && !skipUpdate
 */
interface GridStackLayoutItem {
    i: string
    x: number
    y: number
    w: number
    h: number
}

interface UpdatePayloadItem {
    id: string
    coordinates: {
        x: number
        y: number
        w: number
        h: number
    }
}

/**
 * Map of available dashboard components
 * Key is now the same as component name
 */
export const COMPONENT_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
    DishStore,
    Goal,
    QrCode,
    SalesDay,
    ChatStatistic,
    TeamStore,
    Devices,
}

interface ControlledGridProps {
    items: {
        id: string
        x?: number
        y?: number
        w?: number
        h?: number
        title?: string
        static?: boolean
        component?: Record<string, UpdatePayloadItem['coordinates']>
    }[]
    setComponents: React.Dispatch<React.SetStateAction<ControlledGridProps['items']>>
}
const ControlledGrid: FunctionComponent<ControlledGridProps> = ({ items, setComponents }) => {
    const { isMobile } = useMobile()
    const [skipUpdate, setSkipUpdate] = useState(false)
    const { updateComponent } = useUpdateDashboardComponent()
    const { sendNotification } = useContext(Context)
    const [editMode, setEditMode] = useState(false)

    // Local layout state that mirrors items (optional, used only to initialize GridStack if needed)
    const [localLayout, setLocalLayout] = useState(
        items.map((item) => ({
            id: item.id,
            x: item.x ?? 0,
            y: item.y ?? 0,
            w: item.w ?? 3,
            h: item.h ?? 4,
            title: item.title ?? '',
            static: !!item.static,
            component: item.component ?? {}
        }))
    )

    // Keep localLayout in sync when items change externally
    useEffect(() => {
        setLocalLayout(items.map((item) => ({
            id: item.id,
            x: item.x ?? 0,
            y: item.y ?? 0,
            w: item.w ?? 3,
            h: item.h ?? 4,
            title: item.title ?? '',
            static: !!item.static,
            component: item.component ?? {}
        })))

    }, [items])



    const handleLayoutChange = (newLayout: GridStackLayoutItem[]): void => {
        if (!editMode || skipUpdate) {
            // still update localLayout so UI stays accurate if needed
            const mapped = localLayout.map((item) => {
                const found = newLayout.find((l) => l.i === item.id)
                return found ? { ...item, x: found.x, y: found.y, w: found.w, h: found.h } : item
            })
            setLocalLayout(mapped)
            return
        }

        // update local components state
        setComponents((prev) =>
            prev.map((comp) => {
                const found = newLayout.find((l) => l.i === comp.id)
                return found ? { ...comp, x: found.x, y: found.y, w: found.w, h: found.h } : comp
            })
        )

        // detect changes to persist
        const hasChanged = newLayout.some((node) => {
            const prevComp = items.find((c) => c.id === node.i)
            return (
                prevComp &&
                (prevComp.x !== node.x ||
                    prevComp.y !== node.y ||
                    prevComp.w !== node.w ||
                    prevComp.h !== node.h)
            )
        })

        if (hasChanged) {
            // format for updateComponent API
            const payload: UpdatePayloadItem[] = newLayout.map((node) => ({
                id: node.i,
                coordinates: { x: node.x, y: node.y, w: node.w, h: node.h },
            }))
            updateComponent(payload)
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
        // flag para evitar que handleLayoutChange dispare updateComponent
        setSkipUpdate(true)
        setTimeout(() => setSkipUpdate(false), 0)
    }

    if (items.length === 0) {
        return (<div style={{ width: '100%' }}>
            <Text as='h2' size='2xl' align='center'>
                No components added yet
            </Text>
        </div>
        )
    }

    return (
        <div style={{ width: '100%', marginRight: '10px' }}>
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            <ToggleSwitch
                checked={editMode}
                id='edit_mode'
                label='Edit Mode'
                onChange={handleEditMode}
                successColor='green'
            />
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            {/* GridStack reemplaza a ResponsiveGridLayout */}
            <GridStack
                items={localLayout}
                cols={15}
                rowHeight={40}
                margin={[10, 10]}
                containerPadding={[0, 10]}
                componentMap={COMPONENT_MAP}
                onLayoutChange={handleLayoutChange}

                /* snap / magnetismo */
                snapEnabled={true}
                snapThreshold={9}

                /* interacción */
                dragMode="overlay"            /* recomendado: overlay para capas y FLIP */
                collisionMode="push"          /* push produce reflow que activa soft displacement */
                dragThrottleMs={0}            /* 0 === RAF (suave) */
                allowOverlapDuringDrag={false}
                animateOnDrop={true}
                preventCollision={true}
                isDraggable={editMode}
                isResizable={editMode}

                /* parámetros de animación (ajusta según gusto) */
                animation={{ duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}

                /* soft displacement / roll */
                enableRollOnPush={true}   /* true hace visible el rotateX sutil */
                // sticky es una nueva opción que hace que los elementos "se peguen" a su posición original durante el drag, lo que puede ayudar a visualizar mejor el movimiento y evitar que se desplacen demasiado lejos. Es especialmente útil en combinación con enableRollOnPush para mejorar la experiencia visual.
                sticky={true}

                /* otros */
                showGrid={editMode}
                enableHitOnPush={true}
                hitMultiplier={1.06}           // más sutil
                hitDuration={120}
                hitThresholdPx={8}
                rollAngleMax={8}
                rollDuration={300}
                rollStagger={12}

            />

            {/* Hidden: breakpoint handler (si necesitas integrarlo, podrías usar un componente de tamaño/responsive)
                Actualmente mantenemos la misma API para handleBreakpointChange */}
            <div style={{ display: 'none' }}>
                <button onClick={handleBreakpointChange}>simulateBreakpointChange</button>
            </div>
        </div>
    )
}

export const GridStackWrapper: FunctionComponent = () => {
    const { components: items, setComponents, loading } = useComponents()
    if (loading) { return <Loading /> }

    const normalizedItems: ControlledGridProps['items'] = items.map((item, index) => {
        const safeId = item.id ?? (item as { i?: string }).i ?? `component-${index}`
        return { ...item, id: safeId }
    })

    return (
        <div style={{
            maxWidth: getGlobalStyle('--width-max-desktop'),
            margin: 'auto',
            display: 'flex'
        }}>
            <ControlledGrid items={normalizedItems} setComponents={setComponents as React.Dispatch<React.SetStateAction<ControlledGridProps['items']>>} />
        </div>
    )
}
