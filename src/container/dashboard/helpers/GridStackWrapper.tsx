'use client'

import { useUpdateDashboardComponent } from 'npm-pkg-hook'
import {
    Divider,
    getGlobalStyle,
    Row,
    Text,
    ToggleSwitch
} from 'pkg-components'
import GridStack from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/components/GridStack/GridStack'
import { GridItem } from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/types/types'
import { collisionModeType, dragModeType } from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/types/useGrid.types'
import React, {
    FunctionComponent,
    useContext,
    useEffect,
    useState
} from 'react'

import { Categories } from '@/container/categories'
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
    Categories,
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
    registerComponent: (key: string, component: React.ComponentType<Record<string, unknown>>) => { success: boolean; reason?: string }
}
const ControlledGrid: FunctionComponent<ControlledGridProps> = ({ items, setComponents, registerComponent }) => {
    const [sticky, setSticky] = useState<boolean>(true)
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

    const handleRegisterComponent = (key: string, component: React.ComponentType<Record<string, unknown>>) => {
        const result = registerComponent(key, component)
        if (!result.success) {
            sendNotification({
                title: 'Error registering component',
                description: result.reason || 'An unknown error occurred while registering the component',
                backgroundColor: 'danger',
            })
        }
    }
    return (
        <div style={{ width: '100%', marginRight: '10px' }}>
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            <Row justifyContent='flex-start' gap='lg'>
                <ToggleSwitch
                    checked={editMode}
                    id='edit_mode'
                    label='Editar dashboard'
                    onChange={handleEditMode}
                    successColor='green'
                    style={{
                        width: 'min-content'
                    }}
                    size='small'
                />
                {/* ENABLE sticky MODE */}
                {editMode &&
                    <Row alignItems='center' gap='xs'>
                        <ToggleSwitch
                            checked={sticky}
                            id='sticky_mode'
                            label='Modo pegajoso'
                            onChange={() => setSticky((prev) => !prev)}
                            key='sticky_toggle'
                            name='sticky_mode'
                            successColor='green'
                            style={{
                                width: 'min-content'
                            }}
                            size='small'
                        />
                    </Row>
                }
            </Row>
            <button onClick={() => handleRegisterComponent('Categories', Categories)}>Register ChatStatistic</button>
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            {/* GridStack reemplaza a ResponsiveGridLayout */}
            <GridStack
                items={localLayout as GridItem[]}
                cols={15}
                radio={8}
                rowHeight={40}
                margin={[10, 10]}
                containerPadding={[0, 10]}
                componentMap={COMPONENT_MAP as GridItem['component']}
                onLayoutChange={handleLayoutChange}

                snapEnabled
                snapThreshold={8}

                dragMode={dragModeType.overlay}
                collisionMode={collisionModeType.push}
                dragThrottleMs={0}
                allowOverlapDuringDrag={false}
                preventCollision
                animateOnDrop

                isDraggable={editMode}
                isResizable={editMode}

                animation={{
                    duration: 220,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
                }}

                sticky={true}

                enableRollOnPush={true}
                rollAngleMax={10}
                rollDuration={180}
                rollStagger={12}

                showGrid={editMode}
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
    const {
        components: items,
        setComponents,
        registerComponent,
        loading
    } = useComponents()

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
            <ControlledGrid
                items={normalizedItems}
                setComponents={setComponents as React.Dispatch<React.SetStateAction<ControlledGridProps['items']>>}
                registerComponent={registerComponent}
            />
        </div>
    )
}
