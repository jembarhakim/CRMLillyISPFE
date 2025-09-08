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

async function updateStatus(id: string, status: string) {
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
    });
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
      <div v-else>
        <USelectMenu
          v-model="row.status"
          :options="[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Unpaid', value: 'unpaid' },
          ]"
          @change="updateStatus(row.id, row.status)"
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
</template>
