/** Wait for fonts + decoded images, with timeout and unmount cleanup. No fixed delay on success. */
export async function prepareReceiptForPrint(root:HTMLElement,signal:AbortSignal,deadlineMs=8000):Promise<'ready'|'incomplete'|'aborted'>{
  if(signal.aborted)return 'aborted'
  const cleanup=new Set<()=>void>();let timeout:ReturnType<typeof setTimeout>|undefined;let abort:()=>void=()=>{}
  const imageReady=(img:HTMLImageElement)=>{
    if(typeof img.decode==='function')return Promise.resolve().then(()=>img.decode())
    if(img.complete)return img.naturalWidth?Promise.resolve():Promise.reject(new Error('Image unavailable'))
    return new Promise<void>((resolve,reject)=>{
      const dispose=()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',failed);cleanup.delete(cancel)}
      const loaded=()=>{dispose();resolve()};const failed=()=>{dispose();reject(new Error('Image unavailable'))};const cancel=()=>{dispose();resolve()}
      cleanup.add(cancel);img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});if(img.complete){if(img.naturalWidth)loaded();else failed()}
    })
  }
  try{
    const resources=Promise.allSettled([root.ownerDocument.fonts?.ready??Promise.resolve(),...Array.from(root.querySelectorAll('img')).map(imageReady)]).then(results=>results.some(x=>x.status==='rejected')?'incomplete' as const:'ready' as const)
    return await Promise.race([resources,new Promise<'incomplete'>(resolve=>{timeout=setTimeout(()=>resolve('incomplete'),Math.max(0,deadlineMs))}),new Promise<'aborted'>(resolve=>{abort=()=>resolve('aborted');signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort()})])
  }finally{if(timeout!==undefined)clearTimeout(timeout);signal.removeEventListener('abort',abort);cleanup.forEach(cancel=>cancel())}
}
