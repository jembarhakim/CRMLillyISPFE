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
            <UIcon :name="'i-line-md-arrow-open-right'"
              class="w-6 h-6 transition-colors duration-200" 
              :class="{ 'rotate-180': !showSidebar }"
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
                <IconComponent :name="item.icon" class="w-6 h-6 transition-colors duration-200" 
                  :style="isActiveMenuItem(item.link) 
                    ? 'color: #1d4ed8 !important; fill: #1d4ed8 !important; stroke: #1d4ed8 !important;' 
                    : 'color: black !important; fill: black !important; stroke: black !important;'" />
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
                                     <UIcon name="i-line-md-account" class="w-6 h-6" style="color: black !important; fill: black !important; stroke: black !important;" />
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
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRolePermissions } from '@/composables/useRolePermissions'

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

// Icon component to replace UIcon
const IconComponent = defineComponent({
  props: {
    name: String
  },
  setup(props) {
    const iconMap: Record<string, string> = {
      'i-heroicons-home': 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
      'i-heroicons-user-circle-16-solid': 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
      'i-heroicons-map': 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      'i-heroicons-book-open-solid': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'i-heroicons-wifi-16-solid': 'M1.42 9L9 1.42 16.58 9 9 16.58 1.42 9z',
      'i-heroicons-arrow-down-on-square-stack': 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2z',
      'i-heroicons-building-office-16-solid': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      'i-heroicons-document-currency-dollar-16-solid': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'i-heroicons-arrow-path-16-solid': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'i-heroicons-exclamation-triangle-16-solid': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
    }
    
    return () => h('svg', {
      class: 'w-6 h-6',
      fill: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        d: iconMap[props.name || ''] || iconMap['i-heroicons-home']
      })
    ])
  }
})

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
  authStore.logout()
  showLogoutModal.value = false
  router.push('/login')
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

  /* Make ALL icons black for visibility on desktop - GLOBAL OVERRIDE */
  .sidebar-fix .flex-1 ul li .w-6,
  .sidebar-fix .flex-1 ul li .w-6 *,
  .sidebar-fix .flex-1 ul li svg,
  .sidebar-fix .flex-1 ul li svg *,
  .sidebar-fix .flex-1 ul li i,
  .sidebar-fix .flex-1 ul li i *,
  .sidebar-fix .flex-1 ul li [class*="i-"],
  .sidebar-fix .flex-1 ul li [class*="i-"] *,
  .sidebar-fix .flex-1 ul li [class*="i-heroicons"],
  .sidebar-fix .flex-1 ul li [class*="i-heroicons"] *,
  .sidebar-fix .flex-1 ul li [class*="i-line-md"],
  .sidebar-fix .flex-1 ul li [class*="i-line-md"] *,
  /* Target UIcon component specifically */
  .sidebar-fix .flex-1 ul li .u-icon,
  .sidebar-fix .flex-1 ul li .u-icon *,
  .sidebar-fix .flex-1 ul li [data-icon],
  .sidebar-fix .flex-1 ul li [data-icon] * {
    color: black !important;
    fill: black !important;
    stroke: black !important;
  }
  
  /* NUCLEAR OPTION - Force ALL elements in sidebar to be black */
  .sidebar-fix .flex-1 ul li *,
  .sidebar-fix .flex-1 ul li svg,
  .sidebar-fix .flex-1 ul li svg *,
  .sidebar-fix .flex-1 ul li i,
  .sidebar-fix .flex-1 ul li i *,
  .sidebar-fix .flex-1 ul li span,
  .sidebar-fix .flex-1 ul li div,
  .sidebar-fix .flex-1 ul li button,
  .sidebar-fix .flex-1 ul li a {
    color: black !important;
    fill: black !important;
    stroke: black !important;
  }
  
  /* Target any element with icon-related classes */
  .sidebar-fix .flex-1 ul li [class*="icon"],
  .sidebar-fix .flex-1 ul li [class*="Icon"],
  .sidebar-fix .flex-1 ul li [class*="i-"] {
    color: black !important;
    fill: black !important;
    stroke: black !important;
  }
  
  /* Force ALL elements in sidebar to be black on desktop */
  .sidebar-fix .flex-1 ul li,
  .sidebar-fix .flex-1 ul li * {
    color: black !important;
  }
  
     /* Override any existing color classes on desktop */
   .sidebar-fix .flex-1 ul li .text-gray-700,
   .sidebar-fix .flex-1 ul li .text-gray-900,
   .sidebar-fix .flex-1 ul li .text-white,
   .sidebar-fix .flex-1 ul li .text-gray-500 {
     color: black !important;
   }
   
   /* Force the expand/collapse arrow icon to be black */
   .sidebar-fix .toggle-header .i-line-md\\:arrow-open-right,
   .sidebar-fix .toggle-header .i-line-md\\:arrow-close-left,
   .sidebar-fix .toggle-header [class*="i-line-md:arrow"],
   .sidebar-fix .toggle-header .iconify,
   .sidebar-fix .toggle-header .text-gray-700,
   .sidebar-fix .toggle-header .text-gray-900,
   .sidebar-fix .toggle-header span[class*="i-line-md"],
   .sidebar-fix .toggle-header span.iconify {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
   
   /* NUCLEAR OPTION - Force ALL elements in toggle header to be black */
   .sidebar-fix .toggle-header *,
   .sidebar-fix .toggle-header span,
   .sidebar-fix .toggle-header span * {
     color: black !important;
   }
   
   .sidebar-fix .toggle-header svg,
   .sidebar-fix .toggle-header svg * {
     fill: black !important;
     stroke: black !important;
   }
   
   /* VUE SCOPED OVERRIDE - Force icons to be black even with Vue scoped styles */
   .sidebar-fix .toggle-header [data-v-c5ed0577],
   .sidebar-fix .toggle-header [data-v-c5ed0577] *,
   .sidebar-fix .toggle-header span[data-v-c5ed0577],
   .sidebar-fix .toggle-header span[data-v-c5ed0577] * {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
   
   /* Target the exact element structure from dev tools */
   .sidebar-fix .toggle-header span.iconify.i-line-md\\:arrow-open-right,
   .sidebar-fix .toggle-header span.iconify.i-line-md\\:arrow-close-left {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
   
   /* Force the toggle icon to be black */
   .sidebar-fix .toggle-header .iconify,
   .sidebar-fix .toggle-header .iconify *,
   .sidebar-fix .toggle-header span.iconify,
   .sidebar-fix .toggle-header span.iconify *,
   .sidebar-fix .toggle-header [class*="i-line-md"],
   .sidebar-fix .toggle-header [class*="i-line-md"] * {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
   
   /* NUCLEAR OPTION for toggle header */
   .sidebar-fix .toggle-header *,
   .sidebar-fix .toggle-header span,
   .sidebar-fix .toggle-header span * {
     color: black !important;
   }
   
   .sidebar-fix .toggle-header svg,
   .sidebar-fix .toggle-header svg * {
     fill: black !important;
     stroke: black !important;
   }

  /* Ensure icons are black in collapsed state - HEROICONS SPECIFIC */
  .sidebar-fix.w-16 .flex-1 ul li .w-6,
  .sidebar-fix.w-16 .flex-1 ul li .w-6 *,
  .sidebar-fix.w-16 .flex-1 ul li svg,
  .sidebar-fix.w-16 .flex-1 ul li svg *,
  .sidebar-fix.w-16 .flex-1 ul li i,
  .sidebar-fix.w-16 .flex-1 ul li i *,
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-"],
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-"] *,
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-heroicons"],
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-heroicons"] *,
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-line-md"],
  .sidebar-fix.w-16 .flex-1 ul li [class*="i-line-md"] * {
    color: black !important;
    fill: black !important;
    stroke: black !important;
  }
  
  /* NUCLEAR OPTION for collapsed sidebar icons */
  .sidebar-fix.w-16 .flex-1 ul li *,
  .sidebar-fix.w-16 .flex-1 ul li span,
  .sidebar-fix.w-16 .flex-1 ul li div,
  .sidebar-fix.w-16 .flex-1 ul li button,
  .sidebar-fix.w-16 .flex-1 ul li a {
    color: black !important;
  }
  
  .sidebar-fix.w-16 .flex-1 ul li svg,
  .sidebar-fix.w-16 .flex-1 ul li svg * {
    fill: black !important;
    stroke: black !important;
  }
  
  /* Force ALL elements in collapsed sidebar to be black */
  .sidebar-fix.w-16 .flex-1 ul li,
  .sidebar-fix.w-16 .flex-1 ul li * {
    color: black !important;
  }
  
  /* Target UIcon component specifically in collapsed state */
  .sidebar-fix.w-16 .flex-1 ul li .u-icon,
  .sidebar-fix.w-16 .flex-1 ul li .u-icon *,
  .sidebar-fix.w-16 .flex-1 ul li [data-icon],
  .sidebar-fix.w-16 .flex-1 ul li [data-icon] * {
    color: black !important;
    fill: black !important;
    stroke: black !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  /* Force icons to be visible in collapsed state */
  .sidebar-fix.w-16 .flex-1 ul li .w-6,
  .sidebar-fix.w-16 .flex-1 ul li .w-6 *,
  .sidebar-fix.w-16 .flex-1 ul li svg,
  .sidebar-fix.w-16 .flex-1 ul li svg *,
  .sidebar-fix.w-16 .flex-1 ul li i,
  .sidebar-fix.w-16 .flex-1 ul li i * {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    color: black !important;
    fill: black !important;
    stroke: black !important;
  }

  /* Ensure icons are black in expanded state - HEROICONS SPECIFIC */
  .sidebar-fix:not(.w-16) .flex-1 ul li .w-6,
  .sidebar-fix:not(.w-16) .flex-1 ul li .w-6 *,
  .sidebar-fix:not(.w-16) .flex-1 ul li svg,
  .sidebar-fix:not(.w-16) .flex-1 ul li svg *,
  .sidebar-fix:not(.w-16) .flex-1 ul li i,
  .sidebar-fix:not(.w-16) .flex-1 ul li i *,
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-"],
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-"] *,
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-heroicons"],
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-heroicons"] *,
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-line-md"],
  .sidebar-fix:not(.w-16) .flex-1 ul li [class*="i-line-md"] * {
    color: black !important;
    fill: black !important;
    stroke: black !important;
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

     /* GLOBAL ICON COLOR OVERRIDE - Force all icons to be black */
   .sidebar-fix .flex-1 ul li * {
     color: black !important;
   }

   .sidebar-fix .flex-1 ul li svg,
   .sidebar-fix .flex-1 ul li svg * {
     fill: black !important;
     stroke: black !important;
   }
   
   /* NUCLEAR OPTION - Force ALL elements in sidebar to be black */
   .sidebar-fix .flex-1 ul li,
   .sidebar-fix .flex-1 ul li *,
   .sidebar-fix .flex-1 ul li svg,
   .sidebar-fix .flex-1 ul li svg *,
   .sidebar-fix .flex-1 ul li i,
   .sidebar-fix .flex-1 ul li i *,
   .sidebar-fix .flex-1 ul li span,
   .sidebar-fix .flex-1 ul li div,
   .sidebar-fix .flex-1 ul li button,
   .sidebar-fix .flex-1 ul li a {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
   
   /* Target any element with icon-related classes */
   .sidebar-fix .flex-1 ul li [class*="icon"],
   .sidebar-fix .flex-1 ul li [class*="Icon"],
   .sidebar-fix .flex-1 ul li [class*="i-"] {
     color: black !important;
     fill: black !important;
     stroke: black !important;
   }
}
</style>