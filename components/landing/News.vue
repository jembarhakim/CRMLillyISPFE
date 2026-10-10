<template>
    <div class="relative w-full">
        <!-- SEKSI DAFTAR BERITA -->
        <section id="id_news" class="py-16 sm:py-24 bg-white w-full max-w-full">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

                <!-- Header Seksi -->
                <div class="text-center mb-12 sm:mb-16">
                    <span
                        class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                        PROMO & ARTIKEL TERBARU
                    </span>
                    <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                        Kabar Terbaru dari Lilly ISP
                    </h2>
                </div>

                <!-- State Loading -->
                <div v-if="newsLoading" class="py-12 flex justify-center items-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-4 border-[#F9EBEB] border-t-[#A93133]"></div>
                </div>

                <!-- State Error -->
                <div v-else-if="newsError"
                    class="py-12 text-center text-red-500 bg-red-50 rounded-2xl max-w-2xl mx-auto border border-red-100">
                    <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
                    <p class="font-medium mb-4">{{ newsError }}</p>
                    <button @click="loadNews"
                        class="px-6 py-2 bg-[#A93133] text-white rounded-full hover:bg-red-800 transition-colors">
                        Coba Lagi
                    </button>
                </div>

                <!-- State Kosong -->
                <div v-else-if="newsItems.length === 0"
                    class="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl max-w-2xl mx-auto border border-gray-100">
                    <i class="fas fa-newspaper text-4xl mb-3 text-gray-300"></i>
                    <p>Belum ada artikel atau promo yang diterbitkan saat ini.</p>
                </div>

                <!-- Grid Berita -->
                <template v-else>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        <article v-for="item in newsItems" :key="item.id"
                            class="flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">

                            <!-- Thumbnail -->
                            <div class="relative h-56 sm:h-60 overflow-hidden bg-gray-100">
                                <img v-if="item.image_url" :src="resolveNewsImageUrl(item.image_url)" :alt="item.title"
                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    @error="handleImageError" />
                                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                                    <i class="fas fa-image text-4xl"></i>
                                </div>

                                <!-- Badge Kategori Overlay (Opsional) -->
                                <div
                                    class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#A93133] shadow-sm">
                                    Berita
                                </div>
                            </div>

                            <!-- Konten Kartu -->
                            <div class="p-6 flex-grow flex flex-col">
                                <p v-if="item.published_at"
                                    class="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                                    <i class="far fa-calendar-alt"></i> {{ formatNewsDate(item.published_at) }}
                                </p>
                                <h3
                                    class="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#A93133] transition-colors">
                                    {{ item.title }}
                                </h3>
                                <p class="text-sm text-gray-600 mb-6 line-clamp-3 flex-grow">
                                    {{ item.summary }}
                                </p>

                                <!-- Tombol Baca -->
                                <button @click="openNewsDetail(item)"
                                    class="mt-auto self-start px-5 py-2 bg-[#F9EBEB] text-[#A93133] text-sm font-bold rounded-full group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300">
                                    Baca Selengkapnya <i class="fas fa-arrow-right ml-1 text-xs"></i>
                                </button>
                            </div>
                        </article>
                    </div>

                    <!-- Pagination -->
                    <div v-if="newsTotalPages > 1" class="mt-12 flex items-center justify-center gap-3">
                        <button @click="changeNewsPage(newsPage - 1)" :disabled="newsPage <= 1"
                            class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 text-gray-600 hover:border-[#A93133] hover:text-[#A93133] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span
                            class="text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                            Halaman {{ newsPage }} dari {{ newsTotalPages }}
                        </span>
                        <button @click="changeNewsPage(newsPage + 1)" :disabled="newsPage >= newsTotalPages"
                            class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 text-gray-600 hover:border-[#A93133] hover:text-[#A93133] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </template>
            </div>
        </section>

        <!-- MODAL POPUP BACA BERITA -->
        <transition name="fade">
            <div v-if="selectedNews" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                role="presentation">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeNewsDetail"></div>

                <!-- Konten Modal -->
                <article
                    class="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-slide-up"
                    role="dialog" aria-modal="true" :aria-label="selectedNews.title">

                    <!-- Tombol Close Melayang -->
                    <button @click="closeNewsDetail"
                        class="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 hover:bg-[#A93133] hover:text-white transition-colors shadow-sm">
                        <i class="fas fa-times text-lg"></i>
                    </button>

                    <!-- Gambar Cover -->
                    <div class="relative h-48 sm:h-64 lg:h-80 flex-shrink-0 bg-gray-100">
                        <img v-if="selectedNews.image_url" :src="resolveNewsImageUrl(selectedNews.image_url)"
                            :alt="selectedNews.title" class="w-full h-full object-cover" @error="handleImageError" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <!-- Body Artikel (Scrollable) -->
                    <div class="p-6 sm:p-8 lg:p-10 overflow-y-auto custom-scrollbar">
                        <div class="max-w-3xl mx-auto">
                            <p v-if="selectedNews.published_at" class="text-sm font-medium text-[#A93133] mb-3">
                                Diterbitkan pada {{ formatNewsDate(selectedNews.published_at) }}
                            </p>
                            <h2
                                class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                                {{ selectedNews.title }}
                            </h2>

                            <div v-if="newsDetailLoading" class="py-8 flex justify-center">
                                <div
                                    class="animate-spin rounded-full h-8 w-8 border-4 border-[#F9EBEB] border-t-[#A93133]">
                                </div>
                            </div>

                            <div v-else-if="newsDetailError"
                                class="py-4 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                                <i class="fas fa-exclamation-triangle mr-2"></i> {{ newsDetailError }}
                            </div>

                            <div v-else
                                class="prose prose-lg prose-red max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                                {{ selectedNews.content }}
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { publicNewsApi } from '@/api/news' // Pastikan path API ini sesuai dengan project-mu

// Setup host untuk gambar
const apiHost = useApiHost()
const resolveNewsImageUrl = (imageUrl) => {
    if (!imageUrl || /^(https?:)?\/\//i.test(imageUrl) || /^(data|blob):/i.test(imageUrl)) return imageUrl
    return `${apiHost.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
}

// Handler gambar rusak
const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800&auto=format&fit=crop'
}

// State Berita
const newsItems = ref([])
const newsPage = ref(1)
const newsLimit = 3
const newsTotal = ref(0)
const newsLoading = ref(true)
const newsError = ref('')
const newsTotalPages = computed(() => Math.max(1, Math.ceil(newsTotal.value / newsLimit)))

// State Modal Detail
const selectedNews = ref(null)
const newsDetailLoading = ref(false)
const newsDetailError = ref('')

// Fetch Daftar Berita
const loadNews = async () => {
    newsLoading.value = true
    newsError.value = ''

    try {
        const response = await publicNewsApi().getPublished(newsPage.value, newsLimit)
        const items = response?.items || response?.data?.items || []

        if (!Array.isArray(items)) {
            throw new Error(response?.message || 'Format data berita tidak valid.')
        }

        newsItems.value = items
        newsPage.value = Number(response.page ?? response.data?.page ?? newsPage.value)
        newsTotal.value = Number(response.total ?? response.data?.total ?? items.length)
    } catch (error) {
        newsError.value = error?.message || 'Gagal memuat artikel terbaru.'
    } finally {
        newsLoading.value = false
    }
}

// Pindah Halaman
const changeNewsPage = (page) => {
    if (page < 1 || page > newsTotalPages.value || page === newsPage.value) return
    newsPage.value = page
    loadNews()
}

// Buka Modal Berita
const openNewsDetail = async (item) => {
    selectedNews.value = { ...item, content: '' }
    newsDetailLoading.value = true
    newsDetailError.value = ''

    try {
        const response = await publicNewsApi().getPublishedById(item.id)
        selectedNews.value = response?.data || response
    } catch (error) {
        newsDetailError.value = error?.message || 'Gagal memuat isi artikel.'
    } finally {
        newsDetailLoading.value = false
    }
}

// Tutup Modal Berita
const closeNewsDetail = () => {
    selectedNews.value = null
    newsDetailError.value = ''
}

// Format Tanggal
const formatNewsDate = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)
}

onMounted(() => {
    loadNews()
})
</script>

<style scoped>
/* Animasi Khusus Modal */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
    0% {
        opacity: 0;
        transform: translateY(40px) scale(0.98);
    }

    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Custom Scrollbar untuk Modal */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>