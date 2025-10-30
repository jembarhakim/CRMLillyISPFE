# Quick Start Guide - After Login Separation Fix

## 🚀 How to Apply the Fix

The code has been updated with `layout: false` configuration. Now you just need to clear the cache and restart.

---

## Option 1: Using Script (Easiest)

### Windows PowerShell:
```powershell
cd crm-fe
.\clear-cache-and-restart.ps1
```

### Windows Command Prompt:
```cmd
cd crm-fe
clear-cache-and-restart.bat
```

**That's it!** The script will:
- ✅ Clear `.nuxt` cache
- ✅ Clear `node_modules/.cache`
- ✅ Start dev server
- ✅ Your login pages will now work correctly!

---

## Option 2: Manual Steps

If you prefer to do it manually:

### Step 1: Stop the current dev server
Press `Ctrl + C` in the terminal running the dev server.

### Step 2: Delete cache folders
```powershell
# In crm-fe directory
Remove-Item -Recurse -Force .nuxt
Remove-Item -Recurse -Force node_modules\.cache
```

### Step 3: Start dev server again
```powershell
npm run dev
```

---

## ✅ Verify the Fix

After the server restarts:

### Test Customer Login:
1. Open: `http://localhost:3000/login`
2. Should see: **Full-screen green login page** (NO sidebar/navbar)

### Test Employee Login:
1. Open: `http://localhost:3000/Employee`
2. Should see: **Full-screen blue login page** (NO sidebar/navbar)

---

## 🎯 What Was Fixed

### Changes Made:

**1. Customer Login** (`pages/login/index.vue`):
```typescript
definePageMeta({
  middleware: 'guest',
  layout: false,  // ← ADDED - Prevents dashboard UI
  ssr: false
})
```

**2. Employee Login** (`pages/Employee.vue`):
```typescript
definePageMeta({
  middleware: 'guest',
  layout: false,  // ← ADDED - Prevents dashboard UI
  ssr: false
})
```

---

## 🐛 Troubleshooting

### Problem: "Still seeing sidebar/navbar"

**Solution:**
1. Make sure you ran the cache clearing script
2. Hard refresh browser: `Ctrl + Shift + R`
3. Try incognito/private window
4. Check browser console (F12) for errors

### Problem: "Redirected to dashboard immediately"

**This is normal if you're logged in!**

Guest middleware redirects authenticated users to dashboard.

**To test:**
- Logout first
- Or use incognito window
- Or clear cookies

### Problem: "Script won't run"

**PowerShell execution policy issue:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\clear-cache-and-restart.ps1
```

**Or just use the .bat file instead:**
```cmd
clear-cache-and-restart.bat
```

---

## 📋 File Checklist

Make sure these files exist:

- ✅ `pages/login/index.vue` (Customer login - GREEN theme)
- ✅ `pages/Employee.vue` (Employee login - BLUE theme)
- ✅ `clear-cache-and-restart.ps1` (PowerShell script)
- ✅ `clear-cache-and-restart.bat` (Batch script)
- ✅ `LAYOUT_FIX_GUIDE.md` (Detailed troubleshooting)

---

## 🎉 Success Criteria

After applying the fix, you should have:

- [x] Customer login at `/login` - Full screen, green theme, no sidebar
- [x] Employee login at `/Employee` - Full screen, blue theme, no sidebar
- [x] Landing page login button → `/login`
- [x] Both pages redirect if already logged in (guest middleware)
- [x] No dashboard UI elements on login pages

---

## 📞 Need More Help?

See detailed troubleshooting: **`LAYOUT_FIX_GUIDE.md`**

---

**Status:** ✅ Ready to use  
**Last Updated:** 2025-10-28
