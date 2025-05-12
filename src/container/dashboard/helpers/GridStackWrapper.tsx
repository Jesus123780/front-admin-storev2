'use client'

import React, {
    useLayoutEffect,
    createRef,
    useRef,
    useState
} from 'react'
import {
    Column,
    Devices,
    GridStack,
    Text,
    ToggleSwitch
} from 'pkg-components'
import { useComponents } from '../context'
import { DishStore } from '@/container/main/components/main.dishStore'
import { SalesDay } from '@/container/main/components/main.salesDay'
import { Goal } from '@/container/main/components/main.goal'
import { QrCode } from '@/container/main/components/main.qr'
import { ChatStatistic } from '@/container/ChatStatistic'
import { TeamStore } from '@/container/TeamStore'

export const COMPONENT_MAP = {
    1: DishStore,
    2: Goal,
    3: QrCode,
    4: SalesDay,
    5: ChatStatistic,
    6: TeamStore,
    7: Devices,
};

const Item = ({ id, component }: { id: string; component: React.ReactNode }) => {
    const view = COMPONENT_MAP[Number(id) as keyof typeof COMPONENT_MAP];
    const componentProps = typeof component === 'object' && !Array.isArray(component) && component !== null
        ? { ...component }
        : {};

    return (
        <div style={{ width: '100%' }}>
            {view ? React.createElement(view, componentProps) : null}
        </div>
    );
};

interface ControlledStackProps {
    items: any[];
}

const ControlledStack = ({ items }: ControlledStackProps) => {
    const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});
    const gridRef = useRef<GridStack | undefined>()
    const gridContainerRef = useRef(null)
    const [editMode, setEditMode] = useState(false)
    refs.current = {}

    if (Object.keys(refs.current).length !== items.length) {
        items.forEach(({ id }) => {
            refs.current[id] = refs.current[id] || createRef();
        });
    }

    // Breakpoints para diseño responsivo
    const BREAKPOINTS = [
        { c: 1, w: 700 },
        { c: 2, w: 850 },
        { c: 3, w: 950 },
        { c: 6, w: 1100 },
    ];

    useLayoutEffect(() => {
        if (!gridRef.current) {
            if (!gridContainerRef.current) return
            (gridRef.current = GridStack.init(
                {
                   float: false,
                    animate: true,
                    alwaysShowResizeHandle: true,
                    acceptWidgets: true,
                    column: 12, // Número de columnas por defecto
                    minRow: 12,
                    cellHeight: 'auto',
                    cellHeightThrottle: 100,
                    cellHeightUnit: '%',
                    columnOpts: {
                        breakpointForWindow: true, // Esta opción asegura que GridStack pueda responder a cambios de ventana
                        breakpoints: BREAKPOINTS, // Puntos de quiebre personalizados
                        columnMax: 6, // Número máximo de columnas
                    },
                },
                gridContainerRef.current
            ))
            if (gridRef.current) {
                gridRef.current.setStatic(!editMode)
            }
        } else {
            const grid = gridRef.current
            const layout = items.map((a) =>
                refs.current[a.id].current?.gridstackNode || { ...a, el: refs.current[a.id].current ?? undefined }
            )
            grid.load(layout)
        }
    }, [items]);

    const handleEditMode = () => {
        setEditMode(prev => {
            const newMode = !prev
            if (gridRef.current) {
                gridRef.current.setStatic(!newMode)
            }
            return newMode
        })
    }

    return (
        <div style={{ width: '100%', marginRight: '10px' }}>
            <ToggleSwitch
                checked={editMode}
                id='edit_mode'
                label='Modo Edición'
                onChange={() => {
                    return handleEditMode()
                }}
                successColor='green'
            />
            <div className='grid-stack' ref={gridContainerRef}>
                {items.map((item, i) => {
                    const attrs: React.HTMLAttributes<HTMLDivElement> & {
                        ref: React.RefObject<HTMLDivElement>
                        'gs-id': string
                        'gs-w': number
                        'gs-h': number
                        'gs-x': number
                        'gs-y': number
                        'gs-no-move'?: string
                        'gs-locked'?: string
                        'gs-no-resize'?: string
                    } = {
                        ref: refs.current[item.id],
                        className: 'grid-stack-item',
                        'gs-id': item.id,
                        'gs-w': item.w,
                        'gs-h': item.h,
                        'gs-x': item.x,
                        'gs-y': item.y
                    };

                    if (item.noMove) {
                        attrs['gs-no-move'] = 'true';
                        attrs['gs-locked'] = 'true';
                        attrs['gs-no-resize'] = 'true';
                    }


                    return (
                        <div
                            {...attrs}
                            key={item.id}
                        >
                            <Column style={{
                                position: 'absolute',
                                top: -15,
                                left: 10,
                                width: '100%'
                            }}>
                                <Text as='h2' size='2xl'>
                                    {item.title}
                                </Text>
                            </Column>
                            <div className='grid-stack-item-content'>
                                <Item {...item} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const GridStackWrapper = () => {
    const { components: items } = useComponents();
    return (
        <div>
            <div>
                <div style={{ display: 'flex' }}>
                    <ControlledStack items={items} />
                </div>
            </div>
        </div>
    );
};
