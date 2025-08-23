// Tipos para las coordenadas del componente
export type Coordinates = {
    x: number;
    y: number;
    w: number;
    h?: number; // h puede ser opcional dependiendo de si es parte de las coordenadas
    static?: boolean;
    noResize?: boolean;
    moved?: boolean;
    name: string;
    id: string;
    title: string;
  }
  
  // Tipo para el componente individual
  export type DashboardComponent = {
    id: string;
    idStore: string;
    idUser: string | null;
    coordinates: Coordinates;
  }
  
  // Tipo para el componente que se va a renderizar (asociado al id)
  export type RenderableComponent = React.ElementType; // O el tipo del componente que estás pasando
  
  // Tipo para el objeto en DEFAULT_COMPONENTS
  export type DefaultComponent = DashboardComponent & {
    component: RenderableComponent | null; // El componente que se va a renderizar
  }
  