<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue'
import { newsAdminApi } from '@/api/admin/news'
import { useCustomToast } from '@/composables/useCustomToast'

useHead({ title: 'News Management - CRM System' })

type NewsArticle = {
  id: string
  title: string
  summary: string
  content?: string
  image_url: string
  is_published: boolean
  published_at?: string
  createdAt?: string
  created_at?: string
}

const articles = ref<NewsArticle[]>([])
const search = ref('')
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const errorMessage = ref('')
const updatingArticleId = ref<string | null>(null)
const toast = useCustomToast()
const router = useRouter()
const apiHost = useApiHost()

const columns = [
  { key: 'number', label: 'No' },
  { key: 'title', label: 'Judul' },
  { key: 'summary', label: 'Ringkasan' },
  { key: 'status', label: 'Status' },
  { key: 'published_at', label: 'Tanggal terbit' },
  { key: 'actions', label: 'Aksi' },
]

const filteredArticles = computed(() => {
  const query = search.value.trim().toLowerCase()
  const matches = query
    ? articles.value.filter((article) => [article.title, article.summary].some((value) => value?.toLowerCase().includes(query)))
    : articles.value

  return matches.map((article, index) => ({
    ...article,
    number: index + 1,
    statusLabel: article.is_published ? 'Terbit' : 'Draft',
  }))
})

const visibleArticles = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredArticles.value.slice(start, start + pageSize)
})

watch(search, () => {
  page.value = 1
})

const fetchArticles = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await newsAdminApi().getAll()
    const list = response?.data?.items ?? response?.items ?? response?.data
    if (!Array.isArray(list)) throw new Error(response?.message || 'Format daftar artikel tidak valid.')
    articles.value = list
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal memuat daftar artikel.'
  } finally {
    loading.value = false
  }
}

const openCreateForm = () => router.push('/dashboard/news/create')

const openEditForm = (article: NewsArticle) => router.push(`/dashboard/news/edit/${encodeURIComponent(article.id)}`)

const updatePublicationStatus = async (article: NewsArticle, event: Event) => {
  const select = event.target as HTMLSelectElement
  const previousValue = article.is_published
  const nextValue = select.value === 'visible'

  if (nextValue === previousValue) return
  if (updatingArticleId.value) {
    select.value = previousValue ? 'visible' : 'hidden'
    return
  }

  updatingArticleId.value = article.id
  try {
    const response = await newsAdminApi().getById(article.id)
    const detail = response?.data?.item ?? response?.data ?? response?.item ?? response

    if (!detail?.title || !detail?.summary || !detail?.content) {
      throw new Error('Detail artikel tidak lengkap, status tidak dapat diperbarui.')
    }

    const payload = new FormData()
    payload.append('title', detail.title)
    payload.append('summary', detail.summary)
    payload.append('content', detail.content)
    payload.append('is_published', String(nextValue))

    await newsAdminApi().update(article.id, payload)
    const verifyResponse = await newsAdminApi().getById(article.id)
    const verifiedArticle = verifyResponse?.data?.item ?? verifyResponse?.data ?? verifyResponse?.item ?? verifyResponse
    const persistedStatus = verifiedArticle?.is_published

    if (![true, false, 'true', 'false', 1, 0, '1', '0'].includes(persistedStatus)) {
      throw new Error('Backend tidak mengembalikan status publikasi terbaru.')
    }

    const isPublished = persistedStatus === true || persistedStatus === 'true' || persistedStatus === 1 || persistedStatus === '1'
    if (isPublished !== nextValue) {
      throw new Error('Status belum tersimpan di backend. Periksa kembali data artikel.')
    }

    await fetchArticles()

    toast.add({
      title: isPublished ? 'Artikel ditampilkan.' : 'Artikel disembunyikan.',
      color: 'green',
    })
  } catch (error: any) {
    select.value = previousValue ? 'visible' : 'hidden'
    toast.add({
      title: 'Gagal mengubah visibilitas artikel.',
      description: error?.message || 'Terjadi kesalahan saat memperbarui status.',
      color: 'red',
    })
  } finally {
    updatingArticleId.value = null
  }
}

const deleteArticle = async (article: NewsArticle) => {
  if (!window.confirm(`Hapus artikel "${article.title}"?`)) return

  try {
    await newsAdminApi().delete(article.id)
    toast.add({ title: 'Artikel berhasil dihapus.', color: 'green' })
    await fetchArticles()
  } catch (error: any) {
    toast.add({
      title: 'Gagal menghapus artikel.',
      description: error?.message || 'Terjadi kesalahan saat menghapus artikel.',
      color: 'red',
    })
  }
}

const rowActions = (article: NewsArticle) => [[
  { label: 'Edit', icon: 'pencil-square-20-solid', click: () => openEditForm(article) },
  { label: 'Hapus', icon: 'trash-2-20-solid', click: () => deleteArticle(article) },
]]

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}

const resolveImageUrl = (imageUrl?: string) => {
  if (!imageUrl || /^(https?:)?\/\//i.test(imageUrl) || /^(data|blob):/i.test(imageUrl)) return imageUrl
  return `${apiHost.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
}

onMounted(fetchArticles)
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Kelola News</h1>
        <p class="mt-1 text-sm text-gray-600">Buat dan atur artikel yang ditampilkan di Latest Updates.</p>
      </div>
      <UButton label="Tambah artikel" icon="i-heroicons-plus" @click="openCreateForm" />
    </header>

    <div class="flex flex-col gap-3 border-y border-gray-200 py-3 sm:flex-row sm:items-center sm:justify-between">
      <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Cari judul atau ringkasan" class="w-full sm:max-w-sm" />
      <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-path" label="Muat ulang" :loading="loading" @click="fetchArticles" />
    </div>

    <div v-if="errorMessage" class="flex flex-col items-start gap-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p>{{ errorMessage }}</p>
      <UButton color="red" variant="soft" label="Coba lagi" @click="fetchArticles" />
    </div>

    <div v-else-if="loading && articles.length === 0" class="py-12 text-center text-sm text-gray-500" role="status">
      Memuat artikel...
    </div>

    <div v-else-if="filteredArticles.length === 0" class="py-12 text-center text-sm text-gray-500">
      {{ search ? 'Tidak ada artikel yang cocok.' : 'Belum ada artikel.' }}
    </div>

    <UTable v-else :rows="visibleArticles" :columns="columns">
      <template #title-data="{ row }">
        <div class="max-w-xs">
          <p class="truncate font-medium text-gray-900">{{ row.title }}</p>
          <a v-if="row.image_url" :href="resolveImageUrl(row.image_url)" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-700 hover:underline">
            Lihat gambar
          </a>
        </div>
      </template>
      <template #summary-data="{ row }">
        <p class="max-w-sm truncate text-gray-600">{{ row.summary }}</p>
      </template>
      <template #status-data="{ row }">
        <select :value="row.is_published ? 'visible' : 'hidden'"
          :disabled="Boolean(updatingArticleId)"
          :aria-label="`Visibilitas artikel ${row.title}`"
          class="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 disabled:cursor-wait disabled:opacity-60"
          :class="row.is_published ? 'border-green-300 bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'"
          @change="updatePublicationStatus(row, $event)">
          <option value="visible">Tampilkan</option>
          <option value="hidden">Sembunyikan</option>
        </select>
      </template>
      <template #published_at-data="{ row }">
        {{ formatDate(row.published_at || row.createdAt || row.created_at) }}
      </template>
      <template #actions-data="{ row }">
        <UDropdown :items="rowActions(row)">
          <button type="button" class="inline-flex items-center justify-center rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600" aria-label="Aksi artikel">
            <LucideIcon name="ellipsis-vertical" :size="18" />
          </button>
        </UDropdown>
      </template>
    </UTable>

    <div v-if="filteredArticles.length > pageSize" class="flex justify-end border-t border-gray-200 pt-3">
      <UPagination v-model="page" :page-count="pageSize" :total="filteredArticles.length" />
    </div>
  </section>
</template>
