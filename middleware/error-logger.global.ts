export default defineNuxtRouteMiddleware((to, from) => {
  // Log route changes for debugging
  console.log('Route change:', {
    from: from?.path,
    to: to.path,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
if (process.client) {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    console.error('Error details:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}
