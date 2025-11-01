<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { transactionAdminApi } from "@/api/admin/transaction";
import { accountAdminApi } from "@/api/admin/account";
import { formatIDR } from "@/helper/currency";

const props = defineProps<{
    id?: string;
    type?: {
        type?: string;
        type_cash?: string;
    };
    onSuccess?: () => void;
}>();
const state = reactive({
    type_cash: "",
    type_in_out: "tranfer",
    from_account_id: "",
    to_account_id: "",
    date: "",
    description: "",
    file: "",
    amount: "",
    category: "",
    category_custom: "",
    tags: "",
    payer_id: "",
    method: "",
    ref: "",
});

// Computed property untuk menampilkan format mata uang
const formattedAmount = computed({
    get: () => {
        // Format dengan separator ribuan
        const numericAmount = parseFloat(state.amount) || 0;
        return numericAmount > 0 ? numericAmount.toLocaleString("id-ID") : "";
    },
    set: (value) => {
        // Remove non-numeric characters
        const numericValue = value.toString().replace(/[^\d]/g, "");
        state.amount = numericValue;
    },
});

// Function untuk format display
const displayAmount = computed(() => {
    const numericAmount = parseFloat(state.amount) || 0;
    return numericAmount > 0 ? formatIDR(numericAmount) : "Rp 0,00";
});
if (props.id) {
    await transactionAdminApi()
        .getTransaction(props.id)
        .then((response) => {
            Object.assign(state, response.data);
        })
        .catch((error) => {
            console.error("Error fetching companies:", error);
        });
}
const schema = object({
    from_account_id: string()
        .min(3, "Must be at least 3 characters")
        .required("Required"),
    to_account_id: string()
        .min(3, "Must be at least 3 characters")
        .required("Required"),
    date: string().required("Date is required"),
    amount: string().required("Amount is required"),
});

state.type_cash = props.type?.type_cash ?? "";
const isAdvanced = ref(false);

type Schema = InferType<typeof schema>;
async function onSubmit(event: FormSubmitEvent<Schema>) {
    // Do something with event.data
    console.log(event.data);
    if (state.category_custom != "") {
        state.category = state.category_custom;
    }
    // Build payload with numeric amount to satisfy backend + types
    const payload = {
        ...state,
        amount: parseFloat(state.amount || "0") || 0,
    };
    await transactionAdminApi()
        .createTransactions(payload as any)
        .then((response) => {
            console.log("Success creating / editing company", response);
            props.onSuccess?.();
        })
        .catch((error) => {
            console.error("Error creating company:", error);
        });
    // Do something with event.data
    console.log(event.data);
}

state.date =
    new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    new Date().getDate().toString().padStart(2, "0");
const accounts = ref<any[]>([]);
async function getAccountData() {
    accountAdminApi()
        .getAllAccount()
        .then((response) => {
            accounts.value = response.data.map((value: any, index: number) => ({
                label: value.name,
                value: value.id,
            }));
        });
}
await getAccountData();

const methodOptions = [
    {
        label: "transfer",
        value: "transfer",
    },
    {
        label: "cash",
        value: "cash",
    },
];
</script>

<template>
    <UModal>
        <div class="p-2 mb-4 text-2xl font-bold text-center">
            <h1>Add Tranfer</h1>
        </div>
        <div class="p-4">
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-4"
                @submit="onSubmit"
            >
                <div class="flex gap-4 flex-row-2">
                    <div class="w-full">
                        <UFormGroup label="From Account" name="from_account">
                            <USelectMenu
                                v-model="state.from_account_id"
                                :options="accounts"
                                value-attribute="value"
                                option-attribute="label"
                            />
                        </UFormGroup>
                        <UFormGroup label="To Account" name="to_account">
                            <USelectMenu
                                v-model="state.to_account_id"
                                :options="accounts"
                                value-attribute="value"
                                option-attribute="label"
                            />
                        </UFormGroup>
                        <UFormGroup label="Date" name="date">
                            <UInput v-model="state.date" type="date" />
                        </UFormGroup>
                        <UFormGroup label="Description" name="description">
                            <UInput v-model="state.description" />
                        </UFormGroup>
                        <UFormGroup label="Amount" name="amount">
                            <div class="relative">
                                <UInput
                                    type="text"
                                    v-model="formattedAmount"
                                    placeholder="Enter amount"
                                    class="pl-12"
                                />
                                <div
                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium"
                                >
                                    Rp
                                </div>
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                Current value: {{ displayAmount }}
                            </div>
                        </UFormGroup>
                        <UFormGroup label="Method" name="method">
                            <USelectMenu
                                v-model="state.method"
                                :options="methodOptions"
                                value-attribute="value"
                                option-attribute="label"
                            />
                        </UFormGroup>
                    </div>
                </div>

                <UButton type="submit">Submit</UButton>
            </UForm>
        </div>
    </UModal>
</template>
