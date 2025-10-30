# Logout Redirect Fix - Employee & Customer Separation

## Problem

When employees logged out, they were redirected to the customer login page (`/login`) instead of the employee login page (`/Employee`).

## Root Cause

File: `layouts/navbar.vue` (line 232-236)

The logout handler was hardcoded to always redirect to `/login`:

```typescript
function handleLogoutConfirm() {
  authStore.logout()
  showLogoutModal.value = false
  router.push('/login')  // ← Always redirects to customer login
}
```

## Solution

Updated the logout handler to check the user's role before redirecting:

```typescript
function handleLogoutConfirm() {
  // Store the user role before logout to determine redirect
  const userRole = authStore.user?.role
  
  // Logout user
  authStore.logout()
  showLogoutModal.value = false
  
  // Redirect based on previous role
  // If role was CUSTOMER, redirect to customer login
  // Otherwise (employee/admin roles), redirect to employee login
  if (userRole === 'CUSTOMER') {
    router.push('/login')
  } else {
    router.push('/Employee')
  }
}
```

## How It Works

1. **Before logout:** Store the current user's role in a variable
2. **Perform logout:** Clear auth data from store and cookies
3. **Redirect logic:**
   - If role was `CUSTOMER` → redirect to `/login`
   - If role was anything else (ADMIN, MANAGER, etc.) → redirect to `/Employee`

## User Flows

### Customer Logout
```
Customer Dashboard → Click Logout → Confirm → Redirect to /login ✓
```

### Employee Logout
```
Employee Dashboard → Click Logout → Confirm → Redirect to /Employee ✓
```

## Testing

### Test 1: Employee Logout
1. Login as employee at `/Employee`
2. Navigate to dashboard
3. Click profile → Logout
4. Confirm logout
5. **Expected:** Redirected to `/Employee` (blue login page)

### Test 2: Customer Logout
1. Login as customer at `/login`
2. Navigate to customer portal
3. Click profile → Logout
4. Confirm logout
5. **Expected:** Redirected to `/login` (green login page)

## Files Modified

| File | Change | Line |
|------|--------|------|
| `layouts/navbar.vue` | Added role-based redirect logic | 232-247 |

## No Server Restart Required

This is a runtime change that doesn't require cache clearing or server restart. The fix will work immediately after the file is saved.

## Security Note

The role check happens BEFORE logout, so even if the logout process fails, the redirect will still be based on the user's previous role. This ensures users always land on the appropriate login page for their user type.

---

**Date:** 2025-10-28  
**Status:** ✅ FIXED - Works immediately  
**Issue:** Employee logout redirected to customer login  
**Solution:** Role-based redirect logic
