<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { areaAdminApi } from "@/api/admin/area";
import { useNotification } from '@/composables/useNotification';

const schema = object({
  name_city: string().required("Nama wajib diisi").min(3, "Minimal 3 karakter"),
  name_subdistrict: string().required("Nama wajib diisi").min(4, "Minimal 4 karakter"),
  name_village: string().required("Nama wajib diisi").min(4, "Minimal 4 karakter"),
  code_name: string().required("Kode wilayah wajib diisi").min(2, "Minimal 2 karakter").max(10, "Maksimal 10 karakter"),
});

type Schema = InferType<typeof schema>;

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
      name_city: {
        type: String,
        default: ''
      },
      name_subdistrict: {
        type: String,
        default: ''
      },
      name_village: {
        type: String,
        default: ''
      },
      code_name: {
        type: String,
        default: ''
      }
    })
  }
})
const notification = useNotification();

const state = reactive({
  name_city: "",
  name_subdistrict: "",
  name_village: "",
  code_name: "",
});

watch(
  () => props.isEdit,
  (newValue) => {
    console.log("newValue", props.isEdit, newValue)
    if (newValue) {
      state.name_city = props.data.name_city
      state.name_subdistrict = props.data.name_subdistrict
      state.name_village = props.data.name_village
      state.code_name = props.data.code_name
    } else {
      clearState()
    }
  },
  { immediate: true }
)

function clearState() {
  state.name_city = ""
  state.name_subdistrict = ""
  state.name_village = ""
  state.code_name = ""
}

const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Do something with event.data
  if (props.isEdit) {
    areaAdminApi().editArea(props.data.id, state).then((response) => {
      notification.success('Berhasil', response.message)
      onSuccess()
    }).catch((error) => {
      notification.error('Gagal', 'Gagal memperbarui wilayah')
    })
  } else {

    areaAdminApi().createArea(state).then((response) => {
      notification.success('Wilayah berhasil ditambahkan', response.message)
      onSuccess()
    }).catch((error) => {
      notification.error('Gagal', 'Gagal menambahkan wilayah')
    })
  }
}
</script>

<template>
  <UModal>
    <div class="p-4">
      <div class="p-2 mb-4 text-2xl font-bold text-center">
        <h1>{{ props.isEdit ? "Ubah" : "Tambah" }} Wilayah</h1>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Nama Kota" name="name_city">
          <UInput v-model="state.name_city" />
        </UFormGroup>
        <UFormGroup label="Nama Kecamatan" name="name_subdistrict">
          <UInput v-model="state.name_subdistrict" />
        </UFormGroup>
        <UFormGroup label="Nama Desa/Kelurahan" name="name_village">
          <UInput v-model="state.name_village" />
        </UFormGroup>
        <UFormGroup label="Kode Wilayah" name="code_name">
          <UInput v-model="state.code_name" placeholder="Contoh: TLSK, JKT, BDG" />
          <template #help>
            <span class="text-xs text-gray-500">Kode singkat untuk penamaan jadwal (2-10 karakter)</span>
          </template>
        </UFormGroup>

        <UButton type="submit" color="blue"> Simpan </UButton>
      </UForm>
    </div>
  </UModal>
</template>
