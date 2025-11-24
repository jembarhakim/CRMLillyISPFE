<script setup lang="ts">
import { object, string, type InferType } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { internetPackageAdminApi } from '@/api/admin/internet-package'
import { formatIDR } from '@/helper/currency'
import { useCustomToast } from '@/composables/useCustomToast'

const schema = object({
    name: string()
        .min(3, 'Must be at least 3 characters')
        .required('Required'),
})

type Schema = InferType<typeof schema>
const props = defineProps({
    isEdit: {
        type: Boolean,
        default: false,
    },
    data: {
        type: Object,
        default: () => ({
            id: {
                type: String,
                default: ''
            },
            name: {
                type: String,
                default: ''
            },
            price: {
                type: Number,
                default: 0
            },
            description: {
                type: String,
                default: ''
            },
        })
    }
})

const state = reactive({
    name: '',
    price: 0,
    description: ''
})

// Computed property untuk menampilkan format mata uang
const formattedPrice = computed({
    get: () => {
        // Format dengan separator ribuan
        return state.price > 0 ? state.price.toLocaleString('id-ID') : ''
    },
    set: (value) => {
        // Remove non-numeric characters
        const numericValue = value.toString().replace(/[^\d]/g, '')
        state.price = numericValue ? parseInt(numericValue) : 0
    }
})

// Function untuk format display
const displayPrice = computed(() => {
    return state.price > 0 ? formatIDR(state.price) : 'Rp 0,00'
})

watch(
    () => props.isEdit,
    (newValue) => {
        console.log("newValue", props.isEdit, newValue)
        if (newValue) {
            state.name = props.data.name
            state.price = props.data.price
            state.description = props.data.description
        }
    },
    { immediate: true }
)

const emit = defineEmits(['success'])

function onSuccess() {
    emit('success')
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (props.isEdit) {
        console.log(props.data.id, state)
        await internetPackageAdminApi().editInternetPacket(props.data.id, state).then((response) => {
            useCustomToast().add({ title: "Success Update Product", color: "green", description: response.message })
            onSuccess()
        }).catch((error) => {
            useCustomToast().add({ title: "Error Update Product", color: "red", description: error })
        })
    } else {
        await internetPackageAdminApi().createInternetPackage(state).then((response) => {
            useCustomToast().add({ title: "Success Create Product", color: "green", description: response.message })
            onSuccess()
        }).catch((error) => {
            useCustomToast().add({ title: "Error Create Product", color: "red", description: error })
        })
    }
}
</script>

<template>
    <UModal>
        <div class="p-4">
            <div class="p-2 mb-4 text-2xl font-bold text-center">
                <h1>{{ props.isEdit ? "Edit" : "Add New" }} Internet Package</h1>
            </div>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">

                <UFormGroup label="Package Name" name="name">
                    <UInput v-model="state.name" />
                </UFormGroup>
                <UFormGroup label="Price" name="price">
                    <div class="relative">
                        <UInput 
                            type="text" 
                            v-model="formattedPrice" 
                            placeholder="Enter price amount"
                            class="pl-12"
                        />
                        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                            Rp
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                        Current value: {{ displayPrice }}
                    </div>
                </UFormGroup>
                <UFormGroup label="Description" name="description">
                    <UTextarea type="text" v-model="state.description" />
                </UFormGroup>

                <UButton type="submit">
                    Submit
                </UButton>
            </UForm>
        </div>
    </UModal>
</template>
