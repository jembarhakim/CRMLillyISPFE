<template>
  <div class="min-h-screen flex flex-col font-['Poppins',sans-serif] bg-gray-50/50">

    <!-- ===== NAVBAR (Dark Mode) ===== -->
    <div
      class="sticky top-0 z-30 flex justify-between items-center w-full h-16 px-4 md:px-6 bg-[#111111] border-b border-gray-800 shadow-sm">

      <!-- Logo & Mobile Toggle -->
      <div class="flex items-center gap-4">
        <!-- Mobile sidebar toggle -->
        <button
          class="lg:hidden flex items-center justify-center p-2 focus:outline-none text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
          @click="toggleMobileSidebar" aria-label="Toggle mobile sidebar">
          <LucideIcon :name="showMobileSidebar ? 'x' : 'menu'" :size="24" />
        </button>

        <p class="text-xl md:text-2xl font-extrabold text-white tracking-tight hidden sm:block">
          Lilly <span class="text-[#A93133]">ISP</span>
        </p>
      </div>

      <!-- Profile / Right Section -->
      <div class="flex items-center gap-4">
        <!-- Desktop Profile -->
        <div class="hidden lg:block">
          <UDropdown :items="ProfileDropdown" mode="hover" :popper="{ placement: 'bottom-end' }">
            <div
              class="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-gray-800 border border-transparent transition-all">
              <div class="flex flex-col text-right">
                <span class="text-sm font-bold text-gray-100">{{ authStore.user?.name || 'Admin User' }}</span>
                <span class="text-xs font-medium text-gray-400">{{ authStore.user?.role || 'Administrator' }}</span>
              </div>
              <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="md"
                class="ring-2 ring-[#A93133]" />
            </div>
          </UDropdown>
        </div>

        <!-- Mobile Profile -->
        <div class="lg:hidden flex items-center" @click="toggleMobileSidebar">
          <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="sm"
            class="ring-2 ring-[#A93133]" />
        </div>
      </div>
    </div>

    <div class="admin-shell flex flex-1 overflow-hidden relative">

      <!-- Mobile Sidebar Backdrop -->
      <transition name="fade">
        <div v-if="showMobileSidebar" class="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          @click="toggleMobileSidebar"></div>
      </transition>

      <!-- ===== SIDEBAR (Dark Mode, No Grouping) ===== -->
      <div
        class="sidebar-fix transition-all duration-300 bg-[#111111] border-r border-gray-800 z-50 flex flex-col shadow-lg"
        :class="[
          showSidebar ? 'w-20' : 'w-72',
          showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]">

        <div
          class="hidden lg:flex items-center border-b border-gray-800/50 p-4"
          :class="showSidebar ? 'justify-center' : 'justify-between'"
        >
          <span v-if="!showSidebar" class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menu navigasi
          </span>
          <button
            @click="toggleSidebar"
            class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            <LucideIcon :name="showSidebar ? 'chevron-right' : 'chevron-left'" :size="20" />
          </button>
        </div>

        <!-- Sidebar Menu Container -->
        <div ref="sidebarMenuContainer" class="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 pt-4"
          @scroll="saveSidebarScrollPosition">

          <div v-if="isLoadingPermissions" class="flex flex-col items-center justify-center py-10 opacity-50">
            <LucideIcon name="loader-2" :size="24" class="animate-spin text-[#A93133] mb-2" />
            <span class="text-xs text-gray-400 font-medium" v-if="!showSidebar">Memuat menu...</span>
          </div>

          <div v-else-if="userMenu.length === 0"
            class="p-4 text-center text-sm text-gray-400 bg-gray-800/50 rounded-xl mx-2">
            Tidak ada akses menu.
          </div>

          <!-- Flat 17 Menus -->
          <ul v-else class="space-y-1">
            <li v-for="(item, index) in userMenu" :key="index">
              <button @click="navigateTo(item.link)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative"
                :class="isActiveMenuItem(item.link)
                  ? 'bg-[#A93133]/20 text-[#F9EBEB]'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'" :title="showSidebar ? item.label : ''">
                <!-- Active Indicator (Left Border) -->
                <div v-if="isActiveMenuItem(item.link)"
                  class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A93133] rounded-r-full shadow-[0_0_8px_#A93133]">
                </div>

                <LucideIcon :name="getIconName(item.icon)" :size="20"
                  class="flex-shrink-0 transition-colors duration-200"
                  :class="isActiveMenuItem(item.link) ? 'text-[#A93133]' : 'text-gray-500 group-hover:text-gray-300'" />

                <span v-if="!showSidebar" class="font-semibold text-sm truncate transition-colors duration-200">
                  {{ item.label }}
                </span>
              </button>
            </li>
          </ul>

          <!-- Mobile Profile Menu Inject -->
          <div class="lg:hidden mt-8 pt-6 border-t border-gray-800">
            <div class="px-4 mb-2 text-[11px] font-bold tracking-wider text-gray-500 uppercase">Akun</div>
            <button @click="handleLogoutConfirm"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/30 transition-all">
              <LucideIcon name="log-out" :size="20" />
              <span class="font-semibold text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ===== MAIN CONTENT ===== -->
      <div class="flex-1 overflow-auto bg-gray-50 w-full lg:w-auto" :class="showSidebar ? 'lg:pl-20' : 'lg:pl-72'">
        <!-- Slots for Pages -->
        <div class="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto transition-all duration-300">
          <slot name="header"></slot>
          <slot name="header-child"></slot>
          <slot></slot>
        </div>
      </div>

    </div>
  </div>

  <!-- Logout Confirmation Modal -->
  <LogoutConfirmationModal :is-visible="showLogoutModal" title="Konfirmasi Logout"
    message="Apakah Anda yakin ingin logout? Anda akan keluar dari sistem." @confirm="handleLogoutConfirm"
    @cancel="handleLogoutCancel" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRolePermissions } from '@/composables/useRolePermissions'
import LucideIcon from '@/components/LucideIcon.vue'

const getIconName = (iconName: string) => {
  if (iconName.startsWith('heroicons:')) return iconName.replace('heroicons:', '')
  return iconName
}

interface ProfileDropdownItem {
  label: string
  click: () => Promise<void> | void
}

const router = useRouter()
const route = useRoute()
const showSidebar = ref(false)
const showMobileSidebar = ref(false)
const sidebarMenuContainer = ref<HTMLElement | null>(null)
const sidebarScrollPosition = useState<number>('admin-sidebar-scroll-position', () => 0)
const authStore = useAuthStore()

const { userMenu, loadFeaturePermissions, isLoadingPermissions } = useRolePermissions()
const showLogoutModal = ref(false)

const ProfileDropdown: ProfileDropdownItem[][] = [
  [{
    label: 'Logout',
    click: () => { showLogoutModal.value = true },
  }],
]

onMounted(async () => {
  if (authStore.user) {
    await loadFeaturePermissions()
  }
  await nextTick()
  restoreSidebarScrollPosition()
})

onBeforeUnmount(saveSidebarScrollPosition)

watch(() => route.fullPath, async () => {
  await nextTick()
  restoreSidebarScrollPosition()
}, { flush: 'post' })

function saveSidebarScrollPosition() {
  sidebarScrollPosition.value = sidebarMenuContainer.value?.scrollTop ?? 0
}

function restoreSidebarScrollPosition() {
  if (sidebarMenuContainer.value) {
    sidebarMenuContainer.value.scrollTop = sidebarScrollPosition.value
  }
}

const isActiveMenuItem = (menuLink: string): boolean => {
  const currentPath = route.path
  if (menuLink === '/dashboard' && currentPath === '/dashboard') return true
  if (menuLink !== '/dashboard' && currentPath.startsWith(menuLink)) return true
  return false
}

const toggleSidebar = () => { showSidebar.value = !showSidebar.value }
const toggleMobileSidebar = () => { showMobileSidebar.value = !showMobileSidebar.value }

const navigateTo = (link: string) => {
  router.push(link)
  showMobileSidebar.value = false
}

function handleLogoutConfirm() {
  const userRole = authStore.user?.role
  authStore.logout()
  showLogoutModal.value = false
  if (userRole === 'CUSTOMER') {
    router.push('/login')
  } else {
    router.push('/employee')
  }
}

function handleLogoutCancel() {
  showLogoutModal.value = false
}
</script>

<style scoped>
/* Sidebar Setup */
.sidebar-fix {
  position: fixed;
  top: 64px;
  /* Sesuai tinggi navbar h-16 */
  bottom: 0;
  left: 0;
}

/* Custom Scrollbar untuk Dark Mode */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
  /* Gray-700 */
  border-radius: 10px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #52525b;
  /* Gray-600 */
}

/* Animasi Fade Backdrop Mobile */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1023px) {
  .sidebar-fix {
    top: 0;
    z-index: 50;
  }
}
</style>