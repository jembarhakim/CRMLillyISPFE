# CRM Frontend

## Fitur yang Tersedia

### Tickets Management
- **Admin & Customer Service**: Dapat membuat, mengelola, dan mengassign ticket ke NOC atau Technician
- **NOC**: Dapat mengelola ticket dan mengirim kembali ke Customer Service
- **Technician**: Dapat menambahkan technician note pada ticket yang ditugaskan

### Technician Note Feature
Fitur baru yang memungkinkan role Technician untuk menambahkan catatan teknis pada ticket:

#### Cara Penggunaan:
1. Login sebagai user dengan role **TECHNICIAN**
2. Buka halaman Tickets di dashboard
3. Pada setiap ticket, akan muncul button **"Add Tech Note"** di kolom Actions
4. Klik button tersebut untuk membuka popup modal
5. Isi note yang diperlukan pada textarea
6. Klik **"Add Note"** untuk menyimpan

#### Fitur yang Ditambahkan:
- Button "Add Tech Note" dengan warna orange (`bg-orange-600`)
- Modal popup untuk mengisi technician note
- State management untuk technician note
- Loading state saat submit
- Toast notification untuk feedback
- Hanya muncul untuk role Technician
- Hanya muncul pada ticket yang belum finished

#### Technical Details:
- **State Variables**: `showTechnicianNoteModal`, `technicianNote`, `technicianNoteSubmitting`
- **Functions**: `actPrepareTechnicianNote()`, `sendTechnicianNoteFromModal()`
- **API Integration**: TODO - perlu implementasi backend API `ticketsApi().addTechnicianNote()`
- **Role Check**: Menggunakan `isTechnician.value` dari composable `useRolePermissions`

#### Backend Integration (TODO):
```typescript
// Perlu implementasi di backend
await ticketsApi().addTechnicianNote(selectedId.value, technicianNote.value)
```

## Struktur Project
