import { computeCartTotals, minor, moneyNumber, productMinor, type DeliveryFinancialTerms, type GlobalDiscount, type ReadonlyCartItem, type LineDetail, type SaleSettlement } from 'exact-cart-totals'

// Pure adapter, shared verbatim with the thermal printer. No React, DB or UI dependencies.
export type Amount = number | null
export interface ReceiptExtra { key:string; name:string; quantity:Amount; unitPrice:Amount; total:Amount; originalTotal:Amount; discountAmount:Amount; reportedDiscountAmount:Amount; inconsistentCourtesyPrice:boolean }
export interface ReceiptOption { key:string; name:string; options:{key:string;name:string}[] }
export interface ReceiptProduct { key:string; name:string; quantity:Amount; unitPrice:Amount; total:Amount; free:boolean; originalTotal:Amount; discountAmount:Amount; discountPercent:Amount; reportedDiscountAmount:Amount; sku:string; comment:string; extras:ReceiptExtra[]; optionals:ReceiptOption[] }
export interface ReceiptFinancials { total:Amount; productNet:Amount; extraNet:Amount; productGross:Amount; extraGross:Amount; appliedDiscount:Amount; courtesy:Amount; reportedDiscount:Amount; reportedDiscountLabel:string|null; netMatches:boolean; showBreakdown:boolean; warnings:string[]; merchandiseNet?:Amount; delivery?:Amount; tip?:Amount; settlement?:SaleSettlement|null; deliveryLabel?:string; source?:'preview'|'persisted' }
export interface ReceiptPayment { name:string; kind:'cash'|'non-cash'|'unknown'; change:Amount; reportedChange:Amount; warning:string|null; received?:Amount }
export type PreviewInput = { cart:readonly unknown[]; discountType?:unknown; discountPercent?:unknown; discountAmount?:unknown; quote?:DeliveryFinancialTerms|null; quoteReady:boolean; cash:unknown; paymentMethod:string; paymentKind?:ReceiptPayment['kind'] }
export interface ReceiptView {items:ReceiptProduct[]; financials:ReceiptFinancials;payment:ReceiptPayment; canConfirm:boolean}
export const rec=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
export const arr=(v:unknown):unknown[]=>Array.isArray(v)?v:[]
export const str=(v:unknown):string=>typeof v==='string'?v.trim():typeof v==='number'&&Number.isFinite(v)?String(v):''
const money=(v:unknown)=>moneyNumber(minor(v))
const eq=(a:unknown,b:unknown,label:string)=>{if(minor(a)!==minor(b))throw new Error(`Importe no conciliado: ${label}`)}
const add=(values:unknown[])=>moneyNumber(values.reduce<bigint>((s,v)=>s+minor(v),BigInt(0)))
const minus=(a:unknown,b:unknown)=>moneyNumber(minor(a)-minor(b))
const free=(v:unknown)=>v===true||v===1||v==='1'||v==='true'
const MODES:Record<string,string>={NONE:'Sin domicilio / retiro',MERCHANT:'Domicilio propio',MERCHANT_EXTERNAL:'Servicio propio tercerizado',THIRD_PARTY_COLLECTED:'Domicilio recaudado para tercero',THIRD_PARTY_DIRECT:'Pago directo al domiciliario',MERCHANT_SUBSIDIZED:'Domicilio gratuito',MERCHANT_SUBSIDIZED_EXTERNAL:'Domicilio externo subsidiado'}
export const modeLabel=(mode:unknown)=>MODES[str(mode)]??'Modalidad no verificable'
export function paymentKind(name:unknown):ReceiptPayment['kind']{const s=str(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return /^(efectivo|cash|pago en efectivo|dinero en efectivo)$/.test(s)?'cash':/^(visa|master ?card|tarjeta(?: de (?:debito|credito))?|debito|credito|transferencia|nequi|daviplata|pse|american express|amex)$/.test(s)?'non-cash':'unknown'}
export const formatReceiptMoney=(v:unknown)=>{try{return '$ '+new Intl.NumberFormat('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(money(v))}catch{return '—'}}
function selectedExtras(raw:unknown){return arr(raw).map(rec).filter(e=>{if(e.quantity==null||e.quantity===''||Number(e.quantity)===0)return false;if(!Number.isSafeInteger(Number(e.quantity))||Number(e.quantity)<1)throw new Error('Cantidad de complemento inválida');return true})}
function options(raw:unknown,persisted:boolean):ReceiptOption[]{return arr(raw).map(rec).flatMap((g,i)=>{const selected=arr(g.ExtProductFoodsSubOptionalAll).map(rec).filter(s=>persisted||s.check===true);return selected.length?[{key:`option-${i}`,name:str(g.OptionalProName)||'Opciones',options:selected.map((s,j)=>({key:`sub-${j}`,name:str(s.OptionalSubProName)||'Opción'}))}]:[]})}
function itemFrom(raw:unknown,line:LineDetail,index:number,persisted:boolean):ReceiptProduct{
  const r=rec(raw),p=persisted?rec(r.products):r
  const extras=selectedExtras(persisted?(p.dataExtra??p.ExtProductFoodsAll):p.dataExtra)
  if(extras.length!==line.extras.length)throw new Error('Complementos no conciliados')
  const quantity=Number(persisted?r.cantProducts:p.ProQuantity)
  if(quantity!==line.quantity||free(persisted?(r.free??p.free):p.free)!==line.free)throw new Error('Línea de mercancía no conciliada')
  const originalUnit=money(persisted?p.ProPrice:p.unitPrice)
  if(persisted)eq(r.priceProduct,line.unitPrice,'precio vendido')
  if(!line.free)eq(originalUnit,line.unitPrice,'precio unitario')
  const detail=extras.map((e,i):ReceiptExtra=>{
    // Persisted IDs identify the sold extra; do not use array ordering on read.
    const matches= persisted?line.extras.filter(x=>x.id===str(e.exPid)): [line.extras[i]]
    if(matches.length!==1||!matches[0])throw new Error('Identificador de complemento no conciliado')
    const x=matches[0];if(x.quantity!==Number(e.quantity))throw new Error('Cantidad de complemento no conciliada')
    eq(moneyNumber(productMinor(e.extraPrice,x.quantity,'half-up','extra')),x.gross,'bruto complemento');eq(minus(x.gross,x.discountAmount),x.net,'neto complemento')
    if(line.free&&minor(x.discountAmount)!==BigInt(0))throw new Error('Complemento protegido con descuento')
    return {key:`${line.id}:extra:${i}`,name:str(e.extraName)||'Complemento',quantity:x.quantity,unitPrice:money(e.extraPrice),originalTotal:money(x.gross),total:money(x.net),discountAmount:money(x.discountAmount),reportedDiscountAmount:null,inconsistentCourtesyPrice:false}
  })
  if(persisted&&new Set(extras.map(e=>str(e.exPid))).size!==extras.length)throw new Error('Complemento duplicado')
  const productGross=money(line.productGross),productNet=money(line.productNet),off=minus(productGross,productNet)
  if(line.free&&minor(productNet)!==BigInt(0))throw new Error('Cortesía con cargo')
  eq(moneyNumber(productMinor(originalUnit,quantity,'half-up','product')),line.free?line.originalProductTotal:productGross,'importe original producto')
  eq(add([productNet,...detail.map(x=>x.total)]),line.netTotal,'neto línea')
  eq(add([productGross,...detail.map(x=>x.originalTotal)]),line.lineSubtotal,'bruto línea')
  eq(add([off,...detail.map(x=>x.discountAmount)]),line.commercialDiscountAmount,'descuento línea')
  return {key:`${line.id}:${index}`,name:str(p.pName)||'Producto',quantity,unitPrice:originalUnit,total:productNet,free:line.free,originalTotal:line.free?(line.originalProductTotal==null?null:money(line.originalProductTotal)):productGross,discountAmount:off,discountPercent:null,reportedDiscountAmount:null,sku:str(p.pCode),comment:str(persisted?r.comments:p.comment??p.comments),extras:detail,optionals:options(persisted?(p.dataOptional??p.ExtProductFoodOptional):p.dataOptional,persisted)}
}
function financial(items:ReceiptProduct[],exact:Record<string,unknown>,settlement:SaleSettlement,source:'preview'|'persisted',warnings:string[]):ReceiptFinancials{
  const gross=money(exact.gross??exact.subtotal),net=money(exact.netTotal),discount=money(exact.discountAmount)
  const pnet=add(items.map(i=>i.total)),enet=add(items.flatMap(i=>i.extras.map(x=>x.total))),pgross=add(items.filter(i=>!i.free).map(i=>i.originalTotal)),egross=add(items.flatMap(i=>i.extras.map(x=>x.originalTotal)))
  eq(add([pnet,enet]),net,'neto mercancía');eq(add([pgross,egross]),gross,'bruto mercancía');eq(minus(gross,discount),net,'descuento');eq(settlement.merchandiseNet,net,'neto settlement');eq(add([net,settlement.posCharge,settlement.tip]),settlement.checkoutTotal,'total POS');eq(exact.payableTotal,settlement.checkoutTotal,'cabecera total POS');eq(exact.delivery,settlement.posCharge,'domicilio POS');eq(exact.tip,settlement.tip,'propina')
  if(settlement.currency!=='COP')throw new Error('Moneda incompatible')
  if(settlement.classification==='CLASSIFIED'){
    eq(add([settlement.posCharge,settlement.externalCharge]),settlement.customerFee,'tarifa domicilio');eq(add([settlement.deliveryRevenue,settlement.thirdPartyPayable]),settlement.posCharge,'distribución domicilio');eq(add([net,settlement.deliveryRevenue]),settlement.merchantRevenue,'ingreso comercio');eq(add([settlement.checkoutTotal,settlement.externalCharge]),settlement.customerTotal,'total cliente')
  }else if(settlement.classification==='UNKNOWN'){warnings.push('Domicilio histórico sin clasificación verificable.')}else throw new Error('Clasificación inválida')
  return {total:money(settlement.checkoutTotal),merchandiseNet:net,productNet:pnet,extraNet:enet,productGross:pgross,extraGross:egross,appliedDiscount:discount,courtesy:items.some(i=>i.free&&i.originalTotal===null)?null:add(items.filter(i=>i.free).map(i=>i.originalTotal)),reportedDiscount:discount,reportedDiscountLabel:null,netMatches:true,showBreakdown:true,warnings,delivery:money(settlement.posCharge),tip:money(settlement.tip),settlement,deliveryLabel:modeLabel(settlement.mode),source}
}
export function buildPreviewReceipt(input:PreviewInput):ReceiptView{
  if(!input.quoteReady||!input.quote||!input.cart.length)throw new Error('Confirma la cotización del domicilio antes de cobrar.')
  const kind=input.paymentKind??paymentKind(input.paymentMethod),cash=rec(input.cash)
  if(cash.kind!==kind||cash.hasItems!==true||cash.amountsValid!==true)throw new Error('El checkout todavía no es verificable')
  const type=input.discountType??'PERCENT';if(type!=='PERCENT'&&type!=='AMOUNT')throw new Error('Tipo de descuento inválido')
  const discount:GlobalDiscount={type,value:(type==='AMOUNT'?input.discountAmount??0:input.discountPercent??0) as number|string}
  const rows:ReadonlyCartItem[]=input.cart.map((raw,i)=>{const p=rec(raw);return {shoppingCartId:`pos-${i}`,priceProduct:p.unitPrice as number,cantProducts:p.ProQuantity as number,free:p.free??false,products:{ProPrice:p.unitPrice as number,dataExtra:selectedExtras(p.dataExtra)}}})
  // Tip remains zero in the currently installed useSales flow; never infer from arbitrary form fields.
  const totals=computeCartTotals(rows,{pricingMode:'pos',includeExtras:true,includeLines:true,globalDiscount:discount,deliveryTerms:input.quote})
  const items=input.cart.map((r,i)=>itemFrom(r,totals.lines[i],i,false));const f=financial(items,totals.exact,totals.settlement,'preview',[...totals.warnings]);f.deliveryLabel=str(rec(input.quote).methodName)||modeLabel(totals.settlement.mode)
  eq(cash.subtotal,totals.exact.netTotal,'checkout mercancía');eq(cash.delivery,totals.settlement.posCharge,'checkout domicilio');eq(cash.total,totals.settlement.checkoutTotal,'checkout total')
  const received=kind==='cash'&&cash.received!=null?money(cash.received):null
  const change=kind==='cash'&&cash.canSubmit===true?money(cash.change):null
  if(cash.canSubmit===true&&kind==='cash'&&minor(f.total)!==BigInt(0)){if(received===null||change===null)throw new Error('Efectivo no verificable');eq(add([f.total,change]),received,'efectivo y vuelto')}
  if(kind!=='cash'&&cash.change!=null)eq(cash.change,0,'vuelto no efectivo')
  return {items,financials:f,payment:{name:input.paymentMethod,kind,received,change,reportedChange:change,warning:null},canConfirm:cash.canSubmit===true&&kind!=='unknown'&&totals.warnings.length===0}
}
/** Read only the verified financial representation from getOneSalesStore. Never reprice live products. */
export function buildPersistedReceipt(value:unknown,reference:string):ReceiptView{
  const sale=rec(value),f=rec(sale.financials),calc=rec(f.calculated),exact=rec(f.exact),status=rec(sale.statusOrder)
  if(str(sale.pCodeRef)!==reference||status.name!=='CONCLUIDA')throw new Error('La venta no está confirmada o la referencia no coincide')
  if(f.source!=='persisted'||f.valid!==true||f.breakdownVerified!==true)throw new Error('La venta requiere conciliación financiera; no se emitirá un comprobante con cifras no verificadas')
  const settlement=f.settlement as SaleSettlement|null
  if(!settlement)throw new Error('No hay distribución financiera registrada')
  const warnings:string[]=[]
  if(settlement.classification==='CLASSIFIED'&&f.deliveryVerified!==true)throw new Error('Snapshot de domicilio no verificado')
  if(settlement.classification==='UNKNOWN'&&arr(f.deliveryIssues).some(x=>x!=='DELIVERY_SNAPSHOT_MISSING'))throw new Error('Snapshot de domicilio inconsistente')
  const carts=arr(sale.shoppingCarts),lines=arr(calc.lines) as LineDetail[]
  if(!carts.length||carts.length!==lines.length||new Set(lines.map(x=>x.id)).size!==lines.length||new Set(carts.map(r=>str(rec(r).shoppingCartId))).size!==carts.length)throw new Error('Detalle de venta incompleto')
  const byId=new Map(lines.map(x=>[x.id,x]));const items=carts.map((r,i)=>{const l=byId.get(str(rec(r).shoppingCartId));if(!l)throw new Error('Línea histórica sin correspondencia');return itemFrom(r,l,i,true)})
  const result=financial(items,exact,settlement,'persisted',warnings)
  // Independently verify recorded header values, not just the calculated view.
  const persisted=rec(f.persisted);eq(persisted.gross,exact.gross,'bruto persistido');eq(persisted.discountAmount,exact.discountAmount,'descuento persistido');eq(persisted.netTotal,exact.netTotal,'neto persistido');eq(persisted.delivery??0,exact.delivery,'domicilio persistido');eq(persisted.tip??0,exact.tip,'propina persistida')
  if((persisted.change==null)!==(exact.change==null))throw new Error('Vuelto persistido incompleto')
  if(exact.change!=null)eq(persisted.change,exact.change,'vuelto persistido')
  const name=str(rec(sale.paymentMethod).name),kind=paymentKind(name),rawChange=exact.change==null?null:money(exact.change)
  if(rawChange!==null&&kind!=='cash'&&minor(rawChange)!==BigInt(0))throw new Error('Vuelto registrado sin método de efectivo verificable')
  return {items,financials:result,payment:{name,kind,change:kind==='cash'?rawChange:null,reportedChange:rawChange,received:null,warning:null},canConfirm:false}
}
/** Same customer-facing summary for PDF, thermal and DOM. Internal revenue/cost stays out of receipt. */
export interface ReceiptRow {label:string; value:string; effect:'ADD'|'SUBTRACT'|'TOTAL'|'INFO'}
export function receiptRows(f:ReceiptFinancials):ReceiptRow[]{
  const rows:ReceiptRow[]=[];const put=(label:string,value:unknown,effect:ReceiptRow['effect'])=>rows.push({label,value:formatReceiptMoney(value),effect})
  if(f.showBreakdown){put('Productos',f.productGross,'ADD');put('Complementos',f.extraGross,'ADD');if(f.courtesy!==null&&f.courtesy>0)put('Cortesías (ya excluidas)',f.courtesy,'INFO');if(f.appliedDiscount!==null&&f.appliedDiscount>0)put('Descuento comercial',f.appliedDiscount,'SUBTRACT')}
  put('Neto de mercancía',f.merchandiseNet,'TOTAL')
  if(f.settlement){rows.push({label:'Modalidad de entrega',value:f.deliveryLabel??modeLabel(f.settlement.mode),effect:'INFO'});put('Domicilio cobrado en POS',f.delivery,'ADD');if(f.settlement.classification==='CLASSIFIED'&&minor(f.settlement.externalCharge!)>BigInt(0))put('Domicilio a pagar al repartidor',f.settlement.externalCharge,'INFO')}
  if(f.tip!==null&&f.tip!==undefined&&f.tip>0)put('Propina',f.tip,'ADD')
  put('Total a cobrar en POS',f.total,'TOTAL');if(f.settlement?.classification==='CLASSIFIED'&&minor(f.settlement.externalCharge!)>BigInt(0))put('Total cliente incl. pago externo',f.settlement.customerTotal,'INFO')
  return rows
}
export function paymentRows(p:ReceiptPayment):ReceiptRow[]{const rows:ReceiptRow[]=[{label:'Método de pago',value:p.name||'No informado',effect:'INFO'}];if(p.kind==='cash'&&p.received!=null)rows.push({label:'Efectivo recibido',value:formatReceiptMoney(p.received),effect:'INFO'});if(p.kind==='cash'&&p.change!==null)rows.push({label:'Vuelto',value:formatReceiptMoney(p.change),effect:'INFO'});return rows}
