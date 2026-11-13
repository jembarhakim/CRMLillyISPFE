<script setup lang="ts">
import { defaultAreaData, type Area } from "./area.model";
import AddAreaFrom from "./AddAreaForm.vue";
import { areaAdminApi } from "@/api/admin/area";
import AddAreaForm from "./AddAreaForm.vue";
import { useNotification } from '@/composables/useNotification';
import LucideIcon from '@/components/LucideIcon.vue';

// Set page title
useHead({
  title: 'Manajemen Wilayah - CRM'
})

const notification = useNotification();

const area = ref<any[]>([]);
const areaList = computed(()=>{
    if (!q.value) {
    areaData = area;
    return areaData.value.slice((page.value - 1) * pageCount, page.value * pageCount);
  }

  const newData = area.value.filter((oneArea) => {
    return Object.values(oneArea).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase());
    });
  });

  return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
})
const columns = [
  {
    key: "name_city",
    label: "Kota",
  },
  {
    key: "name_subdistrict",
    label: "Kecamatan",
  },
  {
    key: "name_village",
    label: "Desa/Kelurahan",
  },
  {
    key: "code_name",
    label: "Kode Wilayah",
  },
  {
    key: "actions",
    label: "Tindakan",
  },
];

async function fetchData() {
  await areaAdminApi().getAllAreas().then((response) => {
    area.value = response.data
  }).catch((error) => { })
}

await fetchData()
const page = ref(1);
const pageCount = 5;

const q = ref("");

let areaData: any;

const filteredRows = computed(() => {
  if (!q.value) {
    areaData = area;
    return areaData.value.slice((page.value - 1) * pageCount, page.value * pageCount);
  }

  const newData = area.value.filter((oneArea) => {
    return Object.values(oneArea).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase());
    });
  });
  // areaData = newData;
  return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

const isOpen = ref(false);

function openModal(isEdit: boolean, data: any) {
  useModal().open(AddAreaForm, {
    isEdit,
    data,
    async onSuccess() {
      await fetchData()
      useModal().close()
    }
  })
}

async function deleteData(id: string){
  await areaAdminApi().deleteArea(id).then((response) => {
    notification.success('Berhasil', 'Wilayah berhasil dihapus')
    fetchData()
  }).catch((error) => {
    notification.error('Gagal', 'Gagal menghapus wilayah')
  })
}
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Wilayah"
      description="Kelola data kota, kecamatan, desa, dan kode area layanan."
      icon="map"
      eyebrow="Wilayah Layanan"
    >
      <template #actions>
        <UButton color="blue" label="Tambah Area" @click="openModal(false,null)">
          <template #leading>
            <LucideIcon name="plus" :size="16" />
          </template>
        </UButton>
      </template>
    </AdminPageHeader>

    <section class="admin-data-panel">
      <div class="admin-data-toolbar">
        <div>
          <h2 class="text-sm font-semibold text-gray-900">Daftar Area</h2>
          <p class="mt-1 text-xs text-gray-500">{{ area.length }} area terdaftar</p>
        </div>
        <UInput v-model="q" placeholder="Cari area..." class="w-full sm:max-w-xs" />
      </div>

      <div class="admin-data-table">
        <UTable :rows="filteredRows" :columns="columns">
          <template #code_name-data="{ row }">
            <span class="inline-flex items-center rounded-full bg-[#F9EBEB] px-2.5 py-0.5 text-xs font-medium text-[#A93133]">
              {{ row.code_name || 'N/A' }}
            </span>
          </template>
          <template #actions-data="{ row }">
            <div class="flex flex-wrap gap-2">
              <UButton color="gray" label="Ubah" @click="openModal(true,row)">
                <template #leading>
                  <LucideIcon name="pencil" :size="16" />
                </template>
              </UButton>
              <UButton color="red" label="Hapus" @click="deleteData(row.id)">
                <template #leading>
                  <LucideIcon name="trash" :size="16" />
                </template>
              </UButton>
            </div>
          </template>
        </UTable>
      </div>

      <div class="flex justify-end border-t border-gray-100 px-4 py-3">
        <UPagination v-model="page" :page-count="pageCount" :total="area.length" />
      </div>
    </section>

    <UModal v-model="isOpen">
      <div class="p-4">
        <Placeholder class="h-48" />
        <AddAreaFrom />
      </div>
    </UModal>
  </div>
</template>
