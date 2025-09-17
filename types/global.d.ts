declare global {
  interface Window {
    handleTokenExpiration: () => Promise<void>
    showLogoutConfirmation: () => Promise<void>
  }
}

export {}
