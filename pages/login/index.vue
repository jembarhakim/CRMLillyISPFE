<script setup lang="ts">
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { authCustomerApi } from '@/api/customer/auth'
import LoginNotification from '@/components/LoginNotification.vue'

// Set page title and preload logo
useHead({
  title: 'Customer Login - CRM System',
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
  phone: '',
  password: ''
})

const showError = ref(false)
const errorMessage = ref('')

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.phone) errors.push({ path: 'phone', message: 'Required' })
  if (!state.password) errors.push({ path: 'password', message: 'Required' })
  return errors
}

async function onSubmitCustomer(event: FormSubmitEvent<any>) {
  const authStore = useAuthStore()
  
  try {
    const response = await authCustomerApi().loginAuth(state.phone, state.password)
    
    authStore.login({ token: response.data.token })
    navigateTo('/customer')
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Show generic error message for all login errors
    errorMessage.value = 'Wrong phone number or password'
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
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
    <!-- Red Accent Overlays -->
    <div class="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-red-900/10"></div>
    
    <!-- Network Grid Pattern -->
    <div class="absolute inset-0 opacity-[0.03]">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ef4444" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>

    <!-- Network Connection Lines -->
    <div class="absolute inset-0 opacity-[0.05]">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="network-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="2" fill="#ef4444" opacity="0.6"/>
            <circle cx="0" cy="0" r="2" fill="#ef4444" opacity="0.4"/>
            <circle cx="100" cy="0" r="2" fill="#ef4444" opacity="0.4"/>
            <circle cx="0" cy="100" r="2" fill="#ef4444" opacity="0.4"/>
            <circle cx="100" cy="100" r="2" fill="#ef4444" opacity="0.4"/>
            <line x1="50" y1="50" x2="0" y2="0" stroke="#ef4444" stroke-width="0.5" opacity="0.3"/>
            <line x1="50" y1="50" x2="100" y2="0" stroke="#ef4444" stroke-width="0.5" opacity="0.3"/>
            <line x1="50" y1="50" x2="0" y2="100" stroke="#ef4444" stroke-width="0.5" opacity="0.3"/>
            <line x1="50" y1="50" x2="100" y2="100" stroke="#ef4444" stroke-width="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#network-pattern)"/>
      </svg>
    </div>

    <!-- Animated Network Nodes -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="network-node" style="top: 10%; left: 15%; animation-delay: 0s;"></div>
      <div class="network-node" style="top: 20%; right: 20%; animation-delay: 1s;"></div>
      <div class="network-node" style="bottom: 15%; left: 25%; animation-delay: 2s;"></div>
      <div class="network-node" style="bottom: 25%; right: 15%; animation-delay: 1.5s;"></div>
      <div class="network-node" style="top: 50%; left: 5%; animation-delay: 0.8s;"></div>
      <div class="network-node" style="top: 35%; right: 10%; animation-delay: 1.3s;"></div>
      <div class="network-node" style="bottom: 40%; left: 80%; animation-delay: 1.8s;"></div>
    </div>
    
    <!-- Floating Network Lines -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="network-line" style="top: 15%; left: 10%; width: 200px; animation-delay: 0s;"></div>
      <div class="network-line" style="top: 60%; right: 15%; width: 250px; animation-delay: 1.5s;"></div>
      <div class="network-line" style="bottom: 20%; left: 20%; width: 180px; animation-delay: 2s;"></div>
    </div>

    <div class="relative z-10 w-full max-w-md p-8 m-4 border shadow-2xl backdrop-blur-lg bg-gradient-to-br from-black/90 via-black/95 to-red-950/90 border-red-400/30 rounded-2xl">
      <!-- Decorative Corner Elements -->
      <div class="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-red-500/50 rounded-tl-2xl"></div>
      <div class="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-red-500/50 rounded-br-2xl"></div>
      
      <div class="flex justify-center mb-6">
        <div class="relative">
          <div class="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
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
          <h2 class="text-2xl font-semibold text-white">Customer Login</h2>
          <p class="text-sm text-gray-300 mt-2">Sign in to access your customer portal</p>
          <div class="flex items-center justify-center mt-3 space-x-2">
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div class="w-1 h-1 rounded-full bg-red-400/50"></div>
            <div class="w-1 h-1 rounded-full bg-red-400/50"></div>
          </div>
        </div>
        
        <LoginNotification 
          :show="showError" 
          :message="errorMessage" 
          @close="closeError" 
        />
        
        <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmitCustomer" @error="onError">
          <UFormGroup name="phone">
            <h1 class="mb-1 text-xl font-semibold text-white animate-fade-in-up">No. Handphone</h1>
            <UInput v-model="state.phone" size="lg" placeholder="081234567890" 
              class="bg-black/50 border-red-500/30 focus:border-red-500 text-white placeholder-gray-500" />
          </UFormGroup>

          <UFormGroup name="password">
            <h1 class="mb-1 text-xl font-semibold text-white delay-100 animate-fade-in-up">Password</h1>
            <UInput v-model="state.password" type="password" size="lg" 
              class="bg-black/50 border-red-500/30 focus:border-red-500 text-white placeholder-gray-500" />
          </UFormGroup>

          <UButton type="submit"
            class="flex justify-center w-full py-3 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/50 hover:shadow-red-700/70 hover:scale-[1.02]">
            Sign In
          </UButton>
        </UForm>
        
        <div class="text-center mt-4">
          <NuxtLink to="/landing" class="text-sm text-gray-300 hover:text-red-400 transition-colors">
            ← Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-node {
  position: absolute;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(239, 68, 68, 0) 70%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  animation: pulse-node 3s ease-in-out infinite;
}

@keyframes pulse-node {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(2);
    opacity: 0.8;
  }
}

.network-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent);
  animation: move-line 4s ease-in-out infinite;
}

@keyframes move-line {
  0%, 100% {
    opacity: 0.2;
    transform: translateX(0) scaleX(0.8);
  }
  50% {
    opacity: 0.6;
    transform: translateX(30px) scaleX(1.2);
  }
}
</style>
