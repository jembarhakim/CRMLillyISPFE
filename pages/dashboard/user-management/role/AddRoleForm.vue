<script setup lang="ts">
import { userManagementAdminApi } from '@/api/admin/user-management';
import { object, string, array } from 'yup';
import { MAIN_MENU } from '@/utilities/rolePermissions';

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
  permissions: [] as string[],
});

const schema = object({
  name: string()
    .min(3, "Must be at least 3 characters")
    .required("Required"),
  permissions: array()
    .of(string())
    .min(1, "At least one permission must be selected")
    .required("Required"),
})

// Define available permissions based on the menu items
const availablePermissions = computed(() => {
  const permissions = new Set<string>();
  
  // Add specific permissions
  permissions.add('dashboard:view');
  permissions.add('customer:view');
  permissions.add('customer:manage');
  permissions.add('area:view');
  permissions.add('area:manage');
  permissions.add('report:view');
  permissions.add('internet_package:view');
  permissions.add('internet_package:manage');
  permissions.add('assets:view');
  permissions.add('assets:manage');
  permissions.add('company:view');
  permissions.add('company:manage');
  permissions.add('invoice:view');
  permissions.add('invoice:manage');
  permissions.add('transaction:view');
  permissions.add('transaction:manage');
  permissions.add('tickets:view');
  permissions.add('tickets:manage');
  permissions.add('tickets:create');
  permissions.add('trouble_reports:view');
  permissions.add('trouble_reports:manage');
  permissions.add('mikrotik:view');
  permissions.add('mikrotik:manage');
  permissions.add('network_monitoring:view');
  permissions.add('user_management:view');
  permissions.add('user_management:manage');
  
  return Array.from(permissions).sort();
});

// Group permissions by category
const permissionCategories = computed(() => {
  const categories = [
    {
      name: 'Dashboard',
      permissions: ['dashboard:view']
    },
    {
      name: 'Customer Management',
      permissions: ['customer:view', 'customer:manage']
    },
    {
      name: 'Area Management',
      permissions: ['area:view', 'area:manage']
    },
    {
      name: 'Reports',
      permissions: ['report:view']
    },
    {
      name: 'Internet Package',
      permissions: ['internet_package:view', 'internet_package:manage']
    },
    {
      name: 'Assets',
      permissions: ['assets:view', 'assets:manage']
    },
    {
      name: 'Company',
      permissions: ['company:view', 'company:manage']
    },
    {
      name: 'Invoice',
      permissions: ['invoice:view', 'invoice:manage']
    },
    {
      name: 'Transaction',
      permissions: ['transaction:view', 'transaction:manage']
    },
    {
      name: 'Tickets',
      permissions: ['tickets:view', 'tickets:manage', 'tickets:create']
    },
    {
      name: 'Trouble Reports',
      permissions: ['trouble_reports:view', 'trouble_reports:manage']
    },
    {
      name: 'MikroTik',
      permissions: ['mikrotik:view', 'mikrotik:manage']
    },
    {
      name: 'Network Monitoring',
      permissions: ['network_monitoring:view']
    },
    {
      name: 'User Management',
      permissions: ['user_management:view', 'user_management:manage']
    }
  ];
  
  return categories;
});

if (props.id) {
  await userManagementAdminApi()
    .getRole(props.id)
    .then((response) => {
      Object.assign(state, response.data);
      // Ensure permissions is an array
      if (!Array.isArray(state.permissions)) {
        state.permissions = [];
      }
    })
    .catch((error) => {
      console.error("Error fetching role:", error);
    });
}

const emit = defineEmits(['success'])

function onSuccess() {
  emit('success')
}

function toggleCategoryPermissions(permissions: string[], checked: boolean) {
  if (checked) {
    // Add all permissions from this category
    permissions.forEach(permission => {
      if (!state.permissions.includes(permission)) {
        state.permissions.push(permission);
      }
    });
  } else {
    // Remove all permissions from this category
    state.permissions = state.permissions.filter(permission => !permissions.includes(permission));
  }
}

function toggleAllPermissions(checked: boolean) {
  if (checked) {
    // Add all available permissions
    state.permissions = [...availablePermissions.value];
  } else {
    // Remove all permissions
    state.permissions = [];
  }
}

interface SubmitEvent {
    data: {
        name: string;
        permissions: string[];
    };
}

async function onSubmit(event: SubmitEvent) {
   if (props.id) {
    await userManagementAdminApi()
      .editRole(props.id, {
        name: state.name,
        permissions: state.permissions
      })
      .then((response) => {
        console.log("Success creating / editing role", response);
        onSuccess();
      })
      .catch((error) => {
        console.error("Error creating role:", error);
      });
  } else {
    await userManagementAdminApi()
      .createRole({
        name: state.name,
        permissions: state.permissions
      })
      .then((response) => {
        console.log("Success creating / editing role", response);
        onSuccess();
      })
      .catch((error) => {
        console.error("Error creating role:", error);
      });
  }
}
</script>

<template>
  <UModal>
    <div class="p-4">
        <div class="p-2 mb-4 text-2xl font-bold text-center">
            <h1>{{ props.isEdit ? "Edit" : "Add New" }} Role</h1>
        </div>
        <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
        >
        <UFormGroup label="Role name" name="name">
            <UInput v-model="state.name" />
        </UFormGroup>
        
        <UFormGroup label="Permissions" name="permissions">
          <div class="max-h-60 overflow-y-auto border rounded-lg p-4">
            <div class="space-y-4">
              <!-- Select All Checkbox -->
              <div class="flex items-center justify-between border-b pb-2">
                <h4 class="font-semibold text-sm text-gray-700">All Permissions</h4>
                <UCheckbox
                  :model-value="availablePermissions.every(p => state.permissions.includes(p))"
                  @update:model-value="toggleAllPermissions($event)"
                  label="Select All"
                  class="text-xs"
                />
              </div>
              
              <!-- Category Permissions -->
              <div v-for="category in permissionCategories" :key="category.name" class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-semibold text-sm text-gray-700">{{ category.name }}</h4>
                  <UCheckbox
                    :model-value="category.permissions.every(p => state.permissions.includes(p))"
                    @update:model-value="toggleCategoryPermissions(category.permissions, $event)"
                    label="Select All"
                    class="text-xs"
                  />
                </div>
                <div class="grid grid-cols-2 gap-2 ml-4">
                  <UCheckbox
                    v-for="permission in category.permissions"
                    :key="permission"
                    v-model="state.permissions"
                    :value="permission"
                    :label="permission"
                    class="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </UFormGroup>
        
        <UButton type="submit">Submit</UButton>
        </UForm>
    </div>
    </UModal>
</template>
