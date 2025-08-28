  <template>
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <div class="sticky top-0 z-20 flex justify-between items-center w-full h-16 px-4 md:px-6 bg-white border-b shadow-sm">
        <div class="flex items-center gap-4">
                    <!-- Mobile sidebar toggle button -->
                      <button 
              class="lg:hidden p-2 focus:outline-none fixed top-4 left-4 z-50"
              @click="toggleMobileSidebar"
              aria-label="Toggle mobile sidebar"
            >
              <div v-if="!showMobileSidebar" class="flex flex-col gap-1">
                <div class="w-4 h-0.5 bg-gray-800 rounded"></div>
                <div class="w-4 h-0.5 bg-gray-800 rounded"></div>
                <div class="w-4 h-0.5 bg-gray-800 rounded"></div>
              </div>
              <div v-else class="flex flex-col gap-1">
                <div class="w-4 h-0.5 bg-gray-800 rounded rotate-45 translate-y-1.5"></div>
                <div class="w-4 h-0.5 bg-gray-800 rounded opacity-0"></div>
                <div class="w-4 h-0.5 bg-gray-800 rounded -rotate-45 -translate-y-1.5"></div>
              </div>
            </button>
          <p class="text-lg md:text-xl font-bold text-gray-900">
            Lilly <span class="text-red-600">ISP</span>
          </p>
        </div>
        <!-- Profile dropdown for desktop -->
        <div class="hidden lg:block">
          <UDropdown 
            :items="ProfileDropdown" 
            mode="hover" 
            :popper="{ placement: 'bottom-start' }"
          >
            <UAvatar 
              src="https://avatars.githubusercontent.com/u/739984?v=4" 
              alt="Avatar" 
              chip-color="blue" 
              chip-text=""
              chip-position="top-right"
              size="md"
            />
          </UDropdown>
        </div>
        <!-- Profile avatar for mobile -->
        <div class="lg:hidden">
          <UAvatar 
            src="https://avatars.githubusercontent.com/u/739984?v=4" 
            alt="Avatar" 
            size="sm"
            @click="toggleMobileSidebar"
          />
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">


        <!-- Mobile Sidebar Backdrop -->
        <div 
          v-if="showMobileSidebar"
          class="lg:hidden fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          @click="toggleMobileSidebar"
        ></div>

        <!-- Responsive Sidebar -->
        <div 
          class="sidebar-fix border-r transition-all duration-300 bg-white text-gray-700"
          :class="[
            showSidebar ? 'w-16' : 'w-64',
            showMobileSidebar ? 'show' : '',
          ]"
        >
          <!-- Sidebar toggle button - Always visible -->
          <div 
            class="toggle-header flex justify-center items-center p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-white min-h-[60px] z-20"
            @click="toggleSidebar"
            role="button"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <UIcon 
              :name="showSidebar ? 'i-line-md-arrow-open-right' : 'i-line-md-arrow-close-left'" 
              class="w-6 h-6 text-gray-700 hover:text-gray-900 transition-colors duration-200"
            />
          </div>
          <div class="flex-1 p-2 overflow-auto no-scrollbar">
            <ul class="space-y-2">
              <li 
                v-for="(item, index) in filterMenu" 
                :key="index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700"
                :class="[showSidebar ? 'justify-center' : '']"
                @click="navigateTo(item.link)"
              >
                <UIcon :name="item.icon" class="w-6 h-6" />
                <span v-if="!showSidebar" class="font-medium text-gray-800">{{ item.label }}</span>
              </li>
            </ul>
            
            <!-- Show message if no menu items -->
            <div v-if="filterMenu.length === 0" class="p-3 text-center text-gray-500 text-sm">
              No menu items available for role: {{ authStore.user?.role || 'Unknown' }}
            </div>
            
            <!-- Profile section for mobile -->
            <div class="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div class="p-3 text-sm text-gray-600">
                Logged in as: {{ authStore.user?.user_id || 'User' }}
              </div>
              <ul class="space-y-2">
                <li 
                  v-for="(item, index) in ProfileDropdown[0]" 
                  :key="'profile-' + index"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700"
                  @click="() => { item.click(); showMobileSidebar = false }"
                >
                  <UIcon name="i-line-md-account" class="w-6 h-6" />
                  <span class="font-medium text-gray-800">{{ item.label }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-auto bg-gray-50"
          :class="{'lg:ml-16': showSidebar, 'lg:ml-0': !showSidebar}">
          <slot name="header"></slot>
          <slot name="header-child"></slot>
          <hr class="my-6" />
          <slot></slot>
        </div>
        
        
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { getMenuForRole, getRoleDisplayName } from '@/utilities/rolePermissions'

  // Type definitions
  interface ProfileDropdownItem {
    label: string
    click: () => Promise<void> | void
  }

  // Reactive state
  const router = useRouter()
  const showSidebar = ref(true)
  const showMobileSidebar = ref(false)
  const authStore = useAuthStore()

  // Profile dropdown
  const ProfileDropdown: ProfileDropdownItem[][] = [
    [
      {
        label: 'Logout',
        click: async () => {
          try {
            await authStore.logout()
            router.push('/login')
          } catch (error) {
            console.error('Logout failed:', error)
          }
        },
      },
    ],
  ]

  // Computed menu based on user role using centralized system
  const filterMenu = computed(() => {
    if (!authStore.user || !authStore.user.role) {
      return [] // Return empty array if user is not defined
    }
    
    return getMenuForRole(authStore.user.role)
  })

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
    z-index: 30 !important;
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
      top: 64px !important; /* fixed below navbar */
      left: 0 !important;
      height: calc(100vh - 64px) !important;
      transform: none !important;
      box-shadow: none !important;
      width: auto !important;
      max-width: none !important;
    }
  }
  
  /* Ensure sidebar toggle button is always visible and aligned under navbar */
  .sidebar-fix .toggle-header {
    position: sticky !important;
    top: 40px !important; /* 64px - ~one button height */
    z-index: 20 !important;
    background: white !important;
    border-bottom: 1px solid #e5e7eb !important;
    min-height: 60px !important;
  }
  
  .sidebar-fix .toggle-header:hover {
    background-color: #f3f4f6 !important;
  }
  
  /* Keep sticky behavior on all sizes */
  </style>