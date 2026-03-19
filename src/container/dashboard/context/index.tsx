import { useDashboardComponents } from 'npm-pkg-hook';
import { placeNewComponent } from 'pkg-components';
import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
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

interface GridComponent {
  id: string;
  key?: string;
  title: string;
  moved: boolean;
  static: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

type ComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

type ComponentsContextValue = {
  components: GridComponent[];
  loading: boolean;
  setComponents: React.Dispatch<React.SetStateAction<GridComponent[]>>;
  handleAddComponent: (componentKey?: string, opts?: Partial<ComponentOptions>) => { success: boolean; reason?: string; added?: GridComponent };
  registerComponent: (key: string, component: ComponentType<Record<string, unknown>>) => { success: boolean; reason?: string };
  unregisterComponent: (key: string) => { success: boolean; reason?: string };
  componentMap: ComponentMap;
};

const DEFAULT: ComponentsContextValue = {
  components: [],
  loading: false,
  setComponents: () => { },
  handleAddComponent: () => ({ success: false, reason: 'not initialized' }),
  registerComponent: () => ({ success: false, reason: 'not initialized' }),
  unregisterComponent: () => ({ success: false, reason: 'not initialized' }),
  componentMap: {},
};

const ComponentsContext = createContext<ComponentsContextValue>(DEFAULT);

export const useComponents = () => useContext(ComponentsContext);

export const ComponentsContextProvider: React.FC<{ children: ReactNode; initialMap?: ComponentMap; initialComponents?: GridComponent[]; }> = ({
  children,
  initialMap = COMPONENT_MAP,
  initialComponents = [],
}) => {
    const { sendNotification } = useContext(Context)
  
  const { data, loading } = useDashboardComponents({
    callback: (data: DashboardComponent[]) => {
      const components = data.map((component) => ({
        id: component.coordinates.id,
        title: component.coordinates.title ?? '',
        moved: component.coordinates.moved ?? false,
        static: component.coordinates.static ?? false,
        x: component.coordinates?.x ?? 0,
        y: component.coordinates?.y ?? 0,
        w: component.coordinates?.w ?? 3,
        h: component.coordinates?.h ?? 4
      }));
      setComponents(components as GridComponent[]);
    },
  });

  const [componentMap, setComponentMap] = useState<ComponentMap>(initialMap);
  const [components, setComponents] = useState<GridComponent[]>(initialComponents || data);

  /**
   * Register a component and attempt to mount it in the first free grid slot.
   *
   * - Validates inputs.
   * - Registers component in componentMap.
   * - Tries to place it using placeNewComponent (BFS + fallback scan).
   * - If placement succeeds, uses placed coords; otherwise adds with y: Infinity as fallback.
   *
   * @param {string} key
   * @param {ComponentType<Record<string, unknown>>} component
   * @returns {{ success: boolean; reason?: string; added?: GridComponent }}
   */
  const registerComponent = useCallback((key: string, component: ComponentType<Record<string, unknown>>) => {
    if (!key || typeof key !== 'string') {
      return { success: false, reason: 'invalid key' };
    }
    if (!component) {
      return { success: false, reason: 'invalid component' };
    }
    if (componentMap[key]) {
      return { success: false, reason: 'key already registered' };
    }

    // generate id deterministically
    const id = `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Build layout snapshot from current components (non-mutating)
      const baseLayout = components.map((c) => ({
        i: c.id,
        x: Number.isFinite(c.x) ? c.x : 0,
        y: Number.isFinite(c.y) ? c.y : 0,
        w: c.w,
        h: c.h,
        static: c.static,
      }));

      // node initial hint (we try origin 0,0 — BFS will search from here)
      const nodeHint = { i: id, x: 0, y: 0, w: 3, h: 4, static: false };

      // try to place (cols default to 12, tune maxDepth/maxRows if needed)
      const { success, placedNode } = placeNewComponent.placeNewComponent(baseLayout, nodeHint, 12, { maxDepth: 20, maxRows: 200 });

      // build the GridComponent that we'll add to state
      const added: GridComponent = success && placedNode
        ? {
          id: placedNode.i,
          key,
          title: key,
          moved: false,
          static: placedNode.static ?? false,
          x: placedNode.x,
          y: placedNode.y,
          w: placedNode.w,
          h: placedNode.h,
        }
        : {
          id,
          key,
          title: key,
          moved: false,
          static: false,
          x: 0,
          y: Infinity, // fallback so grid logic can place later
          w: nodeHint.w,
          h: nodeHint.h,
        };

      // persist component map and list (avoid duplicates)
      setComponentMap((prev: ComponentMap) => ({ ...prev, [key]: component }));
      setComponents((prev: GridComponent[]) => {
        if (prev.some((c) => c.key === key)) {return prev;}
        return [...prev, added];
      });

      return { success: true, added };
    } catch (err) {
      return { success: false, reason: `unexpected error: ${err?.message ?? String(err)}` };
    }
  }, [componentMap, components, setComponentMap, setComponents]);


  const unregisterComponent = useCallback((key: string) => {
    if (!componentMap[key]) { return { success: false, reason: 'key not found' }; }
    setComponentMap((prev: ComponentMap) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return { success: true };
  }, [componentMap]);

  const handleAddComponent = useCallback((componentKey?: string, opts?: Partial<ComponentOptions>) => {
    if (componentKey && !componentMap[componentKey]) {
      return { success: false, reason: `componentKey "${componentKey}" is not registered` };
    }

    const id = `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const newComponent: GridComponent = {
      id,
      key: componentKey ?? undefined,
      x: opts?.x ?? 0,
      y: typeof opts?.y === 'number' ? opts.y : Infinity,
      w: opts?.w ?? 3,
      h: opts?.h ?? 4,
      title: opts?.title ?? (componentKey ? `${componentKey}` : 'New component'),
      moved: opts?.moved ?? false,
      static: opts?.static ?? false,
    };

    setComponents((prev: GridComponent[]) => [...prev, newComponent]);
    return { success: true, added: newComponent };
  }, [componentMap]);

  const memoValue = useMemo(
    () => ({
      components,
      loading,
      setComponents,
      handleAddComponent,
      registerComponent,
      unregisterComponent,
      componentMap,
    }),
    [components, loading, handleAddComponent, registerComponent, unregisterComponent, componentMap]
  );

  return (
    <ComponentsContext.Provider value={memoValue}>
      {children}
    </ComponentsContext.Provider>
  );
};
