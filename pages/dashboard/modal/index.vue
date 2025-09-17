<script setup lang="ts">
import Modal from './Modal.vue'
import { useNotification } from '@/composables/useNotification'

const notification = useNotification()
const modal = useModal()
const count = ref(0)

function openModal() {
  count.value += 1
  modal.open(Modal, {
    count: count.value,
    onSuccess() {
      notification.success('Success!', 'Modal action completed successfully')
    }
  })
}
</script>

<template>
 
</template>
