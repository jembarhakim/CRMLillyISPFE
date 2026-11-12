<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  icon?: string
  eyebrow?: string
}>(), {
  icon: 'layout-dashboard',
  eyebrow: 'Administrasi',
})
</script>

<template>
  <header class="admin-page-hero">
    <div class="admin-page-hero-content">
      <div class="admin-page-hero-icon">
        <LucideIcon :name="icon" :size="22" />
      </div>
      <div class="min-w-0">
        <p class="admin-page-hero-eyebrow">{{ eyebrow }}</p>
        <h1 class="admin-page-hero-title">{{ title }}</h1>
        <p class="admin-page-hero-description">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="admin-page-hero-actions">
      <slot name="actions" />
    </div>
  </header>
</template>
