<script setup lang="ts">
// OTP login form for the customer portal.
// Kept dumb: all network calls are delegated through props so the page
// remains the single place that talks to the API.

const props = defineProps<{
  step: 'phone' | 'code'
  phone: string
  code: string
  maskedPhone: string
  resendCountdown: number
  errorMessage: string
  isRequesting: boolean
  isVerifying: boolean
}>()

const emit = defineEmits<{
  (e: 'update:phone', value: string): void
  (e: 'update:code', value: string): void
  (e: 'request-otp'): void
  (e: 'verify-otp'): void
  (e: 'change-phone'): void
}>()

const digits = [0, 1, 2, 3, 4, 5]
const codeInputs = ref<(HTMLInputElement | null)[]>([])

function setCodeInputRef(el: any, index: number) {
  if (el) codeInputs.value[index] = el as HTMLInputElement
}

function onCodeInput(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const digit = target.value.replace(/\D/g, '').slice(-1)
  const chars = props.code.split('')
  chars[index] = digit
  emit('update:code', chars.join('').slice(0, 6))
  target.value = digit

  if (digit && index < 5) {
    codeInputs.value[index + 1]?.focus()
  }
}

function onCodeKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !props.code[index] && index > 0) {
    codeInputs.value[index - 1]?.focus()
  }
  if (event.key === 'Enter') {
    emit('verify-otp')
  }
}

function onCodePaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') || ''
  const onlyDigits = pasted.replace(/\D/g, '').slice(0, 6)
  if (!onlyDigits) return
  event.preventDefault()
  emit('update:code', onlyDigits)
  codeInputs.value[Math.min(onlyDigits.length, 5)]?.focus()
}

// Focus the first box as soon as the code step appears.
watch(
  () => props.step,
  async (step) => {
    if (step === 'code') {
      await nextTick()
      codeInputs.value[0]?.focus()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <!-- Step 1: phone number -->
    <template v-if="step === 'phone'">
      <div class="mb-1">
        <h2 class="text-base font-bold text-gray-900">Masuk dengan kode WhatsApp</h2>
        <p class="text-xs text-gray-500 mt-0.5">
          Masukkan nomor WhatsApp terdaftar, kami kirim kode 6 angka.
        </p>
      </div>

      <label class="block">
        <span class="text-sm font-medium text-gray-700">Nomor WhatsApp</span>
        <div class="mt-1 flex rounded-lg border border-gray-300 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 overflow-hidden">
          <span class="px-3 flex items-center bg-gray-50 text-gray-500 text-sm border-r border-gray-300">+62</span>
          <input
            :value="phone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            placeholder="081234567890"
            class="flex-1 px-3 py-2.5 text-gray-800 outline-none"
            @input="emit('update:phone', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('request-otp')"
          />
        </div>
      </label>

      <p v-if="errorMessage" class="text-sm text-red-600 flex items-start gap-1">
        <LucideIcon name="alert-triangle" :size="16" class="mt-0.5 shrink-0" />
        <span>{{ errorMessage }}</span>
      </p>

      <UButton
        block
        size="lg"
        color="green"
        :loading="isRequesting"
        :disabled="!phone"
        @click="emit('request-otp')"
      >
        Kirim Kode OTP
      </UButton>
    </template>

    <!-- Step 2: 6 digit code -->
    <template v-else>
      <div class="mb-1">
        <h2 class="text-base font-bold text-gray-900">Masukkan kode OTP</h2>
        <p class="text-xs text-gray-500 mt-0.5">
          Kode dikirim ke <span class="font-semibold text-gray-700">{{ maskedPhone }}</span>
        </p>
      </div>

      <div class="flex justify-center gap-2" @paste="onCodePaste">
        <input
          v-for="index in digits"
          :key="index"
          :ref="(el) => setCodeInputRef(el, index - 1)"
          type="text"
          inputmode="numeric"
          maxlength="1"
          autocomplete="one-time-code"
          class="w-11 py-3 text-center text-xl font-bold text-gray-800 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          :value="code[index - 1] || ''"
          @input="onCodeInput($event, index - 1)"
          @keydown="onCodeKeydown($event, index - 1)"
        />
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600 text-center flex items-center justify-center gap-1">
        <LucideIcon name="alert-triangle" :size="16" />
        <span>{{ errorMessage }}</span>
      </p>

      <UButton
        block
        size="lg"
        color="green"
        :loading="isVerifying"
        :disabled="code.length !== 6"
        @click="emit('verify-otp')"
      >
        Verifikasi &amp; Masuk
      </UButton>

      <div class="flex items-center justify-between text-sm">
        <button type="button" class="text-gray-500 hover:text-gray-700" @click="emit('change-phone')">
          Ganti nomor
        </button>
        <button
          type="button"
          class="font-medium"
          :class="resendCountdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'"
          :disabled="resendCountdown > 0 || isRequesting"
          @click="emit('request-otp')"
        >
          {{ resendCountdown > 0 ? `Kirim ulang (${resendCountdown}s)` : 'Kirim ulang kode' }}
        </button>
      </div>

      <p class="text-xs text-gray-400 text-center">
        Kode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.
      </p>
    </template>
  </div>
</template>

