<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { incidentsAdminApi, type MassIncident } from '@/api/admin/incidents'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const incidents = ref<MassIncident[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const etaDraft = ref<Record<string, string>>({})

async function loadIncidents() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    incidents.value = await incidentsAdminApi().list('')
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal memuat insiden'
  } finally {
    isLoading.value = false
  }
}

async function saveETA(item: MassIncident) {
  const eta = etaDraft.value[item.id]
  if (!eta) return
  try {
    await incidentsAdminApi().update(item.id, { eta: new Date(eta).toISOString() })
    await loadIncidents()
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal menyimpan ETA'
  }
}

async function resolveIncident(item: MassIncident) {
  try {
    await incidentsAdminApi().resolve(item.id, 'Gangguan telah ditangani dan konektivitas dipulihkan.')
    await loadIncidents()
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal menyelesaikan insiden'
  }
}

onMounted(loadIncidents)
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-red-600">NET-08 / NET-09</p>
        <h1 class="text-2xl font-bold text-gray-900">Monitoring &amp; Insiden Gangguan Massal</h1>
      </div>
      <button class="rounded-lg border px-4 py-2 text-sm font-semibold" @click="loadIncidents">Refresh</button>
    </div>

    <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div
      v-if="incidents.some((item) => item.status === 'active')"
      class="rounded-xl border border-red-300 bg-red-600 px-5 py-4 text-white shadow-lg"
    >
      <p class="font-bold">Peringatan: terdapat {{ incidents.filter((item) => item.status === 'active').length }} insiden massal aktif.</p>
    </div>

    <div v-if="isLoading" class="text-sm text-gray-500">Memuat insiden...</div>
    <div v-else class="grid gap-4">
      <article
        v-for="item in incidents"
        :key="item.id"
        class="rounded-xl border bg-white p-5 shadow-sm"
        :class="item.status === 'active' ? 'border-red-200' : 'border-gray-200'"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-bold"
                :class="item.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ item.status === 'active' ? 'AKTIF' : 'SELESAI' }}
              </span>
              <span class="text-xs text-gray-500">{{ item.source }}</span>
            </div>
            <h2 class="mt-2 text-lg font-bold text-gray-900">{{ item.title }}</h2>
            <p class="mt-1 text-sm text-gray-600">{{ item.description || item.node_name }}</p>
            <p class="mt-2 text-sm text-gray-700">
              Pelanggan terdampak: <strong>{{ item.affected_customer_ids?.length || 0 }}</strong>
              · Tiket terkait: <strong>{{ item.affected_ticket_ids?.length || 0 }}</strong>
            </p>
          </div>

          <div v-if="item.status === 'active'" class="flex min-w-[260px] flex-col gap-2">
            <label class="text-xs font-semibold text-gray-600">Estimasi Waktu Selesai</label>
            <input
              v-model="etaDraft[item.id]"
              type="datetime-local"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
            <button class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white" @click="saveETA(item)">
              Simpan ETA
            </button>
            <button class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" @click="resolveIncident(item)">
              Tandai Selesai &amp; Tutup Tiket
            </button>
          </div>
        </div>
      </article>

      <div v-if="!incidents.length" class="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">
        Belum ada histori insiden.
      </div>
    </div>
  </div>
</template>
