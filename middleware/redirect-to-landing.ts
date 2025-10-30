export default defineNuxtRouteMiddleware((to, from) => {
  // Redirect from root path to landing page
  if (to.path === '/') {
    return navigateTo('/landing', { redirectCode: 301 })
  }
})
