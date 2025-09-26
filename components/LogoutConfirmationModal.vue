<template>
  <Teleport to="body">
    <Transition
      name="logout-modal"
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
        @click="handleCancel"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div
          class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
          @click.stop
        >
          <!-- Icon -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ title }}
              </h3>
              <p class="text-gray-600 text-sm leading-relaxed">
                {{ message }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 mt-6">
            <button
              @click="handleCancel"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Batal
            </button>
            <button
              @click="handleConfirm"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  title?: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Konfirmasi Logout',
  message: 'Apakah Anda yakin ingin logout? Anda akan keluar dari sistem.'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Handle confirm
function handleConfirm() {
  emit('confirm')
}

// Handle cancel
function handleCancel() {
  emit('cancel')
}

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isVisible) {
      handleCancel()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.logout-modal-enter-active,
.logout-modal-leave-active {
  transition: all 0.3s ease;
}

.logout-modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.logout-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

