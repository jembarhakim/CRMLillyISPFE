<script setup lang="ts">
import { invoiceAdminApi } from "@/api/admin/invoice";
import FormAddComponent from "./FormAddInvoice.vue";
import PartialPaymentModal from "./PartialPaymentModal.vue";
import * as currency from "@/helper/currency";
import type { UpdateStatusInvoiceRequest } from "@/types/requests/invoice";
import { WhatsappApi } from "@/api/admin/wa";
let customer = ref<any[]>([]);

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
  invoiceAdminApi()
    .getAllInvoices()
    .then((response) => {
      response.data.forEach((invoice: any) => {
        invoice.number = response.data.indexOf(invoice) + 1;
        invoice.created_at = invoice.created_at.split("T")[0];
        
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
      });

      customer.value = [...response.data];
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });
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
  invoiceAdminApi()
    .updateStatusInvoice(id, { status })
    .then((response) => {
      useToast().add({
        title: response.message,
        color: "green",
      });
      // Update the specific invoice in the local array instead of refreshing all data
      const invoiceIndex = customer.value.findIndex(inv => inv.id === id);
      if (invoiceIndex !== -1) {
        customer.value[invoiceIndex].status = status;
      }
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
      // Revert the status back to original on error
      const invoiceIndex = customer.value.findIndex(inv => inv.id === id);
      if (invoiceIndex !== -1) {
        customer.value[invoiceIndex].status = currentStatus;
      }
    });
}

// Handle confirmation modal actions
function confirmStatusChange() {
  if (statusConfirmationData.value) {
    proceedWithStatusUpdate(
      statusConfirmationData.value.invoiceId,
      statusConfirmationData.value.newStatus,
      statusConfirmationData.value.currentStatus
    );
  }
  closeStatusConfirmationModal();
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

async function sendWhatsapp(number: string, id: string) {
  WhatsappApi()
    .sendWhatsapp({
      number,
      message:
        `berikut invoice yang harus anda bayarkan sekarang \n\nKami berikan Link untuk melihat invoice \n\nhttps://skripsi.rtrsite.com/invoice/${id} \n\nSilahkan menuju dashboard login customer kami https://skripsi.rtrsite.com/login \n\nTerimakasih`,
    })
    .then((response) => {
      useToast().add({
        title: response.message,
        color: "green",
      });
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });
}

async function deleteData(id: string) {
  await invoiceAdminApi()
    .deleteInvoice(id)
    .then((response) => {
      getData();
      useToast().add({
        title: response.message,
      });
    })
    .catch((err) => {
      useToast().add({
        title: err,
        color: "red",
      });
    });
}

await getData();

const columns = [
  {
    key: "number",
    label: "Number",
  },
  {
    key: "customer.name",
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
    key: "created_at",
    label: "Date",
  },
  {
    key: "actions",
    label: "Actions",
  },
];

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

const filteredRows = computed(() => {
    if (!q.value) {
        return customer.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
    }

    const newData = customer.value.filter((person) => {
        return Object.values(person).some((value) => {
            // person with paginate
            return String(value).toLowerCase().includes(q.value.toLowerCase())
        })
    })
    return newData.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})

const items = (row: any) => [
  [
    {
      label: "Send Whatsapp",
      icon: "i-heroicons-chat-bubble-left-ellipsis-20-solid",
      click: () => sendWhatsapp(row.customer.phone, row.id),
    },
    {
      label: "Download PDF",
      icon: "i-heroicons-arrow-down-on-square-20-solid",
      click: () => navigateTo(`/invoice/${row.id}`),
    },
    {
      label: "Edit",
      icon: "i-heroicons-pencil-20-solid",
      click: () => OpenModalAddCustomer(true, row),
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-heroicons-trash-20-solid",
      click: () => deleteData(row.id),
    },
  ],
];

const toast = useToast();
const modal = useModal();

function OpenModalAddCustomer(isEdit: boolean, data: any) {
  console.log("Open Modal");
  modal.open(FormAddComponent, {
    isEdit,
    data,
    async onSuccess() {
      await getData();
      modal.close();
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
</script>

<template>
  <UButton label="Add Invoice" @click="OpenModalAddCustomer(false, null)" />
  <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
    <UInput v-model="q" placeholder="Filter customer..." />
  </div>

  <UTable :rows="filteredRows" :columns="columns">
    <template #actions-data="{ row }">
      <UDropdown :items="items(row)">
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-ellipsis-horizontal-20-solid"
        />
      </UDropdown>
    </template>
    <template #amount-data="{ row }">
      <p>{{ currency.formatIDR(row.amount) }}</p>
    </template>
    <template #total_paid-data="{ row }">
      <p>{{ currency.formatIDR(row.total_paid) }}</p>
    </template>
    <template #amount_due-data="{ row }">
      <p class="font-medium" :class="{
        'text-red-600': row.amount_due > 0,
        'text-green-600': row.amount_due <= 0
      }">{{ currency.formatIDR(row.amount_due) }}</p>
    </template>
    <template #status-data="{ row }">
      <div v-if="row.status === 'pending'">
        <button
          @click="openPartialPaymentModal(row)"
          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors cursor-pointer"
          title="Click to make partial payment"
        >
          {{ row.status }}
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
      <div v-else-if="row.status === 'paid'">
        <!-- Show as disabled badge for paid status -->
        <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 cursor-not-allowed">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          {{ row.status }}
        </span>
      </div>
      <div v-else>
        <USelectMenu
          :model-value="row.status"
          :options="[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Unpaid', value: 'unpaid' },
          ]"
          @update:model-value="(newStatus) => {
            const originalStatus = row.status;
            updateStatus(row.id, newStatus, originalStatus);
          }"
          value-attribute="value"
          option-attribute="label"
        />
      </div>
    </template>
  </UTable>

  <div
    class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
  >
    <UPagination
      v-model="page"
      :page-count="pageCount"
      :total="customer.length"
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
</template>
