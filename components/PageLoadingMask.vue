<template>
  <Transition name="page-loader" :duration="{ leave: 1200 }">
    <div v-if="isLoading" class="page-loader" aria-label="Memuat Lilly Network" role="status">
      <div class="loading-panels" aria-hidden="true">
        <div class="loading-panel-track">
          <div class="loading-panel" />
        </div>
        <div class="loading-panel-track">
          <div class="loading-panel" />
        </div>
        <div class="loading-panel-track">
          <div class="loading-panel" />
        </div>
        <div class="loading-panel-track">
          <div class="loading-panel" />
        </div>
      </div>

      <div class="loading-content">
        <div class="loading-spinner" aria-hidden="true" />
        <h1 class="loading-title">LILLY NETWORK</h1>
        <p class="loading-caption">MEMUAT</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const isLoading = ref(true)
let loadingTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  loadingTimer = setTimeout(() => {
    isLoading.value = false
  }, 1500)
})

onUnmounted(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
})
</script>

<style scoped>
.page-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: transparent;
}

.loading-panels {
  position: absolute;
  inset: 0;
  display: flex;
}

.loading-panel-track {
  position: relative;
  flex: 1 1 25%;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.loading-panel {
  position: absolute;
  inset: 0;
  background: #fff;
}

.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.loading-spinner {
  width: 5.5rem;
  height: 5.5rem;
  margin-bottom: 3.25rem;
  border: 2px solid #e5e7eb;
  border-top-color: #A93133;
  border-right-color: #A93133;
  border-radius: 50%;
  animation: spinner-rotate 1s linear infinite;
}

.loading-title {
  margin: 0;
  color: #A93133;
  font-size: clamp(1.75rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: 0.3em;
  line-height: 1.1;
}

.loading-caption {
  margin: 0.75rem 0 0;
  color: #8b929c;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.45em;
}

.page-loader-leave-active {
  pointer-events: none;
}

.page-loader-leave-active .loading-panel {
  transition: transform 0.85s cubic-bezier(0.76, 0, 0.24, 1);
}

.page-loader-leave-active .loading-panel-track:nth-child(2) .loading-panel {
  transition-delay: 0.08s;
}

.page-loader-leave-active .loading-panel-track:nth-child(3) .loading-panel {
  transition-delay: 0.16s;
}

.page-loader-leave-active .loading-panel-track:nth-child(4) .loading-panel {
  transition-delay: 0.24s;
}

.page-loader-leave-active .loading-content {
  transition: opacity 0.35s ease;
}

.page-loader-leave-to .loading-panel {
  transform: translateX(-100%);
}

.page-loader-leave-to .loading-content {
  opacity: 0;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .loading-title {
    letter-spacing: 0.18em;
  }

  .loading-spinner {
    margin-bottom: 2.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation-duration: 2s;
  }

  .page-loader-leave-active .loading-panel,
  .page-loader-leave-active .loading-content {
    transition-duration: 0.01ms;
  }

  .page-loader-leave-active .loading-panel-track .loading-panel {
    transition-delay: 0ms;
  }
}
</style>
