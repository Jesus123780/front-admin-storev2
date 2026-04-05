'use client';

import { useUpdateDashboardComponent } from 'npm-pkg-hook';
import {
    Divider,
    getGlobalStyle,
    Row,
    Text,
    ToggleSwitch,
} from 'pkg-components';
import GridStack from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/components/GridStack/GridStack';
import { GridItem } from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/types/types';
import {
    collisionModeType,
    dragModeType,
} from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/types/useGrid.types';
import React, {
    FunctionComponent,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { Categories } from '@/container/categories';
import { ChatStatistic } from '@/container/ChatStatistic';
import { Devices } from '@/container/Devices';
import { DishStore } from '@/container/main/components/main.dishStore';
import { Goal } from '@/container/main/components/main.goal';
import { QrCode } from '@/container/main/components/main.qr';
import { SalesDay } from '@/container/main/components/main.salesDay';
import { TeamStore } from '@/container/TeamStore';
import { Context } from '@/context/Context';

import { Loading } from '../components';
import { useComponents } from '../context';

interface GridStackLayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface UpdatePayloadItem {
    id: string;
    coordinates: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

type GridCoordinates = UpdatePayloadItem['coordinates'];

export const COMPONENT_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
    DishStore,
    Goal,
    QrCode,
    SalesDay,
    ChatStatistic,
    TeamStore,
    Devices,
    Categories,
};

interface ControlledGridProps {
    items: {
        id: string;
        key?: string;
        componentKey?: string;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        title?: string;
        static?: boolean;
        component?: Record<string, unknown>;
    }[];
    setComponents: React.Dispatch<React.SetStateAction<ControlledGridProps['items']>>;
    registerComponent: (
        key: string,
        component: React.ComponentType<Record<string, unknown>>
    ) => { success: boolean; reason?: string; added?: unknown };
    unregisterComponent: (key: string) => { success: boolean; reason?: string };
    removeComponentInstance: (instanceId: string) => { success: boolean; reason?: string };
    handleAddComponent: (
        componentKey?: string,
        opts?: {
            x?: number;
            y?: number;
            w?: number;
            h?: number;
            title?: string;
            moved?: boolean;
            static?: boolean;
        }
    ) => { success: boolean; reason?: string; added?: unknown };
    componentMap: Record<string, React.ComponentType<Record<string, unknown>>>;
}

const createComponentPayload = (
    key?: string,
    coords?: GridCoordinates,
    instanceId?: string
): Record<string, unknown> => {
    if (!key || !coords) {
        return {
            componentKey: key,
            instanceId,
            coordinates: coords,
        };
    }

    return {
        componentKey: key,
        instanceId,
        coordinates: coords,
        [key]: coords,
    };
};

const normalizeItem = (
    item: ControlledGridProps['items'][number]
): ControlledGridProps['items'][number] => {
    const fallbackCoords = {
        x: item.x ?? 0,
        y: item.y ?? 0,
        w: item.w ?? 3,
        h: item.h ?? 4,
    };

    const componentKey = item.componentKey ?? item.key ?? item.title ?? undefined;

    return {
        ...item,
        componentKey,
        component:
            item.component && Object.keys(item.component).length > 0
                ? item.component
                : createComponentPayload(componentKey, fallbackCoords, item.id),
    };
};

const ControlledGrid: FunctionComponent<ControlledGridProps> = ({
    items,
    setComponents,
    registerComponent,
    unregisterComponent,
    removeComponentInstance,
    handleAddComponent,
    componentMap,
}) => {
    const [skipUpdate, setSkipUpdate] = useState(false);
    const { updateComponent } = useUpdateDashboardComponent();
    const { sendNotification } = useContext(Context);
    const [editMode, setEditMode] = useState(false);

    const [localLayout, setLocalLayout] = useState(
        items.map((item) => {
            const normalized = normalizeItem(item);

            return {
                id: normalized.id,
                key: normalized.key,
                componentKey: normalized.componentKey,
                x: normalized.x ?? 0,
                y: normalized.y ?? 0,
                w: normalized.w ?? 3,
                h: normalized.h ?? 4,
                title: normalized.title ?? '',
                static: !!normalized.static,
                component: normalized.component ?? {},
            };
        })
    );

    useEffect(() => {
        setLocalLayout(
            items.map((item) => {
                const normalized = normalizeItem(item);

                return {
                    id: normalized.id,
                    key: normalized.key,
                    componentKey: normalized.componentKey,
                    x: normalized.x ?? 0,
                    y: normalized.y ?? 0,
                    w: normalized.w ?? 3,
                    h: normalized.h ?? 4,
                    title: normalized.title ?? '',
                    static: !!normalized.static,
                    component: normalized.component ?? {},
                };
            })
        );
    }, [items]);

    const handleLayoutChange = (newLayout: GridStackLayoutItem[]): void => {
        if (!editMode || skipUpdate) {
            const mapped = localLayout.map((item) => {
                const found = newLayout.find((l) => l.i === item.id);
                if (!found) { return item; }

                const coords = {
                    x: found.x,
                    y: found.y,
                    w: found.w,
                    h: found.h,
                };

                const componentKey = item.componentKey ?? item.key ?? item.title ?? undefined;

                return {
                    ...item,
                    x: found.x,
                    y: found.y,
                    w: found.w,
                    h: found.h,
                    component: createComponentPayload(componentKey, coords, item.id),
                };
            });

            setLocalLayout(mapped);
            return;
        }

        setComponents((prev) =>
            prev.map((comp) => {
                const found = newLayout.find((l) => l.i === comp.id);
                if (!found) { return comp; }

                const coords = {
                    x: found.x,
                    y: found.y,
                    w: found.w,
                    h: found.h,
                };

                const componentKey = comp.componentKey ?? comp.key ?? comp.title ?? undefined;

                return {
                    ...comp,
                    x: found.x,
                    y: found.y,
                    w: found.w,
                    h: found.h,
                    component: createComponentPayload(componentKey, coords, comp.id),
                };
            })
        );

        const hasChanged = newLayout.some((node) => {
            const prevComp = items.find((c) => c.id === node.i);
            return (
                prevComp &&
                (
                    prevComp.x !== node.x ||
                    prevComp.y !== node.y ||
                    prevComp.w !== node.w ||
                    prevComp.h !== node.h
                )
            );
        });

        if (hasChanged) {
            const payload: UpdatePayloadItem[] = newLayout.map((node) => ({
                id: node.i,
                coordinates: { x: node.x, y: node.y, w: node.w, h: node.h },
            }));

            updateComponent(payload);
        }
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

    const handleBreakpointChange = () => {
        setSkipUpdate(true);
        setTimeout(() => setSkipUpdate(false), 0);
    };

    const handleRegisterComponent = (
        key: string,
        component: React.ComponentType<Record<string, unknown>>
    ) => {
        const alreadyRegistered = !!componentMap[key];

        const result = alreadyRegistered
            ? handleAddComponent(key, { title: key })
            : registerComponent(key, component);

        if (!result.success) {
            sendNotification({
                title: 'Error registering component',
                description: result.reason || 'An unknown error occurred while registering the component',
                backgroundColor: 'danger',
            });
            return;
        }

        sendNotification({
            title: 'Component added',
            description: `${key} was added to the dashboard`,
            backgroundColor: 'success',
        });
    };

    const removeComponent = (key: string) => {
        const target = [...items].reverse().find(
            (comp) => comp.id === key || comp.key === key || comp.componentKey === key
        );

        if (!target) {
            sendNotification({
                title: 'Component not found',
                description: `No component instance found for "${key}"`,
                backgroundColor: 'danger',
            });
            return;
        }

        setComponents((prev) => prev.filter((comp) => comp.id !== target.id));
        removeComponentInstance(target.id);

        if (!COMPONENT_MAP[key]) {
            unregisterComponent(key);
        }
    };

    const gridItems = useMemo(
        () =>
            localLayout.map((item) => {
                const normalized = normalizeItem(item);

                return {
                    ...normalized,
                    component:
                        normalized.component && Object.keys(normalized.component).length > 0
                            ? normalized.component
                            : createComponentPayload(
                                normalized.componentKey ?? normalized.key ?? normalized.title ?? undefined,
                                {
                                    x: normalized.x ?? 0,
                                    y: normalized.y ?? 0,
                                    w: normalized.w ?? 3,
                                    h: normalized.h ?? 4,
                                },
                                normalized.id
                            ),
                };
            }),
        [localLayout]
    );

    if (items.length === 0) {
        return (
            <div style={{ width: '100%' }}>
                <Text as='h2' size='2xl' align='center'>
                    No components added yet
                </Text>
            </div>
        );
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
                    style={{ width: 'min-content' }}
                    size='small'
                />
            </Row>

            <button onClick={() => handleRegisterComponent('Categories', Categories)}>
                Agregar Categories
            </button>

            <button onClick={() => removeComponent('Categories')}>
                Remove Componente
            </button>

            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />

            <GridStack
                items={gridItems as GridItem[]}
                cols={15}
                radio={8}
                rowHeight={40}
                margin={[10, 10]}
                containerPadding={[0, 10]}
                componentMap={componentMap as GridItem['component']}
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
                    duration: 300,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                sticky={true}
                enableRollOnPush={true}
                rollAngleMax={10}
                rollDuration={180}
                rollStagger={12}
                showGrid={editMode}
            />

            <div style={{ display: 'none' }}>
                <button onClick={handleBreakpointChange}>simulateBreakpointChange</button>
            </div>
        </div>
    );
};

export const GridStackWrapper: FunctionComponent = () => {
    const {
        components: items,
        setComponents,
        registerComponent,
        unregisterComponent,
        removeComponentInstance,
        handleAddComponent,
        componentMap,
        loading,
    } = useComponents();

    const normalizedItems: ControlledGridProps['items'] = useMemo(
        () =>
            items.map((item, index) => {
                const safeId = item.id ?? `component-${index}`;
                return {
                    ...item,
                    id: safeId,
                    componentKey: item.componentKey ?? item.key ?? item.title ?? undefined,
                    component:
                        item.component && Object.keys(item.component).length > 0
                            ? item.component
                            : createComponentPayload(
                                item.componentKey ?? item.key ?? item.title ?? undefined,
                                {
                                    x: item.x ?? 0,
                                    y: item.y ?? 0,
                                    w: item.w ?? 3,
                                    h: item.h ?? 4,
                                },
                                safeId
                            ),
                };
            }),
        [items]
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <div
            style={{
                maxWidth: getGlobalStyle('--width-max-desktop'),
                margin: 'auto',
                display: 'flex',
            }}
        >
            <ControlledGrid
                items={normalizedItems}
                setComponents={setComponents as React.Dispatch<
                    React.SetStateAction<ControlledGridProps['items']>
                >}
                registerComponent={registerComponent}
                unregisterComponent={unregisterComponent}
                removeComponentInstance={removeComponentInstance}
                handleAddComponent={handleAddComponent as ControlledGridProps['handleAddComponent']}
                componentMap={componentMap}
            />
        </div>
    );
};