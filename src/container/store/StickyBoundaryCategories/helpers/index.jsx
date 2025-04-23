import { useEffect, useState, useRef } from 'react'

export function useSticky({ elementRef, data }) {
  const [isSticky, setIsSticky] = useState(false)
  const observerRef = useRef(null)

  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current

      // Crear un elemento sentinel que se colocará justo antes del elemento objetivo
      const sentinel = document.createElement('div')
      element.parentElement.insertBefore(sentinel, element)

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          // Cuando el sentinel ya no está en la vista, el elemento está en posición sticky
          setIsSticky(!entry.isIntersecting)
        },
        { threshold: [0] } // Configura el umbral para que el cambio ocurra justo cuando el sentinel comienza a salir de la vista
      )

      observerRef.current.observe(sentinel)

      return () => {
        // Limpiar el observer y eliminar el sentinel al desmontar
        observerRef.current.disconnect()
        sentinel.remove()
      }
    }
  }, [elementRef, data])

  return isSticky
}
