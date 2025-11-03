export default defineNuxtPlugin(() => {
  // Log API configuration - use composables to get the correct host
  const apiHost = useApiHost()
  const waHost = useWaHost()
  const config = useRuntimeConfig()
  
  console.log('API Configuration:', {
    API_HOST: apiHost, // Use the composable that handles localhost detection
    WA_HOST: waHost, // Use the composable that handles localhost detection
    RAW_CONFIG_API_HOST: config.public.API_HOST, // Show raw config for debugging
    NODE_ENV: process.env.NODE_ENV
  })

  // Test API connection using the composable
  $fetch(apiHost + '/api/health', { 
    method: 'GET',
    timeout: 5000 
  }).then(response => {
    console.log('API Health Check Success:', response)
  }).catch(error => {
    console.error('API Health Check Failed:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      data: error.data
    })
  })

  // Log all API calls
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    console.log('API Call:', args[0])
    return originalFetch.apply(this, args).then(response => {
      if (!response.ok) {
        console.error('API Error Response:', {
          url: args[0],
          status: response.status,
          statusText: response.statusText
        })
      }
      return response
    })
  }
})
