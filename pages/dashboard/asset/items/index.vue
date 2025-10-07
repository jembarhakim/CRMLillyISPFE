<script setup lang="ts">
import { assetItemAdminApi } from '@/api/admin/asset-item'
import { assetAdminApi } from '@/api/admin/asset'
import FormAddAssetItemComponent from './AddAssetItemForm.vue'
import { defaultAssetItems } from './asset-item.model'
import { tableColumns } from './table'
import { format } from 'date-fns'

// Set page title
useHead({
  title: 'Asset Items Management - CRM System'
})

const page = ref(1)
const pageCount = 10

const q = ref('')
const selectedAssetId = ref('')

let assetItemData: any = defaultAssetItems
let assets: any = ref([])

const filteredRows = computed(() => {
    if (!q.value && !selectedAssetId.value) {
        return defaultAssetItems.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
    }

    let filteredData = defaultAssetItems.value

    if (selectedAssetId.value) {
        filteredData = filteredData.filter((item: any) => item.asset_id === selectedAssetId.value)
    }

    if (q.value) {
        filteredData = filteredData.filter((item: any) => {
            return Object.values(item).some((value) => {
                return String(value).toLowerCase().includes(q.value.toLowerCase())
            })
        })
    }

    return filteredData.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})

function formatDate(dateString: string) {
    if (!dateString) return 'No Date'
    try {
        const date = new Date(dateString)
        return format(date, 'MMM dd, yyyy')
    } catch (error) {
        return 'Invalid Date'
    }
}

async function getData() {
    await assetItemAdminApi().getAssetItems().then((response) => {
        response.data.forEach((item: any) => {
            item.number = response.data.indexOf(item) + 1;
        });

        defaultAssetItems.value = [...response.data]
    }).catch()
}

async function getAssets() {
    await assetAdminApi().getAllAssets().then((response) => {
        assets.value = response.data.map((asset: any) => ({
            label: `${asset.brand} ${asset.model} (${asset.type})`,
            value: asset.id
        }))
    }).catch()
}

async function deleteAssetItem(itemId: string) {
    await assetItemAdminApi().deleteAssetItem(itemId).then((response) => {
        useToast().add({
            title: response.message
        })
        getData()
    }).catch((err) => {
        useToast().add({
            title: err,
            color: "red"
        })
        getData()
    })
}

await Promise.all([getData(), getAssets()])

// Handle URL parameters for editing and filtering
const route = useRoute()
if (route.query.asset_id) {
    selectedAssetId.value = route.query.asset_id as string
}
if (route.query.edit) {
    // Find the item to edit
    const itemToEdit = defaultAssetItems.value.find((item: any) => item.id === route.query.edit)
    if (itemToEdit) {
        OpenModalAddAssetItem(true, itemToEdit)
    }
}

const isOpen = ref(false)

const toast = useToast()
const modal = useModal()

function OpenModalAddAssetItem(isEdit: boolean, data: any) {
    modal.open(FormAddAssetItemComponent, {
        isEdit,
        data,
        assets: assets.value,
        async onSuccess() {
            await getData()
            modal.close()
        }
    })
}

const items = (row: any) => [
    [{
        label: 'Edit',
        icon: 'i-heroicons-pencil-square-20-solid',
        click: () => OpenModalAddAssetItem(true, row)
    }, {
        label: 'Delete',
        icon: 'i-heroicons-trash-20-solid',
        click: () => deleteAssetItem(row.id)
    }]
]

</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Asset Items Management</h1>
            <UButton label="Add Asset Item" @click="OpenModalAddAssetItem(false, null)" />
        </div>

        <div class="flex gap-4 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
            <UInput v-model="q" placeholder="Filter asset items..." class="flex-1" />
            <USelect 
                v-model="selectedAssetId" 
                :options="assets" 
                placeholder="Filter by Asset"
                class="w-64"
            />
        </div>

        <div class="table-scroll-container">
            <div class="table-scroll-content">
                <UTable :columns="tableColumns" :rows="filteredRows" class="dashboard-table">
                    <template #asset-data="{ row }">
                        <span>{{ row.asset?.brand }} {{ row.asset?.model }}</span>
                    </template>
                    <template #status-data="{ row }">
                        <UBadge 
                            :color="row.status === 'in_stock' ? 'green' : row.status === 'in_use' ? 'blue' : row.status === 'maintenance' ? 'yellow' : row.status === 'damaged' ? 'red' : 'gray'"
                            :label="row.status.replace('_', ' ').toUpperCase()"
                        />
                    </template>
                    <template #created_at-data="{ row }">
                        <span>{{ formatDate(row.created_at) }}</span>
                    </template>
                    <template #actions-data="{ row }">
                        <UDropdown :items="items(row)">
                            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
                        </UDropdown>
                    </template>
                </UTable>
            </div>
            <div class="table-scroll-footer">
                <span class="scroll-hint">↔ Scroll horizontally to see more columns | ↕ Scroll vertically for more rows</span>
            </div>
        </div>

        <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
            <UPagination v-model="page" :page-count="pageCount" :total="assetItemData.length" />
        </div>
    </div>
</template>
