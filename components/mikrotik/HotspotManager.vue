<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Manajemen Hotspot Lokal</h2>
        <p class="text-sm text-slate-500">Akun, sesi aktif, profil, IP Binding, dan isolir perangkat The Dude melalui RouterOS API.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-full px-3 py-1 text-sm" :class="connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
          {{ connectionLabel }}
        </span>
        <button v-if="connected && canConnect" type="button" class="rounded border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50" :disabled="connecting" @click="disconnect">
          {{ connecting ? 'Memproses...' : 'Putuskan API' }}
        </button>
      </div>
    </header>

    <div class="space-y-4 p-5">
      <p class="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Pengelolaan ini menggunakan akun Hotspot lokal router (`/ip hotspot user`), bukan RADIUS.
        Isolir perangkat The Dude memblokir perangkat pada Hotspot; fitur ini bukan firewall umum untuk perangkat di luar Hotspot.
      </p>
      <p v-if="message" class="rounded-lg px-4 py-3 text-sm" :class="hasError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'">
        {{ message }}
      </p>
      <form v-if="!connected && canConnect" class="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-6" @submit.prevent="connect">
        <label class="text-sm">IP/Host Router
          <input v-model.trim="connection.host" required placeholder="IP router" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="text-sm">Port API
          <input v-model.number="connection.port" required type="number" min="1" max="65535" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="text-sm">Username API
          <input v-model.trim="connection.username" required autocomplete="username" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="text-sm">Password API
          <input v-model="connection.password" required type="password" autocomplete="current-password" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="flex items-center gap-2 self-end pb-2 text-sm">
          <input v-model="connection.use_tls" type="checkbox" />
          API-SSL
        </label>
        <button type="submit" class="self-end rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="connecting">
          {{ connecting ? 'Menghubungkan...' : 'Hubungkan RouterOS API' }}
        </button>
      </form>
      <p v-if="!connected && !canConnect" class="rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Minta Admin untuk menghubungkan RouterOS API.
      </p>

      <template v-if="connected">
        <nav class="flex flex-wrap gap-2 border-b pb-3">
          <button
            v-for="item in tabs"
            :key="item.id"
            type="button"
            class="rounded px-4 py-2 text-sm"
            :class="tab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'"
            @click="selectTab(item.id)"
          >
            {{ item.label }}
            <span class="ml-1 rounded-full bg-white/20 px-1.5">
              {{ tabCount(item.id) }}
            </span>
          </button>
        </nav>

        <template v-if="tab === 'users'">
          <form v-if="canManage" class="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="createUser">
            <label class="text-sm">Username
              <input v-model.trim="newUser.name" required maxlength="64" class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label class="text-sm">Password
              <input v-model="newUser.password" required type="password" class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label class="text-sm">Profil
              <select v-model="newUser.profile" class="mt-1 w-full rounded border bg-white px-3 py-2">
                <option value="">Default</option>
                <option v-for="profile in profiles" :key="profile.name" :value="profile.name">{{ profile.name }}</option>
              </select>
            </label>
            <label class="text-sm">Catatan
              <input v-model.trim="newUser.comment" class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <div class="flex items-end">
              <button type="submit" class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="busy">
                {{ busy ? 'Menyimpan...' : 'Tambah akun' }}
              </button>
            </div>
          </form>

          <label class="block max-w-md text-sm text-slate-700">Cari akun
            <input v-model.trim="search" type="search" placeholder="Username, IP, atau catatan" class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div class="overflow-x-auto rounded border border-slate-200">
            <table class="w-full min-w-[850px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-3 py-2 font-medium">Username</th>
                  <th class="px-3 py-2 font-medium">Profil</th>
                  <th class="px-3 py-2 font-medium">IP</th>
                  <th class="px-3 py-2 font-medium">Batas sesi</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id" class="border-t">
                  <td class="px-3 py-3">
                    <p class="font-medium text-slate-900">{{ user.name }}</p>
                    <p v-if="user.comment" class="text-xs text-slate-500">{{ user.comment }}</p>
                  </td>
                  <td class="px-3 py-3">{{ user.profile || 'default' }}</td>
                  <td class="px-3 py-3">{{ user.address || '-' }}</td>
                  <td class="px-3 py-3">{{ user.limit_uptime || '-' }}</td>
                  <td class="px-3 py-3">
                    <span class="rounded-full px-2 py-1 text-xs" :class="user.disabled ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'">
                      {{ user.disabled ? 'Disabled' : 'Aktif' }}
                    </span>
                  </td>
                  <td class="px-3 py-3">
                    <div v-if="canManage" class="flex flex-wrap gap-2">
                      <button type="button" class="rounded border px-2 py-1.5" :disabled="busy" @click="openEdit(user)">Edit</button>
                      <button type="button" class="rounded border px-2 py-1.5" :disabled="busy" @click="toggleUser(user)">
                        {{ user.disabled ? 'Aktifkan' : 'Isolir' }}
                      </button>
                      <button type="button" class="rounded border border-rose-200 px-2 py-1.5 text-rose-700" :disabled="busy" @click="deleteUser(user)">
                        Hapus
                      </button>
                    </div>
                    <span v-else class="text-xs text-slate-500">Hanya lihat</span>
                  </td>
                </tr>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="6" class="px-3 py-8 text-center text-slate-500">Tidak ada akun Hotspot yang cocok.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="tab === 'active'">
          <div class="overflow-x-auto rounded border border-slate-200">
            <table class="w-full min-w-[700px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-3 py-2 font-medium">Username</th>
                  <th class="px-3 py-2 font-medium">IP</th>
                  <th class="px-3 py-2 font-medium">MAC</th>
                  <th class="px-3 py-2 font-medium">Uptime</th>
                  <th class="px-3 py-2 font-medium">Trafik masuk/keluar</th>
                  <th class="px-3 py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="session in sessions" :key="session.id" class="border-t">
                  <td class="px-3 py-3 font-medium">{{ session.user }}</td>
                  <td class="px-3 py-3">{{ session.address || '-' }}</td>
                  <td class="px-3 py-3 font-mono">{{ session.mac || '-' }}</td>
                  <td class="px-3 py-3">{{ session.uptime || '-' }}</td>
                  <td class="px-3 py-3">{{ formatBytes(session.bytes_in) }} / {{ formatBytes(session.bytes_out) }}</td>
                  <td class="px-3 py-3">
                    <button v-if="canManage" type="button" class="rounded border border-rose-200 px-2.5 py-1.5 text-rose-700 disabled:opacity-50" :disabled="busy" @click="kickUser(session)">
                      Putus sesi
                    </button>
                    <span v-else class="text-xs text-slate-500">Hanya lihat</span>
                  </td>
                </tr>
                <tr v-if="sessions.length === 0">
                  <td colspan="6" class="px-3 py-8 text-center text-slate-500">Tidak ada sesi Hotspot aktif.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="tab === 'profiles'">
          <div class="overflow-x-auto rounded border border-slate-200">
            <table class="w-full min-w-[600px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-3 py-2 font-medium">Nama profil</th>
                  <th class="px-3 py-2 font-medium">Rate limit</th>
                  <th class="px-3 py-2 font-medium">Shared users</th>
                  <th class="px-3 py-2 font-medium">Session timeout</th>
                  <th class="px-3 py-2 font-medium">Idle timeout</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="profile in profiles" :key="profile.name" class="border-t">
                  <td class="px-3 py-3 font-medium">{{ profile.name }}</td>
                  <td class="px-3 py-3">{{ profile.rate_limit || '-' }}</td>
                  <td class="px-3 py-3">{{ profile.shared_users || '-' }}</td>
                  <td class="px-3 py-3">{{ profile.session_timeout || '-' }}</td>
                  <td class="px-3 py-3">{{ profile.idle_timeout || '-' }}</td>
                </tr>
                <tr v-if="profiles.length === 0">
                  <td colspan="5" class="px-3 py-8 text-center text-slate-500">Tidak ada profil Hotspot.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="tab === 'bindings'">
          <div class="overflow-x-auto rounded border border-slate-200">
            <table class="w-full min-w-[700px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-3 py-2 font-medium">MAC</th>
                  <th class="px-3 py-2 font-medium">IP</th>
                  <th class="px-3 py-2 font-medium">Tipe</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="binding in bindings" :key="binding.id" class="border-t">
                  <td class="px-3 py-3 font-mono">{{ binding.mac || '-' }}</td>
                  <td class="px-3 py-3">{{ binding.address || '-' }}</td>
                  <td class="px-3 py-3">{{ binding.type || '-' }}</td>
                  <td class="px-3 py-3">{{ binding.disabled ? 'Disabled' : 'Enabled' }}</td>
                  <td class="px-3 py-3">
                    <div v-if="canManage && binding.type !== 'blocked'" class="flex gap-2">
                      <button type="button" class="rounded border px-2 py-1.5 disabled:opacity-50" :disabled="busy || binding.type === 'regular'" @click="setBindingType(binding, 'regular')">Isolir</button>
                      <button type="button" class="rounded border px-2 py-1.5 disabled:opacity-50" :disabled="busy || binding.type === 'bypassed'" @click="setBindingType(binding, 'bypassed')">Pulihkan</button>
                    </div>
                    <span v-else-if="canManage" class="text-xs text-slate-500">Binding blocked dikelola pada tab Perangkat The Dude.</span>
                    <span v-else class="text-xs text-slate-500">Hanya lihat</span>
                  </td>
                </tr>
                <tr v-if="bindings.length === 0">
                  <td colspan="5" class="px-3 py-8 text-center text-slate-500">Tidak ada IP Binding.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <template v-else-if="tab === 'devices'">
          <div class="space-y-3">
            <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 class="font-medium text-slate-900">Impor device dari Network Map</h3>
                <p class="text-sm text-slate-600">Pilih CSV hasil ekspor The Dude. Nama dan IP dari map akan tampil di bawah tanpa membuat akun Hotspot.</p>
              </div>
              <div class="flex flex-wrap items-end gap-3">
                <label class="min-w-64 flex-1 text-sm">File CSV
                  <input type="file" accept=".csv,text/csv" class="mt-1 block w-full rounded border bg-white px-3 py-2" @change="selectDeviceCSV" />
                </label>
                <label class="min-w-64 flex-1 text-sm">Network Map
                  <select v-model="selectedDeviceMap" :disabled="!deviceCSVPreview || importingDeviceCSV" class="mt-1 w-full rounded border bg-white px-3 py-2">
                    <option value="" disabled>Pilih map yang akan diimpor</option>
                    <option v-for="map in deviceCSVPreview?.maps || []" :key="map.name" :value="map.name">
                      {{ map.name }} · {{ map.devices }} IP
                    </option>
                  </select>
                </label>
                <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="!selectedDeviceCSV || !selectedDeviceMap || importingDeviceCSV || previewingDeviceCSV" @click="importDeviceCSV">
                  {{ importingDeviceCSV ? 'Mengimpor...' : 'Impor map' }}
                </button>
              </div>
              <p v-if="previewingDeviceCSV" class="text-sm text-slate-500">Membaca Network Map dari CSV...</p>
              <p v-if="deviceCSVPreview" class="text-sm text-slate-600">
                {{ deviceCSVPreview.rows }} baris · {{ selectedDeviceMapPreview?.devices || 0 }} IP valid pada map terpilih
                <span v-if="selectedDeviceMapPreview?.skipped"> · {{ selectedDeviceMapPreview.skipped }} alamat dilewati</span>
              </p>
              <p v-if="deviceCSVError" class="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ deviceCSVError }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="max-w-3xl text-sm text-slate-600">
                Daftar hanya menampilkan perangkat dari Network Map yang sudah diimpor. Tombol isolir aktif jika IP cocok dengan tepat satu MAC dan satu IP Binding.
                Pemulihan mengembalikan tipe binding sebelumnya.
              </p>
              <p class="w-full text-xs text-slate-500">
                Flag CSV adalah status saat ekspor. Jika flag menunjukkan DOWN, waktu yang ditampilkan adalah waktu pertama kali status itu diimpor/teramati CRM. Status selanjutnya diperbarui melalui ping router (sekitar 60 detik); status langsung dari The Dude memerlukan konfigurasi notifikasi webhook.
              </p>
              <label class="min-w-64 text-sm text-slate-700">
                Filter Network Map
                <select v-model="selectedNetworkMap" :disabled="loadingDude" class="mt-1 w-full rounded border bg-white px-3 py-2 disabled:opacity-50 sm:w-96" @change="() => loadDudeDevices()">
                  <option :value="allNetworkMapsValue">Semua Network Map · {{ allImportedMapDeviceCount }} perangkat</option>
                  <option value="" disabled>Pilih Network Map</option>
                  <option v-for="mapName in availableNetworkMaps" :key="mapName" :value="mapName">
                    {{ mapName }} · {{ dudeDevicesByMap(mapName).length }} perangkat
                  </option>
                </select>
              </label>
              <label class="min-w-40 text-sm text-slate-700">
                Filter Status
                <select v-model="selectedDeviceStatus" class="mt-1 w-full rounded border bg-white px-3 py-2">
                  <option value="all">Semua status</option>
                  <option value="up">UP</option>
                  <option value="down">DOWN (termasuk partially down)</option>
                </select>
              </label>
              <button type="button" class="rounded border px-3 py-2 text-sm disabled:opacity-50" :disabled="loadingDude" @click="() => loadDudeDevices()">
                {{ loadingDude ? 'Memuat perangkat...' : 'Muat ulang perangkat' }}
              </button>
            </div>
            <p v-if="dudeDeviceError" class="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ dudeDeviceError }}</p>
            <div class="overflow-x-auto rounded border border-slate-200">
              <table class="w-full min-w-[900px] text-left text-sm">
                <thead class="bg-slate-50 text-slate-600">
                  <tr>
                    <th class="px-3 py-2 font-medium">Perangkat</th>
                    <th class="px-3 py-2 font-medium">IP</th>
                    <th class="px-3 py-2 font-medium">Network Map</th>
                    <th class="px-3 py-2 font-medium">Status / Flag</th>
                    <th class="px-3 py-2 font-medium">Terakhir down</th>
                    <th class="px-3 py-2 font-medium">MAC terdeteksi</th>
                    <th class="px-3 py-2 font-medium">Status binding</th>
                    <th class="px-3 py-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(device, index) in visibleDudeDevices" :key="device['.id'] || `${device.name}-${device.address}-${index}`" class="border-t">
                    <td class="px-3 py-3">
                      <p class="font-medium">{{ device.name || device['.id'] || '(tanpa nama)' }}</p>
                      <p v-if="device.comment" class="text-xs text-slate-500">{{ device.comment }}</p>
                    </td>
                    <td class="px-3 py-3 font-mono">{{ deviceAddress(device) || '-' }}</td>
                    <td class="px-3 py-3">{{ device.map_name || '-' }}</td>
                    <td class="px-3 py-3">
                      <span class="rounded-full px-2 py-1 text-xs font-medium" :class="dudeStatusClass(device.status)">
                        {{ dudeStatusLabel(device.status) }}
                      </span>
                      <p v-if="device.last_seen" class="mt-1 text-xs text-slate-500">{{ formatLastSeen(device.last_seen) }}</p>
                    </td>
                    <td class="whitespace-nowrap px-3 py-3 text-slate-600">{{ formatLastDown(device.last_down_at) }}</td>
                    <td class="px-3 py-3 font-mono">{{ deviceResolution(device)?.mac || '-' }}</td>
                    <td class="px-3 py-3">
                      <span v-if="deviceResolution(device)?.binding_id" class="rounded-full px-2 py-1 text-xs" :class="deviceResolution(device)?.binding_type === 'blocked' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'">
                        {{ deviceResolution(device)?.binding_type || 'unknown' }}{{ deviceResolution(device)?.binding_disabled ? ' · disabled' : '' }}
                      </span>
                      <span v-else class="text-xs text-amber-700">{{ deviceResolution(device)?.reason || 'Belum dipetakan' }}</span>
                    </td>
                    <td class="px-3 py-3">
                      <button
                        v-if="canManage"
                        type="button"
                        class="rounded border px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        :class="deviceResolution(device)?.binding_type === 'blocked' ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'"
                        :disabled="!deviceResolution(device)?.can_manage || busyDeviceAddress === deviceAddress(device)"
                        @click="toggleDeviceIsolation(device)"
                      >
                        {{ busyDeviceAddress === deviceAddress(device) ? 'Memproses...' : deviceResolution(device)?.binding_type === 'blocked' ? 'Pulihkan' : 'Isolir perangkat' }}
                      </button>
                      <span v-else class="text-xs text-slate-500">Hanya lihat</span>
                      <p v-if="deviceResolution(device)?.reason" class="mt-1 max-w-xs text-xs text-amber-700">{{ deviceResolution(device)?.reason }}</p>
                    </td>
                  </tr>
                  <tr v-if="!loadingDude && visibleDudeDevices.length === 0">
                    <td colspan="8" class="px-3 py-8 text-center text-slate-500">
                      {{ filteredDudeDevices.length > 0 ? `Tidak ada perangkat dengan status ${selectedDeviceStatus === 'up' ? 'UP' : 'DOWN'} pada filter ini.` : selectedNetworkMap === allNetworkMapsValue ? 'Belum ada perangkat dari Network Map yang diimpor.' : selectedNetworkMap ? `Belum ada perangkat pada map ${selectedNetworkMap}.` : 'Belum ada map yang diimpor. Pilih CSV Network Map di atas.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else-if="tab === 'down-history'">
          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-slate-900">Riwayat Perangkat Down</h3>
              <p class="text-sm text-slate-500">Perangkat dengan waktu down terakhir, diurutkan dari kejadian terbaru.</p>
            </div>
            <p v-if="dudeDeviceError" class="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ dudeDeviceError }}</p>
            <div class="overflow-x-auto rounded border border-slate-200">
              <table class="w-full min-w-[700px] text-left text-sm">
                <thead class="bg-slate-50 text-slate-600">
                  <tr>
                    <th class="px-3 py-2 font-medium">Perangkat</th>
                    <th class="px-3 py-2 font-medium">IP</th>
                    <th class="px-3 py-2 font-medium">Network Map</th>
                    <th class="px-3 py-2 font-medium">Status sekarang</th>
                    <th class="px-3 py-2 font-medium">Terakhir down</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="device in downHistoryDevices" :key="device.id" class="border-t">
                    <td class="px-3 py-3 font-medium">{{ device.device_name || '(tanpa nama)' }}</td>
                    <td class="px-3 py-3 font-mono">{{ device.ip_address }}</td>
                    <td class="px-3 py-3">{{ device.map_name || '-' }}</td>
                    <td class="px-3 py-3">
                      <span class="rounded-full px-2 py-1 text-xs font-medium" :class="dudeStatusClass(device.status)">
                        {{ dudeStatusLabel(device.status) }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-3 text-slate-600">{{ formatLastDown(device.last_down_at) }}</td>
                  </tr>
                  <tr v-if="!loadingDude && downHistoryDevices.length === 0">
                    <td colspan="5" class="px-3 py-8 text-center text-slate-500">
                      Belum ada perangkat down yang tercatat. Muat ulang data setelah status perangkat diperiksa.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>
    </div>

    <div v-if="editingUser" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" @click.self="editingUser = null">
      <form class="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl" @submit.prevent="saveUser">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Edit akun {{ editingUser.name }}</h3>
          <button type="button" class="text-slate-500" @click="editingUser = null">Tutup</button>
        </div>
        <label class="block text-sm">Password baru (opsional)
          <input v-model="editForm.password" type="password" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">Profil
          <select v-model="editForm.profile" class="mt-1 w-full rounded border bg-white px-3 py-2">
            <option value="">Default</option>
            <option v-for="profile in profiles" :key="profile.name" :value="profile.name">{{ profile.name }}</option>
          </select>
        </label>
        <label class="block text-sm">IP address
          <input v-model="editForm.address" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">Limit uptime
          <input v-model="editForm.limit_uptime" placeholder="contoh: 1d" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">Catatan
          <input v-model="editForm.comment" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="rounded border px-4 py-2" @click="editingUser = null">Batal</button>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" :disabled="busy">Simpan</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { mikrotikAdminApi } from '@/api/admin/mikrotik'
import {
  dudeDeviceAdminApi,
  type DudeCSVPreview,
  type DudeDevice as ImportedDudeDevice,
} from '@/api/admin/dude-device'
import { useNetworkSocket } from '@/composables/useNetworkSocket'
import { useAuthStore } from '@/stores/auth'

type Tab = 'users' | 'active' | 'profiles' | 'bindings' | 'devices' | 'down-history'
type HotspotUser = {
  id: string; name: string; profile: string; address: string; limit_uptime: string; comment: string; disabled: boolean
}
type HotspotProfile = {
  name: string; rate_limit: string; shared_users: string; session_timeout: string; idle_timeout: string
}
type HotspotSession = {
  id: string; user: string; address: string; mac: string; uptime: string; bytes_in: string; bytes_out: string
}
type HotspotBinding = { id: string; mac: string; address: string; type: string; disabled: boolean }
type DudeDevice = Record<string, string | undefined>
const allNetworkMapsValue = '__all_network_maps__'
type DeviceStatusFilter = 'all' | 'up' | 'down'
type DudeDeviceBinding = {
  address: string
  mac: string
  binding_id: string
  binding_type: string
  binding_disabled: boolean
  can_manage: boolean
  can_restore: boolean
  reason?: string
}

const api = mikrotikAdminApi()
const routerApi = api.routerOS
const dudeDeviceApi = dudeDeviceAdminApi()
const runtimeConfig = useRuntimeConfig()
const statusSocket = useNetworkSocket(runtimeConfig.public.NETWORK_WS_URL as string)
const authStore = useAuthStore()
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'users', label: 'Akun Hotspot' },
  { id: 'active', label: 'Sesi aktif' },
  { id: 'profiles', label: 'Profil' },
  { id: 'bindings', label: 'IP Binding' },
  { id: 'devices', label: 'Perangkat The Dude' },
  { id: 'down-history', label: 'Riwayat Down' },
]
const tab = ref<Tab>('users')
const connected = ref(false)
const routerHost = ref('')
const connecting = ref(false)
const canConnect = computed(() => ['SUPERADMIN', 'ADMIN'].includes(String(authStore.user.role).toUpperCase()))
const connection = reactive({
  host: '103.148.18.248',
  port: 8783,
  username: '',
  password: '',
  use_tls: false,
})
const connectionLabel = computed(() => {
  if (connected.value) return `API terhubung${routerHost.value ? ` · ${routerHost.value}` : ''}`
  if (connecting.value) return 'Sedang menghubungkan API...'
  return 'API belum terhubung'
})
const loading = ref(false)
const busy = ref(false)
const users = ref<HotspotUser[]>([])
const sessions = ref<HotspotSession[]>([])
const profiles = ref<HotspotProfile[]>([])
const bindings = ref<HotspotBinding[]>([])
const dudeDevices = ref<DudeDevice[]>([])
const deviceBindingsByAddress = ref(new Map<string, DudeDeviceBinding>())
const loadingDude = ref(false)
const dudeDeviceError = ref('')
const busyDeviceAddress = ref('')
const selectedDeviceCSV = ref<File | null>(null)
const selectedDeviceMap = ref('')
const selectedNetworkMap = ref(allNetworkMapsValue)
const selectedDeviceStatus = ref<DeviceStatusFilter>('all')
const deviceCSVPreview = ref<DudeCSVPreview | null>(null)
const previewingDeviceCSV = ref(false)
const importingDeviceCSV = ref(false)
const deviceCSVError = ref('')
const selectedDeviceMapPreview = computed(() => deviceCSVPreview.value?.maps.find((map) => map.name === selectedDeviceMap.value))
const availableNetworkMaps = computed(() => [...new Set(
  dudeDevices.value.map((device) => device.map_name?.trim()).filter((mapName): mapName is string => Boolean(mapName)),
)].sort((left, right) => left.localeCompare(right)))
const allImportedMapDeviceCount = computed(() => dudeDevices.value.filter((device) => Boolean(device.map_name?.trim())).length)
const filteredDudeDevices = computed(() => dudeDevicesByMap(selectedNetworkMap.value))
const visibleDudeDevices = computed(() => filteredDudeDevices.value.filter((device) => {
  const status = dudeStatusLabel(device.status)
  if (selectedDeviceStatus.value === 'up') return status === 'UP'
  if (selectedDeviceStatus.value === 'down') return status === 'DOWN' || status === 'PARTIALLY DOWN'
  return true
}))
const downHistoryDevices = computed(() => dudeDevices.value
  .filter((device) => ['DOWN', 'PARTIALLY DOWN'].includes(dudeStatusLabel(device.status)) &&
    Boolean(device.last_down_at) &&
    !Number.isNaN(Date.parse(device.last_down_at || '')))
  .sort((left, right) => Date.parse(right.last_down_at || '') - Date.parse(left.last_down_at || '')))
let deviceStatusPollTimer: ReturnType<typeof setInterval> | undefined
const search = ref('')
const message = ref('')
const hasError = ref(false)
const editingUser = ref<HotspotUser | null>(null)
const newUser = reactive({ name: '', password: '', profile: '', comment: '' })
const editForm = reactive({ password: '', profile: '', address: '', limit_uptime: '', comment: '' })
const canManage = computed(() => ['SUPERADMIN', 'ADMIN', 'FINANCE'].includes(String(authStore.user.role).toUpperCase()))
function tabCount(id: Tab): number {
  switch (id) {
    case 'users': return users.value.length
    case 'active': return sessions.value.length
    case 'profiles': return profiles.value.length
    case 'bindings': return bindings.value.length
    case 'devices': return visibleDudeDevices.value.length
    case 'down-history': return downHistoryDevices.value.length
  }
}
const filteredUsers = computed(() => {
  const query = search.value.toLowerCase()
  if (!query) return users.value
  return users.value.filter((user) =>
    [user.name, user.profile, user.address, user.comment].some((value) => value?.toLowerCase().includes(query)),
  )
})

function unwrapData<T>(result: unknown, label: string): T {
  const data = (result as { data?: T })?.data
  if (data === undefined) throw new Error(`Respons ${label} dari backend tidak valid`)
  return data
}

function showMessage(text: string, error = false) {
  message.value = text
  hasError.value = error
}

async function loadStatus() {
  try {
    const status = unwrapData<{ status: string; host?: string }>(await routerApi.getStatus(), 'status API')
    connected.value = status.status === 'connected'
    routerHost.value = status.host || ''
    if (connected.value) await refresh()
  } catch (error) {
    connected.value = false
    showMessage(error instanceof Error ? error.message : 'Gagal memeriksa koneksi RouterOS API.', true)
  }
}

async function connect() {
  connecting.value = true
  try {
    await routerApi.connect({ ...connection })
    connected.value = true
    routerHost.value = connection.host
    connection.password = ''
    await refresh()
    showMessage('RouterOS API berhasil terhubung.')
  } catch (error) {
    connected.value = false
    showMessage(error instanceof Error ? error.message : 'Gagal menghubungkan RouterOS API.', true)
  } finally {
    connecting.value = false
  }
}

async function disconnect() {
  connecting.value = true
  try {
    await routerApi.disconnect()
    if (deviceStatusPollTimer) {
      clearInterval(deviceStatusPollTimer)
      deviceStatusPollTimer = undefined
    }
    connected.value = false
    routerHost.value = ''
    users.value = []
    profiles.value = []
    sessions.value = []
    bindings.value = []
    dudeDevices.value = []
    deviceBindingsByAddress.value = new Map()
    showMessage('Koneksi RouterOS API diputus.')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal memutus RouterOS API.', true)
  } finally {
    connecting.value = false
  }
}

async function refresh() {
  if (!connected.value) return
  loading.value = true
  try {
    const [userResult, profileResult, sessionResult, bindingResult] = await Promise.all([
      routerApi.listHotspotUsers(),
      routerApi.listHotspotProfiles(),
      routerApi.listHotspotActiveSessions(),
      api.getHotspotIPBindings(),
    ])
    users.value = unwrapData<{ items: HotspotUser[] }>(userResult, 'akun Hotspot').items
    profiles.value = unwrapData<{ items: HotspotProfile[] }>(profileResult, 'profil Hotspot').items
    sessions.value = unwrapData<{ items: HotspotSession[] }>(sessionResult, 'sesi Hotspot').items
    bindings.value = unwrapData<HotspotBinding[]>(bindingResult, 'IP Binding')
    showMessage(`Data dimuat: ${users.value.length} akun, ${sessions.value.length} sesi aktif, ${bindings.value.length} IP Binding.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal memuat data Hotspot.', true)
  } finally {
    loading.value = false
  }
}

async function selectTab(value: Tab) {
  tab.value = value
  if (deviceStatusPollTimer) {
    clearInterval(deviceStatusPollTimer)
    deviceStatusPollTimer = undefined
  }
  if (!connected.value) return
  if (value === 'devices' || value === 'down-history') {
    await loadDudeDevices(value === 'devices')
    deviceStatusPollTimer = setInterval(() => {
      void refreshDeviceStatuses()
    }, 60_000)
    return
  }
  await refresh()
}

function deviceAddress(device: DudeDevice): string {
  const rawAddress = (device.address || device.host || device['ip-address'] || '').split('/')[0].trim()
  const octets = rawAddress.split('.')
  if (octets.length !== 4 || octets.some((octet) => !/^\d{1,3}$/.test(octet) || Number(octet) > 255)) return ''
  return octets.map((octet) => String(Number(octet))).join('.')
}

function deviceResolution(device: DudeDevice): DudeDeviceBinding | undefined {
  const address = deviceAddress(device)
  return address ? deviceBindingsByAddress.value.get(address) : undefined
}

function dudeDevicesByMap(mapName: string): DudeDevice[] {
  if (mapName === allNetworkMapsValue) {
    return dudeDevices.value.filter((device) => Boolean(device.map_name?.trim()))
  }
  if (!mapName) return []
  return dudeDevices.value.filter((device) => device.map_name === mapName)
}

function dudeStatusLabel(status: string | undefined): string {
  switch ((status || '').toLowerCase()) {
    case 'up':
    case 'online':
    case 'ok':
      return 'UP'
    case 'down':
    case 'offline':
      return 'DOWN'
    case 'partially down':
    case 'partial down':
      return 'PARTIALLY DOWN'
    default:
      return 'UNKNOWN'
  }
}

function dudeStatusClass(status: string | undefined): string {
  switch (dudeStatusLabel(status)) {
    case 'UP':
      return 'bg-emerald-50 text-emerald-700'
    case 'DOWN':
      return 'bg-rose-50 text-rose-700'
    case 'PARTIALLY DOWN':
      return 'bg-orange-50 text-orange-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function formatLastSeen(value: string): string {
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? '' : `Diperbarui ${timestamp.toLocaleString()}`
}

function formatLastDown(value: string | null | undefined): string {
  if (!value) return '-'
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? '-' : timestamp.toLocaleString()
}

async function loadDudeDevices(resolveBindings = true) {
  if (!connected.value) return
  loadingDude.value = true
  dudeDeviceError.value = ''
  deviceBindingsByAddress.value = new Map()
  try {
    const importedDevices = unwrapData<ImportedDudeDevice[]>(await dudeDeviceApi.getAll(), 'perangkat Network Map')
    dudeDevices.value = importedDevices.map((device) => ({
      id: device.id,
      device_name: device.device_name,
      ip_address: device.ip_address,
      '.id': `import:${device.id}`,
      name: device.device_name,
      address: device.ip_address,
      map_name: device.map_name,
      status: device.status,
      last_seen: device.last_seen,
      last_down_at: device.last_down_at || undefined,
    }))
    if (selectedNetworkMap.value !== allNetworkMapsValue && !availableNetworkMaps.value.includes(selectedNetworkMap.value)) {
      selectedNetworkMap.value = allNetworkMapsValue
    }

    if (!resolveBindings) {
      deviceBindingsByAddress.value = new Map()
      return
    }

    const addresses = [...new Set(filteredDudeDevices.value.map(deviceAddress).filter(Boolean))]
    if (addresses.length === 0) {
      deviceBindingsByAddress.value = new Map()
      return
    }
    const resolutions: DudeDeviceBinding[] = []
    for (let start = 0; start < addresses.length; start += 200) {
      const batch = addresses.slice(start, start + 200)
      const resolutionResult = unwrapData<{ items: DudeDeviceBinding[] }>(
        await routerApi.resolveHotspotDeviceBindings(batch),
        'pemetaan IP dan MAC perangkat',
      )
      resolutions.push(...(resolutionResult.items || []))
    }
    deviceBindingsByAddress.value = new Map(resolutions.map((item) => [item.address, item]))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Gagal memuat perangkat Network Map.'
    if (dudeDevices.value.length > 0) {
      dudeDeviceError.value = `Data Network Map tampil, tetapi pencocokan MAC gagal. Periksa koneksi RouterOS API serta policy read untuk DHCP, ARP, dan Hotspot. ${detail}`
    } else {
      dudeDeviceError.value = detail
    }
  } finally {
    loadingDude.value = false
  }
}

async function refreshDeviceStatuses() {
  if (!connected.value || !['devices', 'down-history'].includes(tab.value)) return
  try {
    const importedDevices = unwrapData<ImportedDudeDevice[]>(await dudeDeviceApi.getAll(), 'status perangkat')
    const statusByAddress = new Map(importedDevices.map((device) => [device.ip_address, device]))
    dudeDevices.value = dudeDevices.value.map((device) => {
      const imported = statusByAddress.get(deviceAddress(device))
      return imported
        ? {
            ...device,
            status: imported.status,
            last_seen: imported.last_seen,
            last_down_at: imported.last_down_at || undefined,
            map_name: imported.map_name,
          }
        : device
    })
  } catch (error) {
    dudeDeviceError.value = error instanceof Error ? `Gagal memperbarui status: ${error.message}` : 'Gagal memperbarui status perangkat.'
  }
}

async function selectDeviceCSV(event: Event) {
  const input = event.target as HTMLInputElement
  selectedDeviceCSV.value = input.files?.[0] || null
  selectedDeviceMap.value = ''
  deviceCSVPreview.value = null
  deviceCSVError.value = ''
  if (!selectedDeviceCSV.value) return

  previewingDeviceCSV.value = true
  try {
    const response = await dudeDeviceApi.previewCSV(selectedDeviceCSV.value)
    deviceCSVPreview.value = unwrapData<DudeCSVPreview>(response, 'preview CSV')
    if (deviceCSVPreview.value.maps.length === 1) selectedDeviceMap.value = deviceCSVPreview.value.maps[0].name
    if (deviceCSVPreview.value.maps.length === 0) deviceCSVError.value = 'CSV tidak memiliki map dengan alamat IP valid.'
  } catch (error) {
    deviceCSVError.value = error instanceof Error ? error.message : 'Gagal membaca CSV.'
  } finally {
    previewingDeviceCSV.value = false
  }
}

async function importDeviceCSV() {
  if (!selectedDeviceCSV.value || !selectedDeviceMap.value) return
  importingDeviceCSV.value = true
  deviceCSVError.value = ''
  try {
    const response = await dudeDeviceApi.importCSV(selectedDeviceCSV.value, selectedDeviceMap.value)
    const result = unwrapData<{ created: number; updated: number; total: number; skipped: number; map_name: string }>(
      response,
      'hasil impor',
    )
    selectedNetworkMap.value = result.map_name
    await loadDudeDevices()
    showMessage(
      `${result.total} IP dari map ${result.map_name} diimpor (${result.created} baru, ${result.updated} diperbarui, ${result.skipped} alamat dilewati).`,
    )
  } catch (error) {
    deviceCSVError.value = error instanceof Error ? error.message : 'Gagal mengimpor CSV.'
  } finally {
    importingDeviceCSV.value = false
  }
}

async function toggleDeviceIsolation(device: DudeDevice) {
  const address = deviceAddress(device)
  const resolution = deviceResolution(device)
  if (!address || !resolution?.can_manage || !canManage.value) return
  const restoring = resolution.binding_type === 'blocked'
  const name = device.name || address
  const prompt = restoring
    ? `Pulihkan ${name} (${address}, ${resolution.mac}) ke tipe IP Binding sebelumnya?`
    : `Blokir ${name} (${address}, ${resolution.mac}) pada Hotspot? Perangkat akan kehilangan akses melalui Hotspot.`
  if (!window.confirm(prompt)) return
  busyDeviceAddress.value = address
  try {
    await routerApi.setHotspotDeviceBindingType(address, restoring ? 'restore' : 'blocked')
    await loadDudeDevices()
    showMessage(`${name} ${restoring ? 'dipulihkan' : 'diisolir'} pada Hotspot.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal mengubah isolir perangkat.', true)
  } finally {
    busyDeviceAddress.value = ''
  }
}

async function createUser() {
  if (!canManage.value) return
  busy.value = true
  try {
    await routerApi.createHotspotUser({ ...newUser })
    newUser.name = ''
    newUser.password = ''
    newUser.profile = ''
    newUser.comment = ''
    await refresh()
    showMessage('Akun Hotspot berhasil dibuat di router.')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal membuat akun Hotspot.', true)
  } finally {
    busy.value = false
  }
}

function openEdit(user: HotspotUser) {
  editingUser.value = user
  editForm.password = ''
  editForm.profile = user.profile
  editForm.address = user.address
  editForm.limit_uptime = user.limit_uptime
  editForm.comment = user.comment
}

async function saveUser() {
  if (!editingUser.value || !canManage.value) return
  busy.value = true
  try {
    const input: {
      password?: string
      profile: string
      address: string
      limit_uptime: string
      comment: string
    } = {
      profile: editForm.profile,
      address: editForm.address,
      limit_uptime: editForm.limit_uptime,
      comment: editForm.comment,
    }
    if (editForm.password) input.password = editForm.password
    await routerApi.updateHotspotUser(editingUser.value.name, input)
    editingUser.value = null
    await refresh()
    showMessage('Akun Hotspot berhasil diperbarui.')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal memperbarui akun Hotspot.', true)
  } finally {
    busy.value = false
  }
}

async function toggleUser(user: HotspotUser) {
  const action = user.disabled ? 'mengaktifkan' : 'mengisolir'
  if (!window.confirm(`Yakin ${action} akun ${user.name}? Perubahan langsung diterapkan pada router.`)) return
  busy.value = true
  try {
    await routerApi.updateHotspotUser(user.name, { disabled: !user.disabled })
    await refresh()
    showMessage(`Akun ${user.name} ${user.disabled ? 'diaktifkan' : 'diisolir'}.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal mengubah status akun.', true)
  } finally {
    busy.value = false
  }
}

async function deleteUser(user: HotspotUser) {
  if (!window.confirm(`Hapus akun ${user.name} dari router? Tindakan ini tidak dapat dibatalkan.`)) return
  busy.value = true
  try {
    await routerApi.deleteHotspotUser(user.name)
    await refresh()
    showMessage(`Akun ${user.name} dihapus.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal menghapus akun Hotspot.', true)
  } finally {
    busy.value = false
  }
}

async function kickUser(session: HotspotSession) {
  if (!window.confirm(`Putus sesi Hotspot ${session.user} di ${session.address || 'perangkat ini'}?`)) return
  busy.value = true
  try {
    const result = unwrapData<{ sessions_kicked: number }>(await routerApi.kickHotspotUser(session.user), 'putus sesi')
    await refresh()
    showMessage(`${result.sessions_kicked} sesi ${session.user} diputus.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal memutus sesi.', true)
  } finally {
    busy.value = false
  }
}

async function setBindingType(binding: HotspotBinding, type: 'regular' | 'bypassed') {
  const action = type === 'regular' ? 'mengisolir' : 'memulihkan akses'
  if (!window.confirm(`Yakin ${action} perangkat ${binding.mac}?`)) return
  busy.value = true
  try {
    await api.setHotspotIPBindingType(binding.mac, type)
    await refresh()
    showMessage(`IP Binding ${binding.mac} diperbarui ke ${type}.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Gagal mengubah IP Binding.', true)
  } finally {
    busy.value = false
  }
}

function formatBytes(value: string) {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size.toFixed(1)} ${units[unit]}`
}

watch(statusSocket.latestUpdate, (update) => {
  if (!update) return
  const updatedAt = new Date().toISOString()
  dudeDevices.value = dudeDevices.value.map((device) => (
    deviceAddress(device) === update.ip_address
      ? {
          ...device,
          name: update.device_name || device.name,
          status: update.status,
          last_seen: updatedAt,
          last_down_at: ['up', 'online', 'ok'].includes(update.status.toLowerCase())
            ? undefined
            : ['down', 'offline'].includes(update.status.toLowerCase()) &&
                !['down', 'offline'].includes((device.status || '').toLowerCase())
              ? updatedAt
              : device.last_down_at,
        }
      : device
  ))
})

onMounted(() => {
  void loadStatus()
  statusSocket.connect()
})

onUnmounted(() => {
  if (deviceStatusPollTimer) clearInterval(deviceStatusPollTimer)
})
</script>
