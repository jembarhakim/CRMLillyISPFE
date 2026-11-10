<template>
  <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <div
        class="sticky top-0 z-20 flex justify-between items-center w-full h-16 px-4 md:px-6 bg-[#111111] border-b border-gray-800 shadow-sm">
        <div class="flex items-center gap-2 sm:gap-3">
          <p class="text-base sm:text-lg md:text-xl font-bold text-white">
            Lilly <span class="text-[#A93133]">ISP</span>
          </p>
          <!-- Mobile sidebar toggle button -->
          <button
            class="lg:hidden flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 focus:outline-none bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            @click="toggleMobileSidebar" aria-label="Toggle mobile sidebar" title="Menu">
            <div v-if="!showMobileSidebar" class="flex flex-col gap-0.5 sm:gap-1">
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded"></div>
            </div>
            <div v-else class="flex flex-col gap-0.5 sm:gap-1">
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded rotate-45 translate-y-1.5"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded opacity-0"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-300 rounded -rotate-45 -translate-y-1.5"></div>
            </div>
            <span class="text-xs sm:text-sm font-medium text-gray-300">Menu</span>
          </button>
        </div>
        <!-- Profile dropdown for desktop -->
        <div class="hidden lg:block">
          <UDropdown :items="ProfileDropdown" mode="hover" :popper="{ placement: 'bottom-start' }">
            <div class="flex items-center gap-3 cursor-pointer">
              <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" chip-color="red"
                chip-text="" chip-position="top-right" size="md" />
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-300">{{ authStore.user?.name || 'User' }}</span>
                <span class="text-xs text-gray-400">{{ authStore.user?.role || 'Role' }}</span>
              </div>
            </div>
          </UDropdown>
        </div>
        <!-- Profile avatar for mobile -->
        <div class="lg:hidden">
          <div class="flex items-center gap-2" @click="toggleMobileSidebar">
            <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="sm" />
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-300">{{ authStore.user?.name || 'User' }}</span>
              <span class="text-xs text-gray-400">{{ authStore.user?.role || 'Role' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-shell flex flex-1 overflow-hidden">

        <!-- Mobile Sidebar Backdrop -->
        <div v-if="showMobileSidebar" class="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          @click="toggleMobileSidebar"></div>

        <!-- Responsive Sidebar -->
        <div class="sidebar-fix transition-all duration-300 bg-[#111111] text-gray-300" :class="[
          showSidebar ? 'w-16 collapsed-sidebar' : 'w-80',
          showMobileSidebar ? 'show' : '',
        ]">
          <!-- Sidebar toggle button - Hidden on mobile/tablet -->
          <div
            class="toggle-header hidden lg:flex justify-center items-center p-4 border-b cursor-pointer hover:bg-gray-800 transition-colors duration-200 bg-[#111111] min-h-[60px] z-20"
            @click="toggleSidebar" role="button" aria-label="Toggle sidebar" title="Toggle sidebar">
            <LucideIcon 
              name="chevron-right"
              :size="24"
              :class="`transition-colors duration-200 ${!showSidebar ? 'rotate-180' : ''}`"
              style="color: white !important; fill: white !important; stroke: white !important;" />
          </div>
          <div ref="sidebarMenuContainer" class="flex-1 p-2 overflow-auto no-scrollbar"
            @scroll="saveSidebarScrollPosition">
            <ul class="space-y-2">
              <li v-for="(item, index) in userMenu" :key="index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                :class="[showSidebar ? 'justify-center' : '', isActiveMenuItem(item.link) ? 'active-menu-item' : 'hover:bg-white/5 hover:text-white']"
                @click="navigateTo(item.link)">
                <LucideIcon 
                  :name="getIconName(item.icon)" 
                  :size="20"
                  class="transition-colors duration-200" 
                  :class="isActiveMenuItem(item.link) ? 'text-white' : 'text-gray-400'" />
                <span class="font-medium transition-colors duration-200"
                  :class="isActiveMenuItem(item.link) ? 'text-white' : 'text-gray-300'">
                  {{ item.label }}
                </span>
              </li>
            </ul>

            <!-- Show message if no menu items -->
            <div v-if="userMenu.length === 0 && !isLoadingPermissions" class="p-3 text-center text-gray-400 text-sm">
              No menu items available for your role
            </div>
            
            <!-- Show loading message -->
            <div v-if="isLoadingPermissions" class="p-3 text-center text-gray-400 text-sm">
              Loading permissions...
            </div>

            <!-- Profile section for mobile -->
            <div class="lg:hidden mt-4 pt-4 border-t border-gray-800">
              <div class="p-3 text-sm text-gray-400">
                Logged in as: {{ authStore.user?.name || 'User' }}
              </div>
              <ul class="space-y-2">
                <li v-for="(item, index) in ProfileDropdown[0]" :key="'profile-' + index"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 text-gray-300"
                  @click="() => { item.click(); showMobileSidebar = false }">
                  <LucideIcon name="user-circle" :size="20" class="text-gray-400" />
                  <span class="font-medium text-gray-300">{{ item.label }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div
          class="admin-main flex-1 overflow-auto bg-gray-50 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10"
          :class="{ 'lg:ml-16': showSidebar, 'lg:ml-80': !showSidebar }"
          style="background: #f9fafb;">
          <slot name="header"></slot>
          <slot name="header-child"></slot>
          <slot></slot>
        </div>


      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <LogoutConfirmationModal
      :is-visible="showLogoutModal"
      title="Konfirmasi Logout"
      message="Apakah Anda yakin ingin logout? Anda akan keluar dari sistem."
      @confirm="handleLogoutConfirm"
      @cancel="handleLogoutCancel"
    />
  </template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRolePermissions } from '@/composables/useRolePermissions'
import LucideIcon from '@/components/LucideIcon.vue'

// Convert heroicons:icon-name to icon-name for LucideIcon
const getIconName = (iconName: string) => {
  if (iconName.startsWith('heroicons:')) {
    return iconName.replace('heroicons:', '')
  }
  return iconName
}

// Type definitions
interface ProfileDropdownItem {
  label: string
  click: () => Promise<void> | void
}

// Reactive state
const router = useRouter()
const route = useRoute()
const showSidebar = ref(false)
const showMobileSidebar = ref(false)
const sidebarMenuContainer = ref<HTMLElement | null>(null)
const sidebarScrollPosition = useState<number>('admin-sidebar-scroll-position', () => 0)
const authStore = useAuthStore()

// Role permissions composable
const { userMenu, loadFeaturePermissions, isLoadingPermissions } = useRolePermissions()

// Modal state for logout confirmation
const showLogoutModal = ref(false)

// Profile dropdown
const ProfileDropdown: ProfileDropdownItem[][] = [
  [
    {
      label: 'Logout',
      click: async () => {
        // Show logout confirmation modal
        showLogoutModal.value = true
      },
    },
  ],
]

// Load feature permissions on mount
onMounted(async () => {
  if (authStore.user) {
    await loadFeaturePermissions()
  }
  await nextTick()
  restoreSidebarScrollPosition()
})

onBeforeUnmount(saveSidebarScrollPosition)

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    restoreSidebarScrollPosition()
  },
  { flush: 'post' },
)

function saveSidebarScrollPosition() {
  sidebarScrollPosition.value = sidebarMenuContainer.value?.scrollTop ?? 0
}

function restoreSidebarScrollPosition() {
  if (sidebarMenuContainer.value) {
    sidebarMenuContainer.value.scrollTop = sidebarScrollPosition.value
  }
}

// Function to check if a menu item is active
const isActiveMenuItem = (menuLink: string): boolean => {
  const currentPath = route.path
  // Exact match for dashboard root
  if (menuLink === '/dashboard' && currentPath === '/dashboard') {
    return true
  }
  // For other routes, check if current path starts with the menu link
  if (menuLink !== '/dashboard' && currentPath.startsWith(menuLink)) {
    return true
  }
  return false
}

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const toggleMobileSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value
}

const navigateTo = (link: string) => {
  router.push(link)
  // Close mobile sidebar on navigation
  showMobileSidebar.value = false
}

// Handle logout confirmation
function handleLogoutConfirm() {
  // Store the user role before logout to determine redirect
  const userRole = authStore.user?.role
  
  // Logout user
  authStore.logout()
  showLogoutModal.value = false
  
  // Redirect based on previous role
  // If role was CUSTOMER, redirect to customer login
  // Otherwise (employee/admin roles), redirect to employee login
  if (userRole === 'CUSTOMER') {
    router.push('/login')
  } else {
    router.push('/employee')
  }
}

// Handle logout cancel
function handleLogoutCancel() {
  showLogoutModal.value = false
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sidebar-fix {
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  height: 100vh;
  height: 100dvh;
  z-index: 40;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  width: 280px;
  max-width: 80vw;
  background: #111111;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
}

.sidebar-fix.show {
  transform: translateX(0);
}

@media (min-width: 1024px) {
  .sidebar-fix {
    top: 64px;
    bottom: 0;
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    transform: none;
    box-shadow: none;
    max-width: none;
    border-right: 1px solid #27272a;
    z-index: 10;
  }

  .sidebar-fix.w-16 {
    width: 64px;
  }

  .sidebar-fix:not(.w-16) {
    width: 320px;
  }
}

@media (max-width: 1023px) {
  .sidebar-fix.show {
    width: 280px;
  }

  .sidebar-fix.show .flex-1 ul li {
    justify-content: flex-start;
  }

  .sidebar-fix.show .flex-1 ul li span {
    display: block;
  }
}

@media (min-width: 1024px) {
  .sidebar-fix.w-16 .flex-1 ul li span {
    display: none;
  }

  .sidebar-fix.w-16 .flex-1 ul li {
    justify-content: center;
  }

  .sidebar-fix:not(.w-16) .flex-1 ul li span {
    display: block;
  }

  .sidebar-fix:not(.w-16) .flex-1 ul li {
    justify-content: flex-start;
  }
}

.sidebar-fix .toggle-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #111111;
  border-bottom: 1px solid #27272a;
  min-height: 60px;
}

.sidebar-fix .toggle-header:hover {
  background-color: #27272a;
}

.sidebar-fix .active-menu-item {
  background-color: rgba(169, 49, 51, 0.22);
  border-left: 4px solid #A93133;
  color: #F9EBEB;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.sidebar-fix .active-menu-item:hover {
  background-color: rgba(169, 49, 51, 0.32);
}

.admin-shell {
  min-height: 0;
}

.admin-main {
  min-width: 0;
  min-height: 0;
  background: #f9fafb;
}

</style>