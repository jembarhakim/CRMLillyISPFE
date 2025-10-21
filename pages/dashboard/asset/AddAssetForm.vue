<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import {
  asset,
  assetSchema,
  type AssetSchema,
} from "./asset.model";
import { DatePicker as VCalendarDatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'
import { format } from 'date-fns'
import AddAreaForm from "../area/AddAreaForm.vue";
import { assetAdminApi } from "@/api/admin/asset";
import { companyAdminApi } from "@/api/admin/company";

const state = reactive(asset);
const companies = ref<Array<{label: string, value: string}>>([]);

// Fetch companies for dropdown
onMounted(async () => {
  try {
    const response = await companyAdminApi().getAllCompanies();
    if (response.success) {
      companies.value = response.data.map((company) => ({
        label: company.name,
        value: company.id
      }));
    }
  } catch (error) {
    console.error('Failed to fetch companies:', error);
  }
});

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false
  },
  data: {
    type: Object,
    default: () => ({
      id: "",
      type: "",
      brand: "",
      model: "",
      serial_number: "",
      date: new Date(),
      company_id: "",
      price: 0,
      description: "",
      site: "",
    })
  }
})

watch(
  () => props.isEdit,
  (newValue) => {
    console.log(props.data)
    if (newValue) {
      state.type = props.data.type
      state.brand = props.data.brand
      state.model = props.data.model
      state.serial_number = props.data.serial_number
      state.date = props.data.date
      state.company_id = props.data.company_id
      state.price = props.data.price
      state.description = props.data.description
      state.site = props.data.site
    }else{
      // clearState()
    }
  },
  { immediate: true }
)


const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

function clearState() {
  state.type = ""
  state.brand = ""
  state.model = ""
  state.serial_number = ""
  state.date = new Date()
  state.company_id = undefined
  state.price = 0
  state.description = ""
  state.site = ""
}

async function onSubmit(event: FormSubmitEvent<AssetSchema>) {
  console.log(state)
  if (props.isEdit) {
    await assetAdminApi().editAsset(props.data.id, state).then((response) => {
      useToast().add({ title: response.message })
      onSuccess()
    }
    ).catch((err) => {
      useToast().add({ title: err, color: "red" })
      onSuccess()
    }
    )
  } else {
    await assetAdminApi().createAsset(state).then((response) => {
      useToast().add({ title: response.message })
      onSuccess()
    }
    ).catch((err) => {
      useToast().add({ title: err, color: "red" })
      onSuccess()
    }
    )

  }
}
</script>

<template>
  <UModal>
    <div class="p-4">


      <div class="p-2 mb-4 text-2xl font-bold text-center">
        <h1>{{ props.isEdit ? "Edit" : "Add New" }} Asset</h1>
      </div>
      <UForm :schema="assetSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Type" name="type">
          <UInput v-model="state.type" />
        </UFormGroup>

        <UFormGroup label="Brand" name="brand">
          <UInput v-model="state.brand" />
        </UFormGroup>

        <UFormGroup label="Model" name="model">
          <UInput v-model="state.model" />
        </UFormGroup>

        <UFormGroup label="Serial Number" name="serial_number">
          <UInput v-model="state.serial_number" />
        </UFormGroup>


        <UFormGroup label="Date" name="date">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton icon="i-lucide-calendar-days-20-solid" :label="format(state.date, 'd MMM, yyy')" class="w-full"
              color="gray" />

            <template #panel="{ close }">
              <DatePickerComponent v-model="state.date" @close="close" />
            </template>
          </UPopover>
        </UFormGroup>

        <UFormGroup label="Company" name="company_id">
          <USelect 
            v-model="state.company_id" 
            :options="companies"
            placeholder="Select a company"
          />
        </UFormGroup>

        <UFormGroup label="Site" name="site">
          <UInput v-model="state.site" placeholder="Enter site location" />
        </UFormGroup>

        <UFormGroup label="Price" name="price">
          <UInput v-model="state.price" type="number" />
        </UFormGroup>

        <UFormGroup label="Description" name="description">
          <UTextarea v-model="state.description" />
        </UFormGroup>

        <UButton type="submit"> Submit </UButton>
      </UForm>
    </div>
  </UModal>
</template>
