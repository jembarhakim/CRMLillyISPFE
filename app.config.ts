export default defineAppConfig({
    ui: {
        notifications: {
            // Show toasts at the center of the screen
            position: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        },
        modal: {
            overlay: {
                background: 'bg-gray-200/75 dark:bg-gray-800/75'
            }
        }
    }
})
