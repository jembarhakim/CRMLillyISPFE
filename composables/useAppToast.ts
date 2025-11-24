export const useAppToast = () => {
    const toast = useToast()

    return {
        add: (notification: any) => {
            const actions = notification.actions || []
            // Check if close action already exists to avoid duplicates
            const hasClose = actions.some((a: any) => a.label === 'Close')

            if (!hasClose) {
                actions.push({ label: 'Close', click: () => { } })
            }

            toast.add({
                ...notification,
                actions
            })
        },
        remove: (id: string) => toast.remove(id),
        update: (id: string, notification: any) => toast.update(id, notification),
        clear: () => toast.clear()
    }
}
