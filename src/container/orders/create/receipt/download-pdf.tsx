'use client'

import {
 Document, Page, pdf,StyleSheet, Text, View 
} from '@react-pdf/renderer'
import React from 'react'

import type { InvoiceSnapshot } from '../sale-invoice-snapshot'
import {
 formatReceiptMoney, paymentRows, receiptRows 
} from './financial-receipt'
const styles=StyleSheet.create({ page:{ padding:36,fontFamily:'Helvetica',fontSize:10,color:'#242424',lineHeight:1.45 },header:{ paddingBottom:14,borderBottomWidth:1,borderBottomColor:'#dddddd' },brand:{ fontSize:22,fontWeight:700 },title:{ fontSize:13,fontWeight:700,marginTop:12,marginBottom:6 },muted:{ color:'#666666',fontSize:9 },line:{ borderBottomWidth:1,borderBottomColor:'#eeeeee',paddingVertical:7 },row:{ flexDirection:'row',justifyContent:'space-between',gap:12 },label:{ flexGrow:1,flexBasis:0 },value:{ width:120,textAlign:'right' },extra:{ paddingLeft:10,marginTop:4 },strong:{ fontWeight:700 },total:{ fontSize:13,fontWeight:700,backgroundColor:'#eeeeee',padding:8,marginTop:5 },footer:{ marginTop:20,color:'#666666',fontSize:9,textAlign:'center' } })
export async function downloadConfirmedReceipt(snapshot:InvoiceSnapshot):Promise<void>{
  const { view,store,client,date,reference }=snapshot
  if(view.financials.source!=='persisted'||!view.financials.netMatches){throw new Error('No hay comprobante conciliado')}
  const doc=<Document title={`Comprobante ${reference}`}><Page size='A4' style={styles.page}>
    <View style={styles.header}><Text style={styles.brand}>{store.name}</Text>{[store.nit&&`NIT: ${store.nit}`,store.address,store.phone&&`Tel: ${store.phone}`].filter(Boolean).map((t,i)=><Text key={i}>{t}</Text>)}<Text style={styles.title}>Comprobante de venta · {reference}</Text><Text>{date?.label??'Fecha no disponible'}</Text></View>
    {client&&<View><Text style={styles.title}>Cliente</Text>{[client.name,client.document,client.phone,client.address].filter(Boolean).map((t,i)=><Text key={i}>{t}</Text>)}</View>}
    <Text style={styles.title}>Detalle de productos</Text>
    {view.items.map(item=><View key={item.key} style={styles.line}><View style={styles.row}><Text style={[styles.label,styles.strong]}>{item.name}{item.free?' (Cortesia)':''}</Text><Text style={styles.value}>{formatReceiptMoney(item.total)}</Text></View><Text style={styles.muted}>{item.quantity} x {formatReceiptMoney(item.unitPrice)} / ud.</Text>{item.discountAmount!==null&&item.discountAmount>0&&<Text style={styles.muted}>Descuento producto: {formatReceiptMoney(item.discountAmount)}</Text>}{item.extras.map(e=><View key={e.key} style={[styles.row,styles.extra]}><Text style={styles.label}>{e.quantity} x {e.name}</Text><Text style={styles.value}>{formatReceiptMoney(e.total)}</Text></View>)}{item.optionals.map(g=><View key={g.key} style={styles.extra}><Text>{g.name}</Text>{g.options.map(s=><Text key={s.key} style={styles.muted}>- {s.name}</Text>)}</View>)}{item.comment&&<Text style={styles.muted}>Nota: {item.comment}</Text>}</View>)}
    <Text style={styles.title}>Resumen de compra</Text>{receiptRows(view.financials).map(r=><View key={r.label} style={r.label==='Total a cobrar en POS'?[styles.row,styles.total]:styles.row} wrap={false}><Text style={styles.label}>{r.label==='Total a cobrar en POS'?'Total registrado en POS':r.label}</Text><Text style={styles.value}>{r.effect==='SUBTRACT'?'- ':''}{r.value}</Text></View>)}
    <Text style={styles.title}>Pago</Text>{paymentRows(view.payment).map(r=><View key={r.label} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.value}>{r.value}</Text></View>)}
    {view.financials.warnings.map(w=><Text key={w} style={styles.muted}>{w}</Text>)}<Text style={styles.footer}>Gracias por su compra · Venty POS</Text>
  </Page></Document>
  const blob=await pdf(doc).toBlob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`VENTA_${reference.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`;document.body.appendChild(link);try{link.click()}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
}
