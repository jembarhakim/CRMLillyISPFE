<script setup lang="ts">
import { accountAdminApi } from "@/api/admin/account";
import FormAddComponent from "./FormAddComponent.vue";
import { transactionAdminApi } from "@/api/admin/transaction";
import { formatIDR } from "@/helper/currency";
import { formatDateToYMD } from "@/helper/date";

const transaction = ref<any[]>([]);
const isLoading = ref(false);

const page = ref(1);
const pageCount = 10; // Increased from 5 to 10 for better UX

const q = ref("");

// Make peopleData reactive
const peopleData = computed(() => transaction.value);

// const filteredRows = computed(() => {
//     if (!q.value) {

//         return transaction.slice((page.value - 1) * pageCount, page.value * pageCount);
//     }

//     const newData = transaction.filter((transaction) => {
//         return Object.values(transaction).some((value) => {
//             // person with paginate
//             return String(value).toLowerCase().includes(q.value.toLowerCase());
//         });
//     });

//     return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
// });
const columns = [
  {
    key: "number",
    label: "Number",
  },
  {
    key: "createdAt",
    label: "date",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "type_in_out",
    label: "Type",
  },
  {
    key: "amount",
    label: "Amount",
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "Dr",
    label: "Debit",
  },
  {
    key: "Cr",
    label: "Credit",
  },
  {
    key: "actions",
    label: "Actions",
  },
];
const isOpen = ref(false);

const toast = useToast();
const modal = useModal();
function openModal() {
  isOpen.value = true;
  modal.open(FormAddComponent, {
    onSuccess() {
      console.log("Transaction added successfully");
      modal.close();
      fetchAllAccount(); // Refresh the data
      toast.add({
        title: "Success!",
        description: "Transaction added successfully",
        color: "green",
        id: "modal-success",
        ui: { position: "top-right" },
      });
    },
  });
}

async function fetchAllAccount() {
  isLoading.value = true;
  try {
    const response = await transactionAdminApi().getAllTransactions({});
    
    response.data.forEach((item: any, index: number) => {
      item.number = index + 1;
      item.createdAt = formatDateToYMD(item.createdAt);
      item.type_in_out = item.type_in_out === "debit" ? "Debit" : "Credit";
      item.Dr = item.type_in_out !== "Debit" ? "-" : formatIDR(item.amount);
      item.Cr = item.type_in_out !== "Credit" ? "-" : formatIDR(item.amount);
      item.balance = formatIDR(item.account.saldo);
    });
    
    transaction.value = [...response.data];
  } catch (err) {
    useToast().add({
      title: "Error fetching transactions",
      description: err instanceof Error ? err.message : "Unknown error",
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
}
await fetchAllAccount();
const rows = computed(() => {
    if (!q.value) {
        return transaction.value.slice((page.value - 1) * pageCount, page.value * pageCount);
    }

    const newData = transaction.value.filter((item) => {
        return Object.values(item).some((value) => {
            return String(value).toLowerCase().includes(q.value.toLowerCase());
        });
    });

    return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

// Function to handle edit action
const editTransaction = (row: any) => {
  console.log('Edit transaction:', row);
  // Add your edit logic here
};

// Function to handle delete action
const deleteTransaction = async (row: any) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      // Add your delete API call here
      console.log('Delete transaction:', row);
      await fetchAllAccount(); // Refresh data
      useToast().add({
        title: "Transaction deleted successfully",
        color: "green",
      });
    } catch (err) {
      useToast().add({
        title: "Error deleting transaction",
        color: "red",
      });
    }
  }
};
</script>

<template>
  <div class="flex justify-between items-center px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center space-x-2">
      <UInput v-model="q" placeholder="Search transactions..." class="w-64" />
      <UButton
        label="Add Transaction"
        icon="i-lucide-plus"
        color="green"
        @click="openModal"
      />
      <UButton
        icon="i-lucide-refresh-cw"
        color="gray"
        variant="soft"
        :loading="isLoading"
        @click="fetchAllAccount"
        title="Refresh"
      />
    </div>
    <UButton
      label="Generate PDF"
      icon="i-lucide-file-arrow-down"
      color="blue"
      @click="navigateTo('/dashboard/psf')"
    />
  </div>
  <UTable :rows="rows" :columns="columns" :loading="isLoading">
    <template #amount-data="{ row }">
      <p>{{ formatIDR(row.amount) }}</p>
    </template>
    <template #createdAt-data="{ row }">
      <p>{{ formatDateToYMD(row.createdAt) }}</p>
    </template>
    <template #name-data="{ row }">
      <p>{{ row.account.name }}</p>
    </template>
    <template #actions-data="{ row }">
      <div class="flex space-x-2">
        <UButton 
          size="xs" 
          color="green" 
          variant="soft"
          icon="i-lucide-pencil"
          @click="editTransaction(row)"
          title="Edit"
        />
        <UButton 
          size="xs" 
          color="red" 
          variant="soft"
          icon="i-lucide-trash-2"
          @click="deleteTransaction(row)"
          title="Delete"
        />
      </div>
    </template>
  </UTable>

  <div
    class="flex justify-between items-center px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="text-sm text-gray-600">
      Showing {{ (page - 1) * pageCount + 1 }} to {{ Math.min(page * pageCount, transaction.length) }} of {{ transaction.length }} transactions
    </div>
    <UPagination
      v-model="page"
      :page-count="pageCount"
      :total="transaction.length"
      :max-visible="5"
    />
  </div>
</template>
