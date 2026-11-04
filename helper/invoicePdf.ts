// Generates the official invoice/receipt PDF for the customer portal.
// Follows the same html2canvas + jsPDF approach already used by
// pages/invoice/[id].vue so the visual result stays consistent.

export interface InvoicePdfData {
  id: string
  status: string
  amount: number
  created_at?: string
  due_date?: string
  invoice_date?: string
  customer?: {
    name?: string
    address?: string
    phone?: string
  }
  invoice_items?: Array<{
    name: string
    qty: number
    price: number
    total: number
  }>
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Builds the invoice markup in a detached container so it can be rasterised
// into a PDF without disturbing the visible page.
function buildInvoiceMarkup(invoice: InvoicePdfData): HTMLDivElement {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = '794px' // A4 width @96dpi
  container.style.padding = '40px'
  container.style.background = '#ffffff'
  container.style.color = '#1f2937'
  container.style.fontFamily = 'Arial, Helvetica, sans-serif'
  container.style.fontSize = '13px'

  const items = invoice.invoice_items || []
  const rows = items.length
    ? items
        .map(
          (item) => `
            <tr>
              <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatRupiah(item.price)}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatRupiah(item.total)}</td>
            </tr>`
        )
        .join('')
    : `<tr>
         <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;" colspan="3">Tagihan internet</td>
         <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatRupiah(invoice.amount)}</td>
       </tr>`

  const statusLabel =
    invoice.status === 'paid' ? 'LUNAS' : invoice.status === 'pending' ? 'PENDING' : 'BELUM BAYAR'
  const statusColor =
    invoice.status === 'paid' ? '#065f46' : invoice.status === 'pending' ? '#92400e' : '#991b1b'
  const statusBg =
    invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'pending' ? '#fef3c7' : '#fee2e2'

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin:0;font-size:24px;letter-spacing:1px;">INVOICE</h1>
        <p style="margin:4px 0;color:#6b7280;">${invoice.id}</p>
        <span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:bold;color:${statusColor};background:${statusBg};">
          ${statusLabel}
        </span>
        <div style="margin-top:18px;">
          <p style="margin:0;font-weight:bold;">Ditagihkan Kepada</p>
          <p style="margin:2px 0;">${invoice.customer?.name || '-'}</p>
          <p style="margin:2px 0;color:#6b7280;">${invoice.customer?.address || ''}</p>
          <p style="margin:2px 0;color:#6b7280;">Telp: ${invoice.customer?.phone || '-'}</p>
        </div>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-weight:bold;">PT JRNusa (Lilly Networks)</p>
        <p style="margin:2px 0;color:#6b7280;">Jl. Pratu Herman 34, Turen</p>
        <p style="margin:2px 0;color:#6b7280;">Kab. Malang, Jawa Timur 65175</p>
        <p style="margin:12px 0 2px 0;">Tanggal Invoice: <strong>${formatDate(invoice.invoice_date || invoice.created_at)}</strong></p>
        <p style="margin:2px 0;">Jatuh Tempo: <strong>${formatDate(invoice.due_date)}</strong></p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:30px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 6px;text-align:left;font-size:12px;">Deskripsi</th>
          <th style="padding:10px 6px;text-align:center;font-size:12px;">Qty</th>
          <th style="padding:10px 6px;text-align:right;font-size:12px;">Harga</th>
          <th style="padding:10px 6px;text-align:right;font-size:12px;">Jumlah</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:20px;">
      <table style="border-collapse:collapse;min-width:280px;">
        <tr>
          <td style="padding:6px 12px;color:#6b7280;">Total Tagihan</td>
          <td style="padding:6px 12px;text-align:right;font-weight:bold;font-size:15px;">${formatRupiah(invoice.amount)}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top:40px;font-size:11px;color:#9ca3af;text-align:center;">
      Terima kasih telah menggunakan layanan Lilly Networks.
      Kuitansi ini sah dan dibuat secara otomatis oleh sistem.
    </p>
  `

  return container
}

// Downloads the invoice as a PDF. The file name contains the invoice id.
export async function downloadInvoicePdf(invoice: InvoicePdfData): Promise<void> {
  const container = buildInvoiceMarkup(invoice)
  document.body.appendChild(container)

  try {
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const imgData = canvas.toDataURL('image/png')
    const pageWidth = 210
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight)
    pdf.save(`invoice-${invoice.id}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
