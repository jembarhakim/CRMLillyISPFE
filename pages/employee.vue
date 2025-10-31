<script setup lang="ts">
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { authApi } from '@/api/auth'
import LoginNotification from '@/components/LoginNotification.vue'

// Set page title and preload logo
useHead({
  title: 'Employee Login - CRM System',
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/statics/images/logolilly.png'
    }
  ]
})

// Apply guest middleware to prevent logged-in users from accessing login page
definePageMeta({
  middleware: 'guest',
  layout: false,  // Disable layout to prevent navbar/sidebar from showing
  ssr: false  // Disable SSR to prevent Icon component infinite recursion
})

const state = reactive({
  email: '',
  password: ''
})

const showError = ref(false)
const errorMessage = ref('')

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.email) errors.push({ path: 'email', message: 'Required' })
  if (!state.password) errors.push({ path: 'password', message: 'Required' })
  return errors
}

async function onSubmitEmployee(event: FormSubmitEvent<any>) {
  const authStore = useAuthStore()
  
  try {
    const response = await authApi().loginAuth(state.email, state.password)
    
    // Use role name instead of role ID
    authStore.login({ 
      token: response.data.token, 
      role_id: response.data.user.role.name,
      name: response.data.user.name,
      email: response.data.user.email,
      userType: 'employee'
    })
    
    navigateTo('/dashboard')
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Show generic error message for all login errors
    errorMessage.value = 'Wrong email or password'
    showError.value = true
  }
}

async function onError(event: FormErrorEvent) {
  const element = document.getElementById(event.errors[0].id)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function closeError() {
  showError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-tr from-black via-gray-950 to-black">
    <!-- Red Gradient Overlays -->
    <div class="absolute inset-0 bg-gradient-to-tr from-red-950/30 via-red-900/10 to-transparent"></div>
    <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-red-950/20"></div>
    
    <!-- Circuit Board Pattern -->
    <div class="absolute inset-0 opacity-[0.04]">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 0 20 L 20 20 L 20 0" fill="none" stroke="#ef4444" stroke-width="1"/>
            <path d="M 80 100 L 80 80 L 100 80" fill="none" stroke="#ef4444" stroke-width="1"/>
            <circle cx="20" cy="20" r="3" fill="#ef4444"/>
            <circle cx="80" cy="80" r="3" fill="#ef4444"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)"/>
      </svg>
    </div>

    <!-- Network Grid Background -->
    <div class="absolute inset-0 opacity-[0.03]">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="employee-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#ef4444" stroke-width="0.5" opacity="0.4"/>
            <circle cx="0" cy="0" r="2" fill="#ef4444" opacity="0.6"/>
            <circle cx="80" cy="0" r="2" fill="#ef4444" opacity="0.6"/>
            <circle cx="0" cy="80" r="2" fill="#ef4444" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#employee-grid)"/>
      </svg>
    </div>

    <!-- Hexagonal Network Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
      <div class="hexagon-network" style="top: 5%; left: 10%;"></div>
      <div class="hexagon-network" style="top: 15%; right: 15%; animation-delay: 0.5s;"></div>
      <div class="hexagon-network" style="bottom: 10%; left: 20%; animation-delay: 1s;"></div>
      <div class="hexagon-network" style="bottom: 20%; right: 10%; animation-delay: 1.5s;"></div>
      <div class="hexagon-network" style="top: 50%; left: 5%; animation-delay: 0.7s;"></div>
      <div class="hexagon-network" style="top: 40%; right: 5%; animation-delay: 1.2s;"></div>
      <div class="hexagon-network" style="bottom: 45%; left: 12%; animation-delay: 2s;"></div>
      <div class="hexagon-network" style="top: 25%; left: 50%; animation-delay: 1.8s;"></div>
    </div>
    
    <!-- Data Flow Lines -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="data-flow" style="top: 20%; left: 0; animation-delay: 0s;"></div>
      <div class="data-flow" style="top: 50%; left: 0; animation-delay: 2s;"></div>
      <div class="data-flow" style="bottom: 30%; left: 0; animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 w-full max-w-md p-8 m-4 border shadow-2xl backdrop-blur-lg bg-gradient-to-br from-black/95 via-red-950/90 to-black/90 border-red-400/30 rounded-2xl">
      <!-- Corner Accent Lines -->
      <div class="absolute top-0 left-0 w-16 h-16">
        <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
        <div class="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-red-500 to-transparent"></div>
      </div>
      <div class="absolute top-0 right-0 w-16 h-16">
        <div class="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-red-500 to-transparent"></div>
        <div class="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-red-500 to-transparent"></div>
      </div>
      <div class="absolute bottom-0 left-0 w-16 h-16">
        <div class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
        <div class="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-red-500 to-transparent"></div>
      </div>
      <div class="absolute bottom-0 right-0 w-16 h-16">
        <div class="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-red-500 to-transparent"></div>
        <div class="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-red-500 to-transparent"></div>
      </div>
      
      <div class="flex justify-center mb-6">
        <div class="relative">
          <div class="absolute inset-0 bg-red-600/30 blur-2xl rounded-full animate-pulse"></div>
          <img 
            src="/statics/images/logolilly.png" 
            alt="Lilly ISP Logo" 
            class="relative h-16 sm:h-20 w-auto" 
            fetchpriority="high"
            loading="eager"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div class="text-center mb-4">
          <h2 class="text-2xl font-semibold text-white">Employee Sign In</h2>
          <p class="text-sm text-gray-300 mt-2">Access your employee dashboard</p>
          <div class="flex items-center justify-center mt-3 space-x-1">
            <div class="w-1 h-8 bg-red-500/30"></div>
            <div class="w-1 h-6 bg-red-500/50"></div>
            <div class="w-1 h-10 bg-red-500 animate-pulse"></div>
            <div class="w-1 h-6 bg-red-500/50"></div>
            <div class="w-1 h-8 bg-red-500/30"></div>
          </div>
        </div>
        
        <LoginNotification 
          :show="showError" 
          :message="errorMessage" 
          @close="closeError" 
        />
        
        <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmitEmployee" @error="onError">
          <UFormGroup name="email">
            <h1 class="mb-1 text-xl font-semibold text-white animate-fade-in-up">Email</h1>
            <UInput v-model="state.email" size="lg" placeholder="employee@lillyisp.com" 
              class="bg-black/50 border-red-500/30 focus:border-red-500 text-white placeholder-gray-500" />
          </UFormGroup>

          <UFormGroup name="password">
            <h1 class="mb-1 text-xl font-semibold text-white delay-100 animate-fade-in-up">Password</h1>
            <UInput v-model="state.password" type="password" size="lg" 
              class="bg-black/50 border-red-500/30 focus:border-red-500 text-white placeholder-gray-500" />
          </UFormGroup>

          <UButton type="submit"
            class="flex justify-center w-full py-3 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-red-700 to-red-800 rounded-lg hover:from-red-800 hover:to-red-900 shadow-lg shadow-red-700/50 hover:shadow-red-800/70 hover:scale-[1.02]">
            Sign In
          </UButton>
        </UForm>
        
        <div class="text-center mt-4">
          <p class="text-xs text-gray-400 flex items-center justify-center space-x-2">
            <span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>Employee Access Only</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hexagon-network {
  position: absolute;
  width: 60px;
  height: 60px;
  background: transparent;
  border: 2px solid rgba(239, 68, 68, 0.4);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
  animation: rotate-hexagon 8s linear infinite;
}

@keyframes rotate-hexagon {
  0% {
    transform: rotate(0deg) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: rotate(180deg) scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: rotate(360deg) scale(1);
    opacity: 0.3;
  }
}

.data-flow {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.6), transparent);
  animation: flow-data 5s linear infinite;
}

@keyframes flow-data {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
