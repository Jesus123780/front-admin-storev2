import { createContext, useState, useContext } from 'react';
import type { ComponentInfo } from '../helpers';

import { useDashboardComponents } from 'npm-pkg-hook';
import { COMPONENT_MAP } from '../helpers/GridStackWrapper';
import { Coordinates, DashboardComponent } from './types';


const DEFAULT = {
  components: [],
  setComponents: () => {},
} as {
  components: ComponentInfo[];
  setComponents: React.Dispatch<React.SetStateAction<ComponentInfo[]>>;
};

const ComponentsContext = createContext(DEFAULT);

export const useComponents = () => useContext(ComponentsContext);

export const ComponentsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  
  const { data } = useDashboardComponents({
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
  
  return (
    <ComponentsContext.Provider
      value={{
        components: components,
        setComponents
      }}
    >
      {children}
    </ComponentsContext.Provider>
  );
};
