<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import {
  assetItem,
  assetItemSchema,
  assetItemStatus,
  type AssetItemSchema,
} from "./asset-item.model";
import { assetItemAdminApi } from "@/api/admin/asset-item";

const state = reactive(assetItem);

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
      state.serial_number = props.data.serial_number
      state.status = props.data.status
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
  state.status = "in_stock"
}

// MAC address validation
function validateMacAddress(mac: string) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
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

  if (props.isEdit) {
    await assetItemAdminApi().editAssetItem(props.data.id, state).then((response: any) => {
      useToast().add({ title: response.message })
      onSuccess()
    }
    ).catch((err: any) => {
      useToast().add({ title: err, color: "red" })
      onSuccess()
    }
    )
  } else {
    await assetItemAdminApi().createAssetItem(state).then((response: any) => {
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
            placeholder="00:11:22:33:44:55"
            help="Format: 00:11:22:33:44:55 or 00-11-22-33-44-55"
          />
        </UFormGroup>

        <UFormGroup label="Serial Number" name="serial_number">
          <UInput v-model="state.serial_number" placeholder="Optional serial number" />
        </UFormGroup>

        <UFormGroup label="Status" name="status">
          <USelect v-model="state.status" :options="assetItemStatus"></USelect>
        </UFormGroup>

        <UButton type="submit"> Submit </UButton>
      </UForm>
    </div>
  </UModal>
</template>

