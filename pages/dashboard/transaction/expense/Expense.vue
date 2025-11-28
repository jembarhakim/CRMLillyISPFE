<script setup lang="ts">
import LucideIcon from "@/components/LucideIcon.vue";
import { formatIDR } from "@/helper/currency";
import FormExpense from "./FormExpense.vue";
import { transactionAdminApi } from "@/api/admin/transaction";
import { useCustomToast } from "@/composables/useCustomToast";

// Set page title
useHead({
    title: "Expense Transaction - CRM System",
});

const props = defineProps<{
    data: any[];
    refresh?: () => Promise<void>;
    type?: any;
}>();
const rows = ref(props.data ?? []);

watch(
    () => props.data,
    (newData) => {
        rows.value = newData ?? [];
    },
    { immediate: true },
);

type User = {
    id: number;
    username: string;
    fullName: string;
    Type: string;
};
const columns = [
    { key: "number", label: "Number" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "category", label: "Category" },
    { key: "method", label: "Method" },
];
const q = ref("");
const methodFilter = ref("all");
const categoryFilter = ref("all");
const page = ref(1);
const pageCount = 5;

const normalizedExpenses = computed(() => {
    return (rows.value || []).map((transaction) => {
        const normalizedMethod = (transaction?.method || "")
            .toString()
            .toLowerCase();
        const normalizedCategory = (transaction?.category || "")
            .toString()
            .toLowerCase();

        return {
            ...transaction,
            normalizedMethod,
            normalizedCategory,
        };
    });
});

const filteredExpenses = computed(() => {
    let data = normalizedExpenses.value;

    if (q.value) {
        const query = q.value.toLowerCase();
        data = data.filter((transaction) => {
            return Object.values(transaction).some((value) => {
                return String(value ?? "")
                    .toLowerCase()
                    .includes(query);
            });
        });
    }

    if (methodFilter.value !== "all") {
        data = data.filter(
            (transaction) => transaction.normalizedMethod === methodFilter.value,
        );
    }

    if (categoryFilter.value !== "all") {
        data = data.filter(
            (transaction) =>
                transaction.normalizedCategory === categoryFilter.value,
        );
    }

    return data;
});

const paginatedExpenses = computed(() => {
    const start = (page.value - 1) * pageCount;
    return filteredExpenses.value.slice(start, start + pageCount);
});

watch([q, methodFilter, categoryFilter], () => {
    page.value = 1;
});

watch(
    () => rows.value,
    () => {
        page.value = 1;
    },
);

const uniqueMethods = computed(() => {
    const set = new Set<string>();
    normalizedExpenses.value.forEach((transaction) => {
        if (transaction.normalizedMethod) {
            set.add(transaction.normalizedMethod);
        }
    });
    return Array.from(set).sort();
});

const uniqueCategories = computed(() => {
    const set = new Set<string>();
    normalizedExpenses.value.forEach((transaction) => {
        if (transaction.normalizedCategory) {
            set.add(transaction.normalizedCategory);
        }
    });
    return Array.from(set).sort();
});

const totalExpenses = computed(() => normalizedExpenses.value.length);
const hasActiveFilters = computed(
    () => methodFilter.value !== "all" || categoryFilter.value !== "all",
);

function handleClick(row: { id: number }) {
    alert("clicked" + row);
}

function formatFilterLabel(value: string) {
    if (!value) return "Unknown";
    return value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getMethodCount(method: string) {
    return normalizedExpenses.value.filter(
        (transaction) => transaction.normalizedMethod === method,
    ).length;
}

function getCategoryCount(category: string) {
    return normalizedExpenses.value.filter(
        (transaction) => transaction.normalizedCategory === category,
    ).length;
}

const toast = useCustomToast();
const modal = useModal();
const count = ref(0);

const items = (row: User) => [
    [
        {
            label: "Edit",
            icon: "i-heroicons-pencil-square-20-solid",
            click: () => console.log("Edit", row.id),
        },
    ],
    [
        {
            label: "Delete",
            icon: "i-heroicons-trash-2-20-solid",
        },
    ],
];
const isOpen = ref(false);

function openAddExpenseModal() {
    modal.open(FormExpense, {
        type: props.type,
        onSuccess: handleSubmitExpense,
    });
}

function openEditExpenseModal(transactionId: string) {
    modal.open(FormExpense, {
        id: transactionId,
        type: props.type,
        onSuccess: handleSubmitExpense,
    });
}

async function handleSubmitExpense() {
    toast.add({
        title: "Success!",
        id: "modal-success",
    });

    await props.refresh?.();
    modal.close();
    isOpen.value = false;
}

async function deleteExpense(transactionId: string) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this company?",
    );
    if (!confirmed) return;

    try {
        await transactionAdminApi().deleteTransaction(transactionId);
        toast.add({
            title: "Success!",
            id: "modal-success",
        });
        await props.refresh?.();
        // await fetchAllExpenses();
        // props.function;
    } catch (error) {
        console.error("Error deleting company:", error);
    }
}
</script>

<template>
    <div class="space-y-4">
        <UButton label="Add Expense" @click="openAddExpenseModal" />

        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div class="flex-1 w-full search-input-wrapper">
                <UInput
                    v-model="q"
                    placeholder="Search expenses by description, category, method..."
                    class="w-full text-white placeholder:text-white/70"
                >
                    <template #leading>
                        <LucideIcon name="search" :size="16" style="color: #FFFFFF;" />
                    </template>
                </UInput>
            </div>
            <UButton
                v-if="hasActiveFilters"
                label="Clear Filters"
                color="gray"
                variant="outline"
                class="w-full sm:w-auto hover:bg-gray-900 hover:text-white transition-colors"
                @click="
                    methodFilter = 'all';
                    categoryFilter = 'all';
                "
            >
                <template #leading>
                    <LucideIcon name="x" :size="16" />
                </template>
            </UButton>
        </div>

        <div v-if="uniqueCategories.length" class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex flex-wrap gap-2 items-center">
                <span class="text-sm font-medium text-gray-600">Category:</span>
                <UButton
                    :color="categoryFilter === 'all' ? 'primary' : 'gray'"
                    :variant="categoryFilter === 'all' ? 'solid' : 'outline'"
                    class="flex items-center gap-2"
                    @click="
                        categoryFilter = 'all';
                    "
                >
                    <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>All</span>
                    <span class="ml-1 text-xs opacity-75">({{ totalExpenses }})</span>
                </UButton>
                <UButton
                    v-for="category in uniqueCategories"
                    :key="category"
                    :color="categoryFilter === category ? 'primary' : 'gray'"
                    :variant="categoryFilter === category ? 'solid' : 'outline'"
                    class="flex items-center gap-2 capitalize"
                    @click="
                        categoryFilter = categoryFilter === category ? 'all' : category;
                    "
                >
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>{{ formatFilterLabel(category) }}</span>
                    <span class="ml-1 text-xs opacity-75">({{ getCategoryCount(category) }})</span>
                </UButton>
            </div>
        </div>

        <div v-if="uniqueMethods.length" class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex flex-wrap gap-2 items-center">
                <span class="text-sm font-medium text-gray-600">Payment Method:</span>
                <UButton
                    :color="methodFilter === 'all' ? 'primary' : 'gray'"
                    :variant="methodFilter === 'all' ? 'solid' : 'outline'"
                    class="flex items-center gap-2"
                    @click="
                        methodFilter = 'all';
                    "
                >
                    <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>All</span>
                    <span class="ml-1 text-xs opacity-75">({{ totalExpenses }})</span>
                </UButton>
                <UButton
                    v-for="method in uniqueMethods"
                    :key="method"
                    :color="methodFilter === method ? 'primary' : 'gray'"
                    :variant="methodFilter === method ? 'solid' : 'outline'"
                    class="flex items-center gap-2 capitalize"
                    @click="
                        methodFilter = methodFilter === method ? 'all' : method;
                    "
                >
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{{ formatFilterLabel(method) }}</span>
                    <span class="ml-1 text-xs opacity-75">({{ getMethodCount(method) }})</span>
                </UButton>
            </div>
        </div>

        <UTable :rows="paginatedExpenses" :columns="columns">
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
                <p>{{ formatIDR(row.amount) }}</p>
            </template>
        </UTable>

        <div
            class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
        >
            <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="filteredExpenses.length"
            />
        </div>
    </div>
</template>

<style scoped>
.search-input-wrapper :deep(input) {
  color: white !important;
}

.search-input-wrapper :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.search-input-wrapper :deep([class*="leading"] svg),
.search-input-wrapper :deep([class*="leading"] path),
.search-input-wrapper :deep(svg) {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
</style>
