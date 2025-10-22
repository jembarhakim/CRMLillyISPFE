<template>
  <component :is="iconComponent" v-bind="$attrs" />
</template>

<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  strokeWidth: {
    type: Number,
    default: 2
  }
})

// Convert kebab-case to PascalCase for icon names
const iconName = computed(() => {
  return props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
})

// Get the icon component
const iconComponent = computed(() => {
  const icon = icons[iconName.value]
  if (!icon) {
    console.warn(`Icon "${props.name}" not found in lucide-vue-next`)
    return null
  }
  return icon
})
</script>
