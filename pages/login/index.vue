<script setup lang="ts">
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { authApi } from '@/api/auth'
import { authCustomerApi } from '@/api/customer/auth'
import LoginNotification from '@/components/LoginNotification.vue'

// Set page title
useHead({
  title: 'Login - CRM System'
})

// Apply guest middleware to prevent logged-in users from accessing login page
definePageMeta({
  middleware: 'guest',
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
  const api = useApiHost()
  console.log('API host:', api)
  
  try {
    const response = await authApi().loginAuth(state.email, state.password)
    console.log('Login response:', response)
    console.log('Response data:', response.data)
    console.log('Token:', response.data?.token)
    console.log('User role object:', response.data?.user?.role)
    console.log('User role name:', response.data?.user?.role?.name)
    
    // Fix: Use role name instead of role ID
    authStore.login({ 
      token: response.data.token, 
      role_id: response.data.user.role.name,
      name: response.data.user.name,
      email: response.data.user.email
    })
    console.log('Auth store after login - role:', authStore.user?.role)
    navigateTo('/dashboard')
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Show generic error message for all login errors
    errorMessage.value = 'Wrong email or password'
    
    showError.value = true
  }

  console.log(event.data)
}

async function onSubmitCustomer(event: FormSubmitEvent<any>) {
  const authStore = useAuthStore()
  const api = useApiHost()
  console.log(api)
  authCustomerApi().loginAuth(state.email, state.password)
    .then((response) => {

      authStore.login({ token: response.data.token, })
      navigateTo('/customer')
    })
    .catch((error) => {
      console.log(error, "apa ini")
      
      // Show generic error message for all login errors
      errorMessage.value = 'Wrong email or password'
      
      showError.value = true
    })

  console.log(event.data)
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

const items = [{
  key: 'customer',
  label: 'Customer',
  description: 'Login as customer',
},
{
  key: 'employee',
  label: 'Employee',
  description: 'Login as Employee',
}
]
</script>
<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-green-800 to-black">
    <div
      class="w-full max-w-md p-8 m-4 border shadow-lg backdrop-blur-lg bg-green-400/10 border-green-500/20 rounded-2xl">
      <div class="flex justify-center mb-6">
        <p class="text-3xl font-bold text-white">
          Lilly <span class="text-green-400">ISP</span>
        </p>
      </div>

      <UTabs :items="items" class="w-full">
        <template #item="{ item }">
          <div v-if="item.key === 'customer'" class="space-y-3">
            <LoginNotification 
              :show="showError" 
              :message="errorMessage" 
              @close="closeError" 
            />
             <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmitCustomer" @error="onError">
              <UFormGroup name="email">
                <h1 class="mb-1 text-xl font-semibold text-white animate-fade-in-up">No. Handphone</h1>
                <UInput v-model="state.email" size="lg" />
              </UFormGroup>

              <UFormGroup name="password">
                <h1 class="mb-1 text-xl font-semibold text-white delay-100 animate-fade-in-up">Password</h1>
                <UInput v-model="state.password" type="password" size="lg" />
              </UFormGroup>

              <UButton type="submit"
                class="flex justify-center w-full py-2 text-lg font-semibold text-white transition duration-200 ease-in-out bg-green-500 rounded-lg hover:bg-green-400">
                Sign In
              </UButton>
            </UForm>
          </div>
          <div v-if="item.key === 'employee'" class="space-y-3">
            <LoginNotification 
              :show="showError" 
              :message="errorMessage" 
              @close="closeError" 
            />
            <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmitEmployee" @error="onError">
              <UFormGroup name="email">
                <h1 class="mb-1 text-xl font-semibold text-white animate-fade-in-up">Email</h1>
                <UInput v-model="state.email" size="lg" />
              </UFormGroup>

              <UFormGroup name="password">
                <h1 class="mb-1 text-xl font-semibold text-white delay-100 animate-fade-in-up">Password</h1>
                <UInput v-model="state.password" type="password" size="lg" />
              </UFormGroup>

              <UButton type="submit"
                class="flex justify-center w-full py-2 text-lg font-semibold text-white transition duration-200 ease-in-out bg-green-500 rounded-lg hover:bg-green-400">
                Sign In
              </UButton>
            </UForm>
          </div>
        </template>
      </UTabs>

    </div>
  </div>
</template>
