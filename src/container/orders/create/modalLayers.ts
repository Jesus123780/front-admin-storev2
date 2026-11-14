'use client'
import { useEffect, useState } from 'react'
/** LIFO layers, intentionally independent of the financial flow. */
const BASE_LAYER=1000000000
const LAYER_STEP=10
let openStack:symbol[]=[]
const listeners=new Set<()=>void>()
const notify=()=>{listeners.forEach(listener=>listener())}
const pushLayer=(token:symbol)=>{if(!openStack.includes(token)){openStack.push(token);notify()}}
const removeLayer=(token:symbol)=>{const next=openStack.filter(item=>item!==token);if(next.length!==openStack.length){openStack=next;notify()}}
const layerOf=(token:symbol):number|undefined=>{const index=openStack.indexOf(token);return index===-1?undefined:BASE_LAYER+index*LAYER_STEP}
export const useModalLayer=(isOpen:boolean):number|undefined=>{
  const [token]=useState(()=>Symbol('modal-layer'))
  const [,forceRender]=useState(0)
  useEffect(()=>{const listener=()=>{forceRender(tick=>tick+1)};listeners.add(listener);return()=>{listeners.delete(listener)}},[])
  useEffect(()=>{if(isOpen){pushLayer(token);}else {removeLayer(token);}return()=>{removeLayer(token)}},[isOpen,token])
  return layerOf(token)
}
