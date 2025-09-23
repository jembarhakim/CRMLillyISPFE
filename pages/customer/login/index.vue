<script setup lang="ts">
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { authApi } from '@/api/auth'
import LoginNotification from '@/components/LoginNotification.vue'

// Set page title
useHead({
  title: 'Customer Login - CRM System'
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

async function onSubmit(event: FormSubmitEvent<any>) {
  const authStore = useAuthStore()
  const api = useApiHost()
  console.log(api)
  authApi().loginAuth(state.email, state.password)
    .then((response) => {

      authStore.login(response.data.token)
      navigateTo('/dashboard')
    })
    .catch((error) => {
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
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="p-4 m-4 bg-white rounded-lg shadow">
      <LoginNotification 
        :show="showError" 
        :message="errorMessage" 
        @close="closeError" 
      />
      <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
        <UFormGroup label="Email" name="email">
          <UInput v-model="state.email" />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton type="submit">
          Submit
        </UButton>
      </UForm>
    </div>
  </div>
</template>
