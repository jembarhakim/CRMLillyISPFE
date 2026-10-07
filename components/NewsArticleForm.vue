<script setup lang="ts">
import { object, string, boolean, type InferType } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { newsAdminApi, type NewsArticlePayload } from '@/api/admin/news'
import { useCustomToast } from '@/composables/useCustomToast'

const props = defineProps<{
  isEdit?: boolean
  articleId?: string
}>()

const router = useRouter()
const toast = useCustomToast()
const loadingArticle = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref('')
const imageError = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const existingImageUrl = ref('')
const apiHost = useApiHost()
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxImageSize = 5 * 1024 * 1024

const schema = object({
  title: string().trim().required('Judul wajib diisi.'),
  summary: string().trim().required('Ringkasan wajib diisi.'),
  content: string().trim().required('Konten artikel wajib diisi.'),
  is_published: boolean().required(),
})

type Schema = InferType<typeof schema>

const state = reactive<NewsArticlePayload>({
  title: '',
  summary: '',
  content: '',
  is_published: false,
})

const resolveImageUrl = (path: string) => {
  if (!path || /^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path
  return `${apiHost.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

const chooseImage = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  imageError.value = ''
  if (!file) return

  const extension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedImageTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    imageError.value = 'Format file harus JPG, JPEG, PNG, WEBP, atau GIF.'
    selectedImage.value = null
    if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
    input.value = ''
    return
  }
  if (file.size > maxImageSize) {
    imageError.value = 'Ukuran gambar maksimal 5 MB.'
    selectedImage.value = null
    if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
    input.value = ''
    return
  }

  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  selectedImage.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

onMounted(async () => {
  if (!props.isEdit || !props.articleId) return

  loadingArticle.value = true
  errorMessage.value = ''
  try {
    const response = await newsAdminApi().getById(props.articleId)
    const article = response?.data ?? response
    state.title = article.title || ''
    state.summary = article.summary || ''
    state.content = article.content || ''
    existingImageUrl.value = article.image_url || ''
    state.is_published = Boolean(article.is_published)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal memuat detail artikel.'
  } finally {
    loadingArticle.value = false
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (props.isEdit && !props.articleId) return
  if (!props.isEdit && !selectedImage.value) {
    imageError.value = 'Pilih gambar untuk artikel baru.'
    return
  }
  if (imageError.value) return

  submitting.value = true
  try {
    const payload = new FormData()
    payload.append('title', state.title)
    payload.append('summary', state.summary)
    payload.append('content', state.content)
    payload.append('is_published', String(state.is_published))
    if (selectedImage.value) payload.append('image', selectedImage.value)

    if (props.isEdit) {
      await newsAdminApi().update(props.articleId!, payload)
      toast.add({ title: 'Artikel berhasil diperbarui.', color: 'green' })
    } else {
      await newsAdminApi().create(payload)
      toast.add({ title: 'Artikel berhasil dibuat.', color: 'green' })
    }
    await router.push('/dashboard/news')
  } catch (error: any) {
    toast.add({
      title: 'Gagal menyimpan artikel.',
      description: error?.message || 'Terjadi kesalahan saat menyimpan artikel.',
      color: 'red',
    })
  } finally {
    submitting.value = false
  }
}

const cancel = () => router.push('/dashboard/news')

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})
</script>

<template>
  <section class="mx-auto w-full max-w-4xl space-y-5">
    <header class="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">{{ isEdit ? 'Edit artikel' : 'Tambah artikel' }}</h1>
        <p class="mt-1 text-sm text-gray-600">Artikel ditampilkan pada bagian Latest Updates jika diterbitkan.</p>
      </div>
      <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" label="Kembali" @click="cancel" />
    </header>

    <div v-if="loadingArticle" class="py-12 text-center text-sm text-gray-500" role="status">
      Memuat detail artikel...
    </div>
    <div v-else-if="errorMessage" class="flex flex-col items-start gap-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p>{{ errorMessage }}</p>
      <UButton color="gray" variant="soft" label="Kembali ke daftar" @click="cancel" />
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-7" @submit="onSubmit">
      <UFormGroup label="Judul" name="title" required>
        <UInput v-model="state.title" maxlength="180" placeholder="Judul artikel" />
      </UFormGroup>

      <UFormGroup label="Ringkasan" name="summary" required>
        <UTextarea v-model="state.summary" :rows="3" maxlength="500" placeholder="Ringkasan yang tampil pada kartu berita" />
      </UFormGroup>

      <UFormGroup label="Gambar artikel" name="image" :required="!isEdit">
        <input ref="imageInput" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
          class="block w-full rounded border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:font-medium hover:file:bg-gray-200"
          @change="chooseImage" />
        <p class="mt-1 text-xs text-gray-500">JPG, JPEG, PNG, WEBP, atau GIF. Maksimal 5 MB. {{ isEdit ? 'Kosongkan jika ingin mempertahankan gambar lama.' : '' }}</p>
        <p v-if="imageError" class="mt-1 text-sm text-red-600" role="alert">{{ imageError }}</p>
      </UFormGroup>

      <div v-if="imagePreviewUrl || existingImageUrl" class="overflow-hidden rounded border border-gray-200">
        <img :src="imagePreviewUrl || resolveImageUrl(existingImageUrl)" alt="Preview gambar artikel" class="max-h-72 w-full object-cover" />
      </div>

      <UFormGroup label="Konten artikel" name="content" required>
        <UTextarea v-model="state.content" :rows="12" placeholder="Isi lengkap artikel" />
      </UFormGroup>

      <UCheckbox v-model="state.is_published" label="Terbitkan artikel" />

      <div class="flex flex-col-reverse justify-end gap-2 border-t border-gray-200 pt-5 sm:flex-row">
        <UButton color="gray" variant="ghost" label="Batal" @click="cancel" />
        <UButton type="submit" :loading="submitting" :disabled="submitting"
          :label="isEdit ? 'Simpan perubahan' : 'Buat artikel'" />
      </div>
    </UForm>
  </section>
</template>
