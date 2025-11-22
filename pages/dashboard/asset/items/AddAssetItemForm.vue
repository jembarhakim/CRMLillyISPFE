<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import {
  assetItem,
  assetItemSchema,
  assetItemStatus,
  type AssetItemSchema,
} from "./asset-item.model";
import { assetItemAdminApi } from "@/api/admin/asset-item";
import { companyAdminApi } from "@/api/admin/company";

const state = reactive(assetItem);
const companies = ref<Array<{label: string, value: string}>>([]);

// Fetch companies for dropdown
onMounted(async () => {
  try {
    const response = await companyAdminApi().getAllCompanies();
    if (response.success) {
      companies.value = response.data.map((company: any) => ({
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
      id: {
        type: String,
        default: "",
      },
      asset_id: {
        type: String,
        default: ""
      },
      mac_address: {
        type: String,
        default: ""
      },
      serial_number: {
        type: String,
        default: ""
      },
      status: {
        type: String,
        default: "in_stock"
      },
      company_id: {
        type: String,
        default: undefined
      },
      site: {
        type: String,
        default: ""
      },
      mac_sticker: {
        type: String,
        default: ""
      },
    })
  },
  assets: {
    type: Array,
    default: () => []
  }
})

watch(
  () => props.isEdit,
  (newValue) => {
    console.log(props.data)
    if (newValue) {
      state.asset_id = props.data.asset_id
      state.mac_address = props.data.mac_address
      state.serial_number = props.data.serial_number || ""
      state.mac_sticker = props.data.mac_sticker || ""
      state.status = props.data.status
      state.company_id = props.data.company_id || undefined
      state.site = props.data.site || ""
    } else {
      clearState()
    }
  },
  { immediate: true }
)

const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

function clearState() {
  state.asset_id = ""
  state.mac_address = ""
  state.serial_number = ""
  state.mac_sticker = ""
  state.status = "in_stock"
  state.company_id = undefined
  state.site = ""
}

// MAC address validation
function validateMacAddress(mac: string) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Auto-format MAC address as user types
function formatMacAddress(value: string) {
  // Remove all non-hex characters (keep only 0-9, A-F, a-f)
  let cleaned = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  
  // Limit to 12 characters (MAC address is 12 hex digits)
  cleaned = cleaned.slice(0, 12);
  
  // Insert colon every 2 characters
  let formatted = '';
  for (let i = 0; i < cleaned.length; i += 2) {
    if (i > 0) formatted += ':';
    formatted += cleaned.slice(i, i + 2);
  }
  
  return formatted;
}

// Handle MAC address input
function onMacAddressInput(event: Event) {
  const target = event.target as HTMLInputElement;
  // Use nextTick to avoid conflicts with v-model
  nextTick(() => {
    const formatted = formatMacAddress(target.value);
    state.mac_address = formatted;
    // Auto-copy to MAC sticker field
    state.mac_sticker = formatted;
  });
}

// Handle MAC sticker input
function onMacStickerInput(event: Event) {
  const target = event.target as HTMLInputElement;
  // Use nextTick to avoid conflicts with v-model
  nextTick(() => {
    const formatted = formatMacAddress(target.value);
    state.mac_sticker = formatted;
  });
}

async function onSubmit(event: FormSubmitEvent<AssetItemSchema>) {
  console.log(state)
  
  // Validate MAC address format
  if (!validateMacAddress(state.mac_address)) {
    useToast().add({
      title: "Invalid MAC address format. Please use format like: 00:11:22:33:44:55 or 00-11-22-33-44-55",
      color: "red"
    })
    return
  }

  // Prepare submission data - convert empty strings to undefined for optional fields
  const submitData = {
    ...state,
    company_id: state.company_id && state.company_id.trim() !== '' ? state.company_id : undefined,
    site: state.site && state.site.trim() !== '' ? state.site : undefined,
    mac_sticker: state.mac_sticker && state.mac_sticker.trim() !== '' ? state.mac_sticker : state.mac_address,
  }

  if (props.isEdit) {
    await assetItemAdminApi().editAssetItem(props.data.id, submitData).then((response: any) => {
      useToast().add({ title: response.message })
      onSuccess()
    }
    ).catch((err: any) => {
      useToast().add({ title: err, color: "red" })
      onSuccess()
    }
    )
  } else {
    await assetItemAdminApi().createAssetItem(submitData).then((response: any) => {
      useToast().add({ title: response.message })
      onSuccess()
    }
    ).catch((err: any) => {
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
        <h1>{{ props.isEdit ? "Edit" : "Add New" }} Asset Item</h1>
      </div>
      <UForm :schema="assetItemSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Asset" name="asset_id">
          <USelect 
            v-model="state.asset_id" 
            :options="props.assets"
            placeholder="Select an asset"
          />
        </UFormGroup>

        <UFormGroup label="MAC Address" name="mac_address">
          <UInput 
            v-model="state.mac_address" 
            @input="onMacAddressInput"
            placeholder="40EE152CF2F8 or 40:EE:15:2C:F2:F8"
            help="Enter MAC address (colons will be added automatically)"
          />
        </UFormGroup>

        <UFormGroup label="Serial Number" name="serial_number">
          <UInput v-model="state.serial_number" placeholder="Optional serial number" />
        </UFormGroup>

        <UFormGroup label="MAC Sticker" name="mac_sticker">
          <UInput
            v-model="state.mac_sticker"
            @input="onMacStickerInput"
            placeholder="40EE152CF2F8 or 40:EE:15:2C:F2:F8"
            help="Enter MAC sticker (colons will be added automatically)"
          />
        </UFormGroup>

        <UFormGroup label="Status" name="status">
          <USelect v-model="state.status" :options="assetItemStatus"></USelect>
        </UFormGroup>

        <UFormGroup label="Company" name="company_id">
          <USelect 
            v-model="state.company_id" 
            :options="companies"
            placeholder="Select a company (optional)"
            option-attribute="label"
            value-attribute="value"
            :clearable="true"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select the company this asset item belongs to. You can clear the selection to remove company assignment.
          </p>
        </UFormGroup>

        <UFormGroup label="Site" name="site">
          <UInput 
            v-model="state.site" 
            placeholder="Enter site location (optional)"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter the site/location where this asset item is located.
          </p>
        </UFormGroup>

        <UButton type="submit"> Submit </UButton>
      </UForm>
    </div>
  </UModal>
</template>
