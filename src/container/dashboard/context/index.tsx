import { createContext, useState, useContext, useMemo } from 'react';
import type { ComponentInfo } from '../helpers';

import { useDashboardComponents } from 'npm-pkg-hook';
import { COMPONENT_MAP } from '../helpers/GridStackWrapper';
import { Coordinates, DashboardComponent } from './types';


const DEFAULT = {
  components: [],
  loading: false,
  setComponents: () => { },
  handleAddComponent: () => { },
} as {
  components: ComponentInfo[]
  setComponents: React.Dispatch<React.SetStateAction<ComponentInfo[]>>
  handleAddComponent: () => void;
  loading: boolean
};

const ComponentsContext = createContext(DEFAULT);

export const useComponents = () => useContext(ComponentsContext);

export const ComponentsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const { data, loading } = useDashboardComponents({
    callback: (data: DashboardComponent[]) => {
      const components = data.map((component) => {
        return {
          id: component.id,
          ...(component.coordinates || {})
        };
      });
      setComponents(components)
    }
  })
  const DEFAULT_COMPONENTS = data.map((component: { id: keyof typeof COMPONENT_MAP; coordinates?: Coordinates }) => {

    return {
      id: component.id,
      ...(component.coordinates || {})
    };
  });
  const [components, setComponents] = useState<ComponentInfo[]>(DEFAULT_COMPONENTS)
  const handleAddComponent = () => {
    const newComponent = {
      id: Math.random().toString(36).substring(2, 15),
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
    setComponents((prev) => [...prev, newComponent]);
  }
  const memoizedValue = useMemo(() => ({
    components,
    loading,
    setComponents,
    handleAddComponent,
  }), [components, loading]);

  return (
    <ComponentsContext.Provider
      value={memoizedValue}
    >
      {children}
    </ComponentsContext.Provider>
  );
};
