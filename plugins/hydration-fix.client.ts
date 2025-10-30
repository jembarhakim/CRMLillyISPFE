// Plugin to fix SSR hydration issues with hasOwnProperty
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Fix hasOwnProperty issues during hydration
    const originalHasOwnProperty = Object.prototype.hasOwnProperty
    
    // Create a safe hasOwnProperty function
    const safeHasOwnProperty = function(this: any, prop: string | number | symbol) {
      try {
        // Check if the object has the method
        if (typeof this === 'object' && this !== null) {
          return originalHasOwnProperty.call(this, prop)
        }
        return false
      } catch (error) {
        console.warn('hasOwnProperty error during hydration:', error)
        return false
      }
    }
    
    // Override hasOwnProperty globally to handle SSR edge cases
    Object.prototype.hasOwnProperty = safeHasOwnProperty
    
    // Also fix for objects that might not have prototype
    const fixObjectPrototype = (obj: any) => {
      if (obj && typeof obj === 'object' && !obj.hasOwnProperty) {
        obj.hasOwnProperty = safeHasOwnProperty
      }
    }
    
    // Apply fix to common objects that might be affected
    if (window) {
      fixObjectPrototype(window)
    }
    
    // Fix for any objects in the global scope
    const originalDefineProperty = Object.defineProperty
    Object.defineProperty = function(obj: any, prop: string | number | symbol, descriptor: PropertyDescriptor) {
      try {
        const result = originalDefineProperty.call(this, obj, prop, descriptor)
        fixObjectPrototype(obj)
        return result
      } catch (error) {
        console.warn('defineProperty error during hydration:', error)
        return obj
      }
    }
  }
})
