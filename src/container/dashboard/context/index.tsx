import { createContext, useState, useContext, useMemo } from 'react';
import type { ComponentInfo } from '../helpers';
import { useDashboardComponents } from 'npm-pkg-hook';
import { COMPONENT_MAP } from '../helpers/GridStackWrapper';
import { Coordinates, DashboardComponent } from './types';

const DEFAULT = {
  components: [],
  loading: false,
  setComponents: () => {},
  handleAddComponent: () => {},
} as {
  components: ComponentInfo[];
  setComponents: React.Dispatch<React.SetStateAction<ComponentInfo[]>>;
  handleAddComponent: () => void;
  loading: boolean;
};

const ComponentsContext = createContext(DEFAULT);

export const useComponents = () => useContext(ComponentsContext);

export const ComponentsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, loading } = useDashboardComponents({
    callback: (data: DashboardComponent[]) => {
      const components = data.map((component) => ({
        id: component.id,
        x: component.coordinates?.x ?? 0,
        y: component.coordinates?.y ?? 0,
        w: component.coordinates?.w ?? 3,
        h: component.coordinates?.h ?? 4,
      }));
      setComponents(components);
    },
  });

  const DEFAULT_COMPONENTS: ComponentInfo[] = data.map(
    (component: { id: keyof typeof COMPONENT_MAP; coordinates?: Coordinates }) => ({
      id: component.id.toString(),
      x: component.coordinates?.x ?? 0,
      y: component.coordinates?.y ?? 0,
      w: component.coordinates?.w ?? 3,
      h: component.coordinates?.h ?? 4,
    })
  );

  const [components, setComponents] = useState<ComponentInfo[]>(DEFAULT_COMPONENTS);

  /**
   * Add a new component dynamically
   */
  const handleAddComponent = () => {
    const newComponent: ComponentInfo = {
      id: Math.random().toString(36).substring(2, 15),
      x: 0,
      y: Infinity, // 👈 con Infinity RGL lo coloca en la última fila disponible
      w: 3,
      h: 4,
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  const memoizedValue = useMemo(
    () => ({
      components,
      loading,
      setComponents,
      handleAddComponent,
    }),
    [components, loading]
  );

  return (
    <ComponentsContext.Provider value={memoizedValue}>
      {children}
    </ComponentsContext.Provider>
  );
};
