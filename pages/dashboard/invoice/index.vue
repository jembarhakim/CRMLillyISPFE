<script setup lang="ts">

import { invoiceAdminApi } from "@/api/admin/invoice";

import { recurringInvoiceAdminApi } from "@/api/admin/recurring-invoice";

import FormAddComponent from "./FormAddInvoice.vue";

import PartialPaymentModal from "./PartialPaymentModal.vue";

import * as currency from "@/helper/currency";

import type { UpdateStatusInvoiceRequest } from "@/types/requests/invoice";

import { WhatsappApi } from "@/api/admin/wa";

import { useNotification } from '@/composables/useNotification';

// Dynamic import for client-side only usage
// Set page title

useHead({

  title: 'Invoice Management - CRM System'

})



let customer = ref<any[]>([]);

const isLoading = ref(false);

// Router job cache by invoice id

const routerJobsByInvoice = ref<Record<string, any[]>>({})



// Partial payment modal state

const showPartialPaymentModal = ref(false)

const selectedInvoiceForPayment = ref<any>(null)



// Status confirmation modal state

const showStatusConfirmationModal = ref(false)

const statusConfirmationData = ref<{

  invoiceId: string

  newStatus: string

  currentStatus: string

  invoiceData: any

} | null>(null)



// PDF view tracking state

const pdfViewingInvoices = ref<Set<string>>(new Set())

const activeRecurringCustomerIds = ref<Set<string>>(new Set())



// Print state

const printing = ref(false)

// Column selection for print report
const showColumnSelector = ref(false)
const selectedColumns = ref<Set<string>>(new Set())

// Define columns before using them in computed properties
const columns = [

  {

    key: "number",

    label: "Number",

  },

  {

    key: "customer_display",

    label: "Customer",

  },

  {

    key: "amount",

    label: "Amount",

  },

  {

    key: "total_paid",

    label: "Total Paid",

  },

  {

    key: "amount_due",

    label: "Amount Due",

  },

  {

    key: "status",

    label: "Status",

  },

  {

    key: "invoice_date",

    label: "Invoice Date",

  },

  {

    key: "due_date",

    label: "Due Date",

  },

  {

    key: "actions",

    label: "Actions",

  },

];

// Initialize selected columns with all columns except 'actions'
const availableColumns = computed(() => {
  return columns.filter(col => col.key !== 'actions')
})

// Initialize with all columns selected
selectedColumns.value = new Set(availableColumns.value.map(col => col.key))

// Select All / Unselect All state
const allColumnsSelected = computed(() => {
  return availableColumns.value.every(col => selectedColumns.value.has(col.key))
})



const router = useRouter();

type Customer = {

  id: string;

  name: string;

  email: string;

  phone: string;

  address: string;

  area_code: string;

  gmaps_link: string;

  packet_internet: string;

  ip_static: string;

  mac_address: string;

};



async function getData() {

  console.log("Fetching invoice data...");

  isLoading.value = true;

  try {

    const response = await invoiceAdminApi().getAllInvoices();

    console.log("Invoice data received:", response?.data);



    // Ensure we always work with an array

    const data: any[] = Array.isArray(response?.data) ? response.data : [];



    data.forEach((invoice: any, idx: number) => {

      // Use local index instead of indexOf to avoid issues with non-strict equality

      invoice.number = idx + 1;

      // Normalize dates for display

      if (invoice.invoice_date) {

        invoice.invoice_date = String(invoice.invoice_date).split("T")[0];

      } else if (invoice.created_at) {

        // Fallback to created_at when backend doesn't send invoice_date

        invoice.invoice_date = String(invoice.created_at).split("T")[0];

      }

      if (invoice.due_date) {

        invoice.due_date = String(invoice.due_date).split("T")[0];

      }

      
      
      // Calculate total_paid from transaction data

      invoice.total_paid = invoice.transaction?.amount || 0;

      
      
      // Calculate amount_due

      invoice.amount_due = invoice.amount - invoice.total_paid;

      
      
      // Only auto-update status if it's not manually set to 'paid' or 'pending'

      // This prevents overriding manual status changes

      if (invoice.status === 'unpaid' || !invoice.status) {

        if (invoice.total_paid >= invoice.amount) {

          invoice.status = 'paid';

        } else if (invoice.total_paid > 0) {

          invoice.status = 'pending';

        } else {

          invoice.status = 'unpaid';

        }

      }



      // Build display name: "[code_area] - [Customer name]"

      const code = invoice?.customer?.area?.code_name || invoice?.customer?.area?.codeName || ''

      const custName = invoice?.customer?.name || ''

      invoice.customer_display = code ? `${code} - ${custName}` : custName

    });



    customer.value = [...data];



    // Lazy-init router job cache: don't auto-fetch all to avoid burst.

    // We'll fetch per-row on demand when rendering if missing.

    console.log("Invoice data updated in customer.value:", (customer.value?.length || 0), "invoices");

  } catch (err: any) {

    console.error("Error fetching invoice data:", err);

    const message = typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan';

    notification.error('Error', String(message));

  } finally {

    isLoading.value = false;

  }

}



async function updateStatus(id: string, status: string, currentStatus: string) {

  // If changing to 'paid', show confirmation modal

  if (status === 'paid' && currentStatus !== 'paid') {

    // Find the invoice data

    const invoiceData = customer.value.find(inv => inv.id === id);

    
    
    // Set confirmation modal data

    statusConfirmationData.value = {

      invoiceId: id,

      newStatus: status,

      currentStatus: currentStatus,

      invoiceData: invoiceData

    };

    
    
    // Show confirmation modal

    showStatusConfirmationModal.value = true;

    return;

  }



  // For other status changes, proceed directly

  await proceedWithStatusUpdate(id, status, currentStatus);

}



async function proceedWithStatusUpdate(id: string, status: string, currentStatus: string) {

  try {

    const response = await invoiceAdminApi().updateStatusInvoice(id, { status });

    
    
    notification.success('Success', response.message);

    // After a status update, refresh router jobs for this invoice

    try { await fetchRouterJobs(id) } catch (_) {}

    
    
    // Update the specific invoice in the local array instead of refreshing all data

    const invoiceIndex = customer.value.findIndex(inv => inv.id === id);

    if (invoiceIndex !== -1) {

      customer.value[invoiceIndex].status = status;

    }

    
    
    return response;

  } catch (err: any) {

    const raw = typeof err === 'string' ? err : err?.message || ''

    // Friendlier message for MikroTik scheduler not found

    if (/mikrotik.*scheduler.*not\s*found/i.test(raw)) {

      const pretty = 'Scheduler tidak ditemukan. Pastikan nama scheduler sesuai dengan kode area customer di MikroTik.'

      notification.error('MikroTik Error', pretty + `\n(${raw})`)

    } else {

      const message = raw || 'Terjadi kesalahan';

      notification.error('Error', String(message));

    }

    
    
    // Revert the status back to original on error

    const invoiceIndex = customer.value.findIndex(inv => inv.id === id);

    if (invoiceIndex !== -1) {

      customer.value[invoiceIndex].status = currentStatus;

    }

    
    
    throw err;

  }

}



// Handle confirmation modal actions

async function confirmStatusChange() {

  if (statusConfirmationData.value) {

    // Store invoice ID before closing modal

    const invoiceId = statusConfirmationData.value.invoiceId;

    const newStatus = statusConfirmationData.value.newStatus;

    
    
    try {

      await proceedWithStatusUpdate(

        invoiceId,

        newStatus,

        statusConfirmationData.value.currentStatus

      );

      
      
      // Close modal first

      closeStatusConfirmationModal();

      
      
      // If status was successfully changed to 'paid', automatically open PDF

      if (newStatus === 'paid') {

        console.log('Status changed to paid, opening PDF automatically for invoice:', invoiceId);

        
        
        // Use nextTick to ensure modal is closed and UI is updated

        await nextTick();

        
        
        // Small delay to ensure status update is reflected in UI

        setTimeout(async () => {

          try {

            console.log('Attempting to open PDF for invoice:', invoiceId);

            await handlePdfView(invoiceId, true);

          } catch (error) {

            console.error('Error opening PDF automatically:', error);

            notification.error('Error', 'Gagal membuka PDF otomatis. Silakan klik "Download PDF" secara manual.', 5000);

          }

        }, 1000);

      }

    } catch (error) {

      console.error('Error updating status:', error);

      closeStatusConfirmationModal();

    }

  }

}



function cancelStatusChange() {

  if (statusConfirmationData.value) {

    // Revert the status back to original

    const invoiceIndex = customer.value.findIndex(inv => inv.id === statusConfirmationData.value!.invoiceId);

    if (invoiceIndex !== -1) {

      customer.value[invoiceIndex].status = statusConfirmationData.value.currentStatus;

    }

  }

  closeStatusConfirmationModal();

}



function closeStatusConfirmationModal() {

  showStatusConfirmationModal.value = false;

  statusConfirmationData.value = null;

}



// PDF View Tracking Functions

async function handlePdfView(invoiceId: string, isAutoOpen: boolean = false) {

  console.log('handlePdfView called with:', { invoiceId, isAutoOpen });

  
  
  try {

    // Check if PDF has already been viewed

    const invoice = customer.value.find(inv => inv.id === invoiceId);

    console.log('Found invoice:', invoice);

    
    
    if (invoice?.pdf_viewed) {

      console.log('PDF already viewed, showing error message');

      notification.error('PDF Sudah Dilihat', 'PDF invoice ini sudah pernah dilihat dan tidak dapat diakses lagi untuk mencegah duplikasi pembayaran.', 5000);

      return;

    }



    console.log('Marking PDF as viewed...');

    try {

      // Mark PDF as viewed before opening

      await invoiceAdminApi().markPdfViewed(invoiceId);

      console.log('PDF marked as viewed successfully');

    } catch (markError) {

      console.error('Failed to mark PDF as viewed:', markError);

      // Continue anyway - we'll still open the PDF

      notification.warning('Warning', 'Gagal menandai PDF sebagai dilihat, tetapi PDF tetap akan dibuka.', 3000);

    }

    
    
    // Add to tracking set

    pdfViewingInvoices.value.add(invoiceId);

    
    
    // Update local invoice data

    const invoiceIndex = customer.value.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex !== -1) {

      customer.value[invoiceIndex].pdf_viewed = true;

      customer.value[invoiceIndex].pdf_viewed_at = new Date().toISOString();

      console.log('Updated local invoice data');

    }



    // Navigate to PDF view

    try {

      console.log('Attempting to navigate to PDF:', `/invoice/${invoiceId}`);

      
      
      // Always use navigateTo for consistent behavior

      console.log('Navigating to PDF with navigateTo');

      await navigateTo(`/invoice/${invoiceId}`);

      console.log('Successfully navigated to PDF');

    } catch (error) {

      console.error('Navigation failed, trying window.open:', error);

      // Fallback to window.open if navigateTo fails

      const pdfUrl = `${window.location.origin}/invoice/${invoiceId}`;

      console.log('Opening PDF in new window:', pdfUrl);

      window.open(pdfUrl, '_blank');

    }

    
    
    // Different messages for manual vs auto open

    if (isAutoOpen) {

      notification.success('Status Diubah ke PAID', 'PDF invoice dibuka otomatis. PDF ini tidak dapat dibuka lagi untuk mencegah duplikasi pembayaran.', 5000);

    } else {

      notification.info('PDF Dibuka', 'PDF invoice telah dibuka. PDF ini tidak dapat dibuka lagi untuk mencegah duplikasi pembayaran.', 5000);

    }
    
    

  } catch (error: any) {

    console.error('Error handling PDF view:', error);

    
    
    // Check if it's a JSON parsing error

    if (error.message && error.message.includes('Unexpected token')) {

      console.error('JSON parsing error - server returned HTML instead of JSON');

      notification.error('Error', 'Server error: PDF tidak dapat dibuka. Silakan coba lagi.', 5000);

    } else {

      notification.error('Error', error.message || 'Gagal membuka PDF', 5000);

    }

  }

}



function isPdfViewed(invoiceId: string): boolean {

  const invoice = customer.value.find(inv => inv.id === invoiceId);

  return invoice?.pdf_viewed || false;

}



// Helper functions for paid status logic

function getTotalPaid(row: any): number {

  if (row.status?.toLowerCase() === 'paid') {

    // If status is paid, total paid should be the full amount

    return row.amount || 0;

  }

  // If not paid, use the actual total_paid from backend

  return row.total_paid || 0;

}



function getAmountDue(row: any): number {

  if (row.status?.toLowerCase() === 'paid') {

    // If status is paid, amount due should be 0

    return 0;

  }

  // If not paid, use the actual amount_due from backend

  return row.amount_due || 0;

}



async function sendWhatsapp(number: string, id: string) {

  WhatsappApi()

    .sendWhatsapp({

      number,

      message:

        `berikut invoice yang harus anda bayarkan sekarang \n\nKami berikan Link untuk melihat invoice \n\nhttps://skripsi.rtrsite.com/invoice/${id} \n\nSilahkan menuju dashboard login customer kami https://skripsi.rtrsite.com/login \n\nTerimakasih`,

    })

    .then((response) => {

      notification.success('Success', response.message);

    })

    .catch((err) => {

      const message = typeof err === 'string' ? err : err?.message || 'Gagal mengirim WhatsApp';

      useToast().add({

        title: message,

        color: "red",

      });

    });

}



// Load active recurring index for conditional action visibility

async function loadActiveRecurringCustomers() {

  try {

    const res = await recurringInvoiceAdminApi().getAllRecurringInvoices()

    const ids = new Set<string>()

    ;(res.data || []).forEach((r: any) => {

      if ((r.status || '').toLowerCase() === 'active') ids.add(r.customer_id)

    })

    activeRecurringCustomerIds.value = ids

  } catch (e) {

    // ignore silently; action will still be available

  }

}



// --- Start Recurring from Invoice ---

const showStartRecurringModal = ref(false)

const selectedInvoiceForRecurring = ref<any>(null)

const recurringForm = reactive({

  invoice_date: '',

  due_date: '',

  frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',

  description: ''

})



function openStartRecurringModal(row: any) {

  selectedInvoiceForRecurring.value = row

  // default dates: today and +30 days

  const today = new Date()

  const due = new Date()

  due.setDate(today.getDate() + 30)

  recurringForm.invoice_date = today.toISOString().split('T')[0]

  recurringForm.due_date = due.toISOString().split('T')[0]

  recurringForm.frequency = 'monthly'

  recurringForm.description = `Recurring from invoice ${row.id}`

  showStartRecurringModal.value = true

}



async function createRecurringFromInvoice() {

  if (!selectedInvoiceForRecurring.value) return

  const base = await invoiceAdminApi().getInvoice(selectedInvoiceForRecurring.value.id)

  const inv = base.data || selectedInvoiceForRecurring.value

  const items = (inv.invoice_items || []).map((it: any) => ({

    name: it.name,

    price: Number(it.price || 0),

    qty: Number(it.qty || 1),

    total: Number(it.total || (Number(it.price || 0) * Number(it.qty || 1)))

  }))

  try {

    await recurringInvoiceAdminApi().createRecurringInvoice({

      customer_id: inv.customer_id || inv.customer?.id,

      amount: Number(inv.amount || 0),

      invoice_date: new Date(recurringForm.invoice_date + 'T00:00:00.000Z').toISOString(),

      due_date: new Date(recurringForm.due_date + 'T00:00:00.000Z').toISOString(),

      frequency: recurringForm.frequency,

      description: recurringForm.description,

      invoice_items: items

    })

    useToast().add({ title: 'Recurring invoice started', color: 'green' })

    showStartRecurringModal.value = false

  } catch (err: any) {

    notification.error('Failed to start recurring', err?.message || 'Failed to start recurring')

  }

}



function closeStartRecurringModal() {

  showStartRecurringModal.value = false

  selectedInvoiceForRecurring.value = null

}



async function deleteData(id: string) {

  await invoiceAdminApi()

    .deleteInvoice(id)

    .then((response) => {

      getData();

      notification.success('Success', response.message);

    })

    .catch((err) => {

      notification.error('Error', err);

    });

}



// --- Router Jobs helpers ---

async function fetchRouterJobs(invoiceId: string) {

  const res = await invoiceAdminApi().getRouterJobsByInvoice(invoiceId)

  routerJobsByInvoice.value[invoiceId] = res.data || []

}



function getRouterJobState(invoiceId: string): { state: 'none'|'pending'|'error'|'success', message?: string } {

  const jobs = routerJobsByInvoice.value[invoiceId]

  if (!jobs || jobs.length === 0) return { state: 'none' }

  // If any error -> error; else if any pending -> pending; else success

  const anyError = jobs.some((j: any) => (j.status || '').toLowerCase() === 'error')

  if (anyError) {

    const err = jobs.find((j: any) => (j.status || '').toLowerCase() === 'error')

    return { state: 'error', message: err?.last_error || 'Router update failed' }

  }

  const anyPending = jobs.some((j: any) => (j.status || '').toLowerCase() === 'pending')

  if (anyPending) return { state: 'pending' }

  return { state: 'success' }

}



async function ensureJobsLoaded(invoiceId: string) {

  if (!routerJobsByInvoice.value[invoiceId]) {

    try { await fetchRouterJobs(invoiceId) } catch (_) {}

  }

}



async function retryRouterJobs(invoiceId: string) {

  try {

    await invoiceAdminApi().retryRouterJobsByInvoice(invoiceId)

    notification.success('Router Update', 'Retry queued')

    await fetchRouterJobs(invoiceId)

  } catch (err: any) {

    notification.error('Router Update', err?.message || 'Failed to retry')

  }

}



await Promise.all([getData(), loadActiveRecurringCustomers()]);



const page = ref(1);

const pageCount = 5;



const rows = computed(() => {

  if (!q.value) {

    return customer.value.slice(

      (page.value - 1) * pageCount,

      page.value * pageCount

    );

  }



  const newData = customer.value.filter((transaction) => {

    return Object.values(transaction).some((value) => {

      return String(value).toLowerCase().includes(q.value.toLowerCase());

    });

  });



  return newData.slice((page.value - 1) * pageCount, page.value * pageCount);

});



const q = ref("");

const dateFilter = ref("");

const statusFilter = ref("");



// Clear all filters

function clearFilters() {

    q.value = "";

    dateFilter.value = "";

    statusFilter.value = "";

}



const filteredRows = computed(() => {

    let filteredData = customer.value;



    // Filter by search query (customer name only)

    if (q.value) {

        filteredData = filteredData.filter((invoice) => {

            // Only search in the customer name field

            return invoice.customer?.name?.toLowerCase().includes(q.value.toLowerCase())

        })

    }



    // Filter by date (match either invoice_date or due_date)

    if (dateFilter.value) {

        filteredData = filteredData.filter((invoice) => {

            const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : null;

            const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;

            const filterDate = new Date(dateFilter.value);

            return (

              (invoiceDate && invoiceDate.toDateString() === filterDate.toDateString()) ||

              (dueDate && dueDate.toDateString() === filterDate.toDateString())

            );

        })

    }



    // Filter by status

    if (statusFilter.value) {

        filteredData = filteredData.filter((invoice) => {

            if (statusFilter.value === 'unpaid_pending') {
                return invoice.status?.toLowerCase() === 'unpaid' || invoice.status?.toLowerCase() === 'pending';
            }
            return invoice.status?.toLowerCase() === statusFilter.value.toLowerCase();

        })

    }



    return filteredData.slice((page.value - 1) * pageCount, (page.value) * pageCount)

})



const items = (row: any) => [

  [

    {

      label: "Send Whatsapp",

      icon: "chat-bubble-left-ellipsis-20-solid",

      click: () => sendWhatsapp(row.customer.phone, row.id),

    },

    {

      label: isPdfViewed(row.id) ? "PDF Sudah Dilihat" : "Download PDF",

      icon: isPdfViewed(row.id) ? "eye-slash-20-solid" : "arrow-down-on-square-20-solid",

      disabled: isPdfViewed(row.id),

      click: () => handlePdfView(row.id),

    },

    (() => {

      const cid = row.customer_id || row.customer?.id

      // Allow starting recurring when customer id is missing (new/partial rows)

      // and only block when there is a known active recurring for this customer

      const available = (!cid) || !activeRecurringCustomerIds.value.has(cid)

      return {

        label: available ? "Start Recurring" : "Already Recurring",

        icon: "refresh-cw-20-solid",

        disabled: !available,

        click: () => available && openStartRecurringModal(row),

      }

    })(),

    {

      label: "Edit",

      icon: "pencil-20-solid",

      click: () => OpenModalAddCustomer(true, row),

    },

  ],

  [

    {

      label: "Delete",

      icon: "trash-2-20-solid",

      click: () => deleteData(row.id),

    },

  ],

];



const notification = useNotification();

const modal = useModal();



function OpenModalAddCustomer(isEdit: boolean, data: any) {

  console.log("Open Modal");

  modal.open(FormAddComponent, {

    isEdit,

    data,

    async onSuccess() {

      console.log("Modal onSuccess called, refreshing data...");

      try {

        await getData();

        console.log("Data refreshed successfully");

        modal.close();

        console.log("Modal closed successfully");

      } catch (error) {

        console.error("Error refreshing data:", error);

      }

    },

  });

}

const sort = ref({

  column: "amount",

  direction: "asc" as "asc",

});



// Function to open partial payment modal

function openPartialPaymentModal(invoice: any) {

  selectedInvoiceForPayment.value = invoice

  showPartialPaymentModal.value = true

}



// Function to close partial payment modal

function closePartialPaymentModal() {

  selectedInvoiceForPayment.value = null

  showPartialPaymentModal.value = false

}



// Function to handle successful payment

function handlePaymentSuccess() {

  getData() // Refresh the invoice list

  closePartialPaymentModal()

}

// Toggle Select All / Unselect All
function toggleSelectAllColumns() {
  if (allColumnsSelected.value) {
    // Unselect all
    selectedColumns.value.clear()
  } else {
    // Select all
    availableColumns.value.forEach(col => {
      selectedColumns.value.add(col.key)
    })
  }
}

// Toggle individual column selection
function toggleColumn(columnKey: string) {
  if (selectedColumns.value.has(columnKey)) {
    selectedColumns.value.delete(columnKey)
  } else {
    selectedColumns.value.add(columnKey)
  }
}

// Open column selector modal
function openColumnSelector() {
  showColumnSelector.value = true
}

// Close column selector and proceed with print
async function proceedWithPrint() {
  if (selectedColumns.value.size === 0) {
    notification.warning('No Columns Selected', 'Please select at least one column to print.')
    return
  }
  
  showColumnSelector.value = false
  await printAllUnpaidInvoices()
}

// Generate thermal printer data for filtered invoices
function generateThermalDataForInvoices(invoices: any[]): string {
  const printerWidth = 32
  const printerWidthData = 45
  let output = ''

  for (let i = 0; i < invoices.length; i++) {
    const invoice = invoices[i]
    
    // Each invoice gets its own complete header - centered format
    output += '<div class="header-section">\n'
    output += centerText("PT JR Nusa Menara Networks", printerWidth) + "\n"
    output += centerText("Jl Raya Talangsuko 373 Turen", printerWidth) + "\n"
    output += centerText("PH: 08123511147, (0341)8224357", printerWidth) + "\n"
    output += centerText("EMAIL: info@menara.net.id", printerWidth) + "\n"
    output += centerText("LINK: www.menara.net.id", printerWidth) + "\n"
    output += "=".repeat(printerWidth) + "\n"
    output += centerText("----- DITERBITKAN UNTUK -----", printerWidth) + "\n"
    
    // Only include customer name if column is selected
    if (selectedColumns.value.has('customer_display')) {
      output += centerText(invoice.customer?.name || 'Unknown Customer', printerWidth) + "\n"
    }
    
    output += "-".repeat(printerWidth) + "\n"
    output += centerText("*** Tanda Terima ***", printerWidth) + "\n"
    output += '</div>\n'
    
    // Data section - clean format with proper spacing
    output += '<div class="data-section">\n'
    
    // Receipt details - clean format with proper alignment
    if (selectedColumns.value.has('number')) {
      output += formatKV("Nomor Tanda", invoice.number || invoice.id, printerWidth) + "\n"
      output += formatKV("Terima", invoice.number || invoice.id, printerWidth) + "\n"
    }
    
    if (selectedColumns.value.has('invoice_date')) {
      output += formatKV("Tanggal penerimaan", invoice.invoice_date || invoice.created_at?.split('T')[0] || new Date().toISOString().split('T')[0], printerWidth) + "\n"
    }
    
    if (selectedColumns.value.has('due_date')) {
      output += formatKV("Tanggal jatuh tempo", invoice.due_date?.split('T')[0] || '-', printerWidth) + "\n"
    }
    
    output += "-".repeat(printerWidthData) + "\n"

    // Item details section - clean format (always include if amount is selected)
    if (selectedColumns.value.has('amount') || selectedColumns.value.has('amount_due') || selectedColumns.value.has('total_paid')) {
      output += formatKV("Tertentu", "Jumlah", printerWidth) + "\n"
      output += "-".repeat(22) + "          " + "-".repeat(22) + "\n"
      
      // Item description with month countdown and price - formatted like the image
      const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-based
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        for (let j = 0; j < invoice.invoice_items.length; j++) {
          const item = invoice.invoice_items[j]
          // Calculate month countdown from current month
          let monthCountdown = currentMonth - j
          if (monthCountdown <= 0) {
            monthCountdown = 12 + monthCountdown
          }
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const monthName = monthNames[monthCountdown - 1]
          // Format with service name, month, and price: "Internet Service - Dec - Rp 150000"
          // Extract service name without MAC address (remove anything after the first space that looks like MAC)
          let serviceName = item.name || "Internet Service"
          // Remove various MAC address patterns:
          // 1. Standard format: XX:XX:XX:XX:XX:XX
          // 2. Short format: XX:XX:XX:XX:XX:XX:XX:XX (like 00:00:00:94cb331d)
          // 3. Any pattern with colons and hex characters
          serviceName = serviceName.replace(/\s+[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}.*$/, '')
          serviceName = serviceName.replace(/\s+[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}.*$/, '')
          // Also remove any remaining MAC-like patterns
          serviceName = serviceName.replace(/\s+[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}.*$/, '')
          const itemPrice = item.price || item.total || 0
          const formattedPrice = formatCurrency(itemPrice)
          const fullText = `${serviceName} ${monthName} - Rp ${formattedPrice}`
          output += fullText + "\n"
        }
      } else {
        // Fallback for invoices without items
        const fallbackPrice = formatCurrency(invoice.amount || 0)
        output += `Internet Service - ${new Date().toLocaleDateString('en-US', { month: 'short' })} - Rp ${fallbackPrice}\n`
      }
      
      // Period (using invoice date) - left aligned
      if (selectedColumns.value.has('invoice_date')) {
        const invoiceDate = new Date(invoice.invoice_date || invoice.created_at)
        output += invoiceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + "\n"
      }
      output += "-".repeat(printerWidthData) + "\n"
    }

    // Financial summary section - clean format with proper alignment
    if (selectedColumns.value.has('amount')) {
      output += formatKV("Total keseluruhan", "Rp " + formatCurrency(invoice.amount), printerWidthData) + "\n"
    }
    
    if (selectedColumns.value.has('total_paid')) {
      const totalPaid = getTotalPaid(invoice)
      output += formatKV("Total dibayar", "Rp " + formatCurrency(totalPaid), printerWidthData) + "\n"
    }
    
    if (selectedColumns.value.has('total_paid') || selectedColumns.value.has('amount')) {
      output += formatKV("(-) Digaji", "0,00", printerWidthData) + "\n"
      output += "-".repeat(printerWidthData) + "\n"
    }
    
    if (selectedColumns.value.has('amount_due')) {
      const amountDue = getAmountDue(invoice)
      output += formatKV("Saldo", "Rp " + formatCurrency(amountDue), printerWidth) + "\n"
    } else if (selectedColumns.value.has('amount')) {
      output += formatKV("Saldo", "Rp " + formatCurrency(invoice.amount), printerWidth) + "\n"
    }
    
    if (selectedColumns.value.has('status')) {
      output += formatKV("Status", invoice.status?.toUpperCase() || '-', printerWidth) + "\n"
    }
    
    output += '</div>\n'

    // Add separator and gap between invoices for easier cutting
    if (i < invoices.length - 1) {
      output += "\n\n\n\n\n" // Add more spacing between invoices for easier cutting
    }
  }

  return output.trim()
}

// Helper functions for thermal printer formatting
function centerText(text: string, width: number): string {
  const len = text.length
  if (len >= width || width <= 0) {
    return text
  }
  // Calculate total padding needed
  const totalPadding = width - len
  // Split padding evenly on both sides
  const leftPad = Math.floor(totalPadding / 2)
  const rightPad = totalPadding - leftPad
  return " ".repeat(leftPad) + text + " ".repeat(rightPad)
}

function justifyText(text: string, width: number): string {
  const len = text.length
  if (len >= width || width <= 0) {
    return text
  }
  // For justified text, distribute spaces evenly
  const spaces = width - len
  const leftSpaces = Math.floor(spaces / 2)
  const rightSpaces = spaces - leftSpaces
  return " ".repeat(leftSpaces) + text + " ".repeat(rightSpaces)
}

function formatKV(label: string, value: string, width: number): string {
  const maxLabel = width - value.length - 1
  if (maxLabel < 1) {
    return label + " " + value
  }
  if (label.length > maxLabel) {
    label = label.substring(0, maxLabel)
  }
  return label.padEnd(maxLabel) + " " + value
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Print filtered invoices (unpaid and pending)
async function printAllUnpaidInvoices() {

  // Ensure this only runs on client side
  if (typeof window === 'undefined') return
  
  try {

    printing.value = true

    
    // Get the currently filtered data from the table
    const filteredInvoices = filteredRows.value
    
    // Filter to only unpaid and pending invoices
    const unpaidPendingInvoices = filteredInvoices.filter(invoice => 
      invoice.status?.toLowerCase() === 'unpaid' || invoice.status?.toLowerCase() === 'pending'
    )
    
    if (unpaidPendingInvoices.length === 0) {
      notification.warning('No Invoices', 'No unpaid or pending invoices found in the current filter.')
      return
    }
    
    // Generate thermal printer data for filtered invoices
    const thermalData = generateThermalDataForInvoices(unpaidPendingInvoices)
    
    // Dynamic import for client-side only usage
    const { generatePrintReportHTML } = await import('@/utils/printReport')
    
    
    // Create a new window with the thermal printer data

    const printWindow = window.open('', '_blank')

    if (printWindow) {

      const htmlContent = generatePrintReportHTML(thermalData)
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      

      // Don't auto-print on mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (!isMobile) {
        // Auto print after a short delay for desktop
      setTimeout(() => {

        printWindow.print()

        }, 1000)
      }
    }

    
    
    // Show success notification

    const toast = useToast()

    toast.add({

      title: 'Report Generated',
      description: `Generated report for ${unpaidPendingInvoices.length} invoices (${statusFilter.value || 'all statuses'}). Use the controls in the new window to print or save as PDF.`,
      color: 'green'

    })
    
    

  } catch (error: any) {

    console.error('Print error:', error)

    notification.error('Print Failed', error?.message || 'Failed to generate report')
  } finally {

    printing.value = false

  }

}

</script>



<template>

  <div class="flex justify-between items-center mb-4">

    <div class="flex gap-2 mb-4">

    <UButton label="Add Invoice" @click="OpenModalAddCustomer(false, null)" />

    <UButton 

      icon="refresh-cw" 

      color="gray" 

      variant="soft"

      :loading="isLoading"

      @click="getData"

      title="Refresh Data"

    />

  </div>

    <UButton 

      label="Print Filtered Report" 
      color="orange" 

      icon="printer"

      @click="openColumnSelector"

      :loading="printing"

    />

  </div>

  
  
  <!-- Filter Section -->

  <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">

      <!-- Customer Search Filter -->

      <div>

        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Customer</label>

        <UInput v-model="q" placeholder="Search customer..." />

      </div>

      
      
      <!-- Date Filter -->

      <div>

        <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>

        <UInput v-model="dateFilter" type="date" placeholder="Select date..." />

      </div>

      
      
      <!-- Status Filter -->

      <div>

        <label class="block text sm font-medium text-gray-700 mb-1">Filter by Status</label>

        <USelectMenu 

          v-model="statusFilter" 

          :options="[

            { label: 'All Status', value: '' },

            { label: 'Paid', value: 'paid' },

            { label: 'Unpaid', value: 'unpaid' },

            { label: 'Pending', value: 'pending' },
            { label: 'Unpaid + Pending', value: 'unpaid_pending' }
          ]"

          option-attribute="label"

          value-attribute="value"

          placeholder="Select status..."

        />

      </div>

      
      
      <!-- Clear Filters Button -->

      <div class="flex items-end">

        <UButton 

          @click="clearFilters" 

          color="gray" 

          variant="outline"

          class="w-full"

        >

          Clear Filters

        </UButton>

      </div>

    </div>

  </div>



  <UTable :rows="filteredRows" :columns="columns" :loading="isLoading">

    <template #actions-data="{ row }">

      <UDropdown :items="items(row)">

        <UButton

          color="gray"

          variant="ghost"

          icon="ellipsis-horizontal-20-solid"

        />

      </UDropdown>

    </template>

    <template #amount-data="{ row }">

      <p>{{ currency.formatIDR(row.amount) }}</p>

    </template>

    <template #total_paid-data="{ row }">

      <p>{{ currency.formatIDR(getTotalPaid(row)) }}</p>

    </template>

    <template #amount_due-data="{ row }">

      <p class="font-medium" :class="{

        'text-red-600': getAmountDue(row) > 0,

        'text-green-600': getAmountDue(row) <= 0

      }">{{ currency.formatIDR(getAmountDue(row)) }}</p>

    </template>

    <template #status-data="{ row }">

      <!-- Router job status badge (lazy load per row) -->

      <div class="mb-1" @mouseenter="ensureJobsLoaded(row.id)" @touchstart.passive="ensureJobsLoaded(row.id)">

        <template v-if="getRouterJobState(row.id).state === 'pending'">

          <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">

            Router update pending

          </span>

        </template>

        <template v-else-if="getRouterJobState(row.id).state === 'error'">

          <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">

            <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">

              Router update failed

            </span>

            <UButton size="2xs" color="red" variant="outline" @click.stop="retryRouterJobs(row.id)">Retry</UButton>

          </div>

        </template>

        <template v-else-if="getRouterJobState(row.id).state === 'success'">

          <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700">

            Router updated

          </span>

        </template>

      </div>

      <div class="space-y-2">

        <!-- Status Badge -->

        <div v-if="row.status === 'pending'" class="space-y-2">

          <button

            @click="openPartialPaymentModal(row)"

            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors cursor-pointer w-full justify-center"

            title="Click to make partial payment"

          >

            {{ row.status }}

            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>

            </svg>

          </button>

          
          
          <!-- Pending Reason Display -->

          <div v-if="row.pending_reason" class="mt-2 p-2 bg-yellow-50 dark:bg-black/70 border border-yellow-200 dark:border-yellow-700 rounded-lg">

            <div class="flex items-start gap-2">

              <svg class="w-4 h-4 text-yellow-200 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">

                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>

              </svg>

              <div class="flex-1">

                <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Pending Reason:</p>

                <p class="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">{{ row.pending_reason }}</p>

              </div>

            </div>

          </div>

          
          
          <!-- Mobile-friendly stacked buttons -->

          <div class="flex flex-col space-y-1 lg:flex-row lg:space-y-0 lg:space-x-1">

            <UButton size="xs" color="green" variant="soft" class="w-full lg:w-auto"

              @click="updateStatus(row.id, 'paid', row.status)">

              Mark Paid

            </UButton>

            <UButton size="xs" color="gray" variant="outline" class="w-full lg:w-auto"

              @click="updateStatus(row.id, 'unpaid', row.status)">

              Mark Unpaid

            </UButton>

          </div>

        </div>

        <div v-else-if="row.status === 'paid'">

          <!-- Show as disabled badge for paid status -->

          <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 cursor-not-allowed w-full justify-center">

            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">

              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>

            </svg>

            {{ row.status }}

          </span>

        </div>

        <div v-else-if="row.status === 'unpaid'" class="space-y-2">

          <!-- Mobile-friendly stacked buttons -->

          <div class="flex flex-col space-y-1 lg:flex-row lg:space-y-0 lg:space-x-1">

            <UButton size="xs" color="green" variant="soft" class="w-full lg:w-auto"

              @click="updateStatus(row.id, 'paid', row.status)">

              Mark Paid

            </UButton>

            <UButton size="xs" color="yellow" variant="soft" class="w-full lg:w-auto"

              @click="updateStatus(row.id, 'pending', row.status)">

              Mark Pending

            </UButton>

          </div>

        </div>

        
        
        <!-- PDF Viewed Indicator -->

        <div v-if="isPdfViewed(row.id)" class="flex items-center text-xs text-red-600 justify-center">

          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">

            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path>

          </svg>

          PDF Sudah Dilihat

        </div>

      </div>

    </template>

    <template #invoice_date-data="{ row }">

      <span>{{ row.invoice_date ? row.invoice_date : '-' }}</span>

    </template>

    <template #due_date-data="{ row }">

      <span>{{ row.due_date ? row.due_date : '-' }}</span>

    </template>

  </UTable>



  <div

    class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"

  >

    <UPagination

      v-model="page"

      :page-count="pageCount"

      :total="(customer && customer.length) ? customer.length : 0"

    />

  </div>



  <!-- Partial Payment Modal -->

  <PartialPaymentModal

    v-if="showPartialPaymentModal && selectedInvoiceForPayment"

    :invoice="selectedInvoiceForPayment"

    @close="closePartialPaymentModal"

    @success="handlePaymentSuccess"

  />



  <!-- Status Confirmation Modal -->

  <UModal v-model="showStatusConfirmationModal">

    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">

      <template #header>

        <div class="flex items-center gap-3">

          <div class="flex-shrink-0">

            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">

              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>

              </svg>

            </div>

          </div>

          <div>

            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">

              Konfirmasi Perubahan Status

            </h3>

            <p class="text-sm text-gray-500 dark:text-gray-400">

              Anda akan mengubah status pembayaran invoice

            </p>

          </div>

        </div>

      </template>



      <div class="p-6">

        <div v-if="statusConfirmationData" class="space-y-4">

          <!-- Invoice Information -->

          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">

            <h4 class="font-medium text-gray-900 dark:text-white mb-3">Detail Invoice</h4>

            <div class="grid grid-cols-2 gap-4 text-sm">

              <div>

                <span class="text-gray-500 dark:text-gray-400">Customer:</span>

                <p class="font-medium text-gray-900 dark:text-white">{{ statusConfirmationData.invoiceData?.customer?.name || 'N/A' }}</p>

              </div>

              <div>

                <span class="text-gray-500 dark:text-gray-400">Amount:</span>

                <p class="font-medium text-gray-900 dark:text-white">{{ currency.formatIDR(statusConfirmationData.invoiceData?.amount || 0) }}</p>

              </div>

              <div>

                <span class="text-gray-500 dark:text-gray-400">Status Saat Ini:</span>

                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"

                      :class="{

                        'bg-red-100 text-red-800': statusConfirmationData.currentStatus === 'unpaid',

                        'bg-yellow-100 text-yellow-800': statusConfirmationData.currentStatus === 'pending',

                        'bg-green-100 text-green-800': statusConfirmationData.currentStatus === 'paid'

                      }">

                  {{ statusConfirmationData.currentStatus?.toUpperCase() }}

                </span>

              </div>

              <div>

                <span class="text-gray-500 dark:text-gray-400">Status Baru:</span>

                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">

                  {{ statusConfirmationData.newStatus?.toUpperCase() }}

                </span>

              </div>

            </div>

          </div>



          <!-- Warning Message -->

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">

            <div class="flex">

              <div class="flex-shrink-0">

                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">

                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>

                </svg>

              </div>

              <div class="ml-3">

                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">

                  Peringatan Penting

                </h3>

                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">

                  <p>

                    Setelah status diubah menjadi <strong>PAID</strong>, status ini tidak dapat diubah kembali. 

                    Pastikan pembayaran sudah benar-benar diterima sebelum melanjutkan.

                  </p>

                </div>

              </div>

            </div>

          </div>



          <!-- Confirmation Question -->

          <div class="text-center">

            <p class="text-lg font-medium text-gray-900 dark:text-white">

              Apakah Anda yakin ingin mengubah status pembayaran menjadi <span class="text-green-600 font-bold">PAID</span>?

            </p>

            <p class="text-sm text-blue-600 dark:text-blue-400 mt-2">

              💡 PDF invoice akan terbuka otomatis setelah konfirmasi

            </p>

          </div>

        </div>

      </div>



      <template #footer>

        <div class="flex justify-end gap-3">

          <UButton

            color="gray"

            variant="soft"

            @click="cancelStatusChange"

          >

            Batal

          </UButton>

          <UButton

            color="green"

            @click="confirmStatusChange"

            class="bg-green-600 hover:bg-green-700"

          >

            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>

            </svg>

            Ya, Ubah Status

          </UButton>

        </div>

      </template>

    </UCard>

  </UModal>



  <!-- Start Recurring Modal -->

  <UModal v-model="showStartRecurringModal">

    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">

      <template #header>

        <h3 class="text-lg font-semibold">Start Recurring Invoice</h3>

      </template>

      <div class="space-y-4 p-2">

        <UFormGroup label="Invoice Date" required>

          <UInput v-model="recurringForm.invoice_date" type="date" />

        </UFormGroup>

        <UFormGroup label="Due Date" required>

          <UInput v-model="recurringForm.due_date" type="date" />

        </UFormGroup>

        <UFormGroup label="Frequency" required>

          <USelectMenu v-model="recurringForm.frequency"

            :options="[

              { label: 'Monthly', value: 'monthly' },

              { label: 'Quarterly', value: 'quarterly' },

              { label: 'Yearly', value: 'yearly' }

            ]" option-attribute="label" value-attribute="value" />

        </UFormGroup>

        <UFormGroup label="Description">

          <UTextarea v-model="recurringForm.description" :rows="3" />

        </UFormGroup>

      </div>

      <template #footer>

        <div class="flex justify-end gap-2">

          <UButton color="gray" variant="soft" @click="closeStartRecurringModal">Cancel</UButton>

          <UButton color="green" @click="createRecurringFromInvoice">Start</UButton>

        </div>

      </template>

    </UCard>

  </UModal>

  <!-- Column Selector Modal for Print Report -->
  <UModal v-model="showColumnSelector">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Select Columns to Print</h3>
          <UButton
            :icon="allColumnsSelected ? 'i-heroicons-x-mark' : 'i-heroicons-check'"
            color="gray"
            variant="ghost"
            size="sm"
            @click="toggleSelectAllColumns"
            :title="allColumnsSelected ? 'Unselect All' : 'Select All'"
          >
            {{ allColumnsSelected ? 'Unselect All' : 'Select All' }}
          </UButton>
        </div>
      </template>

      <div class="space-y-3 p-4">
        <div 
          v-for="column in availableColumns" 
          :key="column.key"
          class="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
          @click="toggleColumn(column.key)"
        >
          <UCheckbox
            :model-value="selectedColumns.has(column.key)"
            @update:model-value="toggleColumn(column.key)"
            class="pointer-events-none"
          />
          <label class="flex-1 cursor-pointer text-sm font-medium">
            {{ column.label }}
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="showColumnSelector = false"
          >
            Cancel
          </UButton>
          <UButton
            color="orange"
            @click="proceedWithPrint"
            :disabled="selectedColumns.size === 0"
          >
            Print Report
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>

</template>

