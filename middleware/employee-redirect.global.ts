export default defineNuxtRouteMiddleware((to) => {
  // Redirect /Employee (uppercase) to /employee (lowercase)
  if (to.path === '/Employee') {
    return navigateTo('/employee', { redirectCode: 301 })
  }
})
