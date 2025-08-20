<script setup lang="ts">
import { ref } from 'vue'
import { ticketsApi } from '@/api/tickets'

const form = ref({
  customer_id: 1,
  title: '',
  description: '',
  type: 'wifi',
  gps_lat: undefined as number | undefined,
  gps_lng: undefined as number | undefined,
})

async function submit(){
  await ticketsApi().create({
    customer_id: Number(form.value.customer_id),
    title: form.value.title,
    description: form.value.description,
    type: form.value.type,
    gps_lat: form.value.gps_lat,
    gps_lng: form.value.gps_lng,
  })
  navigateTo('/dashboard/tickets')
}
</script>

<template>
  <div class="max-w-2xl p-6 bg-white rounded-lg shadow border border-gray-100">
    <h1 class="text-2xl font-semibold mb-4">Add Trouble Ticket</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Customer ID</label>
        <input v-model="form.customer_id" type="number" class="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Title</label>
        <input v-model="form.title" class="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Description</label>
        <textarea v-model="form.description" class="w-full border rounded px-3 py-2"></textarea>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Type</label>
        <select v-model="form.type" class="w-full border rounded px-3 py-2">
          <option value="wifi">WiFi</option>
          <option value="internet">Internet</option>
          <option value="hardware">Hardware</option>
          <option value="power">Power</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">GPS Lat</label>
          <input v-model.number="form.gps_lat" type="number" step="0.0000001" class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">GPS Lng</label>
          <input v-model.number="form.gps_lng" type="number" step="0.0000001" class="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <button class="px-4 py-2 bg-emerald-600 text-white rounded">Create Ticket</button>
    </form>
  </div>
</template>


