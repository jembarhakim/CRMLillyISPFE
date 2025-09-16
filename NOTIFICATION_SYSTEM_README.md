# Sistem Notifikasi Modal Baru

Sistem notifikasi telah diubah dari toast biasa menjadi modal popup dengan overlay gelap sesuai spesifikasi yang diminta.

## Komponen Utama

### 1. NotificationModal.vue
Komponen modal notifikasi dengan fitur:
- Overlay gelap transparan
- Background dark navy (#0f172a)
- Text putih
- Border radius 12px
- Box shadow halus
- Animasi fade-in
- Tombol close (X) di pojok kanan atas
- Progress bar untuk auto close
- Icon berdasarkan tipe notifikasi

### 2. Notification Store (stores/notification.ts)
Store Pinia untuk mengelola notifikasi global:
- Queue system untuk multiple notifications
- Auto-close dengan duration yang dapat dikustomisasi
- Support untuk tipe: success, error, info, warning

### 3. useNotification Composable
Composable untuk memudahkan penggunaan notifikasi:
```typescript
const notification = useNotification()

// Methods
notification.success(title, message?, duration?)
notification.error(title, message?, duration?)
notification.info(title, message?, duration?)
notification.warning(title, message?, duration?)
notification.close()
notification.clearAll()
```

## Cara Penggunaan

### Basic Usage
```typescript
import { useNotification } from '@/composables/useNotification'

const notification = useNotification()

// Success notification
notification.success('Success!', 'Data berhasil disimpan')

// Error notification
notification.error('Error!', 'Terjadi kesalahan saat menyimpan data', 5000)

// Warning notification
notification.warning('Warning!', 'Data akan dihapus permanen', 4000)

// Info notification
notification.info('Info', 'Proses sedang berjalan...', 3000)
```

### Advanced Usage
```typescript
// Multiple notifications (akan di-queue)
notification.info('First', 'First notification')
notification.success('Second', 'Second notification')
notification.error('Third', 'Third notification')

// Clear all notifications
notification.clearAll()
```

## Konfigurasi

### Default Duration
- Success: 2000ms
- Error: 5000ms
- Info: 2000ms
- Warning: 4000ms

### Custom Duration
```typescript
notification.success('Success!', 'Message', 10000) // 10 detik
```

## Fitur

1. **Auto Close**: Notifikasi otomatis tertutup setelah duration yang ditentukan
2. **Manual Close**: Bisa ditutup manual dengan tombol X atau klik overlay
3. **Queue System**: Multiple notifications akan di-queue dan ditampilkan satu per satu
4. **Responsive**: Modal responsive untuk berbagai ukuran layar
5. **Keyboard Support**: Bisa ditutup dengan tombol Escape
6. **Progress Bar**: Menampilkan progress bar untuk auto close
7. **Icon Support**: Icon berbeda untuk setiap tipe notifikasi

## Migration dari Toast Lama

Semua penggunaan `useToast()` telah di-refactor ke sistem baru:

### Sebelum:
```typescript
const toast = useToast()
toast.add({
  title: 'Success!',
  description: 'Data berhasil disimpan',
  color: 'green',
  timeout: 3000
})
```

### Sesudah:
```typescript
const notification = useNotification()
notification.success('Success!', 'Data berhasil disimpan', 3000)
```

## Testing

Untuk testing sistem notifikasi, kunjungi `/test-notification` yang berisi berbagai contoh penggunaan.

## File yang Telah Di-refactor

- `pages/dashboard/tickets/index.vue`
- `pages/dashboard/invoice/index.vue`
- `pages/dashboard/customer/index.vue`
- `pages/dashboard/customer/FormAddComponent.vue`
- `pages/dashboard/modal/index.vue`
- `plugins/auth-expired.client.ts`

## Struktur File

```
crm-fe/
├── components/
│   └── NotificationModal.vue
├── stores/
│   └── notification.ts
├── composables/
│   └── useNotification.ts
├── plugins/
│   └── notification-init.client.ts
└── pages/
    └── test-notification.vue
```
