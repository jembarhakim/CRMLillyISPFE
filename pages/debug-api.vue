<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">🔧 API Debug</h1>
    
    <div class="space-y-6">
      <!-- API Host Info -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">📡 API Configuration</h2>
        <p><strong>API Host:</strong> {{ apiHost }}</p>
        <p><strong>Full Login URL:</strong> {{ apiHost }}/api/auth/login</p>
      </div>

      <!-- Test Direct API Call -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">🧪 Direct API Test</h2>
        <button 
          @click="testDirectAPI" 
          :disabled="testing"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ testing ? 'Testing...' : 'Test Direct API Call' }}
        </button>
        <div v-if="apiResult" class="mt-4 p-4 bg-gray-100 rounded">
          <h3 class="font-semibold">Result:</h3>
          <pre class="text-sm overflow-auto">{{ apiResult }}</pre>
        </div>
      </div>

      <!-- Test with Different URLs -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">🔍 Test Different URLs</h2>
        <div class="space-y-2">
          <button 
            @click="testURL(`${apiHost}/api/auth/login`)" 
            class="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
          >
            Current API Host
          </button>
          <button 
            @click="testURL('http://localhost:3001/api/auth/login')" 
            class="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
          >
            localhost:3001
          </button>
          <button 
            @click="testURL('http://127.0.0.1:3001/api/auth/login')" 
            class="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
          >
            127.0.0.1:3001
          </button>
        </div>
        <div v-if="urlTestResult" class="mt-4 p-4 bg-gray-100 rounded">
          <h3 class="font-semibold">URL Test Result:</h3>
          <pre class="text-sm overflow-auto">{{ urlTestResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const apiHost = useApiHost()
const testing = ref(false)
const apiResult = ref('')
const urlTestResult = ref('')

async function testDirectAPI() {
  testing.value = true
  apiResult.value = ''
  
  try {
    const response = await fetch(`${apiHost}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@email.com',
        password: 'password',
      }),
    })
    
    const contentType = response.headers.get('content-type')
    const text = await response.text()
    
    apiResult.value = `Status: ${response.status}
URL: ${response.url}
Content-Type: ${contentType}
Response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`
    
  } catch (error: any) {
    apiResult.value = `Error: ${error.message}`
  } finally {
    testing.value = false
  }
}

async function testURL(url: string) {
  urlTestResult.value = ''
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@email.com',
        password: 'password',
      }),
    })
    
    const contentType = response.headers.get('content-type')
    const text = await response.text()
    
    urlTestResult.value = `URL: ${url}
Status: ${response.status}
Content-Type: ${contentType}
Response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`
    
  } catch (error: any) {
    urlTestResult.value = `URL: ${url}
Error: ${error.message}`
  }
}
</script>