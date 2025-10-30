// Plugin specifically for VPS deployment hydration issues
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Wait for DOM to be ready
    nextTick(() => {
      // Fix hasOwnProperty issues that occur during VPS deployment
      const fixHasOwnProperty = () => {
        // Override hasOwnProperty to handle SSR serialization issues
        const originalHasOwnProperty = Object.prototype.hasOwnProperty
        
        Object.prototype.hasOwnProperty = function(prop: string | number | symbol) {
          try {
            // Check if this is a valid object with prototype
            if (this && typeof this === 'object' && this.constructor === Object) {
              return originalHasOwnProperty.call(this, prop)
            }
            // For objects without proper prototype (SSR serialized objects)
            return prop in this
          } catch (error) {
            console.warn('hasOwnProperty error during VPS hydration:', error)
            return prop in this
          }
        }
      }
      
      // Apply fix immediately
      fixHasOwnProperty()
      
      // Also apply fix after a short delay to catch any late-loading objects
      setTimeout(fixHasOwnProperty, 100)
      setTimeout(fixHasOwnProperty, 500)
    })
  }
})
