import type { OrderRecord } from '../types'
import { clientName, formatCOP, formatOrderDate, orderAmount } from './orders'

/** Real PDF export. Install once in the consuming app: npm install jspdf. */
export async function exportOrderPdf(order: OrderRecord): Promise<void> {
  const { jsPDF } = false
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const margin = 18
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const bottom = pdf.internal.pageSize.getHeight() - 20
  let y = 22

  const nextPage = (height = 8) => {
    if (y + height > bottom) { pdf.addPage(); y = 22 }
  }
  const line = () => {
    nextPage(9)
    pdf.setDrawColor(224, 224, 224)
    pdf.line(margin, y, margin + width, y)
    y += 9
  }
  const text = (value: string, fontSize = 10, bold = false, indent = 0) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(fontSize)
    const rows = pdf.splitTextToSize(value, width - indent) as string[]
    nextPage(rows.length * (fontSize * 0.47) + 4)
    pdf.text(rows, margin + indent, y)
    y += rows.length * (fontSize * 0.47) + 4
  }
  const safeValue = (value?: string | null) => value?.trim() || 'No disponible'

  pdf.setTextColor(40, 40, 40)
  text('VENTY · COMPROBANTE DE ORDEN', 16, true)
  text(`Orden #${order.pCodeRef}`, 12, true)
  text(`Fecha: ${formatOrderDate(order.createdAt)}`)
  text(`Establecimiento: ${safeValue(order.store?.description)}`)
  line()
  text('DETALLES DE LA VENTA', 11, true)
  text(`Cliente: ${safeValue(clientName(order))}`)
  text(`Medio de pago: ${safeValue(order.paymentMethod?.name)}`)
  const status = typeof order.statusOrder === 'string' ? order.statusOrder : order.statusOrder?.name
  text(`Estado: ${status || order.status || 'Sin estado'}`)
  line()
  text('PRODUCTOS', 11, true)
  const items = order.shoppingCarts ?? []
  if (!items.length) text('El detalle de productos no está disponible.')
  items.forEach((item, index) => {
    const name = item.products?.pName || `Producto ${index + 1}`
    const quantity = Number(item.cantProducts) || 0
    text(`${quantity} x ${name}`, 10, true)
    if (item.comments?.trim()) text(`Nota: ${item.comments.trim()}`, 9, false, 4)
    text(`Precio registrado: ${formatCOP(item.priceProduct ?? item.products?.ProPrice)}`, 9, false, 4)
  })
  line()
  text('RESUMEN FINANCIERO', 11, true)
  const summary = order.financials?.summary
  if (summary?.length) {
    for (const item of summary) text(`${item.name ?? item.key ?? 'Concepto'}: ${formatCOP(item.value)}`)
  } else if (order.totals?.length) {
    for (const item of order.totals) text(`${item.name ?? item.key ?? 'Concepto'}: ${formatCOP(item.numericValue ?? Number(item.value))}`)
  }
  text(`TOTAL DE LA ORDEN: ${formatCOP(orderAmount(order))}`, 12, true)
  if (order.financials?.valid === false) text('Aviso: los importes financieros requieren verificación.', 9)
  if (order.refundSummary?.commercialStatus && order.refundSummary.commercialStatus !== 'NOT_REFUNDED') {
    text(`Estado de devoluciones: ${order.refundSummary.commercialStatus}`, 9)
  }
  line()
  text('Documento informativo generado desde Venty. No reemplaza una factura electrónica ni un comprobante fiscal.', 8)
  const cleanCode = order.pCodeRef.replace(/[^\w-]/g, '_').slice(0, 90)
  pdf.save(`orden-${cleanCode}.pdf`)
}
