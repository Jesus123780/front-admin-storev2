'use client';

import React, { useState, useEffect, useContext, FunctionComponent } from 'react';
import { Column, Text, ToggleSwitch, Responsive, WidthProvider, Layout, Layouts } from 'pkg-components';
import { useUpdateDashboardComponent } from 'npm-pkg-hook';
import { useComponents } from '../context';
import { DishStore } from '@/container/main/components/main.dishStore';
import { SalesDay } from '@/container/main/components/main.salesDay';
import { Goal } from '@/container/main/components/main.goal';
import { QrCode } from '@/container/main/components/main.qr';
import { ChatStatistic } from '@/container/ChatStatistic';
import { TeamStore } from '@/container/TeamStore';
import { Devices } from '@/container/Devices';
import { Context } from '@/context/Context';
import { Loading } from '../components';
import styles from './styles.module.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
};

interface ItemProps {
    id: string;
    component?: Record<string, any>;
}

const Item: FunctionComponent<ItemProps> = ({ id, component }) => {
    const View = COMPONENT_MAP[id];
    if (!View) return null;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <View {...(component || {})} />
        </div>
    );
};

interface ControlledGridProps {
    items: any[];
    setComponents: React.Dispatch<React.SetStateAction<any[]>>;
}
const ControlledGrid: FunctionComponent<ControlledGridProps> = ({ setComponents }) => {
    // Default dashboard items configuration
    const defaultItems = [
        {
            'w': 3,
            'h': 2.6,
            'x': 0,
            'y': 0,
            'id': 'DishStore',
            'moved': false,
            'static': true,
            title: '',
        },
        {
            'w': 3,
            'h': 8,
            'x': 3,
            'y': 0,
            'id': 'Goal',
            'moved': false,
            'static': false,
            title: 'Meta del día',
        },
        {
            'w': 3,
            'h': 8,
            'x': 6,
            'y': 0,
            'id': 'QrCode',
            'moved': false,
            'static': false,
            title: 'Código QR',
        },
        {
            'w': 3,
            'h': 3,
            'x': 0,
            'y': 2.6,
            'id': 'SalesDay',
            'moved': false,
            'static': false,
            title: 'Ventas del día',
        },
        {
            'w': 3,
            'h': 5,
            'x': 9,
            'y': 0,
            'id': 'TeamStore',
            'moved': false,
            'static': false,
            title: 'Equipo del comercio',
        },
        {
            'w': 3,
            'h': 8,
            'x': 0,
            'y': 5.6,
            'id': 'Devices',
            'moved': false,
            'static': false,
            title: 'Dispositivos conectados',
        },
        {
            'w': 9,
            'h': 7,
            'x': 3,
            'y': 8,
            'id': 'ChatStatistic',
            'moved': false,
            'static': false,
            title: 'Estadísticas',
        }
    ]

    const items = defaultItems;
    const { updateComponent } = useUpdateDashboardComponent();
    const { sendNotification } = useContext(Context);
    const [editMode, setEditMode] = useState(false);
    const [layouts, setLayouts] = useState<Layouts>({ lg: [] });

    // Convertimos los items en layout para RGL
    useEffect(() => {
        const newLayout: Layout[] = items.map((item) => ({
            i: item.id, // ahora el id ya es el nombre del componente
            x: item.x ?? 0,
            y: item.y ?? 0,
            w: item.w ?? 3,
            h: item.h ?? 4,
            static: !!item.noMove,
        }));
        setLayouts({ lg: newLayout });
    }, []);

    /**
     * Handle changes in layout (drag / resize)
     */
    const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
        setLayouts(allLayouts);

        setComponents((prev) =>
            prev.map((comp) => {
                const newLayout = layout.find((l) => l.i === comp.id);
                return newLayout
                    ? { ...comp, x: newLayout.x, y: newLayout.y, w: newLayout.w, h: newLayout.h }
                    : comp;
            })
        );

        layout.forEach((node) => {
            updateComponent({
                id: node.i,
                coordinates: { x: node.x, y: node.y, w: node.w, h: node.h },
            });
        });
    };

    const handleEditMode = () => {
        setEditMode((prev) => {
            const newMode = !prev;
            if (!newMode) {
                sendNotification({
                    title: 'Changes saved',
                    description: 'Your dashboard changes were saved successfully',
                    backgroundColor: 'success',
                });
            }
            return newMode;
        });
    };
    console.log('Layouts:', layouts);
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
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                isDraggable={editMode}
                isResizable={editMode}
                onLayoutChange={handleLayoutChange}
            >
                {items.map((item) => {
                    return (<div key={item.id} className={styles.gridItems} style={{ background: '#fff' }}>
                        <Column className={styles['grid-stack-item-header']} style={{
                            position: 'absolute',
                            top: -20,
                            left: 10,
                            width: '100%',
                        }}>
                            <Text as='h2' size='2xl'>
                                {item.title}
                            </Text>
                        </Column>
                        <div className={styles['grid-stack-item-content']}>
                            <Item {...item} />
                        </div>
                    </div>);
                })}
            </ResponsiveGridLayout>
        </div>
    );
};

export const GridStackWrapper: FunctionComponent = () => {
    const { components: items, setComponents, loading } = useComponents();
    if (loading) return <Loading />;

    return (
        <div style={{ display: 'flex' }}>
            <ControlledGrid items={items} setComponents={setComponents} />
        </div>
    );
};
