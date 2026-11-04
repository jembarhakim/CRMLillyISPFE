<script setup lang="ts">
import { authCustomerApi } from '@/api/customer/auth'

// Portal login â€” intentionally self-contained (no child components) so the
// form always renders, and styled to match the public landing page:
// Poppins type, #A93133 accent, #111111 top bar.

useHead({
  title: 'Masuk Portal Pelanggan - Lilly Networks',
})

definePageMeta({ layout: false })

type LoginMode = 'password' | 'whatsapp'

// Password (nomor + password) is the default; OTP is the "lupa password" path.
const mode = ref<LoginMode>('password')

const brandRed = '#A93133'

// ---------------------------------------------------------------------------
// Password login
// ---------------------------------------------------------------------------
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const loginError = ref('')
const isSubmitting = ref(false)

async function submitPasswordLogin() {
  loginError.value = ''

  if (!phone.value.trim() || !password.value) {
    loginError.value = 'Nomor pelanggan dan password wajib diisi.'
    return
  }

  isSubmitting.value = true
  try {
    const response = await authCustomerApi().loginAuth(phone.value.trim(), password.value)
    const authStore = useAuthStore()
    authStore.login({
      token: response.data.token,
      role_id: 'CUSTOMER',
      name: response.data.user?.name || '',
      email: response.data.user?.alias || '',
      userType: 'customer',
    })
    await navigateTo('/customer')
  } catch (error: any) {
    loginError.value = error?.message || 'Nomor atau password salah.'
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------------------------------------------------------------
// WhatsApp OTP login
// ---------------------------------------------------------------------------
const otpPhone = ref('')
const otpCode = ref('')
const otpStep = ref<'phone' | 'code'>('phone')
const otpError = ref('')
const isLoadingOtp = ref(false)
const isVerifyingOtp = ref(false)
const maskedPhone = ref('')
const resendCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  resendCountdown.value = 0
}

function startCountdown(seconds: number) {
  stopCountdown()
  resendCountdown.value = seconds
  countdownTimer = setInterval(() => {
    resendCountdown.value -= 1
    if (resendCountdown.value <= 0) stopCountdown()
  }, 1000)
}

onUnmounted(stopCountdown)

async function requestOtp() {
  otpError.value = ''
  const normalized = otpPhone.value.replace(/\D/g, '')

  if (normalized.length < 9) {
    otpError.value = 'Masukkan nomor WhatsApp yang benar, contoh: 081234567890'
    return
  }

  isLoadingOtp.value = true
  try {
    const response = await authCustomerApi().requestOtp(normalized)
    maskedPhone.value = response?.data?.phone_masked || normalized
    otpStep.value = 'code'
    otpCode.value = ''
    startCountdown(response?.data?.resend_in ?? 60)
  } catch (error: any) {
    otpError.value = error?.message || 'Gagal mengirim kode OTP.'
  } finally {
    isLoadingOtp.value = false
  }
}

async function verifyOtp() {
  otpError.value = ''
  const code = otpCode.value.replace(/\D/g, '')

  if (code.length !== 6) {
    otpError.value = 'Kode OTP terdiri dari 6 angka.'
    return
  }

  isVerifyingOtp.value = true
  try {
    const response = await authCustomerApi().verifyOtp(otpPhone.value, code)
    if (!response?.success) {
      throw new Error(response?.message || 'Kode OTP salah.')
    }

    const authStore = useAuthStore()
    authStore.login({
      token: response.data.token,
      role_id: 'CUSTOMER',
      name: response.data.user?.name || '',
      email: response.data.user?.alias || '',
      userType: 'customer',
    })
    stopCountdown()
    await navigateTo('/customer')
  } catch (error: any) {
    otpError.value = error?.message || 'Kode OTP salah.'
    otpCode.value = ''
  } finally {
    isVerifyingOtp.value = false
  }
}

/** Switch screens and clear stale state so errors never leak between forms. */
function switchMode(next: LoginMode) {
  mode.value = next
  loginError.value = ''
  otpError.value = ''

  if (next === 'password') {
    otpStep.value = 'phone'
    otpCode.value = ''
    stopCountdown()
  }
}
</script>

<template>
  <!--
    Design follows the public landing page: Poppins, #111111 top bar,
    #A93133 accent. Uses the portal-* component classes from
    assets/css/portal.css so the styling never depends on utility scanning.
  -->
  <div class="portal-auth-shell" style="font-family: 'Poppins', sans-serif;">
    <!-- Top bar (mirrors landing) -->
    <div class="portal-auth-topbar">
      <div class="portal-auth-topbar-inner">
        <span class="portal-auth-topbar-text">Layanan internet rumah &amp; bisnis</span>
        <a href="/landing" class="portal-auth-back">
          <i class="fas fa-arrow-left" style="font-size:10px"></i> Kembali ke beranda
        </a>
      </div>
    </div>

    <!-- Main -->
    <div class="portal-auth-main">
      <div class="portal-auth-box">
        <!-- Brand -->
        <div class="portal-auth-brand">
          <img
            src="/statics/images/logolilly.png"
            alt="Lilly ISP"
            class="portal-auth-logo"
          />
          <h1 class="portal-auth-title">Masuk Portal Pelanggan</h1>
          <p class="portal-auth-subtitle">
            Kelola tagihan, keluhan, dan paket internet Anda.
          </p>
        </div>

        <!-- Card -->
        <div class="portal-auth-card">

          <!-- ============ PASSWORD: nomor + password ============ -->
          <form v-if="mode === 'password'" class="portal-form" @submit.prevent="submitPasswordLogin">
            <label class="portal-form-row">
              <span class="portal-field-label">Nomor Pelanggan</span>
              <input
                v-model="phone"
                type="text"
                inputmode="numeric"
                autocomplete="username"
                placeholder="Contoh: 081234567890"
                class="portal-field"
              />
            </label>

            <label class="portal-form-row">
              <span class="portal-field-label">Password</span>
              <span class="portal-field-wrap">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                  class="portal-field portal-field-with-icon"
                />
                <button
                  type="button"
                  class="portal-field-eye"
                  :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  @click="showPassword = !showPassword"
                >
                  <LucideIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </span>
            </label>

            <p v-if="loginError" class="portal-alert">
              <LucideIcon name="alert-triangle" :size="14" />
              <span>{{ loginError }}</span>
            </p>

            <button type="submit" :disabled="isSubmitting" class="portal-btn-primary">
              <span v-if="isSubmitting" class="portal-spinner"></span>
              {{ isSubmitting ? 'Memproses...' : 'Masuk' }}
            </button>

            <div class="portal-auth-divider">
              <button
                type="button"
                class="portal-auth-link"
                @click="switchMode('whatsapp')"
              >
                Lupa password? Masuk dengan kode WhatsApp
              </button>
            </div>
          </form>

          <!-- ============ OTP: kode WhatsApp ============ -->
          <div v-else class="portal-form">
            <!-- Step 1: nomor -->
            <template v-if="otpStep === 'phone'">
              <div>
                <h2 class="portal-heading">Masuk dengan kode WhatsApp</h2>
                <p class="portal-body" style="margin-top:4px">
                  Masukkan nomor WhatsApp terdaftar, kami kirim kode 6 angka.
                </p>
              </div>

              <label class="portal-form-row">
                <span class="portal-field-label">Nomor WhatsApp</span>
                <input
                  v-model="otpPhone"
                  type="tel"
                  inputmode="numeric"
                  autocomplete="tel"
                  placeholder="081234567890"
                  class="portal-field"
                  @keydown.enter.prevent="requestOtp"
                />
              </label>

              <p v-if="otpError" class="portal-alert">
                <LucideIcon name="alert-triangle" :size="14" />
                <span>{{ otpError }}</span>
              </p>

              <button type="button" :disabled="isLoadingOtp" class="portal-btn-primary" @click="requestOtp">
                <span v-if="isLoadingOtp" class="portal-spinner"></span>
                {{ isLoadingOtp ? 'Mengirim...' : 'Kirim Kode OTP' }}
              </button>
            </template>

            <!-- Step 2: kode -->
            <template v-else>
              <div>
                <h2 class="portal-heading">Masukkan kode OTP</h2>
                <p class="portal-body" style="margin-top:4px">
                  Kode dikirim ke <strong>{{ maskedPhone }}</strong>
                </p>
              </div>

              <input
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="000000"
                class="portal-field portal-field-code"
                @keydown.enter.prevent="verifyOtp"
              />

              <p v-if="otpError" class="portal-alert">
                <LucideIcon name="alert-triangle" :size="14" />
                <span>{{ otpError }}</span>
              </p>

              <button
                type="button"
                :disabled="isVerifyingOtp || otpCode.replace(/\D/g, '').length !== 6"
                class="portal-btn-primary"
                @click="verifyOtp"
              >
                <span v-if="isVerifyingOtp" class="portal-spinner"></span>
                {{ isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Masuk' }}
              </button>

              <div class="portal-otp-actions">
                <button type="button" class="portal-otp-link" @click="otpStep = 'phone'">
                  Ganti nomor
                </button>
                <button
                  type="button"
                  :disabled="resendCountdown > 0 || isLoadingOtp"
                  class="portal-otp-link portal-otp-link-strong"
                  @click="requestOtp"
                >
                  {{ resendCountdown > 0 ? `Kirim ulang (${resendCountdown}s)` : 'Kirim ulang kode' }}
                </button>
              </div>
            </template>

            <div class="portal-auth-divider">
              <button type="button" class="portal-auth-link" @click="switchMode('password')">
                ← Kembali ke login nomor &amp; password
              </button>
            </div>
          </div>
        </div>

        <p class="portal-auth-footnote">
          Butuh bantuan? Hubungi layanan pelanggan kami.
        </p>
      </div>
    </div>
  </div>
</template>

