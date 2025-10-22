export default defineAppConfig({
    ui: {
        notifications: {
            // Show toasts at the center of the screen
            position: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        },
        // Override default Nuxt UI icons to use Lucide instead of Heroicons
        button: {
            default: {
                loadingIcon: 'loader-2'
            }
        },
        notification: {
            default: {
                closeButton: {
                    icon: 'x'
                }
            }
        },
        modal: {
            overlay: {
                background: 'bg-gray-200/75 dark:bg-gray-800/75'
            },
            default: {
                closeButton: {
                    icon: 'x'
                }
            }
        }
    }
})
