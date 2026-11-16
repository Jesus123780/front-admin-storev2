import { minorText,toMinor } from './format'
import type { AuditRow } from './types'
export interface ExternalRow {reference:string;amount:string}
/** Deliberately restricted CSV contract: one captured gross payment per Venty reference.
 * No fees, chargebacks, partial/split payments or settlement batches inferred. */
export function parseExternalCsv(text:string):ExternalRow[]{
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());if(lines.shift()?.trim()!=='pCodeRef,amount'){throw new Error('Encabezado requerido: pCodeRef,amount')}
  if(lines.length>5000){throw new Error('Máximo 5.000 filas externas')}
  const seen=new Set<string>();return lines.map((line,i)=>{const fields=line.split(',');if(fields.length!==2){throw new Error(`Fila ${i+2}: se esperan dos columnas sin comillas`);}const [reference,amount]=fields.map(v=>v.trim());if(!/^[A-Za-z0-9_-]{1,100}$/.test(reference)||!/^\d{1,30}\.\d{2}$/.test(amount)){throw new Error(`Fila ${i+2}: referencia o importe inválido (ej. T-123,170700.85)`);}if(seen.has(reference)){throw new Error(`Fila ${i+2}: referencia duplicada`);}seen.add(reference);return { reference,amount }})
}
export function matchExternal(sales:readonly AuditRow[],external:readonly ExternalRow[]){
 const map=new Map<string,ExternalRow>();for(const x of external){if(map.has(x.reference)){throw new Error('Referencia externa duplicada');}map.set(x.reference,x)}
 const results=sales.map(row=>{const x=map.get(row.reference);map.delete(row.reference);const payable=row.recorded.payable;const delta=x&&payable!==null?minorText(toMinor(x.amount)-toMinor(payable)):null;return { reference:row.reference,recorded:payable,external:x?.amount??null,delta,status:!x?'MISSING_EXTERNAL':payable===null?'UNVERIFIABLE':delta==='0.00'?'MATCHED':'MISMATCH' }})
 for(const x of map.values()){results.push({ reference:x.reference,recorded:null,external:x.amount,delta:null,status:'MISSING_POS' })}
 return results
}
