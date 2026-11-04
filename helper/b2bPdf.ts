// PDF generators for the B2B module: price quotation (RAB) and BAST.
//
// Same approach as helper/invoicePdf.ts: build the document as detached HTML,
// rasterise it with html2canvas, then place it on an A4 jsPDF page. Doing this
// on the client keeps the Go backend free of PDF dependencies.

export interface PdfCompany {
  name?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
}

export interface PdfProject {
  code: string
  title: string
  client_name: string
  pic_name?: string
  pic_phone?: string
  location?: string
  start_date?: string | null
  target_end_date?: string | null
}

export interface PdfQuotationItem {
  category: string
  name: string
  unit?: string
  qty: number
  unit_price: number
  subtotal: number
  note?: string
}

export interface PdfQuotation {
  version: number
  subject?: string
  notes?: string
  terms?: string
  subtotal: number
  tax_percent: number
  tax_amount: number
  grand_total: number
  valid_until?: string | null
  created_at: string
  items: PdfQuotationItem[]
}

export interface PdfBastItem {
  name: string
  qty: number
  unit?: string
  note?: string
}

export interface PdfBast {
  number: string
  signed_by_client?: string
  signed_by_vendor?: string
  signed_date?: string | null
  notes?: string
  items: PdfBastItem[]
}

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)

const tanggal = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const categoryLabel: Record<string, string> = {
  perangkat: 'Perangkat',
  kabel: 'Kabel',
  jasa: 'Jasa Instalasi',
  lainnya: 'Lainnya',
}

// Letterhead shared by both documents.
function letterhead(company: PdfCompany, docTitle: string, docNumber: string): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #A93133;padding-bottom:14px;">
      <div style="display:flex;gap:12px;align-items:center;">
        ${company.logo_url ? `<img src="${company.logo_url}" style="height:52px;width:auto;" />` : ''}
        <div>
          <div style="font-size:17px;font-weight:800;color:#111827;">${company.name || 'PT JRNusa (Lilly Networks)'}</div>
          <div style="font-size:11px;color:#6b7280;line-height:1.5;">
            ${company.address || 'Jl. Pratu Herman 34, Turen, Kab. Malang, Jawa Timur 65175'}<br/>
            ${company.phone ? `Telp: ${company.phone}` : ''} ${company.email ? `· ${company.email}` : ''}
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-weight:800;color:#A93133;letter-spacing:0.5px;">${docTitle}</div>
        <div style="font-size:11px;color:#6b7280;">${docNumber}</div>
      </div>
    </div>
  `
}

// A4 wrapper used for both documents.
function wrapContainer(inner: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.left = '-10000px'
  el.style.top = '0'
  el.style.width = '794px'
  el.style.padding = '36px 40px'
  el.style.background = '#ffffff'
  el.style.color = '#1f2937'
  el.style.fontFamily = 'Arial, Helvetica, sans-serif'
  el.style.fontSize = '12px'
  el.innerHTML = inner
  return el
}

// Rasterise the detached node and trigger the download.
async function renderPdf(container: HTMLDivElement, filename: string): Promise<void> {
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
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}

// ---------------------------------------------------------------------------
// Quotation (Penawaran Harga / RAB)
// ---------------------------------------------------------------------------

export async function downloadQuotationPdf(
  project: PdfProject,
  quotation: PdfQuotation,
  company: PdfCompany = {}
): Promise<void> {
  const rows = quotation.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;">${item.name}
          ${item.note ? `<div style="font-size:10px;color:#9ca3af;">${item.note}</div>` : ''}
        </td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;">${categoryLabel[item.category] || item.category}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty} ${item.unit || ''}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:right;">${rupiah(item.unit_price)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:right;">${rupiah(item.subtotal)}</td>
      </tr>`
    )
    .join('')

  const inner = `
    ${letterhead(company, 'PENAWARAN HARGA', `Rev. ${quotation.version} · ${project.code}`)}

    <div style="display:flex;justify-content:space-between;margin-top:18px;gap:20px;">
      <div style="flex:1;">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Kepada</div>
        <div style="font-weight:700;font-size:13px;margin-top:2px;">${project.client_name}</div>
        <div style="color:#6b7280;margin-top:2px;">${project.pic_name || ''}</div>
        ${project.pic_phone ? `<div style="color:#6b7280;">Telp: ${project.pic_phone}</div>` : ''}
        ${project.location ? `<div style="color:#6b7280;">${project.location}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:11px;color:#374151;">
        <div>Tanggal: <strong>${tanggal(quotation.created_at)}</strong></div>
        <div>Berlaku s/d: <strong>${tanggal(quotation.valid_until)}</strong></div>
        <div>Proyek: <strong>${project.title}</strong></div>
      </div>
    </div>

    ${quotation.subject ? `<p style="margin-top:16px;"><strong>Perihal:</strong> ${quotation.subject}</p>` : ''}

    <table style="width:100%;border-collapse:collapse;margin-top:14px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 6px;font-size:10px;text-align:center;">No</th>
          <th style="padding:8px 6px;font-size:10px;text-align:left;">Uraian</th>
          <th style="padding:8px 6px;font-size:10px;text-align:left;">Kategori</th>
          <th style="padding:8px 6px;font-size:10px;text-align:center;">Qty</th>
          <th style="padding:8px 6px;font-size:10px;text-align:right;">Harga Satuan</th>
          <th style="padding:8px 6px;font-size:10px;text-align:right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <table style="border-collapse:collapse;min-width:300px;">
        <tr><td style="padding:5px 10px;color:#6b7280;">Subtotal</td>
            <td style="padding:5px 10px;text-align:right;">${rupiah(quotation.subtotal)}</td></tr>
        <tr><td style="padding:5px 10px;color:#6b7280;">PPN ${quotation.tax_percent}%</td>
            <td style="padding:5px 10px;text-align:right;">${rupiah(quotation.tax_amount)}</td></tr>
        <tr style="border-top:2px solid #A93133;">
            <td style="padding:8px 10px;font-weight:800;font-size:13px;">GRAND TOTAL</td>
            <td style="padding:8px 10px;text-align:right;font-weight:800;font-size:13px;">${rupiah(quotation.grand_total)}</td></tr>
      </table>
    </div>

    ${quotation.terms ? `<div style="margin-top:16px;"><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Syarat &amp; Ketentuan</div>
      <div style="white-space:pre-line;margin-top:4px;line-height:1.6;">${quotation.terms}</div></div>` : ''}

    ${quotation.notes ? `<p style="margin-top:12px;color:#4b5563;"><em>${quotation.notes}</em></p>` : ''}

    <div style="display:flex;justify-content:space-between;margin-top:44px;text-align:center;">
      <div style="width:180px;">
        <div style="font-size:11px;color:#6b7280;">Dibuat oleh,</div>
        <div style="height:56px;"></div>
        <div style="border-top:1px solid #9ca3af;padding-top:4px;font-size:11px;">Project Manager</div>
      </div>
      <div style="width:180px;">
        <div style="font-size:11px;color:#6b7280;">Disetujui klien,</div>
        <div style="height:56px;"></div>
        <div style="border-top:1px solid #9ca3af;padding-top:4px;font-size:11px;">${project.client_name}</div>
      </div>
    </div>
  `

  await renderPdf(wrapContainer(inner), `penawaran-${project.code}-rev${quotation.version}.pdf`)
}

// ---------------------------------------------------------------------------
// BAST (Berita Acara Serah Terima)
// ---------------------------------------------------------------------------

export async function downloadBastPdf(
  project: PdfProject,
  bast: PdfBast,
  company: PdfCompany = {}
): Promise<void> {
  const rows = bast.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${index + 1}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.unit || '-'}</td>
        <td style="padding:7px 6px;border-bottom:1px solid #e5e7eb;">${item.note || '-'}</td>
      </tr>`
    )
    .join('')

  const inner = `
    ${letterhead(company, 'BERITA ACARA SERAH TERIMA', bast.number)}

    <p style="margin-top:20px;line-height:1.8;text-align:justify;">
      Pada hari ini, <strong>${tanggal(bast.signed_date)}</strong>, bertempat di
      <strong>${project.location || 'lokasi proyek'}</strong>, telah dilaksanakan serah terima
      pekerjaan <strong>${project.title}</strong> (Kode Proyek: <strong>${project.code}</strong>)
      kepada <strong>${project.client_name}</strong>.
    </p>

    <div style="display:flex;gap:20px;margin-top:16px;">
      <div style="flex:1;">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Pihak Pertama (Pelaksana)</div>
        <div style="font-weight:700;margin-top:2px;">${company.name || 'PT JRNusa (Lilly Networks)'}</div>
        <div style="color:#6b7280;">${bast.signed_by_vendor || '-'}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Pihak Kedua (Pemberi Tugas)</div>
        <div style="font-weight:700;margin-top:2px;">${project.client_name}</div>
        <div style="color:#6b7280;">${bast.signed_by_client || project.pic_name || '-'}</div>
      </div>
    </div>

    <div style="margin-top:20px;font-size:11px;color:#374151;font-weight:700;">
      DAFTAR PERANGKAT / PEKERJAAN YANG DISERAHKAN
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 6px;font-size:10px;text-align:center;">No</th>
          <th style="padding:8px 6px;font-size:10px;text-align:left;">Nama Perangkat / Pekerjaan</th>
          <th style="padding:8px 6px;font-size:10px;text-align:center;">Qty</th>
          <th style="padding:8px 6px;font-size:10px;text-align:center;">Satuan</th>
          <th style="padding:8px 6px;font-size:10px;text-align:left;">Keterangan</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${bast.notes ? `<div style="margin-top:16px;"><div style="font-size:10px;color:#6b7280;text-transform:uppercase;">Catatan</div>
      <div style="white-space:pre-line;margin-top:4px;line-height:1.6;">${bast.notes}</div></div>` : ''}

    <p style="margin-top:18px;line-height:1.8;text-align:justify;">
      Dengan ditandatanganinya berita acara ini, pekerjaan dinyatakan
      <strong>SELESAI</strong> dan menjadi dasar pencairan dana pembayaran termin
      sesuai kontrak yang berlaku.
    </p>

    <div style="display:flex;justify-content:space-between;margin-top:40px;text-align:center;">
      <div style="width:200px;">
        <div style="font-size:11px;color:#6b7280;">Pihak Pertama,</div>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #9ca3af;padding-top:4px;font-size:11px;font-weight:700;">
          ${bast.signed_by_vendor || 'Project Manager'}
        </div>
      </div>
      <div style="width:200px;">
        <div style="font-size:11px;color:#6b7280;">Pihak Kedua,</div>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #9ca3af;padding-top:4px;font-size:11px;font-weight:700;">
          ${bast.signed_by_client || project.client_name}
        </div>
      </div>
    </div>

    <p style="margin-top:28px;font-size:10px;color:#9ca3af;text-align:center;">
      Dokumen ini dibuat secara otomatis oleh sistem CRM Lilly Networks.
    </p>
  `

  await renderPdf(wrapContainer(inner), `bast-${bast.number}.pdf`)
}

// Parse the JSON snapshot stored on a BAST record.
export function parseBastItems(snapshot: string): PdfBastItem[] {
  try {
    const parsed = JSON.parse(snapshot || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
