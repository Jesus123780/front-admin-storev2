import { useDashboardComponents } from 'npm-pkg-hook';
import { placeNewComponent } from 'pkg-components';
import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Context } from '@/context/Context';

import { COMPONENT_MAP } from '../helpers/GridStackWrapper';
import { DashboardComponent } from './types';

interface ComponentOptions {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  title?: string;
  moved?: boolean;
  static?: boolean;
}

interface GridCoordinates {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridComponent {
  id: string;
  key?: string;
  componentKey?: string;
  title: string;
  moved: boolean;
  static: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  component?: Record<string, unknown>;
}

type ComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

type ComponentsContextValue = {
  components: GridComponent[];
  loading: boolean;
  setComponents: React.Dispatch<React.SetStateAction<GridComponent[]>>;
  handleAddComponent: (
    componentKey?: string,
    opts?: Partial<ComponentOptions>
  ) => { success: boolean; reason?: string; added?: GridComponent };
  registerComponent: (
    key: string,
    component: ComponentType<Record<string, unknown>>,
    opts?: Partial<ComponentOptions>
  ) => { success: boolean; reason?: string; added?: GridComponent };
  unregisterComponent: (key: string) => { success: boolean; reason?: string };
  removeComponentInstance: (instanceId: string) => { success: boolean; reason?: string };
  componentMap: ComponentMap;
  isBuiltInComponent: (key: string) => boolean;
};

const DEFAULT: ComponentsContextValue = {
  components: [],
  loading: false,
  setComponents: () => {},
  handleAddComponent: () => ({ success: false, reason: 'not initialized' }),
  registerComponent: () => ({ success: false, reason: 'not initialized' }),
  unregisterComponent: () => ({ success: false, reason: 'not initialized' }),
  removeComponentInstance: () => ({ success: false, reason: 'not initialized' }),
  componentMap: {},
  isBuiltInComponent: () => false,
};

const ComponentsContext = createContext<ComponentsContextValue>(DEFAULT);

export const useComponents = () => useContext(ComponentsContext);

const DEFAULT_COLS = 12;
const DEFAULT_NODE_WIDTH = 3;
const DEFAULT_NODE_HEIGHT = 4;
const PLACE_OPTIONS = {
  maxDepth: 20,
  maxRows: 200,
} as const;

const makeId = () =>
  `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const toFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const buildComponentPayload = (
  componentKey: string | undefined,
  coords: GridCoordinates,
  instanceId?: string
): Record<string, unknown> => {
  return {
    componentKey,
    instanceId,
    coordinates: coords,
    ...(componentKey ? { [componentKey]: coords } : {}),
  };
};

const buildLayoutSnapshot = (components: GridComponent[]) =>
  components.map((c) => ({
    i: c.id,
    x: toFiniteNumber(c.x, 0),
    y: toFiniteNumber(c.y, 0),
    w: c.w,
    h: c.h,
    static: c.static,
  }));

const buildGridComponentFromPlacement = ({
  id,
  key,
  title,
  moved,
  staticValue,
  placedNode,
  fallbackW,
  fallbackH,
}: {
  id: string;
  key?: string;
  title: string;
  moved: boolean;
  staticValue: boolean;
  placedNode?: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static?: boolean;
  };
  fallbackW: number;
  fallbackH: number;
}): GridComponent => {
  const coords: GridCoordinates = placedNode
    ? {
        x: placedNode.x,
        y: placedNode.y,
        w: placedNode.w,
        h: placedNode.h,
      }
    : {
        x: 0,
        y: Infinity,
        w: fallbackW,
        h: fallbackH,
      };

  return {
    id: placedNode?.i ?? id,
    key,
    componentKey: key,
    title,
    moved,
    static: placedNode?.static ?? staticValue,
    x: coords.x,
    y: coords.y,
    w: coords.w,
    h: coords.h,
    component: buildComponentPayload(key, coords, placedNode?.i ?? id),
  };
};

const mapDashboardComponent = (component: DashboardComponent): GridComponent => {
  const componentKey =
    (component.coordinates as Record<string, unknown>)?.componentKey as string | undefined
    ?? component.coordinates.title
    ?? undefined;

  const coords: GridCoordinates = {
    x: component.coordinates?.x ?? 0,
    y: component.coordinates?.y ?? 0,
    w: component.coordinates?.w ?? DEFAULT_NODE_WIDTH,
    h: component.coordinates?.h ?? DEFAULT_NODE_HEIGHT,
  };

  return {
    id: component.coordinates.id,
    key: componentKey,
    componentKey,
    title: component.coordinates.title ?? '',
    moved: component.coordinates.moved ?? false,
    static: component.coordinates.static ?? false,
    x: coords.x,
    y: coords.y,
    w: coords.w,
    h: coords.h,
    component: buildComponentPayload(componentKey, coords, component.coordinates.id),
  };
};

export const ComponentsContextProvider: React.FC<{
  children: ReactNode;
  initialMap?: ComponentMap;
  initialComponents?: GridComponent[];
}> = ({
  children,
  initialMap = COMPONENT_MAP,
  initialComponents = [],
}) => {
  const { sendNotification } = useContext(Context);

  const [componentMap, setComponentMap] = useState<ComponentMap>(initialMap);
  const [components, setComponents] = useState<GridComponent[]>(initialComponents);

  const builtInKeys = useMemo(() => new Set(Object.keys(initialMap)), [initialMap]);

  const isBuiltInComponent = useCallback(
    (key: string) => builtInKeys.has(key),
    [builtInKeys]
  );

  const { data, loading } = useDashboardComponents({
    callback: (apiData: DashboardComponent[]) => {
      const mappedComponents = apiData.map(mapDashboardComponent);
      setComponents(mappedComponents);
    },
  });

  useEffect(() => {
    if (!Array.isArray(data)) {return;}
    const mappedComponents = data.map(mapDashboardComponent);
    setComponents(mappedComponents);
  }, [data]);

  /**
   * Importantísimo para tu GridStack actual:
   * la grilla renderiza con componentMap[node.i], así que cada instancia
   * debe tener su propio alias dentro del mapa usando el id del item.
   */
  useEffect(() => {
    setComponentMap((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const item of components) {
        const baseKey = item.componentKey ?? item.key ?? item.title ?? undefined;
        if (!baseKey) {continue;}

        const baseComponent = prev[baseKey];
        if (baseComponent && !next[item.id]) {
          next[item.id] = baseComponent;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [components]);

  const handleAddComponent = useCallback(
    (
      componentKey?: string,
      opts?: Partial<ComponentOptions>
    ): { success: boolean; reason?: string; added?: GridComponent } => {
      if (componentKey && !componentMap[componentKey]) {
        return {
          success: false,
          reason: `componentKey "${componentKey}" is not registered`,
        };
      }

      const id = makeId();
      const title = opts?.title ?? componentKey ?? 'New component';

      const nodeHint = {
        i: id,
        x: opts?.x ?? 0,
        y: typeof opts?.y === 'number' ? opts.y : 0,
        w: opts?.w ?? DEFAULT_NODE_WIDTH,
        h: opts?.h ?? DEFAULT_NODE_HEIGHT,
        static: opts?.static ?? false,
      };

      try {
        const baseLayout = buildLayoutSnapshot(components);
        const { success, placedNode } = placeNewComponent.placeNewComponent(
          baseLayout,
          nodeHint,
          DEFAULT_COLS,
          PLACE_OPTIONS
        );

        const added = buildGridComponentFromPlacement({
          id,
          key: componentKey,
          title,
          moved: opts?.moved ?? false,
          staticValue: opts?.static ?? false,
          placedNode: success ? placedNode : undefined,
          fallbackW: nodeHint.w,
          fallbackH: nodeHint.h,
        });

        const componentToAlias = componentKey ? componentMap[componentKey] : undefined;

        setComponentMap((prev) => ({
          ...prev,
          ...(componentKey && componentToAlias ? { [id]: componentToAlias } : {}),
        }));

        setComponents((prev) => [...prev, added]);

        return { success: true, added };
      } catch (err) {
        return {
          success: false,
          reason: `unexpected error: ${
            err instanceof Error ? err.message : String(err)
          }`,
        };
      }
    },
    [componentMap, components]
  );

  const registerComponent = useCallback(
    (
      key: string,
      component: ComponentType<Record<string, unknown>>,
      opts?: Partial<ComponentOptions>
    ): { success: boolean; reason?: string; added?: GridComponent } => {
      if (!key || typeof key !== 'string') {
        return { success: false, reason: 'invalid key' };
      }

      if (!component) {
        return { success: false, reason: 'invalid component' };
      }

      if (componentMap[key]) {
        return { success: false, reason: 'key already registered' };
      }

      const id = makeId();
      const title = opts?.title ?? key;

      const nodeHint = {
        i: id,
        x: opts?.x ?? 0,
        y: typeof opts?.y === 'number' ? opts.y : 0,
        w: opts?.w ?? DEFAULT_NODE_WIDTH,
        h: opts?.h ?? DEFAULT_NODE_HEIGHT,
        static: opts?.static ?? false,
      };

      try {
        const baseLayout = buildLayoutSnapshot(components);
        const { success, placedNode } = placeNewComponent.placeNewComponent(
          baseLayout,
          nodeHint,
          DEFAULT_COLS,
          PLACE_OPTIONS
        );

        const added = buildGridComponentFromPlacement({
          id,
          key,
          title,
          moved: opts?.moved ?? false,
          staticValue: opts?.static ?? false,
          placedNode: success ? placedNode : undefined,
          fallbackW: nodeHint.w,
          fallbackH: nodeHint.h,
        });

        setComponentMap((prev) => ({
          ...prev,
          [key]: component,
          [id]: component,
        }));

        setComponents((prev) => [...prev, added]);

        return { success: true, added };
      } catch (err) {
        return {
          success: false,
          reason: `unexpected error: ${
            err instanceof Error ? err.message : String(err)
          }`,
        };
      }
    },
    [componentMap, components]
  );

  const unregisterComponent = useCallback(
    (key: string) => {
      if (!componentMap[key]) {
        return { success: false, reason: 'key not found' };
      }

      setComponentMap((prev: ComponentMap) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      return { success: true };
    },
    [componentMap]
  );

  const removeComponentInstance = useCallback(
    (instanceId: string) => {
      const exists = components.some((item) => item.id === instanceId);
      if (!exists) {
        return { success: false, reason: 'instance not found' };
      }

      setComponents((prev) => prev.filter((item) => item.id !== instanceId));

      setComponentMap((prev) => {
        const next = { ...prev };
        delete next[instanceId];
        return next;
      });

      return { success: true };
    },
    [components]
  );

  const memoValue = useMemo(
    () => ({
      components,
      loading,
      setComponents,
      handleAddComponent,
      registerComponent,
      unregisterComponent,
      removeComponentInstance,
      componentMap,
      isBuiltInComponent,
    }),
    [
      components,
      loading,
      handleAddComponent,
      registerComponent,
      unregisterComponent,
      removeComponentInstance,
      componentMap,
      isBuiltInComponent,
    ]
  );

  return (
    <ComponentsContext.Provider value={memoValue}>
      {children}
    </ComponentsContext.Provider>
  );
};