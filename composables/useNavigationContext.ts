import { ref } from 'vue'

export interface NavigationContext {
  from: 'customer' | 'reports' | 'direct'
  returnUrl: string
  returnLabel: string
}

const navigationContext = ref<NavigationContext | null>(null)

export const useNavigationContext = () => {
  const setNavigationContext = (context: NavigationContext) => {
    navigationContext.value = context
  }

  const getNavigationContext = (): NavigationContext | null => {
    return navigationContext.value
  }

  const clearNavigationContext = () => {
    navigationContext.value = null
  }

  const getBackNavigation = (): NavigationContext => {
    // If we have a stored context, use it
    if (navigationContext.value) {
      return navigationContext.value
    }

    // Fallback for direct URL access
    return {
      from: 'direct',
      returnUrl: '/dashboard/report/customer-installation/reports',
      returnLabel: 'Back to Reports'
    }
  }

  return {
    setNavigationContext,
    getNavigationContext,
    clearNavigationContext,
    getBackNavigation
  }
}
