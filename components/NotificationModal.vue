<template>
  <Teleport to="body">
    <Transition
      name="notification-modal"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="closeModal"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div
          class="relative bg-slate-900 text-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
          @click.stop
        >
          <!-- Close Button -->
          <button
            @click="closeModal"
            class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Icon based on type -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div
                v-if="type === 'success'"
                class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div
                v-else-if="type === 'error'"
                class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <div
                v-else-if="type === 'info'"
                class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div
                v-else
                class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-white mb-1">
                {{ title }}
              </h3>
              <p v-if="message" class="text-gray-300 text-sm leading-relaxed">
                {{ message }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="showProgress" class="mt-4 w-full bg-gray-700 rounded-full h-1">
            <div
              class="bg-white h-1 rounded-full transition-all duration-100 ease-linear"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  title: string
  message?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 2000,
  message: ''
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(false)
const showProgress = ref(false)
const progress = ref(100)
let progressInterval: NodeJS.Timeout | null = null

// Watch for visibility changes
watch(() => props.isVisible, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    startProgress()
  } else {
    stopProgress()
  }
})

// Start progress bar animation
function startProgress() {
  if (props.duration <= 0) return
  
  showProgress.value = true
  progress.value = 100
  
  const interval = 50 // Update every 50ms
  const decrement = (interval / props.duration) * 100
  
  progressInterval = setInterval(() => {
    progress.value -= decrement
    if (progress.value <= 0) {
      closeModal()
    }
  }, interval)
}

// Stop progress bar animation
function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  showProgress.value = false
  progress.value = 100
}

// Close modal
function closeModal() {
  stopProgress()
  isVisible.value = false
  emit('close')
}

// Cleanup on unmount
onUnmounted(() => {
  stopProgress()
})

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible.value) {
      closeModal()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.notification-modal-enter-active,
.notification-modal-leave-active {
  transition: all 0.3s ease;
}

.notification-modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.notification-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
