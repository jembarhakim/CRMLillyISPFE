<script setup lang="ts">
import { boolean, object, string, type InferType } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { formatIDR } from '@/helper/currency'
import LucideIcon from '@/components/LucideIcon.vue'

const schema = object({
    // email: string().email('Invalid email').required('Required'),
    // password: string()
    //     .min(8, 'Must be at least 8 characters')
    //     .required('Required'),
    // name: string()
    //     .min(3, 'Must be at least 3 characters')
    //     .required('Required'),
    // phone: string()
    //     .min(3, 'Must be at least 3 characters')
    //     .required('Required'),
    // address: string()
    //     .min(3, 'Must be at least 3 characters')
    //     .required('Required'),
    // packet_internet: string()
    //     .min(3, 'Must be at least 3 characters')
    //     .required('Required')
})

type Schema = InferType<typeof schema>

const state = reactive({
    type_cash: '',
    nominal: 0,
    description: '',
    type_use_of_money: '',
    type_transaction: '',
})

// Computed property untuk menampilkan format mata uang
const formattedNominal = computed({
    get: () => {
        // Format dengan separator ribuan
        return state.nominal > 0 ? state.nominal.toLocaleString('id-ID') : ''
    },
    set: (value) => {
        // Remove non-numeric characters
        const numericValue = value.toString().replace(/[^\d]/g, '')
        state.nominal = numericValue ? parseInt(numericValue) : 0
    }
})

// Function untuk format display
const displayNominal = computed(() => {
    return state.nominal > 0 ? formatIDR(state.nominal) : 'Rp 0,00'
})
const type_cash = [
    { label: 'Cash', value: 'cash' },
    { label: 'Credit Card', value: 'credit_card' },
    { label: 'Debit Card', value: 'debit_card' },
]

const type_use_of_money = [
    { label: 'Operational', value: 'operational' },
    { label: 'Asset', value: 'asset' },
    { label: 'Investment', value: 'investment' },
    { label: 'Other', value: 'other' },
]
const type_transaction = [
    { label: 'Cash In', value: 'cash_in' },
    { label: 'Cash Out', value: 'cash_out' },
]

defineProps({
    // isOpen: { type: Boolean, required: true }
})
const emit = defineEmits(['success', 'close'])
async function onSubmit(event: FormSubmitEvent<Schema>) {
    // Do something with event.data
    // Emit an event to the parent component
    // Close the modal
    clearState()
    // Emit success event
    emit('success')
}
function clearState() {
    state.type_cash = ''
    state.nominal = 0
    state.description = ''
}
</script>

<!-- <template>
    <UModal>
        <UCard>
            <div class="space-y-2">
                <p>This modal was opened programmatically !</p>
                <p>Count:</p>
                <UButton @click="onSubmit">
                    Click to emit a success event
                </UButton>
            </div>
        </UCard>
    </UModal>
</template> -->
<template>
    <UModal>
        <div class="p-4">


            <div class="p-2 mb-4 text-2xl font-bold text-center flex items-center justify-center gap-2">
                <LucideIcon name="dollar-sign" :size="24" class="text-blue-600" />
                <h1>Add New Report Cash Flow</h1>
            </div>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormGroup name="type_cash">
                    <template #label>
                        <div class="flex items-center gap-2">
                            <LucideIcon name="wallet" :size="16" class="text-gray-600" />
                            <span>Type Cash</span>
                        </div>
                    </template>
                    <USelectMenu v-model="state.type_cash" :options="type_cash" value-attribute="value"
                        option-attribute="label" />
                </UFormGroup>
                <UFormGroup name="type_transaction">
                    <template #label>
                        <div class="flex items-center gap-2">
                            <LucideIcon name="trending-up" :size="16" class="text-gray-600" />
                            <span>Type Transaction</span>
                        </div>
                    </template>
                    <USelectMenu v-model="state.type_transaction" :options="type_transaction" value-attribute="value"
                        option-attribute="label" />
                </UFormGroup>
                <UFormGroup name="type_use_of_money">
                    <template #label>
                        <div class="flex items-center gap-2">
                            <LucideIcon name="briefcase" :size="16" class="text-gray-600" />
                            <span>Type Used Of Money</span>
                        </div>
                    </template>
                    <USelectMenu v-model="state.type_use_of_money" :options="type_use_of_money" value-attribute="value"
                        option-attribute="label" />
                </UFormGroup>
                <UFormGroup name="nominal">
                    <template #label>
                        <div class="flex items-center gap-2">
                            <LucideIcon name="currency-dollar" :size="16" class="text-gray-600" />
                            <span>Nominal</span>
                        </div>
                    </template>
                    <div class="relative">
                        <UInput 
                            type="text" 
                            v-model="formattedNominal" 
                            placeholder="Enter nominal amount"
                            class="pl-12"
                        />
                        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                            Rp
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                        Current value: {{ displayNominal }}
                    </div>
                </UFormGroup>
                <UFormGroup name="description">
                    <template #label>
                        <div class="flex items-center gap-2">
                            <LucideIcon name="document-text" :size="16" class="text-gray-600" />
                            <span>Description</span>
                        </div>
                    </template>
                    <UTextarea v-model="state.description" />
                </UFormGroup>

                <UButton type="submit">
                    <template #leading>
                        <LucideIcon name="check" :size="16" />
                    </template>
                    Submit
                </UButton>
            </UForm>
        </div>
    </UModal>
</template>
