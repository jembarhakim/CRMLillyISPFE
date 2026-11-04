<script setup lang="ts">
// Password login form for the customer portal.
// The parent page performs the API call and shows the error banner.

defineProps<{
  phone: string
  password: string
}>()

const emit = defineEmits<{
  (e: 'update:phone', value: string): void
  (e: 'update:password', value: string): void
  (e: 'submit'): void
}>()

// Show/hide the password so customers can check for typos.
const showPassword = ref(false)
</script>

<template>
  <div class="space-y-4">
    <div class="mb-1">
      <h2 class="text-base font-bold text-gray-900">Masuk ke akun Anda</h2>
      <p class="text-xs text-gray-500 mt-0.5">
        Gunakan nomor pelanggan dan password Anda.
      </p>
    </div>

    <label class="block">
      <span class="text-xs font-medium text-gray-700">Nomor Pelanggan</span>
      <input
        :value="phone"
        type="text"
        inputmode="numeric"
        autocomplete="username"
        placeholder="Contoh: 081234567890"
        class="mt-1 w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        @input="emit('update:phone', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label class="block">
      <span class="text-xs font-medium text-gray-700">Password</span>
      <div class="relative mt-1">
        <input
          :value="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Masukkan password"
          class="w-full px-3.5 py-2.5 pr-11 text-sm border border-gray-300 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          @input="emit('update:password', ($event.target as HTMLInputElement).value)"
          @keydown.enter="emit('submit')"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
          :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
          @click="showPassword = !showPassword"
        >
          <LucideIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
        </button>
      </div>
    </label>

    <UButton
      block
      size="lg"
      color="green"
      :disabled="!phone || !password"
      @click="emit('submit')"
    >
      Masuk
    </UButton>
  </div>
</template>
