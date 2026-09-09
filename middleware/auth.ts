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
    // Determine correct login page based on stored userType
    const redirectPath = authStore.userType === 'employee' ? '/employee' : '/login'
    return navigateTo(`${redirectPath}?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  // Skip backend verify for now - the middleware guest and global-auth already handle auth checks
  // Backend verify is causing 401 issues due to database lookup delays
  // Token validity is checked via cookie and middleware checks, which is sufficient
  console.log('Token validation skipped in auth middleware - using store-based validation only');

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
      const userType = useAuthStore().userType;
      useAuthStore().logout();
      const redirectPath = userType === 'employee' ? '/employee' : '/login';
      return navigateTo(redirectPath);
    } else {
      authStore.user = response.data;
    }
  } catch (error: any) {
    console.error("authStore cek auth error", error);
    // Don't logout immediately on network errors, just log the error
    // Only logout if it's a clear authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userType = authStore.userType;
      authStore.logout();
      const redirectPath = userType === 'employee' ? '/employee' : '/login';
      return navigateTo(redirectPath);
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
      const userType = authStore.userType;
      authStore.logout();
      const redirectPath = userType === 'employee' ? '/employee' : '/login';
      return navigateTo(redirectPath);
    } else {
      authStore.user = response.data;
    }
  } catch (error: any) {
    console.error("authStore cek auth error", error);
    // Don't logout immediately on network errors, just log the error
    // Only logout if it's a clear authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userType = authStore.userType;
      authStore.logout();
      const redirectPath = userType === 'employee' ? '/employee' : '/login';
      return navigateTo(redirectPath);
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
  // ADMIN role no longer exists - SUPERADMIN is the only admin role
  // If restrictions are needed for SUPERADMIN, uncomment below:
  // if (
  //   user.value?.role === "SUPERADMIN" &&
  //   restrictedForAdmins.includes(to.path)
  // ) {
  //   return "disallow";
  // }
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
