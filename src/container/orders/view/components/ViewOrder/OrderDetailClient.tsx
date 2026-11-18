'use client'
import { useGetSale,usePrintSaleTicket } from 'npm-pkg-hook'
import { Icon,RippleButton } from 'pkg-components'
import {
useCallback,useContext,useEffect,useRef,useState
} from 'react'

import OrderDetail from '@/container/orders/view/components/ViewOrder'
import { Context } from '@/context/Context'

import type { Order } from '../types/order'
import styles from './order-detail-client.module.css'
type Props={orderId:string}
export interface SaleResponse {getOneSalesStore:{success?:boolean;data:Order|null;message?:string;errors?:Array<{message?:string}>|null}}
type RequestState={status:'loading'}|{status:'success';order:Order}|{status:'error';message:string}
function OrderErrorState({ message,onRetry }:{message:string;onRetry?:()=>void}){return <section className={styles.errorContainer}><div className={styles.errorContent}><div className={styles.errorIcon} aria-hidden='true'><Icon icon='IconWarning' size={34} color='var(--color-icons-gray)'/></div><div role='alert'><h2>No pudimos cargar la orden</h2><p>{message}</p></div>{onRetry&&<RippleButton type='button' radius='12px' padding='14px 24px' onClick={onRetry}><span className={styles.retry}><Icon icon='IconReload' size={18} color='#fff'/>Reintentar consulta</span></RippleButton>}</div></section>}
function OrderDetailContent({ orderId }:Props){
 const { sendNotification }=useContext(Context),{ getOneSalesStore,loading }=useGetSale(),[handlePrintSale]=usePrintSaleTicket()
 const [attempt,setAttempt]=useState(0),[request,setRequest]=useState<RequestState>({ status:'loading' })
 const fetchRef=useRef(getOneSalesStore)
 useEffect(()=>{fetchRef.current=getOneSalesStore},[getOneSalesStore])
 useEffect(()=>{let current=true;setRequest({ status:'loading' });void(async()=>{try{const response=await fetchRef.current({ variables:{ pCodeRef:orderId },fetchPolicy:'no-cache' });if(!current){return;}if(response.error){throw response.error;}const result=(response.data as SaleResponse|undefined)?.getOneSalesStore;if(result?.success===false||result?.errors?.length){setRequest({ status:'error',message:'No fue posible consultar esta orden.' });return}if(!result?.data){setRequest({ status:'error',message:'No encontramos información para esta orden.' });return}setRequest({ status:'success',order:result.data })}catch{if(current){setRequest({ status:'error',message:'Ocurrió un inconveniente al consultar la información. Intenta nuevamente.' })}}})();return()=>{current=false}},[orderId,attempt])
 const handleRetry=useCallback(()=>{setRequest({ status:'loading' });setAttempt(previous=>previous+1)},[])
 const orderCode=request.status==='success'?request.order.pCodeRef?.trim():undefined
 const handleClickPrint=useCallback(async()=>{if(!orderCode){throw new Error('La orden no tiene un código válido.');}if(typeof handlePrintSale!=='function'){throw new Error('El servicio de impresión no está disponible.');}const response=await handlePrintSale(orderCode).catch(()=>undefined);if(!response?.success){const description=response?.message||'No fue posible enviar el comprobante a la impresora.';sendNotification({ title:'Error al imprimir',description,backgroundColor:'error' });throw new Error(description)}sendNotification({ title:'Impresión enviada',description:response.message||'El comprobante fue enviado correctamente.',backgroundColor:'success' })},[orderCode,handlePrintSale,sendNotification])
 if(request.status==='loading'){return <OrderDetail order={null} loading/>}
 if(request.status==='error'){return <OrderErrorState message={request.message} onRetry={handleRetry}/>}
 return <OrderDetail order={request.order} loading={loading} modalView={false} handlePrint={handleClickPrint}/>
}
export default function OrderDetailClient({ orderId }:Props){const normalized=orderId?.trim();return normalized?<OrderDetailContent key={normalized} orderId={normalized}/>:<OrderErrorState message='El identificador de la orden no es válido.'/>}
