# Technician Note Feature

## Overview
Fitur ini memungkinkan user dengan role **TECHNICIAN** untuk menambahkan catatan teknis pada ticket yang ditugaskan kepada mereka.

## Fitur yang Ditambahkan

### 1. Button "Add Tech Note"
- **Lokasi**: Kolom Actions pada tabel tickets
- **Warna**: Orange (`bg-orange-600`)
- **Visibility**: Hanya muncul untuk role Technician
- **Condition**: Hanya muncul pada ticket yang belum finished

### 2. Modal Popup
- **Judul**: "Add Technician Note"
- **Input**: Textarea untuk mengisi note
- **Placeholder**: "Enter your technician note..."
- **Buttons**: Cancel dan Add Note

### 3. State Management
```typescript
// State variables
const showTechnicianNoteModal = ref(false)
const technicianNote = ref('')
const technicianNoteSubmitting = ref(false)
```

### 4. Functions
```typescript
// Prepare modal
function actPrepareTechnicianNote(id: number) {
  selectedId.value = id;
  technicianNote.value = '';
  showTechnicianNoteModal.value = true
}

// Submit note
async function sendTechnicianNoteFromModal() {
  if (!selectedId.value) return;
  try {
    technicianNoteSubmitting.value = true
    // TODO: Implement API call for technician note
    // await ticketsApi().addTechnicianNote(selectedId.value, technicianNote.value)
    showTechnicianNoteModal.value = false
    // feedback
    try { const toast = useToast(); toast.add({ title: 'Technician Note Added', description: 'Note has been added successfully.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e:any) {
    console.error('sendTechnicianNote error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to add technician note'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  } finally {
    technicianNoteSubmitting.value = false
  }
}
```

## Role-Based Access Control

### Visibility Rules
```typescript
{
  label: 'Add Tech Note',
  color: 'bg-orange-600',
  action: () => { actPrepareTechnicianNote(ticket.id) },
  show: isTechnician.value && ticket.status !== 'finished',
  tooltip: 'Add technician note to this ticket'
}
```

### Role Check
- Menggunakan `isTechnician.value` dari composable `useRolePermissions`
- Hanya user dengan role `TECHNICIAN` yang dapat melihat button ini

## UI Components

### Modal Structure
```vue
<!-- Modal Technician Note -->
<div v-if="showTechnicianNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/60" @click="showTechnicianNoteModal = false"></div>
  <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900">Add Technician Note</h2>
      <button class="text-gray-400 hover:text-gray-600" @click="showTechnicianNoteModal = false">✕</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea v-model="technicianNote" placeholder="Enter your technician note..."
          class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
      </div>
    </div>
    <div class="mt-6 flex justify-end gap-2">
      <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
        @click="showTechnicianNoteModal = false">Cancel</button>
      <button class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        @click="sendTechnicianNoteFromModal" :disabled="technicianNoteSubmitting">
        Add Note
      </button>
    </div>
  </div>
</div>
```

## Backend Integration (TODO)

### API Endpoint
```typescript
// Perlu implementasi di backend
await ticketsApi().addTechnicianNote(selectedId.value, technicianNote.value)
```

### Expected API Response
```typescript
interface TechnicianNoteResponse {
  success: boolean
  message: string
  data?: {
    ticket_id: number
    note: string
    technician_id: string
    created_at: string
  }
}
```

## Testing

### Test Cases
1. **Role Access**: Pastikan hanya role Technician yang dapat melihat button
2. **Modal Display**: Pastikan modal muncul saat button diklik
3. **Form Validation**: Pastikan form dapat diisi dan disubmit
4. **Loading State**: Pastikan loading state berfungsi saat submit
5. **Error Handling**: Pastikan error handling berfungsi
6. **Success Feedback**: Pastikan toast notification muncul setelah berhasil

### Manual Testing Steps
1. Login sebagai user dengan role Technician
2. Buka halaman Tickets
3. Verifikasi button "Add Tech Note" muncul di kolom Actions
4. Klik button untuk membuka modal
5. Isi note dan submit
6. Verifikasi feedback dan modal tertutup

## Future Enhancements

### Potential Improvements
1. **Rich Text Editor**: Tambahkan rich text editor untuk formatting
2. **File Attachments**: Tambahkan fitur upload file/gambar
3. **Note History**: Tampilkan history semua technician notes
4. **Template Notes**: Tambahkan template notes yang sering digunakan
5. **Email Notifications**: Kirim email notifikasi saat note ditambahkan

### Backend Requirements
1. **Database Schema**: Tambahkan tabel `technician_notes`
2. **API Endpoints**: Implementasi CRUD untuk technician notes
3. **Validation**: Validasi input dan permissions
4. **Audit Trail**: Log semua perubahan pada notes
