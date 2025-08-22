<script setup lang="ts">
import { onMounted, ref, watch, defineAsyncComponent } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const rows = ref<any[]>([])
const loading = ref(true)
const note = ref('')
const techId = ref('')
const selectedId = ref<number | null>(null)
const activeTab = ref(0)
const isLoading = ref(true)

async function refresh() {
  const res: any = await ticketsApi().list()
  rows.value = res.data || res
  loading.value = false
  isLoading.value = false
}

onMounted(refresh)

function actPrepare(id: number) { selectedId.value = id; note.value = ''; techId.value = '' }

async function sendToNOC() { if (!selectedId.value) return; await ticketsApi().sendToNOC(selectedId.value, note.value); await refresh() }
async function nocSolved() { if (!selectedId.value) return; await ticketsApi().nocSolved(selectedId.value, note.value); await refresh() }
async function nocPhysical() { if (!selectedId.value) return; await ticketsApi().nocPhysical(selectedId.value, note.value); await refresh() }
async function assignTechnician() { if (!selectedId.value) return; await ticketsApi().assignTechnician(selectedId.value, techId.value); await refresh() }
async function resolve() { if (!selectedId.value) return; await ticketsApi().resolve(selectedId.value, note.value); await refresh() }

const showAdd = ref(false)
const form = ref({ customer_id: 1, title: '', description: '', type: 'wifi', gps_lat: undefined as number | undefined, gps_lng: undefined as number | undefined })
async function createTicket() {
  try {
    console.log('Auth store token:', authStore.getToken) // Debug log
    console.log('Creating ticket with data:', form.value) // Debug log
    await ticketsApi().create({
      customer_id: Number(form.value.customer_id),
      title: form.value.title,
      description: form.value.description,
      type: form.value.type,
      gps_lat: form.value.gps_lat,
      gps_lng: form.value.gps_lng,
    })
    showAdd.value = false
    form.value = { customer_id: 1, title: '', description: '', type: 'wifi', gps_lat: undefined, gps_lng: undefined }
    await refresh()
  } catch (error) {
    console.error('Error creating ticket:', error) // Debug log
  }
}
// Fetchers similar to transaction page
async function fetchAllTickets(params: any) {
  // params is kept for parity; current API does not filter server-side
  isLoading.value = true
  await ticketsApi()
    .list()
    .then((response: any) => {
      const data = response.data || response
      data.forEach((t: any, idx: number) => {
        t.number = idx + 1
      })
      rows.value = data
    })
    .catch((err: any) => {
      console.error('Error fetching tickets:', err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const tab_items = [
  { label: 'Tickets', value: 'tickets' },
  { label: 'Trouble Reports', value: 'trouble' },
]

async function fetchTicket() { await fetchAllTickets({}) }
async function fetchTrouble() { /* rendered component fetches itself */ }

watch(activeTab, (idx) => { if (idx === 0) fetchTicket(); else fetchTrouble() }, { immediate: true })

// Use alias consistent with tsconfig paths
const TroubleReport = defineAsyncComponent(() => import('@/pages/dashboard/report/trouble/index.vue'))
</script>
<template>
  <div class="space-y-4 text-gray-900">
    <UTabs :items="tab_items" class="w-full" v-model="activeTab" />

    <div v-if="activeTab === 0" class="space-y-4">
      <h1 class="text-2xl font-semibold text-gray-900">Trouble Tickets</h1>
      <div class="p-4 bg-white rounded-lg shadow border border-gray-100 overflow-auto">
        <div class="flex items-center justify-between mb-3">
          <button class="px-3 py-2 bg-emerald-600 text-white rounded" @click="showAdd = true">Add Ticket</button>
        </div>
        <table class="min-w-full text-sm text-gray-700">
          <thead class="bg-gray-50">
            <tr class="text-left border-b border-gray-100 uppercase text-xs tracking-wide text-gray-600">
              <th class="p-2">ID</th>
              <th class="p-2">Title</th>
              <th class="p-2">Type</th>
              <th class="p-2">Status</th>
              <th class="p-2">Assignee</th>
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="border-b border-gray-100 hover:bg-gray-50/60">
              <td class="p-2">{{ r.id }}</td>
              <td class="p-2">{{ r.title }}</td>
              <td class="p-2 capitalize">{{ r.type }}</td>
              <td class="p-2 capitalize">{{ r.status }}</td>
                             <td class="p-2 capitalize">{{ r.current_assignee_role }}</td>
              <td class="p-2 space-x-2">
                <button class="px-2 py-1 text-white bg-blue-600 rounded" @click="actPrepare(r.id); sendToNOC()">To
                  NOC</button>
                <button class="px-2 py-1 text-white bg-green-600 rounded" @click="actPrepare(r.id); nocSolved()">NOC
                  Solved</button>
                <button class="px-2 py-1 text-white bg-amber-600 rounded"
                  @click="actPrepare(r.id); nocPhysical()">Physical</button>
                <button class="px-2 py-1 text-white bg-cyan-600 rounded"
                  @click="actPrepare(r.id); assignTechnician()">Assign Tech</button>
                <button class="px-2 py-1 text-white bg-emerald-600 rounded"
                  @click="actPrepare(r.id); resolve()">Resolve</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Add Ticket -->
      <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showAdd = false"></div>
        <div class="relative w-full max-w-2xl mx-4 rounded-xl shadow-xl bg-slate-900 text-slate-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Add New Ticket</h2>
            <button class="text-slate-300 hover:text-white" @click="showAdd = false">✕</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-300 mb-1">Customer ID</label>
              <input v-model="form.customer_id" type="number"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">Type</label>
              <select v-model="form.type"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                <option value="wifi">WiFi</option>
                <option value="internet">Internet</option>
                <option value="hardware">Hardware</option>
                <option value="power">Power</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Title</label>
              <input v-model="form.title"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Description</label>
              <textarea v-model="form.description"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none"></textarea>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">GPS Lat</label>
              <input v-model.number="form.gps_lat" type="number" step="0.0000001"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">GPS Lng</label>
              <input v-model.number="form.gps_lng" type="number" step="0.0000001"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-600 text-white" @click="showAdd = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-emerald-600 text-white" @click="createTicket">Submit</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <ClientOnly>
        <component :is="TroubleReport" />
      </ClientOnly>
    </div>
  </div>
</template>
