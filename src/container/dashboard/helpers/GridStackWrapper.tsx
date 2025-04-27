import React, { useLayoutEffect, createRef, useRef } from 'react'
import { GridStack } from 'pkg-components'
import { useComponents } from '../context'
import { DishStore } from '@/container/main/components/main.dishStore'
import { SalesDay } from '@/container/main/components/main.salesDay'
import { Goal } from '@/container/main/components/main.goal'
import { QrCode } from '@/container/main/components/main.qr'

export const COMPONENT_MAP = {
    1: DishStore,
    2: Goal,
    3: QrCode,
    4: SalesDay
};

const Item = ({ id, component }: { id: string; component: React.ReactNode }) => {
    const view = COMPONENT_MAP[Number(id) as keyof typeof COMPONENT_MAP];
    const componentProps = typeof component === 'object' && !Array.isArray(component) && component !== null
      ? { ...component }
      : {};

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {view ? React.createElement(view, componentProps) : null}
        </div>
    );
};

interface ControlledStackProps {
    items: any[];
}

const ControlledStack = ({ items }: ControlledStackProps) => {
    const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});
    const gridRef = useRef<GridStack | undefined>();
    const gridContainerRef = useRef(null);
    refs.current = {};

    if (Object.keys(refs.current).length !== items.length) {
        items.forEach(({ id }) => {
            refs.current[id] = refs.current[id] || createRef();
        });
    }

    // Breakpoints para diseño responsivo
    const BREAKPOINTS = [
        { c: 1, w: 700 },
        { c: 2, w: 850 },
        { c: 4, w: 950 },
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
          ));
      } else {
          const grid = gridRef.current
          const layout = items.map((a) =>
              refs.current[a.id].current?.gridstackNode || { ...a, el: refs.current[a.id].current ?? undefined }
          );
          grid._ignoreCB = true;
          grid.load(layout);
          delete grid._ignoreCB;
      }
  }, [items]);

    return (
        <div style={{ width: '100%', marginRight: '10px' }}>
            <div className='grid-stack' ref={gridContainerRef}>
                {items.map((item, i) => {
                    const attrs: any = {
                        ref: refs.current[item.id],
                        key: item.id,
                        className: 'grid-stack-item',
                        'gs-id': item.id,
                        'gs-w': item.w,
                        'gs-h': item.h,
                        'gs-x': item.x,
                        'gs-y': item.y,
                    };

                    if (item.noMove) {
                        attrs['gs-no-move'] = 'true';
                        attrs['gs-locked'] = 'true'; // Evita que lo muevan otros
                        attrs['gs-no-resize'] = 'true'; // Opcional
                    }

                    return (
                        <div
                            {...attrs}
                            key={item.id}
                            className={`grid-stack-item ${item.className ?? ''}`}
                        >
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
            <div style={{ display: 'flex', backgroundColor: 'lightgrey', padding: '10px' }}>
                <div style={{ display: 'flex' }}>
                    <ControlledStack items={items} />
                </div>
            </div>
        </div>
    );
};
