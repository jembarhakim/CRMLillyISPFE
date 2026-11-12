<script setup lang="ts">
import Role from './role/Role.vue';
import User from './user/User.vue';



// Set page title
useHead({
  title: 'User & Role Management - CRM System'
})

const tab_items = [
  {
    label: "User Management",
    value: "user",
  },
  {
    label: "Role",
    value: "role",
  },
  // {
  //   label: "Report Customer Installation",
  //   value: "report-customer",
  // },
];
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="User Management"
      description="Kelola akun pengguna dan role akses dalam sistem."
      icon="users"
      eyebrow="Akses & Pengguna"
    />
    <section class="admin-data-panel p-4 sm:p-5">
      <UTabs :items="tab_items" class="w-full">
        <template #item="{ item }">
          <div v-if="item.value == 'user'">
            <User />
          </div>

          <div v-if="item.value == 'role'">
            <Role />
          </div>

          <!-- <div v-if="item.value == 'report-customer'">
        <CustomerInstallation />

      </div> -->
        </template>
      </UTabs>
    </section>
  </div>
</template>
