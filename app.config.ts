export default defineAppConfig({
    ui: {
        notifications: {
            // Show toasts at the center of the screen
            position: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        },
        // Override default Nuxt UI icons to use Heroicons
        button: {
            default: {
                loadingIcon: 'i-heroicons-arrow-path'
            }
        },
        notification: {
            default: {
                closeButton: {
                    icon: 'i-heroicons-x-mark'
                }
            }
        },
        modal: {
            overlay: {
                background: 'bg-gray-200/75 dark:bg-gray-800/75'
            },
            default: {
                closeButton: {
                    icon: 'i-heroicons-x-mark'
                }
            }
        }
    }
})
