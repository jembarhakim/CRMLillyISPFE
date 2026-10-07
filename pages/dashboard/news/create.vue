<script setup lang="ts">
import NewsArticleForm from '@/components/NewsArticleForm.vue'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Tambah Artikel - CRM System' })
</script>

<template>
  <NewsArticleForm />
</template>
