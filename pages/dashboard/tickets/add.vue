<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { customerAdminApi } from '@/api/admin/customer'
import { areaAdminApi } from '@/api/admin/area'

const loading = ref(true)
const customers = ref<{id:string, name:string, area?:{id:string, name_city:string, name_subdistrict:string, name_village:string}, area_id?:string, areaId?:string}[]>([])
const allCustomers = ref<{id:string, name:string, area?:{id:string, name_city:string, name_subdistrict:string, name_village:string}, area_id?:string, areaId?:string}[]>([])
const areas = ref<{id:string, name_city:string, name_subdistrict:string, name_village:string}[]>([])
const selectedAreaId = ref('')
const types = ref<{id:string, name?:string}[]>([])
const showNewType = ref(false)
const newTypeName = ref('')

const form = ref({
  customer_id: '',
  title: '',
  description: '' as string | undefined,
  type: ''
})

// Keyword-based trouble type classification
const classifyTroubleType = (text: string): string => {
  const lowerText = text.toLowerCase()
  
  // Define keywords for each trouble type (using new database IDs)
  const keywords = {
    '1': ['kabel', 'terputus', 'putus', 'cable', 'broken', 'cut', 'terpotong', 'damage'],
    '2': ['listrik', 'mati', 'power', 'electric', 'elektrik', 'mati listrik', 'blackout', 'outage', 'gangguan listrik'],
    '3': ['dhcp', 'restart', 'reboot', 'router', 'modem', 'koneksi', 'connection', 'ip', 'network', 'masalah dhcp'],
    '4': ['perangkat', 'device', 'tidak berfungsi', 'rusak', 'broken', 'mati', 'offline', 'perangkat tidak berfungsi'],
    '5': ['server', 'konfigurasi', 'config', 'setting', 'setup', 'configuration', 'koneksi server'],
    '6': ['batas', 'limit', 'terlampaui', 'exceeded', 'over', 'quota', 'bandwidth', 'pengguna terlampaui']
  }
  
  // Check for keyword matches
  for (const [troubleType, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (lowerText.includes(keyword)) {
        return troubleType
      }
    }
  }
  
  return '1' // Default fallback to 'Kabel Terputus'
}


// Filter customers based on selected area
const filteredCustomers = computed(() => {
  if (!selectedAreaId.value) {
    return customers.value
  }
  return customers.value.filter(customer => {
    // Check if customer has area and if it matches selected area
    if (!customer.area) return false
    // Try different possible area ID properties
    return (customer.area as any)?.id === selectedAreaId.value || 
           (customer as any).area_id === selectedAreaId.value ||
           (customer as any).areaId === selectedAreaId.value
  })
})


onMounted(async () => {
  // load customers (reuse admin API which already exists)
  try {
    const custRes: any = await customerAdminApi().getAllCustomers()
    const customerData = (custRes.data || custRes || []).map((c:any) => ({ 
      id: c.id, 
      name: c.name,
      area: c.area
    }))
    customers.value = customerData
    allCustomers.value = customerData
  } catch (e) { console.error('load customers', e) }

  // load areas
  try {
    const areaRes: any = await areaAdminApi().getAllAreas()
    areas.value = (areaRes.data || areaRes || []).map((a:any) => ({
      id: a.id,
      name_city: a.name_city,
      name_subdistrict: a.name_subdistrict,
      name_village: a.name_village
    }))
  } catch (e) { console.error('load areas', e) }

  try {
    const tt: any = await ticketsApi().troubleTypes()
    types.value = tt.data || tt || []
  } catch (e) { console.error('load trouble types', e) }

  // preselect first options if empty
  if (!form.value.customer_id && filteredCustomers.value.length) form.value.customer_id = filteredCustomers.value[0].id
  if (!form.value.type && types.value.length) form.value.type = types.value[0].id
  showNewType.value = types.value.length === 0
  loading.value = false
})

async function submit(){
  // Auto-classify trouble type based on title/description
  const textToAnalyze = form.value.title || form.value.description || ''
  let classifiedType = ''
  
  if (textToAnalyze.trim()) {
    classifiedType = classifyTroubleType(textToAnalyze)
  }
  
  await ticketsApi().create({
    customer_id: form.value.customer_id,
    title: form.value.title,
    description: form.value.description,
    type: classifiedType,
  })
  navigateTo('/dashboard/tickets')
}

function generateTypeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  // fallback
  return 'tt_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const saveNewType = async () => {
  const id = generateTypeId()
  await ticketsApi().createTroubleType(id, newTypeName.value || undefined)
  const tt: any = await ticketsApi().troubleTypes()
  types.value = tt.data || tt || []
  form.value.type = id
  newTypeName.value = ''
  showNewType.value = false
}
</script>

<template>
  <div class="max-w-2xl p-6 bg-white rounded-lg shadow border border-gray-100">
    <h1 class="text-2xl font-semibold mb-4">Add Trouble Ticket</h1>

    <div v-if="loading">Loading...</div>
    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Area</label>
          <select v-model="selectedAreaId" class="w-full border rounded px-3 py-2">
            <option value="">All Areas</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">
              {{ area.name_city }} - {{ area.name_subdistrict }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Customer</label>
          <select v-model="form.customer_id" class="w-full border rounded px-3 py-2">
            <option v-for="c in filteredCustomers" :key="c.id" :value="c.id">
              {{ c.name }}
              <template v-if="c.area">
                ({{ c.area.name_city }} - {{ c.area.name_subdistrict }})
              </template>
            </option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Title</label>
        <input v-model="form.title" class="w-full border rounded px-3 py-2" placeholder="Enter trouble description..." />
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Description</label>
        <textarea v-model="form.description as any" class="w-full border rounded px-3 py-2"></textarea>
      </div>

      <button class="px-4 py-2 bg-emerald-600 text-white rounded">Create Ticket</button>
    </form>
  </div>
</template>


