export function useCustomToast() {
  const toast = useToast()

  function add(notification: any) {
    const actions = notification.actions || []
    const hasClose = actions.some((a: any) => a.label === 'Close')

    if (!hasClose) {
      actions.push({ label: 'Close', click: () => { } })
    }

    toast.add({
      ...notification,
      actions
    })
  }

  function success(title: string, description?: string, duration?: number) {
    add({
      title,
      description,
      color: 'green',
      timeout: duration || 3000,
      icon: 'i-heroicons-check-circle'
    })
  }

  function error(title: string, description?: string, duration?: number) {
    add({
      title,
      description,
      color: 'red',
      timeout: duration || 5000,
      icon: 'i-heroicons-exclamation-circle'
    })
  }

  function info(title: string, description?: string, duration?: number) {
    add({
      title,
      description,
      color: 'blue',
      timeout: duration || 3000,
      icon: 'i-heroicons-information-circle'
    })
  }

  function warning(title: string, description?: string, duration?: number) {
    add({
      title,
      description,
      color: 'orange',
      timeout: duration || 4000,
      icon: 'i-heroicons-exclamation-triangle'
    })
  }

  function clearAll() {
    toast.clear()
  }

  return {
    add,
    success,
    error,
    info,
    warning,
    remove: toast.remove,
    clear: toast.clear,
    clearAll
  }
}
