<template>
  <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <div
        class="sticky top-0 z-20 flex justify-between items-center w-full h-16 px-4 md:px-6 bg-white border-b shadow-sm">
        <div class="flex items-center gap-2 sm:gap-3">
          <p class="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            Lilly <span class="text-red-600">ISP</span>
          </p>
          <!-- Mobile sidebar toggle button -->
          <button
            class="lg:hidden flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            @click="toggleMobileSidebar" aria-label="Toggle mobile sidebar" title="Menu">
            <div v-if="!showMobileSidebar" class="flex flex-col gap-0.5 sm:gap-1">
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded"></div>
            </div>
            <div v-else class="flex flex-col gap-0.5 sm:gap-1">
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded rotate-45 translate-y-1.5"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded opacity-0"></div>
              <div class="w-3 sm:w-4 h-0.5 bg-gray-800 rounded -rotate-45 -translate-y-1.5"></div>
            </div>
            <span class="text-xs sm:text-sm font-medium text-gray-700">Menu</span>
          </button>
        </div>
        <!-- Profile dropdown for desktop -->
        <div class="hidden lg:block">
          <UDropdown :items="ProfileDropdown" mode="hover" :popper="{ placement: 'bottom-start' }">
            <div class="flex items-center gap-3 cursor-pointer">
              <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" chip-color="blue"
                chip-text="" chip-position="top-right" size="md" />
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900">{{ authStore.user?.name || 'User' }}</span>
                <span class="text-xs text-gray-500">{{ authStore.user?.role || 'Role' }}</span>
              </div>
            </div>
          </UDropdown>
        </div>
        <!-- Profile avatar for mobile -->
        <div class="lg:hidden">
          <div class="flex items-center gap-2" @click="toggleMobileSidebar">
            <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="sm" />
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-900">{{ authStore.user?.name || 'User' }}</span>
              <span class="text-xs text-gray-500">{{ authStore.user?.role || 'Role' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">

        <!-- Mobile Sidebar Backdrop -->
        <div v-if="showMobileSidebar" class="lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity duration-300"
          @click="toggleMobileSidebar"></div>

        <!-- Responsive Sidebar -->
        <div class="sidebar-fix transition-all duration-300 bg-white text-gray-700" :class="[
          showSidebar ? 'w-16 collapsed-sidebar' : 'w-80',
          showMobileSidebar ? 'show' : '',
        ]">
          <!-- Sidebar toggle button - Hidden on mobile/tablet -->
          <div
            class="toggle-header hidden lg:flex justify-center items-center p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-white min-h-[60px] z-20"
            @click="toggleSidebar" role="button" aria-label="Toggle sidebar" title="Toggle sidebar">
            <LucideIcon 
              name="chevron-right"
              :size="24"
              :class="`transition-colors duration-200 ${!showSidebar ? 'rotate-180' : ''}`"
              style="color: black !important; fill: black !important; stroke: black !important;" />
          </div>
          <div class="flex-1 p-2 overflow-auto no-scrollbar">
            <ul class="space-y-2">
              <li v-for="(item, index) in userMenu" :key="index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                :class="[
                  showSidebar ? 'justify-center' : '',
                  isActiveMenuItem(item.link) 
                    ? 'active-menu-item' 
                    : 'hover:bg-gray-100 text-gray-700'
                ]" 
                @click="navigateTo(item.link)">
                <LucideIcon 
                  :name="getIconName(item.icon)" 
                  :size="20"
                  class="transition-colors duration-200" 
                  :class="isActiveMenuItem(item.link) 
                    ? 'text-blue-600' 
                    : 'text-gray-600'" />
                <span class="font-medium transition-colors duration-200"
                  :class="isActiveMenuItem(item.link) ? 'text-blue-800' : 'text-gray-800'">
                  {{ item.label }}
                </span>
              </li>
            </ul>

            <!-- Show message if no menu items -->
            <div v-if="userMenu.length === 0 && !isLoadingPermissions" class="p-3 text-center text-gray-500 text-sm">
              No menu items available for your role
            </div>
            
            <!-- Show loading message -->
            <div v-if="isLoadingPermissions" class="p-3 text-center text-gray-500 text-sm">
              Loading permissions...
            </div>

            <!-- Profile section for mobile -->
            <div class="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div class="p-3 text-sm text-gray-600">
                Logged in as: {{ authStore.user?.name || 'User' }}
              </div>
              <ul class="space-y-2">
                <li v-for="(item, index) in ProfileDropdown[0]" :key="'profile-' + index"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700"
                  @click="() => { item.click(); showMobileSidebar = false }">
                  <LucideIcon name="user-circle" :size="20" class="text-gray-600" />
                  <span class="font-medium text-gray-800">{{ item.label }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-auto bg-gray-50"
          :class="{ 'lg:ml-16': showSidebar, 'lg:ml-80': !showSidebar }" style="background: #f9fafb;">
          <slot name="header"></slot>
          <slot name="header-child"></slot>
          <hr class="my-6" />
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
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
const showSidebar = ref(true)
const showMobileSidebar = ref(false)
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
})

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

/* Responsive sidebar - Mobile first approach */
.sidebar-fix {
  display: flex !important;
  flex-direction: column !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  height: 100vh !important;
  z-index: 40 !important;
  transform: translateX(-100%) !important;
  transition: transform 0.3s ease !important;
  width: 280px !important;
  max-width: 80vw !important;
  background: white !important;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1) !important;
}

/* Show sidebar when active */
.sidebar-fix.show {
  transform: translateX(0) !important;
}

/* Desktop sidebar - fixed and non-scrolling */
@media (min-width: 1024px) {
  .sidebar-fix {
    position: fixed !important;
    top: 64px !important;
    /* fixed below navbar */
    left: 0 !important;
    height: calc(100vh - 64px) !important;
    transform: none !important;
    box-shadow: none !important;
    width: auto !important;
    max-width: none !important;
    border: none !important;
    background: white !important;
    z-index: 10 !important;
  }
}

/* Mobile sidebar - always show text labels */
@media (max-width: 1023px) {
  .sidebar-fix.show {
    width: 280px !important;
  }

  .sidebar-fix.show .flex-1 ul li {
    justify-content: flex-start !important;
  }

  .sidebar-fix.show .flex-1 ul li span {
    display: block !important;
  }
}

/* Desktop sidebar - hide text when collapsed, show when expanded */
@media (min-width: 1024px) {
  .sidebar-fix.w-16 .flex-1 ul li span {
    display: none !important;
  }

  .sidebar-fix.w-16 .flex-1 ul li {
    justify-content: center !important;
  }
  
  /* Ensure icons are visible in collapsed state */
  .sidebar-fix.w-16 .flex-1 ul li .w-6 {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .sidebar-fix:not(.w-16) .flex-1 ul li span {
    display: block !important;
  }

  .sidebar-fix:not(.w-16) .flex-1 ul li {
    justify-content: flex-start !important;
  }

  .sidebar-fix:not(.w-16) {
    width: 320px !important;
    /* w-80 = 320px */
  }

  .sidebar-fix.w-16 {
    background: white !important;
    border-right: none !important;
  }
}

/* Ensure sidebar toggle button is always visible and aligned under navbar */
.sidebar-fix .toggle-header {
  position: sticky !important;
  top: 40px !important;
  /* 64px - ~one button height */
  z-index: 20 !important;
  background: white !important;
  border-bottom: 1px solid #e5e7eb !important;
  min-height: 60px !important;
}

.sidebar-fix .toggle-header:hover {
  background-color: #f3f4f6 !important;
}

/* Active menu item styles */
.sidebar-fix .active-menu-item {
  background-color: #eff6ff !important;
  border-left: 4px solid #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
}

.sidebar-fix .active-menu-item:hover {
  background-color: #dbeafe !important;
}

/* Ensure active state is visible in collapsed mode */
@media (min-width: 1024px) {
  .sidebar-fix.w-16 .active-menu-item {
    border-left: 4px solid #3b82f6 !important;
    background-color: #eff6ff !important;
  }
  
  .sidebar-fix.w-16 .active-menu-item .w-6 {
    color: #1d4ed8 !important;
    fill: #1d4ed8 !important;
    stroke: #1d4ed8 !important;
  }
}

/* Keep sticky behavior on all sizes */

/* Fix the dark gap between sidebar and content */
@media (min-width: 1024px) {

  /* Remove all default margins and padding */
  .flex-1 {
    margin-left: 0 !important;
    padding-left: 0 !important;
  }

  /* Make sidebar completely white */
  .sidebar-fix {
    background: white !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* Make sidebar background white but don't override icon colors */
  .sidebar-fix {
    background: white !important;
  }
  
  .sidebar-fix .flex-1 {
    background: white !important;
  }
  
  .sidebar-fix .toggle-header {
    background: white !important;
  }

  /* Clean icon styling for desktop - remove excessive overrides */
  .sidebar-fix .flex-1 ul li svg {
    color: #374151;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
  
  /* Clean text styling for desktop */
  .sidebar-fix .flex-1 ul li .text-gray-700,
  .sidebar-fix .flex-1 ul li .text-gray-900,
  .sidebar-fix .flex-1 ul li .text-white,
  .sidebar-fix .flex-1 ul li .text-gray-500 {
    color: #374151;
  }
   
  /* Clean toggle header styling */
  .sidebar-fix .toggle-header svg {
    color: #374151;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  /* Clean collapsed state styling */
  .sidebar-fix.w-16 .flex-1 ul li svg {
    color: #374151;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    display: block;
    visibility: visible;
    opacity: 1;
  }

  /* Clean expanded state styling */
  .sidebar-fix:not(.w-16) .flex-1 ul li svg {
    color: #374151;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  /* Position content exactly where sidebar ends */
  .sidebar-fix.w-16~.flex-1 {
    margin-left: 64px !important;
  }

  .sidebar-fix:not(.w-16)~.flex-1 {
    margin-left: 320px !important;
  }

  /* Ensure no gap by making content background match */
  .flex-1 {
    background: #f9fafb !important;
  }

  /* Clean global icon styling */
  .sidebar-fix .flex-1 ul li svg {
    color: #374151;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
}
</style>