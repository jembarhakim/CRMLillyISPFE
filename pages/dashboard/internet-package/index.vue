<script setup lang="ts">
import FormAddComponent from "./FormAddComponent.vue";
import LucideIcon from "@/components/LucideIcon.vue";
import { internetPackageAdminApi } from "@/api/admin/internet-package";
import { formatIDR } from "@/helper/currency";
import { useCustomToast } from "@/composables/useCustomToast";
// Set page title
useHead({
    title: "Internet Package Management - CRM System",
});

const internetPackages = ref<any[]>([]); // Use ref for reactivity
const internetPackageList = computed(() => {
    if (!q.value) {
        return internetPackages.value.slice(
            (page.value - 1) * pageCount,
            page.value * pageCount,
        );
    }

    const newData = internetPackages.value.filter((transaction) => {
        return Object.values(transaction).some((value) => {
            return String(value).toLowerCase().includes(q.value.toLowerCase());
        });
    });

    return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});
const column = [
    {
        key: "number",
        label: "Number",
    },
    {
        key: "name",
        label: "Name",
    },
    {
        key: "price",
        label: "Price",
    },
    {
        key: "description",
        label: "Description",
    },
    {
        key: "actions",
        label: "Action",
    },
];

async function fetchData() {
    await internetPackageAdminApi()
        .getAllInternetPacket()
        .then((response) => {
            internetPackages.value = response.data.map(
                (product: any, index: number) => ({
                    ...product,
                    number: index + 1,
                }),
            );
            console.log(internetPackages);
        })
        .catch((error) => {
            console.error("Error fetching companies:", error);
        });
}

async function deletePacket(id: string) {
    await internetPackageAdminApi()
        .deleteInternetPacket(id)
        .then((response) => {
            useCustomToast().add({
                title: "Success Delete Product",
            });

            fetchData();
        })
        .catch((error) => {
            useCustomToast().add({
                title: "Failed Delete Product",
                color: "red",
            });
        });
}

await fetchData();

const page = ref(1);
const pageCount = 5;
const q = ref("");

const isOpen = ref(false);
const modal = useModal();

function openModal(isEdit: boolean, data: any) {
    modal.open(FormAddComponent, {
        isEdit: isEdit,
        data: data,
        async onSuccess() {
            try {
                await fetchData();
                console.log("Data fetched successfully:");
                modal.close();
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Optionally show an error message to the user
                // For example, update FormAddComponent state to display error
                modal.close(); // Close modal or keep open based on your needs
            }
        },
    });
}
const items = (row: any) => [
    [
        {
            label: "Edit",
            icon: "pencil-square-20-solid",
            click: () => openModal(true, row),
        },
    ],
    [
        {
            label: "Delete",
            icon: "trash-2-20-solid",
            click: () => deletePacket(row.id.toString()),
        },
    ],
];
</script>

<template>
    <div class="space-y-5">
        <AdminPageHeader
            title="Internet Package"
            description="Atur paket layanan internet, harga, dan detail produk."
            icon="wifi"
            eyebrow="Produk & Layanan"
        >
            <template #actions>
                <UButton label="Tambah Paket" @click="openModal(false, null)">
                    <template #leading>
                        <LucideIcon name="plus" :size="16" />
                    </template>
                </UButton>
            </template>
        </AdminPageHeader>

        <section class="admin-data-panel">
            <div class="admin-data-toolbar">
                <div>
                    <h2 class="text-sm font-semibold text-gray-900">Daftar Paket Internet</h2>
                    <p class="mt-1 text-xs text-gray-500">{{ internetPackages.length }} paket tersedia</p>
                </div>
                <UInput v-model="q" placeholder="Cari paket..." class="w-full sm:max-w-xs" />
            </div>
            <div class="admin-data-table">
                <UTable :rows="internetPackageList" :columns="column">
                    <template #actions-data="{ row }">
                        <UDropdown :items="items(row)">
                            <button
                                type="button"
                                class="bg-gray-700 text-white px-2 py-1 text-sm hover:bg-gray-600 rounded inline-flex items-center justify-center shadow-sm transition-colors duration-200 group"
                                aria-label="Actions"
                            >
                                <LucideIcon
                                    name="ellipsis-vertical"
                                    class="text-white"
                                    :size="18"
                                />
                            </button>
                        </UDropdown>
                    </template>
                    <template #price-data="{ row }">
                        <p class="font-medium text-gray-900">{{ formatIDR(row.price) }}</p>
                    </template>
                </UTable>
            </div>

            <div class="flex justify-end border-t border-gray-100 px-4 py-3">
                <UPagination
                    v-model="page"
                    :page-count="pageCount"
                    :total="internetPackages.length"
                />
            </div>
        </section>
    </div>

    <!-- <div>
        <UModal v-model="isOpen">
            <div class="p-4">
                <Placeholder class="h-48" />
                <FormAddComponent></FormAddComponent>
            </div>
        </UModal>
    </div> -->
</template>
