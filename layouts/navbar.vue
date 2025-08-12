  <template>
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <div class="sticky top-0 z-20 flex justify-between items-center w-full h-16 px-4 md:px-6 bg-white border-b shadow-sm">
        <div class="flex items-center gap-4">
          <!-- Mobile menu toggle button -->
          <button 
            class="md:hidden p-2 focus:outline-none"
            @click="toggleMobileMenu"
            aria-label="Toggle mobile menu"
          >
            <UIcon 
              :name="showMobileMenu ? 'i-line-md-close' : 'i-line-md-menu'" 
              class="w-6 h-8"
            />
          </button>
          <p class="text-lg md:text-xl font-bold">
            Lilly <span class="text-red-500">ISP</span>
          </p>
        </div>
        <!-- Profile dropdown for desktop -->
        <div class="hidden md:block">
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
        <div class="md:hidden">
          <UAvatar 
            src="https://avatars.githubusercontent.com/u/739984?v=4" 
            alt="Avatar" 
            size="sm"
            @click="toggleMobileMenu"
          />
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Mobile Menu -->
        <div 
          v-if="showMobileMenu"
          class="md:hidden fixed inset-0 bg-black/30 z-10 transition-opacity duration-300"
          @click="toggleMobileMenu"
        >
          <div 
            class="w-64 bg-white h-full p-4 overflow-auto transform transition-transform duration-300"
            :class="[showMobileMenu ? 'translate-x-0' : '-translate-x-full']"
            @click.stop
          >
            <div class="flex justify-between items-center mb-4">
              <p class="text-lg font-bold">
                Lilly <span class="text-red-500">ISP</span>
              </p>
              <button 
                class="p-2"
                @click="toggleMobileMenu"
                aria-label="Close mobile menu"
              >
                <UIcon name="i-line-md-close" class="w-6 h-6" />
              </button>
            </div>
            <ul class="space-y-2">
              <li 
                v-for="(item, index) in filterMenu" 
                :key="index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-blue-100"
                @click="navigateTo(item.link); toggleMobileMenu()"
              >
                <UIcon :name="item.icon" class="w-6 h-6" />
                <span class="font-medium">{{ item.label }}</span>
              </li>
              <!-- Profile dropdown items in mobile menu -->
              <li 
                v-for="(item, index) in ProfileDropdown[0]" 
                :key="'profile-' + index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-blue-100"
                @click="item.click(); toggleMobileMenu()"
              >
                <UIcon name="i-line-md-account" class="w-6 h-6" />
                <span class="font-medium">{{ item.label }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Desktop Sidebar -->
        <div 
          class="hidden md:flex md:flex-col border-r transition-all duration-300 bg-white"
          :class="[
            showSidebar ? 'w-16' : 'w-64',
          ]"
        >
          <!-- Sidebar toggle button -->
          <div 
            class="flex justify-center p-4 border-b cursor-pointer hover:bg-gray-100"
            @click="toggleSidebar"
            role="button"
            aria-label="Toggle sidebar"
          >
            <UIcon 
              :name="showSidebar ? 'i-line-md-arrow-open-right' : 'i-line-md-arrow-close-left'" 
              class="w-5 h-5"
            />
          </div>
          <div class="flex-1 p-2 overflow-auto no-scrollbar">
            <ul class="space-y-2">
              <li 
                v-for="(item, index) in filterMenu" 
                :key="index"
                class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-blue-100"
                :class="[showSidebar ? 'justify-center' : '']"
                @click="navigateTo(item.link)"
              >
                <UIcon :name="item.icon" class="w-6 h-6" />
                <span v-if="!showSidebar" class="font-medium">{{ item.label }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-auto bg-gray-50">
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

  // Type definitions
  interface MenuItem {
    label: string
    icon: string
    link: string
  }

  interface ProfileDropdownItem {
    label: string
    click: () => Promise<void> | void
  }

  // Reactive state
  const router = useRouter()
  const showSidebar = ref(true)
  const showMobileMenu = ref(false)
  const authStore = useAuthStore()

  // Menu items
  const items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      link: '/dashboard',
    },
    {
      label: 'Customer',
      icon: 'i-heroicons-user-circle-16-solid',
      link: '/dashboard/customer',
    },
    {
      label: 'Area',
      icon: 'i-heroicons-map',
      link: '/dashboard/area',
    },
    {
      label: 'Report',
      icon: 'i-heroicons-book-open-solid',
      link: '/dashboard/report',
    },
    {
      label: 'Internet Package',
      icon: 'i-heroicons-wifi-16-solid',
      link: '/dashboard/internet-package',
    },
    {
      label: 'Assets',
      icon: 'i-heroicons-arrow-down-on-square-stack',
      link: '/dashboard/asset',
    },
    {
      label: 'Company',
      icon: 'i-heroicons-building-office-16-solid',
      link: '/dashboard/companies',
    },
    {
      label: 'Invoice',
      icon: 'i-heroicons-document-currency-dollar-16-solid',
      link: '/dashboard/invoice',
    },
    {
      label: 'Transaction',
      icon: 'i-heroicons-document-currency-dollar-16-solid',
      link: '/dashboard/transaction',
    },
    {
      label: 'User Management',
      icon: 'i-heroicons-user-circle-16-solid',
      link: '/dashboard/user-management',
    },
  ]

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

  // Computed menu based on user role
  const filterMenu = computed(() => {
    if (!authStore.user) return items // Fallback if user is not defined
    if (authStore.user.role === 'ADMIN') {
      const hideMenu = [''] // No items hidden for ADMIN
      return items.filter(item => !hideMenu.includes(item.label))
    }
    if (authStore.user.role === 'TECHNICIAN') {
      const hideMenu = ['User Management', 'Report', 'Invoice', 'Transaction', 'Company', 'Area']
      return items.filter(item => !hideMenu.includes(item.label))
    }
    if (authStore.user.role === 'FINANCE') {
      const hideMenu = ['User Management','Company', 'Assets', 'Internet Package', 'Area']
      return items.filter(item => !hideMenu.includes(item.label))
    }
    return items
  })

  // Methods
  const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
  }

  const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value
  }

  const navigateTo = (link: string) => {
    router.push(link)
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
  </style>