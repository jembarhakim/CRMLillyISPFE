import type { CustomerBill } from '@/api/customer/billing'

/**
 * Formats an amount as Indonesian rupiah without decimals.
 * The admin pages use helper/currency.ts (with ",00") because they show exact
 * ledger values; customers only need the rounded figure, e.g. "Rp 150.000".
 */
export function formatRupiah(amount: number | null | undefined): string {
  const value = Number(amount ?? 0)
  if (!Number.isFinite(value)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}


// Colour + label mapping for the customer bill table.
// "Lunas" -> green, "Pending" -> yellow, "Belum Bayar" -> red.
export interface BillStatusStyle {
  label: string
  color: 'green' | 'yellow' | 'red' | 'gray'
  icon: string
}

export function billStatusStyle(status: CustomerBill['status'] | string): BillStatusStyle {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', color: 'green', icon: 'check-circle' }
    case 'pending':
      return { label: 'Pending', color: 'yellow', icon: 'clock' }
    default:
      return { label: 'Belum Bayar', color: 'red', icon: 'alert-triangle' }
  }
}

// Complaint ticket stage colours, matching the 4 step tracking.
export interface TicketStageStyle {
  label: string
  color: 'blue' | 'purple' | 'orange' | 'green'
  icon: string
}

export function ticketStageStyle(stage: string): TicketStageStyle {
  switch (stage) {
    case 'received':
      return { label: 'Tiket Diterima', color: 'blue', icon: 'ticket' }
    case 'scheduled':
      return { label: 'Teknisi Dijadwalkan', color: 'purple', icon: 'calendar' }
    case 'handling':
      return { label: 'Dalam Penanganan', color: 'orange', icon: 'wrench' }
    default:
      return { label: 'Selesai', color: 'green', icon: 'check-circle' }
  }
}

// Service request approval colours.
export function serviceRequestStatusStyle(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'Disetujui', color: 'green' as const }
    case 'rejected':
      return { label: 'Ditolak', color: 'red' as const }
    default:
      return { label: 'Menunggu Persetujuan', color: 'yellow' as const }
  }
}

// Formats a "2025-10-28" or ISO timestamp into "28 Oktober 2025".
export function formatDateID(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formats a "2025-10-28 14:30" value into "28 Okt 2025, 14:30".
export function formatDateTimeID(value?: string | null): string {
  if (!value) return '-'
  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
