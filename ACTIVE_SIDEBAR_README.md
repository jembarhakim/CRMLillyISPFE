# Active Sidebar Feature

## Overview
Fitur active sidebar telah diimplementasikan untuk memberikan indikasi visual yang jelas tentang halaman/fitur yang sedang aktif di sidebar. Ini membantu pengguna untuk mengetahui posisi mereka dalam aplikasi.

## Fitur yang Diimplementasikan

### 1. **Deteksi Route Aktif**
- Sistem secara otomatis mendeteksi route yang sedang aktif
- Menggunakan `useRoute()` dari Vue Router untuk mendapatkan path saat ini
- Fungsi `isActiveMenuItem()` membandingkan link menu dengan path saat ini

### 2. **Visual Indicators**
- **Background Color**: Menu item aktif memiliki background biru muda (`bg-blue-50`)
- **Border Left**: Garis vertikal biru di sisi kiri (`border-l-4 border-blue-500`)
- **Text Color**: Teks berubah menjadi biru gelap (`text-blue-800`)
- **Icon Color**: Icon berubah menjadi biru (`#1d4ed8`)
- **Shadow**: Efek bayangan halus untuk memberikan depth

### 3. **Responsive Design**
- **Desktop Expanded**: Menampilkan semua indikator visual (background, border, text, icon)
- **Desktop Collapsed**: Tetap menampilkan border kiri dan warna icon untuk indikasi
- **Mobile**: Menampilkan semua indikator visual seperti desktop expanded

### 4. **Smooth Transitions**
- Animasi transisi 200ms untuk perubahan warna dan style
- Transisi yang smooth saat hover dan active state

## Implementasi Teknis

### **Vue.js Logic**
```javascript
// Function to check if a menu item is active
const isActiveMenuItem = (menuLink: string): boolean => {
  const currentPath = route.path
  // Exact match for dashboard root
  if (menuLink === '/dashboard' && currentPath === '/dashboard') {
    return true
  }
  // For other routes, check if current path starts with the menu link
  if (menuLink !== '/dashboard' && currentPath.startsWith(menuLink)) {
    return true
  }
  return false
}
```

### **Template Implementation**
```vue
<li v-for="(item, index) in filterMenu" :key="index"
  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
  :class="[
    showSidebar ? 'justify-center' : '',
    isActiveMenuItem(item.link) 
      ? 'active-menu-item' 
      : 'hover:bg-gray-100 text-gray-700'
  ]" 
  @click="navigateTo(item.link)">
```

### **CSS Styling**
```css
/* Active menu item styles */
.sidebar-fix .active-menu-item {
  background-color: #eff6ff !important;
  border-left: 4px solid #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
}

.sidebar-fix .active-menu-item:hover {
  background-color: #dbeafe !important;
}
```

## Behavior

### **Route Matching Logic**
1. **Dashboard Root** (`/dashboard`): Exact match dengan path saat ini
2. **Sub-routes** (e.g., `/dashboard/customer`): Path saat ini harus dimulai dengan link menu
3. **Dynamic Routes**: Mendukung route dengan parameter dinamis

### **Visual States**
- **Inactive**: Background putih, text abu-abu, icon hitam
- **Active**: Background biru muda, border kiri biru, text biru gelap, icon biru
- **Hover**: Background abu-abu muda (inactive) atau biru lebih terang (active)

## Testing

Untuk menguji fitur ini:

1. **Login** dengan berbagai role (Admin, Customer Service, NOC, Technician, Finance)
2. **Navigate** ke berbagai halaman melalui sidebar
3. **Verify** bahwa menu item yang sesuai dengan halaman saat ini ter-highlight
4. **Test** responsive behavior dengan collapse/expand sidebar
5. **Check** mobile view untuk memastikan active state tetap terlihat

## Browser Compatibility

Fitur ini menggunakan:
- CSS Grid dan Flexbox (didukung semua browser modern)
- CSS Transitions (didukung semua browser modern)
- Vue 3 Composition API (didukung semua browser modern)

## Future Enhancements

Potensi pengembangan lebih lanjut:
1. **Breadcrumb Integration**: Menampilkan breadcrumb berdasarkan active menu
2. **Animation Effects**: Menambahkan animasi slide atau fade untuk transisi
3. **Custom Themes**: Mendukung multiple color schemes untuk active state
4. **Accessibility**: Menambahkan ARIA labels untuk screen readers
