<template>
  <div
    v-if="isVisible"
    class="fixed top-4 right-4 z-50 max-w-md w-full sm:w-96"
    @click.self="closeToast"
  >
    <!-- Toast Container -->
    <div
      :class="[
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-200 animate-in slide-in-from-right',
        {
          'bg-green-50 border-green-200 text-green-900': type === 'success',
          'bg-red-50 border-red-200 text-red-900': type === 'error',
          'bg-blue-50 border-blue-200 text-blue-900': type === 'info',
          'bg-yellow-50 border-yellow-200 text-yellow-900': type === 'warning',
        }
      ]"
      @click.stop
    >
      <!-- Icon -->
      <div class="flex-shrink-0 mt-0.5">
        <svg
          v-if="type === 'success'"
          class="w-5 h-5 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else-if="type === 'error'"
          class="w-5 h-5 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else-if="type === 'warning'"
          class="w-5 h-5 text-yellow-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          class="w-5 h-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 v-if="title" class="font-semibold text-sm mb-1">
          {{ title }}
        </h3>
        <p v-if="description" class="text-sm opacity-90 break-words">
          {{ description }}
        </p>
      </div>

      <!-- Close Button -->
      <button
        @click="closeToast"
        class="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 ml-2"
        aria-label="Close toast"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- Progress Bar -->
      <div v-if="duration > 0" class="absolute bottom-0 left-0 h-0.5 bg-gray-200 w-full rounded-full overflow-hidden">
        <div
          class="h-full transition-all duration-100 ease-linear"
          :class="{
            'bg-green-600': type === 'success',
            'bg-red-600': type === 'error',
            'bg-blue-600': type === 'info',
            'bg-yellow-600': type === 'warning',
          }"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  isVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000,
  isVisible: false,
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(props.isVisible)
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

function startProgress() {
  if (props.duration <= 0) return
  
  progress.value = 100
  const interval = 30 // Update every 30ms
  const decrement = (interval / props.duration) * 100
  
  progressInterval = setInterval(() => {
    progress.value -= decrement
    if (progress.value <= 0) {
      closeToast()
    }
  }, interval)
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  progress.value = 100
}

function closeToast() {
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
      closeToast()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  return () => {
    document.removeEventListener('keydown', handleEscape)
  }
})
</script>

<style scoped>
@keyframes slide-in-from-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-in.slide-in-from-right {
  animation: slide-in-from-right 0.3s ease-out;
}
</style>
