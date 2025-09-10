import { authApi } from '@/api/auth'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side to avoid SSR issues
  if (!process.client) {
    return;
  }

  // Check if this is a protected route
  const isProtectedRoute = to.path.startsWith('/dashboard') || to.path.startsWith('/customer');
  
  if (!isProtectedRoute) {
    return;
  }

  const authStore = useAuthStore();
  
  // Wait for auth store to be initialized
  if (!authStore.isInitialized) {
    // Force initialization
    authStore.initFromCookies();
    
    // Small delay to ensure initialization is complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Check if user is logged in using the store
  if (!authStore.isLoggedIn) {
    console.log('No valid authentication found, redirecting to login');
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  console.log('Valid authentication found, allowing access to:', to.path);
});

async function checkAuth() {
  const authStore = useAuthStore();
  
  // Check if we have a token first
  if (!authStore.isLoggedIn) {
    return;
  }
  
  try {
    const response = await authApi().verifyAuth();
    if (response.success == false) {
      console.log("Token verification failed, logging out");
      authStore.logout();
      return navigateTo("/login");
    } else {
      authStore.user = response.data;
    }
  } catch (error: any) {
    console.error("authStore cek auth error", error);
    // Don't logout immediately on network errors, just log the error
    // Only logout if it's a clear authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      authStore.logout();
      return navigateTo("/login");
    }
  }
}

async function checkAuthCustomer() {
  const authStore = useAuthStore();
  
  // Check if we have a token first
  if (!authStore.isLoggedIn) {
    return;
  }
  
  try {
    const response = await authApi().verifyAuthCustomer();
    if (response.success == false) {
      console.log("Customer token verification failed, logging out");
      authStore.logout();
      return navigateTo("/login");
    } else {
      authStore.user = response.data;
    }
  } catch (error: any) {
    console.error("authStore cek auth error", error);
    // Don't logout immediately on network errors, just log the error
    // Only logout if it's a clear authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      authStore.logout();
      return navigateTo("/login");
    }
  }
}

function checkPermission(to: RouteLocationNormalized) {
  const { user } = useAuth();

  const restrictedForAdmins = [""];
  const restrictedForTechnicians = [
    "/dashboard/user-management",
    "/dashboard/report",
    "/dashboard/invoice",
    "/dashboard/transaction",
    "/dashboard/companies",
  ];
  const restrictedForFinances = [
    "/dashboard/user-management",
    "/dashboard/companies",
    "/dashboard/asset",
    "/dashboard/area",
    "/dashboard/internet-package",
  ];
  if (
    user.value?.role === "ADMIN" &&
    restrictedForAdmins.includes(to.path)
  ) {
    return "disallow";
  }
  if (
    user.value?.role === "TECHNICIAN" &&
    restrictedForTechnicians.includes(to.path)
  ) {
    return "disallow";
  }
  if (
    user.value?.role === "FINANCE" &&
    restrictedForFinances.includes(to.path)
  ) {
    return "disallow";
  }
}
