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

  const handlePrint = () => {
    console.log("Print function called");
  }

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
