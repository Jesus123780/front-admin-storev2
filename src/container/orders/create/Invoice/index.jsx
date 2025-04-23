import { useReactToPrint } from 'npm-pkg-hook'
import {
  useEffect,
  useState,
  useRef
} from 'react'


export const Invoice = ({ children }) => {
  const componentRef = useRef()
  const [isPrinting, setIsPrinting] = useState(false)
  const promiseResolveRef = useRef(null)

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
    // Resolves the Promise, letting `react-to-print` know that the DOM updates are completed
      promiseResolveRef.current()
    }
  }, [isPrinting])

  const handlePrint = useReactToPrint({
    
    content: () => {return componentRef.current},
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        promiseResolveRef.current = resolve
        setIsPrinting(true)
      })
    },
    onAfterPrint: () => {
    // Reset the Promise resolve so we can print again
      promiseResolveRef.current = null
      setIsPrinting(false)
    }
  })

  return (
    <>
      {isPrinting && 'loading'}
      <div ref={componentRef}>
        {children}
      </div>
      <button onClick={handlePrint}>Print this out!</button>
    </>
  )
}
