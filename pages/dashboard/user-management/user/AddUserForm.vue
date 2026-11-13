<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { userManagementAdminApi } from "@/api/admin/user-management";
const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    required: false,
  },
});
const roles = ref<any[]>([]);

const state = reactive({
  name: "",
  email: "",
  logo_url: "",
  role_id: "",
  password: "",
  password_confirm: "",
  phone: "",
});
onMounted(async () => {
  await userManagementAdminApi()
    .getAllRole()
    .then((response) => {
      roles.value = response.data.map((role: any) => ({
        label: role.name,
        value: role.id,
      }));
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
    });
  if (props.id) {
    await userManagementAdminApi()
      .getUser(props.id)
      .then((response) => {
        Object.assign(state,{...response.data,role_id:response.data.role?.id});
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
      });
  }
});

const schema = object({
  name: string().required("Nama wajib diisi"),
  email: string()
    .email("Format email tidak valid")
    .required("Email wajib diisi"),
  role_id: string().required("Peran wajib dipilih"),
  password: string()
    .min(6, "Kata sandi minimal 6 karakter")
    .required("Kata sandi wajib diisi"),
  password_confirm: string()
    .required("Konfirmasi kata sandi wajib diisi")
    .test("passwords-match", "Kata sandi tidak cocok", function (value) {
      const { password } = this.parent; // Access parent object, which includes the password
      return password === value; // Compare password and confirmPassword
    }),
  phone: string()
    .matches(/^\d+$/, "Nomor telepon hanya boleh berisi angka")
    .required("Nomor telepon wajib diisi"),
  // logo_url: string()
  //   .url("Logo URL must be a valid URL")
  //   .required("Logo URL is required"),
});

const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

async function onSubmit() {
  console.log("schema", schema);
  console.log("state", state);
  if (props.id) {
    await userManagementAdminApi()
      .editUser(props.id, state)
      .then((response) => {
        console.log("Success creating / editing company", response);
        onSuccess();
      })
      .catch((error) => {
        console.error("Error creating company:", error);
      });
  } else {
    await userManagementAdminApi()
      .createUser(state)
      .then((response) => {
        console.log("Success creating / editing company", response);
        onSuccess();
      })
      .catch((error) => {
        console.error("Error creating company:", error);
      });
  }
}
</script>

<template>
  <UModal>
    <div class="p-2 mb-4 text-2xl font-bold text-center">
      <h1>{{ props.isEdit ? "Ubah Pengguna" : "Tambah Pengguna" }}</h1>
    </div>
    <div class="p-4">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormGroup label="Nama Pengguna" name="name">
          <UInput v-model="state.name" />
        </UFormGroup>
        <UFormGroup label="Email" name="email">
          <UInput v-model="state.email" />
        </UFormGroup>
        <UFormGroup label="Nomor Telepon" name="phone">
          <UInput v-model="state.phone" />
        </UFormGroup>
        <div v-if="roles.length === 0">
          <span class="text-gray-500">Memuat daftar peran...</span>
        </div>
        <URadioGroup
          v-else
          v-model="state.role_id"
          :options="roles"
          name="role_id"
          legend="Peran"
        />
        <UFormGroup label="Password" name="password">
          <UInput type="password" v-model="state.password" />
        </UFormGroup>
        <UFormGroup label="Konfirmasi Kata Sandi" name="password_confirm">
          <UInput type="password" v-model="state.password_confirm" />
        </UFormGroup>
        <UFormGroup label="URL Logo" name="logo_url">
          <UInput v-model="state.logo_url" />
        </UFormGroup>
        <UButton type="submit">Simpan</UButton>
      </UForm>
    </div>
  </UModal>
</template>
