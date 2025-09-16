<script setup lang="ts">
import { archiveInstallationAdminApi } from '@/api/admin/archive-installation';
import { customerAdminApi } from '@/api/admin/customer';
import FormCustomerInstallation from './FormCustomerInstallation.vue';
import ImageViewComponent from './ImageViewComponent.vue';
import CustomerSelectionModal from './CustomerSelectionModal.vue';


const dataList = ref([]);
const columns = [
  { key: "customer", label: "Customer" },
  { key: "technician", label: "Technician" },
  { key: "date", label: "Date Installation" },
  {
    key:"actions",
    label: "Actions",
  }
];
const q = ref("");
const page = ref(1);
const pageCount = 5;

const modal = useModal()
const customerModal = useModal()
const allCustomers = ref<any[]>([]);
const selectedCustomer = ref<any>(null);

function handleClick(row:any) {
  modal.open(ImageViewComponent, {
    image: row.images.map((item:any) => useApiHost()+"/"+item.full_path),
    onClose: () => {
      modal.close();
    },
  });
}

// Function to open customer selection modal
async function openCustomerSelection() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    allCustomers.value = response.data;
    customerModal.open(CustomerSelectionModal, {
      customers: allCustomers.value,
      onSelect: (customer: any) => {
        selectedCustomer.value = customer;
        customerModal.close();
        // Open installation form with selected customer
        modal.open(FormCustomerInstallation, {
          data: customer,
          onClose: () => {
            modal.close();
          },
        });
      },
      onClose: () => {
        customerModal.close();
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    useToast().add({
      title: "Failed to load customers",
      color: "red",
    });
  }
}


async function getData() {
  try {
    const res = await archiveInstallationAdminApi().getAllArchiveInstallation();
    res.data.map((item:any) => {
      item.customer = item.customer.name;
      item.technician = item.technician.name;
      item.date = item.date.split("T")[0];
    });
    dataList.value = res.data;
  } catch (err) {
    console.log(err);
  }
}

// Expose refresh function for parent components
defineExpose({
  refreshData: getData
});

const rows = computed(() => {
    if (!q.value) {
        return dataList.value.slice((page.value - 1) * pageCount, page.value * pageCount);
    }

    const newData = dataList.value.filter((data) => {
        return Object.values(data).some((value) => {
            return String(value).toLowerCase().includes(q.value.toLowerCase());
        });
    });

    return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

getData();
</script>

<template>
        <div
          class="flex justify-between items-center px-3 py-3.5 border-b border-gray-200 dark:border-gray-700"
        >
          <UInput v-model="q" placeholder="Search" class="flex-1 max-w-md" />
          <UButton 
            @click="openCustomerSelection" 
            color="green" 
            icon="i-heroicons-plus"
            class="ml-4"
          >
            Add New Installation
          </UButton>
        </div>
        <UTable :rows="rows" :columns="columns">

            <template #actions-data="{ row }">
                <UButton @click="handleClick(row)">View Image</UButton>
            <!-- <UDropdown>
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
            </UDropdown> -->
        </template>
        </UTable>

        <div
          class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
        >
          <UPagination
            v-model="page"
            :page-count="pageCount"
            :total="dataList.length"
          />
        </div>
</template>