export default defineNuxtPlugin(() => {
  // Log API configuration
  const config = useRuntimeConfig()
  console.log('API Configuration:', {
    API_HOST: config.public.API_HOST,
    WA_HOST: config.public.WA_HOST,
    NODE_ENV: process.env.NODE_ENV
  })

  // Test API connection
  $fetch(config.public.API_HOST + '/api/health', { 
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
