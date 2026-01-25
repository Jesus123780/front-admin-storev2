import {
 useEffect, 
 useRef,
 useState 
} from 'react'

interface StickyProps {
  elementRef: React.RefObject<HTMLElement>
  data: {
    id: string | number
  }[]
}

export function useSticky({ elementRef, data }: StickyProps): boolean {
  const [isSticky, setIsSticky] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current

      // Crear un elemento sentinel que se colocará justo antes del elemento objetivo
      const sentinel = document.createElement('div')
      if (element.parentElement) {
        element.parentElement.insertBefore(sentinel, element)
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          // Cuando el sentinel ya no está en la vista, el elemento está en posición sticky
          setIsSticky(!entry.isIntersecting)
        },
        { threshold: [0] } // Configura el umbral para que el cambio ocurra justo cuando el sentinel comienza a salir de la vista
      )

      if (observerRef.current) {
        observerRef.current.observe(sentinel)
      }

      return () => {
        // Limpiar el observer y eliminar el sentinel al desmontar
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
        sentinel.remove()
      }
    }
  }, [elementRef, data])

  return isSticky
}
