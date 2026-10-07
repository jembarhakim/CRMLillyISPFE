<script setup lang="ts">
import NewsArticleForm from '@/components/NewsArticleForm.vue'

const route = useRoute()

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Edit Artikel - CRM System' })
</script>

<template>
  <NewsArticleForm :is-edit="true" :article-id="String(route.params.id)" />
</template>
