<script setup lang="ts">
import { userManagementAdminApi } from '@/api/admin/user-management';
import { object, string, array } from 'yup';

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

const state = reactive({
  name: "",
  role_permissions: [] as Array<{
    feature_id: string;
    feature_name: string;
    can_access: number;
  }>,
});

const error = ref("");
const isLoading = ref(false);
const showConfirmDialog = ref(false);

const schema = object({
  name: string()
    .min(3, "Minimal 3 karakter")
    .required("Wajib diisi"),
  role_permissions: array()
    .of(object())
    .min(1, "Minimal satu izin harus dikonfigurasi")
    .required("Wajib diisi"),
})

// Define available features from database
const availableFeatures = ref<Array<{ id: string; name: string }>>([]);

// Load features from database
async function loadFeatures() {
  try {
    const response = await userManagementAdminApi().getAllFeatures();
    availableFeatures.value = response.data.map((feature: any) => ({
      id: feature.id, // Using UUID from database as ID
      name: feature.name
    }));
  } catch (err) {
    console.error("Error loading features:", err);
    // Fallback to hardcoded features if API fails
    availableFeatures.value = [
      { id: 'dashboard', name: 'dashboard' },
      { id: 'customer', name: 'customer' },
      { id: 'area', name: 'area' },
      { id: 'report', name: 'report' },
      { id: 'internet_package', name: 'internet_package' },
      { id: 'assets', name: 'assets' },
      { id: 'company', name: 'company' },
      { id: 'invoice', name: 'invoice' },
      { id: 'transaction', name: 'transaction' },
      { id: 'tickets', name: 'tickets' },
      { id: 'trouble_reports', name: 'trouble_reports' },
      { id: 'user_management', name: 'user_management' }
    ];
  }
}

// Load features first, then load role data
await loadFeatures();

if (props.id) {
  try {
    const response = await userManagementAdminApi().getRole(props.id);
    state.name = response.data.name;
    
    // Initialize with all features unchecked first
    initializeRolePermissions();
    
    // Update with actual permissions from database
    if (response.data.role_permissions) {
      response.data.role_permissions.forEach((permission: any) => {
        const index = state.role_permissions.findIndex(
          rp => rp.feature_id === permission.feature_id
        );
        if (index !== -1) {
          state.role_permissions[index].can_access = permission.can_access;
        }
      });
    }
  } catch (err) {
    console.error("Error fetching role:", err);
    error.value = "Gagal memuat data peran";
  }
} else {
  // Initialize for new role
  initializeRolePermissions();
}

const emit = defineEmits(['success'])

function onSuccess() {
  emit('success')
}

function showConfirmation() {
  showConfirmDialog.value = true;
}

function confirmSubmit() {
  showConfirmDialog.value = false;
  onSubmit({ data: { name: state.name, role_permissions: state.role_permissions } } as SubmitEvent);
}

function initializeRolePermissions() {
  state.role_permissions = availableFeatures.value.map(feature => ({
    feature_id: feature.id,
    feature_name: feature.name,
    can_access: 0
  }));
}

function toggleAllFeatures(checked: boolean) {
  state.role_permissions.forEach(permission => {
    permission.can_access = checked ? 1 : 0;
  });
}

function toggleFeature(featureId: string, checked: boolean) {
  const permission = state.role_permissions.find(rp => rp.feature_id === featureId);
  if (permission) {
    permission.can_access = checked ? 1 : 0;
  }
}

function isFeatureChecked(featureId: string): boolean {
  const permission = state.role_permissions.find(rp => rp.feature_id === featureId);
  return permission ? permission.can_access === 1 : false;
}

function areAllFeaturesChecked(): boolean {
  return state.role_permissions.every(rp => rp.can_access === 1);
}

interface SubmitEvent {
    data: {
        name: string;
        role_permissions: Array<{
            feature_id: string;
            feature_name: string;
            can_access: number;
        }>;
    };
}

async function onSubmit(event: SubmitEvent) {
  error.value = "";
  isLoading.value = true;
  
  try {
    console.log("🔍 Sending role_permissions:", state.role_permissions);
    
    if (props.id) {
      await userManagementAdminApi()
        .editRole(props.id, {
          name: state.name,
          role_permissions: state.role_permissions
        });
    } else {
      await userManagementAdminApi()
        .createRole({
          name: state.name,
          role_permissions: state.role_permissions
        });
    }
    onSuccess();
  } catch (err: any) {
    error.value = err.message || "Terjadi kesalahan saat menyimpan peran";
    console.error("Error creating/editing role:", err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal>
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">
        {{ props.isEdit ? "Ubah" : "Tambah" }} Peran
      </h2>
      
      <!-- Error Display -->
      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>
      
      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <!-- Role Name -->
        <UFormGroup label="Nama Peran" name="name">
          <UInput v-model="state.name" placeholder="Masukkan nama peran" />
        </UFormGroup>
        
        <!-- Features -->
        <UFormGroup label="Fitur" name="features">
          <div class="space-y-3">
            <!-- Select All -->
            <div class="flex items-center justify-between border-b pb-2">
              <span class="font-medium">Semua Fitur</span>
              <UCheckbox
                :model-value="areAllFeaturesChecked()"
                @update:model-value="toggleAllFeatures($event)"
                label="Pilih Semua"
              />
            </div>
            
            <!-- Feature List -->
            <div class="grid grid-cols-2 gap-2">
              <UCheckbox
                v-for="feature in availableFeatures"
                :key="feature.id"
                :model-value="isFeatureChecked(feature.id)"
                @update:model-value="toggleFeature(feature.id, $event)"
                :label="feature.name"
              />
            </div>
          </div>
        </UFormGroup>
        
        <!-- Submit Button -->
        <div class="flex justify-end space-x-2 pt-4">
          <UButton @click="showConfirmation" :loading="isLoading" :disabled="isLoading">
            {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
          </UButton>
        </div>
      </UForm>
    </div>
    
    <!-- Simple Confirmation -->
    <UModal v-model="showConfirmDialog">
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Konfirmasi</h3>
        <p class="mb-4">Simpan peran ini?</p>
        <div class="flex justify-end space-x-2">
          <UButton @click="showConfirmDialog = false" variant="outline">Batal</UButton>
          <UButton @click="confirmSubmit" color="primary">Ya</UButton>
        </div>
      </div>
    </UModal>
  </UModal>
</template>
