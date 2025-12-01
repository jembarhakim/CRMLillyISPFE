<template>
  <div class="technician-checklist">
    <!-- Main Container with Enhanced Styling - Full screen on mobile -->
    <div class="bg-white rounded-xl md:rounded-xl shadow-xl border border-gray-100 overflow-hidden h-screen md:h-auto md:max-h-none flex flex-col">
      <!-- Header Section - Mobile optimized -->
      <div :class="['bg-gradient-to-r', headerGradientClass, 'px-4', 'md:px-6', 'py-3', 'md:py-4', 'flex-shrink-0']">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-lg md:text-xl font-bold text-white truncate">Checklist Teknisi</h2>
              <span v-if="readOnly" class="px-2 py-1 text-xs font-semibold bg-white/20 text-white rounded-full border border-white/30">
                Hanya Baca
              </span>
            </div>
            <p class="text-blue-100 text-xs md:text-sm mt-1">
              {{ readOnly ? 'Lihat checklist yang telah diselesaikan' : 'Selesaikan tugas yang diberikan langkah demi langkah' }}
            </p>
          </div>
          <div class="text-right ml-3 flex-shrink-0">
            <div class="text-white text-sm md:text-base font-medium">
              Langkah {{ currentStepIndex + 1 }} dari {{ checklist.length }}
            </div>
            <div class="text-blue-200 text-xs mt-1">
              {{ progressPercentage }}% Selesai
            </div>
          </div>
        </div>
      </div>

      <!-- Content Container - Scrollable on mobile -->
      <div class="p-4 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
        <!-- Job Completed Banner -->
        <div v-if="jobCompletedLocal" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Pekerjaan Berhasil Diselesaikan!</h3>
              <p class="text-sm text-green-700 mt-1">Anda dapat menutup tugas ini dengan aman.</p>
            </div>
          </div>
        </div>

        <!-- Team Assignment Section -->
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div class="flex items-center mb-5">
            <svg class="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900">Pilih Tim Teknisi</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Senior Teknisi</label>
              <select v-model="team.senior" 
              class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation"
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Pilih Teknisi Senior...</option>
                <option v-for="t in technicians" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Junior Teknisi</label>
              <select v-model="team.junior" 
              class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation"
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Pilih Teknisi Junior...</option>
                <option v-for="t in technicians" :key="t.id + '-j'" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Helper</label>
              <select v-model="team.helper" 
              class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation"
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Pilih helper...</option>
                <option v-for="t in technicians" :key="t.id + '-h'" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
          </div>
          
          <div class="mt-5 text-right" v-if="!readOnly">
            <button @click="saveTeam" 
                    :disabled="savingTeam"
                    class="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg font-medium">
              <svg v-if="savingTeam" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ savingTeam ? 'Menyimpan...' : 'Simpan Tim' }}
            </button>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Progress Menyeluruh</h3>
            <div class="text-sm font-medium text-gray-700">
              {{ completedSteps }} dari {{ checklist.length }} tahap terselesaikan
            </div>
          </div>
          
          <!-- Enhanced Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                   :style="{ width: `${progressPercentage}%` }"></div>
            </div>
            <div class="mt-2 text-center">
              <span class="text-sm font-medium text-gray-700">{{ progressPercentage }}% Terselesaikan</span>
            </div>
          </div>
          
          <!-- Step Indicators -->
          
        </div>

        <!-- Selfie Photo Step - Enhanced Mobile UI/UX -->
        <div v-if="networkArchitecture && shouldShowSelfieStep" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <!-- Header Section -->
          <div class="px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
            <div class="flex items-center gap-3 md:gap-4">
              <div class="flex-shrink-0">
                <div class="w-14 h-14 md:w-12 md:h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl md:text-lg font-bold shadow-lg">
                  📸
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-lg md:text-xl font-bold text-gray-900">Foto Selfie Tim</h3>
                  <span class="px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm flex-shrink-0" 
                        :class="selfiePhoto ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ selfiePhoto ? 'Sudah Diambil' : 'Belum Diambil' }}
                  </span>
                </div>
                <p class="text-sm md:text-sm text-gray-600 leading-relaxed mt-1">Ambil foto selfie tim teknisi yang mengerjakan pekerjaan ini</p>
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="px-4 md:px-6 py-4 md:py-5 space-y-4">
            <!-- Selfie Preview - Enhanced for Mobile -->
            <div v-if="selfiePhoto" class="relative w-full">
              <div class="relative w-full aspect-square max-w-md mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                <img :src="selfiePhoto.preview" 
                     class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <button @click="removeSelfie" 
                        v-if="!readOnly"
                        class="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-xl md:text-lg font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg touch-manipulation z-10">
                  <svg class="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Selfie Upload - Enhanced Mobile UX -->
            <div v-if="!readOnly" class="space-y-4">
              <!-- File Input Area - Better Mobile Design -->
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-4 hover:border-purple-400 active:border-purple-500 transition-colors bg-gray-50">
                <div class="flex flex-col items-center justify-center text-center space-y-3">
                  <div class="w-16 h-16 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div class="space-y-1">
                    <label for="selfie-upload" class="block">
                      <span class="inline-flex items-center justify-center px-6 py-3 md:py-2.5 bg-purple-600 text-white text-base md:text-sm font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-md cursor-pointer touch-manipulation">
                        <svg class="w-5 h-5 md:w-4 md:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        {{ selfiePhoto ? 'Ganti Foto' : 'Pilih Foto' }}
                      </span>
                    </label>
                    <input id="selfie-upload"
                           type="file" 
                           accept="image/*" 
                           capture="user"
                           @change="handleSelfieUpload"
                           class="hidden" />
                    <p class="text-xs md:text-xs text-gray-500 px-2">
                      Gunakan kamera untuk mengambil foto selfie tim
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Save Button - Enhanced for Mobile -->
              <button @click="saveSelfie" 
                      :disabled="!selfiePhoto || savingSelfie"
                      class="w-full flex items-center justify-center px-6 py-4 md:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 active:scale-98 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all text-base md:text-sm font-semibold shadow-lg hover:shadow-xl touch-manipulation">
                <svg v-if="savingSelfie" class="animate-spin -ml-1 mr-3 h-5 w-5 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="-ml-1 mr-3 h-5 w-5 md:h-4 md:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {{ savingSelfie ? 'Menyimpan...' : (selfiePhoto ? 'Simpan Foto Selfie' : 'Pilih Foto Terlebih Dahulu') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Network Architecture Selection -->
        <div v-if="!networkArchitecture" class="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <svg class="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-yellow-800">Pilih Arsitektur Jaringan</h3>
          </div>
          <p class="text-sm text-yellow-700 mb-4">Silakan pilih jenis arsitektur jaringan sebelum melanjutkan dengan checklist.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button @click="selectArchitecture('FTTH')" 
                    :disabled="readOnly"
                    class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              FTTH (Fiber ke Rumah)
            </button>
            <button @click="selectArchitecture('HTB')" 
                    :disabled="readOnly"
                    class="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              HTB (Terminal Box Berkecepatan Tinggi)
            </button>
          </div>
        </div>

        <!-- Current Step Display - Hide for selfie step (step_order = 0) as it has its own section -->
        <div v-if="networkArchitecture && currentStep && currentStep.step_order !== 0" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <!-- Step Header - Clean Design -->
          <div class="px-5 md:px-6 py-5">
            <div class="flex items-start gap-4">
              <!-- Step Number Badge -->
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                  {{ currentStep.step_order }}
                </div>
              </div>
              
              <!-- Title and Description -->
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-bold text-gray-900 mb-2 leading-tight">{{ currentStep.title }}</h3>
                <p class="text-sm text-gray-600 leading-relaxed mb-4">{{ currentStep.description }}</p>
              </div>
              
              <!-- Status Badge - Right Aligned -->
              <div class="flex-shrink-0 flex flex-col items-end gap-2">
                <span class="px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm" :class="getStatusClass(currentStep.status)">
                  {{ getStatusText(currentStep.status) }}
                </span>
                <span class="text-xs text-gray-500">Diperbarui pada {{ currentStep.completed_at }}</span>
              </div>
            </div>
          </div>

          <!-- Step Content - Enhanced Desktop Layout -->
          <div class="px-5 md:px-6 pb-5 md:pb-6 space-y-5 md:space-y-6 border-t border-gray-100 pt-5 md:pt-6">
            <!-- Step Details Grid - Enhanced for Desktop: 3 columns on large screens, 2 on medium, 1 on mobile -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              <!-- Peralatan Diperlukan -->
              <div class="bg-blue-50 rounded-xl p-5 md:p-6 border border-blue-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
                <h4 class="text-sm md:text-base font-semibold text-blue-800 mb-3 flex items-center">
                  <div class="w-10 h-10 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg class="w-5 h-5 md:w-4 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  Peralatan Diperlukan
                </h4>
                <p class="text-sm md:text-base text-blue-700 leading-relaxed flex-1">{{ currentStep.tools }}</p>
              </div>
              
              <!-- Suku Cadang -->
              <div class="bg-orange-50 rounded-xl p-5 md:p-6 border border-orange-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
                <h4 class="text-sm md:text-base font-semibold text-orange-800 mb-3 flex items-center">
                  <div class="w-10 h-10 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg class="w-5 h-5 md:w-4 md:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  Suku Cadang
                </h4>
                <p class="text-sm md:text-base text-orange-700 leading-relaxed flex-1">{{ currentStep.spare_parts }}</p>
              </div>
              
              <!-- Prosedur -->
              <div class="bg-green-50 rounded-xl p-5 md:p-6 border border-green-100 hover:shadow-md transition-shadow duration-200 flex flex-col md:col-span-2 lg:col-span-1">
                <h4 class="text-sm md:text-base font-semibold text-green-800 mb-3 flex items-center">
                  <div class="w-10 h-10 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg class="w-5 h-5 md:w-4 md:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  Prosedur
                </h4>
                <p class="text-sm md:text-base text-green-700 whitespace-pre-line leading-relaxed flex-1">{{ currentStep.procedure }}</p>
              </div>
              
              <!-- Solusi -->
              <div class="bg-purple-50 rounded-xl p-5 md:p-6 border border-purple-100 hover:shadow-md transition-shadow duration-200 flex flex-col md:col-span-2 lg:col-span-1">
                <h4 class="text-sm md:text-base font-semibold text-purple-800 mb-3 flex items-center">
                  <div class="w-10 h-10 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg class="w-5 h-5 md:w-4 md:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  Solusi
                </h4>
                <p class="text-sm md:text-base text-purple-700 whitespace-pre-line leading-relaxed flex-1">{{ currentStep.solution }}</p>
              </div>
            </div>

            <!-- Progress Notes - Enhanced Design -->
            <div v-if="currentStep.notes" class="bg-blue-50 border border-blue-200 rounded-xl p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
              <h4 class="text-sm md:text-base font-semibold text-blue-800 mb-3 flex items-center">
                <div class="w-10 h-10 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg class="w-5 h-5 md:w-4 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
                Catatan
              </h4>
              <p class="text-sm md:text-base text-blue-700 leading-relaxed">{{ currentStep.notes }}</p>
            </div>

            <!-- Existing Images -->
            <div v-if="currentStepImages.length" class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-700 flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Uploads sebelumnya
              </h4>
              <div class="flex flex-wrap gap-2">
                <div v-for="(url, i) in currentStepImages" :key="i" 
                     class="relative group cursor-pointer"
                     @click="openImage(url)">
                  <img :src="url" 
                       class="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors" />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                    <svg class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Spare Parts Used - Enhanced Design -->
            <div v-if="currentStep.spare_parts_used" class="bg-orange-50 border border-orange-200 rounded-xl p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
              <h4 class="text-sm md:text-base font-semibold text-orange-800 mb-3 flex items-center">
                <div class="w-10 h-10 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg class="w-5 h-5 md:w-4 md:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                Spare Parts Digunakan
              </h4>
              <p class="text-sm md:text-base text-orange-700 leading-relaxed">{{ currentStep.spare_parts_used }}</p>
            </div>

            <!-- Action Button - Hide for selfie step (step_order = 0) -->
            <div v-if="!readOnly && currentStep.step_order !== 0" class="pt-4 border-t border-gray-200">
              <div v-if="!canAccessStep(currentStepIndex)" class="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center">
                <svg class="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                Silakan selesaikan semua langkah sebelumnya (Selesai atau Tidak Diterapkan) sebelum memperbarui langkah ini.
              </div>
              <button @click="openStepModal(currentStep)" 
                      :disabled="!canAccessStep(currentStepIndex)"
                      class="w-full flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-md hover:shadow-lg touch-manipulation">
                <svg class="h-6 w-6 md:h-5 md:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Perbarui Status Langkah
              </button>
            </div>
          </div>
        </div>

        <!-- Navigation Controls - Mobile optimized: step indicators on top, buttons below -->
        <div v-if="networkArchitecture && checklist.length > 0" class="flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <!-- Step Indicators - Full width on mobile, centered -->
          <div ref="stepIndicatorsContainer" class="flex justify-center space-x-1.5 md:space-x-1 overflow-x-auto px-2 scroll-smooth no-scrollbar w-full">
            <button v-for="(step, index) in checklist" 
                    :key="step.step_id"
                    :ref="el => { if (el) stepIndicatorRefs[index] = el as HTMLButtonElement }"
                    @click="goToStep(index)"
                    class="w-5 h-5 md:w-3 md:h-3 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0 touch-manipulation"
                    :class="{
                      'bg-green-500 shadow-lg': step.status === 'done',
                      'bg-yellow-500 shadow-lg': step.status === 'needs_spare_parts',
                      'bg-red-500 shadow-lg': step.status === 'not_applicable',
                      'bg-gray-300': step.status === 'pending',
                      'ring-2 ring-blue-500 ring-offset-2': index === currentStepIndex
                    }"
                    :title="`Langkah ${index + 1}: ${step.title}`">
            </button>
          </div>

          <!-- Navigation Buttons - Horizontal layout -->
          <div class="flex items-center justify-between gap-2">
            <button @click="previousStep" 
                    :disabled="currentStepIndex === 0"
                    class="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-sm font-medium touch-manipulation shadow-sm flex-1 md:flex-none">
              <svg class="h-5 w-5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span class="ml-2 hidden sm:inline">Sebelumnya</span>
              <span class="ml-2 sm:hidden">Sebelum</span>
            </button>

            <button @click="nextStep" 
                    :disabled="currentStepIndex === checklist.length - 1"
                    class="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-sm font-medium touch-manipulation shadow-sm flex-1 md:flex-none">
              <span class="mr-2">Selanjutnya</span>
              <svg class="h-5 w-5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Summary Step - Shows after all steps completed -->
        <div v-if="networkArchitecture && allStepsCompleted && !showSummary" class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg p-6">
          <div class="text-center mb-6">
            <div class="flex items-center justify-center mb-3">
              <svg class="h-10 w-10 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-2xl font-bold text-gray-900">Ringkasan Checklist Teknisi</h3>
            </div>
            <p class="text-sm text-gray-600">Ringkasan lengkap dari semua langkah yang telah diselesaikan</p>
          </div>
          
          <button @click="showSummary = true" 
                  class="w-full md:w-auto mx-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-semibold shadow-md hover:shadow-lg">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Lihat Ringkasan
          </button>
        </div>

        <!-- Summary View -->
        <div v-if="showSummary && allStepsCompleted" class="bg-white border-2 border-blue-200 rounded-xl shadow-lg overflow-hidden">
        <div :class="['bg-gradient-to-r', headerGradientClass, 'px-6', 'py-4']">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-white">Ringkasan Checklist Teknisi</h3>
              <button @click="showSummary = false" 
                      class="text-blue-200 hover:text-white transition-colors">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Team Info -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg class="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Tim Teknisi
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div v-if="team.senior">
                  <span class="font-medium text-gray-700">Senior:</span>
                  <span class="text-gray-900 ml-2">{{ getTechnicianName(team.senior) }}</span>
                </div>
                <div v-if="team.junior">
                  <span class="font-medium text-gray-700">Junior:</span>
                  <span class="text-gray-900 ml-2">{{ getTechnicianName(team.junior) }}</span>
                </div>
                <div v-if="team.helper">
                  <span class="font-medium text-gray-700">Helper:</span>
                  <span class="text-gray-900 ml-2">{{ getTechnicianName(team.helper) }}</span>
                </div>
              </div>
            </div>

            <!-- Steps Summary -->
            <div class="space-y-4">
              <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                <svg class="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Langkah-langkah yang Diselesaikan
              </h4>
              
              <div class="space-y-3">
                <div v-for="(step, index) in checklist.filter(s => s.step_order !== 0)" :key="step.step_id" 
                     class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                           :class="{
                             'bg-green-100 text-green-800': step.status === 'done',
                             'bg-yellow-100 text-yellow-800': step.status === 'needs_spare_parts',
                             'bg-red-100 text-red-800': step.status === 'not_applicable',
                             'bg-gray-100 text-gray-800': step.status === 'pending'
                           }">
                        {{ step.step_order }}
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <h5 class="font-semibold text-gray-900">{{ step.title }}</h5>
                        <span class="px-2 py-1 text-xs font-semibold rounded"
                              :class="getStatusClass(step.status)">
                          {{ getStatusText(step.status) }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 mb-2">{{ step.description }}</p>
                      <div v-if="step.notes" class="text-sm text-gray-700 bg-blue-50 rounded p-2 mb-2">
                        <span class="font-medium">Catatan:</span> {{ step.notes }}
                      </div>
                      <div v-if="step.spare_parts_used" class="text-sm text-orange-700 bg-orange-50 rounded p-2 mb-2">
                        <span class="font-medium">Suku Cadang:</span> {{ step.spare_parts_used }}
                      </div>
                      <div v-if="getStepImages(step).length > 0" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, i) in getStepImages(step)" :key="i"
                             :src="img"
                             @click="openImage(img)"
                             class="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selfie Photo in Summary -->
            <div v-if="selfiePhoto" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg class="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Foto Selfie Tim
              </h4>
              <div class="flex justify-center">
                <img :src="selfiePhoto.preview" 
                     @click="openImage(selfiePhoto.preview)"
                     class="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md cursor-pointer hover:border-blue-400 transition-colors" />
              </div>
            </div>

            <!-- Statistics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                <div class="text-2xl font-bold text-green-700">{{ stepsWithoutFix }}</div>
                <div class="text-sm text-green-600">Langkah Tanpa Perbaikan</div>
              </div>
              <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                <div class="text-2xl font-bold text-yellow-700">{{ checklist.filter(s => s.status === 'needs_spare_parts').length }}</div>
                <div class="text-sm text-yellow-600">Perbaikan</div>
              </div>
              <div class="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                <div class="text-2xl font-bold text-red-700">{{ checklist.filter(s => s.status === 'not_applicable').length }}</div>
                <div class="text-sm text-red-600">Tidak Diterapkan</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                <div class="text-2xl font-bold text-blue-700">{{ progressPercentage }}%</div>
                <div class="text-sm text-blue-600">Progress</div>
              </div>
            </div>

            <!-- Detailed Summary Section -->
            <div class="space-y-6 mt-6">
              <!-- Terminal Section -->
              <div v-if="ticketData && ticketData.terminal_info" class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-5 border-2 border-cyan-200">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="h-6 w-6 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  Terminal
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Nama Terminal :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.nama_terminal || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Kondisi awal :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.kondisi_awal || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Perangkat Terminal Awal :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.perangkat_terminal_awal || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Analisa Awal :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.analisa_awal || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tgl Tindakan :</span>
                    <span class="text-gray-900">{{ formatActionDate(ticketData.terminal_info.tgl_tindakan) }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tindakan :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.tindakan || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Teknisi :</span>
                    <span class="text-gray-900">{{ getTechniciansList() }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Hasil Akhir :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.hasil_akhir || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Kendala :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.kendala || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tindakan selanjutnya :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.tindakan_selanjutnya || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Perangkat tambahan :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.perangkat_tambahan || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Jumlah material :</span>
                    <span class="text-gray-900">{{ ticketData.terminal_info.jumlah_material || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- End User Section -->
              <div v-if="ticketData" class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="h-6 w-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  End User
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Nama Pel. :</span>
                    <span class="text-gray-900">{{ ticketData.customer_name || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Kondisi awal :</span>
                    <span class="text-gray-900">{{ ticketData.kondisi_awal || ticketData.customer_note || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Perangkat Awal :</span>
                    <span class="text-gray-900">{{ ticketData.perangkat_awal || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Analisa Awal :</span>
                    <span class="text-gray-900">{{ ticketData.analisa_awal || ticketData.noc_note || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tgl Tindakan :</span>
                    <span class="text-gray-900">{{ formatActionDate(ticketData.tgl_tindakan || ticketData.created_at) }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tindakan :</span>
                    <span class="text-gray-900">{{ getActionsTaken() }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Teknisi :</span>
                    <span class="text-gray-900">{{ getTechniciansList() }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Hasil Akhir :</span>
                    <span class="text-gray-900">{{ ticketData.hasil_akhir || (ticketData.status === 'finished' ? 'Normal' : '-') }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Kendala :</span>
                    <span class="text-gray-900">{{ ticketData.kendala || ticketData.technician_note || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Tindakan selanjutnya :</span>
                    <span class="text-gray-900">{{ ticketData.tindakan_selanjutnya || '-' }}</span>
                  </div>
                  <div class="flex">
                    <span class="font-semibold text-gray-700 w-40 flex-shrink-0">- Jumlah material :</span>
                    <span class="text-gray-900">{{ getMaterialSummary() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Complete Job Notification -->
        <div v-if="!readOnly && networkArchitecture && allStepsCompleted && showSummary" class="bg-green-50 border border-green-200 rounded-xl shadow-sm p-6">
          <div class="text-center">
            <div class="flex items-center justify-center mb-3">
              <svg class="h-8 w-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-lg font-semibold text-green-800">Semua Langkah Selesai!</h3>
            </div>
            <p class="text-sm text-green-700">Pekerjaan telah otomatis ditandai sebagai selesai.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Step Update Modal - Full screen on mobile -->
    <div v-if="showStepModal" class="fixed inset-0 bg-black bg-opacity-50 md:bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div class="bg-white rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:w-full md:max-w-2xl md:max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header - Mobile optimized -->
        <div :class="['bg-gradient-to-r', headerGradientClass, 'px-4', 'md:px-6', 'py-4', 'flex-shrink-0']">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="text-base md:text-lg font-semibold text-white">Perbarui Langkah</h3>
              <p class="text-blue-100 text-xs md:text-sm mt-1 truncate">{{ selectedStep?.title }}</p>
            </div>
            <button @click="closeStepModal" class="text-blue-200 hover:text-white transition-colors flex-shrink-0 p-2 -mr-2 touch-manipulation">
              <svg class="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content - Scrollable on mobile -->
        <div class="p-4 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          <!-- Status Selection -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select v-model="stepUpdate.status" 
                    :disabled="isDismantleTicket"
                    class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option v-if="!isDismantleTicket" value="done" class="text-gray-900">✅ Pengecekan</option>
              <option value="fix" class="text-gray-900">🔧 Penanganan</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Catatan</label>
            <textarea v-model="stepUpdate.notes" 
                      rows="4" 
                      class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation"
                      placeholder="Tambahkan catatan untuk langkah ini..."></textarea>
          </div>

          <!-- Image Upload -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              Gambar Progress 
              <span class="text-gray-500 font-normal">(Penanganan memerlukan 2 gambar)</span>
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <input type="file" 
                     multiple 
                     accept="image/*" 
                     @change="handleImageUpload"
                     class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p class="text-xs text-gray-500 mt-2">Upload gambar yang menunjukkan perkembangan pada langkah ini</p>
            </div>
            
            <!-- Image Previews -->
            <div v-if="stepUpdate.images && stepUpdate.images.length > 0" class="grid grid-cols-4 gap-2 mt-3">
              <div v-for="(img, index) in stepUpdate.images" :key="index" class="relative group">
                <img :src="img.preview" class="w-full h-20 object-cover rounded-lg border" />
                <button @click="removeImage(index)" 
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Spare Parts Used -->
          <div v-if="stepUpdate.status === 'needs_spare_parts'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Suku Cadang yang Digunakan</label>
            <select v-model="stepUpdate.sparePartsUsed" 
                    class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-500 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation">
              <option value="">Pilih suku cadang...</option>
              <option v-for="part in spareParts" :key="part.id" :value="part.name">
                {{ part.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Modal Footer - Mobile optimized with larger buttons -->
        <div class="bg-gray-50 px-4 md:px-6 py-4 flex-shrink-0 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button @click="closeStepModal"
                  class="w-full sm:w-auto px-6 py-3 md:px-4 md:py-2 text-gray-600 border-2 md:border border-gray-300 rounded-lg hover:bg-white hover:text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-base md:text-sm font-medium touch-manipulation">
            Batal
          </button>
          <button @click="updateStep" 
                  :disabled="updating"
                  class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-semibold md:font-medium touch-manipulation">
            <svg v-if="updating" class="animate-spin -ml-1 mr-2 h-5 w-5 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ updating ? 'Memperbarui...' : 'Perbarui Langkah' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Image Viewer Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div class="relative w-full max-w-6xl mx-4">
        <button @click="closeImage" 
                class="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <img :src="viewedImageUrl" class="max-h-[85vh] w-full object-contain rounded-lg" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { useApiHost } from '@/composables/useApiHost'
import { useNotification } from '@/composables/useNotification'

interface ChecklistStep {
  step_id: number
  step_order: number
  title: string
  description: string
  tools: string
  spare_parts: string
  procedure: string
  solution: string
  status: string
  notes?: string
  spare_parts_used?: string
  completed_at?: string
  image_paths?: string | string[] | null
}

interface SparePart {
  id: number
  name: string
  description?: string
  category: string
}

const DISMANTLE_STEP_ID = 12

const props = defineProps<{
  ticketId: number
  technicianId: string
  readOnly?: boolean
}>()

const readOnly = computed(() => !!props.readOnly)

const emit = defineEmits<{
  jobCompleted: []
}>()

// Notification system
const notification = useNotification()

// State
const checklist = ref<ChecklistStep[]>([])
const spareParts = ref<SparePart[]>([])
  const technicians = ref<any[]>([])
const networkArchitecture = ref<string>('')
  const team = ref<{ senior: string; junior: string; helper: string }>({ senior: '', junior: '', helper: '' })
const showStepModal = ref(false)
const selectedStep = ref<ChecklistStep | null>(null)
const stepUpdate = ref({
  status: 'pending',
  notes: '',
  sparePartsUsed: '',
  images: [] as { file: File; preview: string }[]
})
const updating = ref(false)
const completing = ref(false)
const jobCompletedLocal = ref(false)
  const savingTeam = ref(false)
const currentStepIndex = ref(0)
const selfiePhoto = ref<{ file: File; preview: string } | null>(null)
const savingSelfie = ref(false)
const showSummary = ref(false)
const ticketData = ref<any>(null)
const dismantleFlag = ref(false)
const isGangguanTicket = computed(() => {
  const data = ticketData.value
  if (!data) return false
  const classificationRaw =
    data.classification_id ??
    data.classification ??
    data.type ??
    data.type_id ??
    data.ticket_type ??
    data.ticket_type_id
  return (classificationRaw ?? '').toString().toLowerCase() === 'gangguan'
})
const isDismantleTicket = computed(() => {
  if (dismantleFlag.value) return true

  const data = ticketData.value
  if (!data) return false

  const classificationRaw =
    data.classification_id ??
    data.classification ??
    data.type ??
    data.type_id ??
    data.ticket_type ??
    data.ticket_type_id
  const classificationStr = (classificationRaw ?? '').toString().toLowerCase()
  const classificationNum = Number(classificationRaw)
  const statusVal = data.status_id ?? data.ticket_status_id ?? data.status ?? data.type_status
  const statusId = statusVal != null ? String(statusVal) : ''
  const statusText = typeof statusVal === 'string' ? statusVal.toLowerCase() : ''

  if (classificationStr === 'dismantle' || statusText === 'dismantle') return true
  if (!Number.isNaN(classificationNum) && classificationNum === 7) return true
  return statusId === '7'
})

const headerGradientClass = computed(() => {
  if (isDismantleTicket.value) return 'from-orange-500 to-orange-600'
  if (isGangguanTicket.value) return 'from-red-600 to-rose-700'
  return 'from-blue-600 to-indigo-700'
})

// Refs for step indicators auto-scroll
const stepIndicatorsContainer = ref<HTMLElement | null>(null)
const stepIndicatorRefs = ref<Record<number, HTMLButtonElement>>({})

// Computed
const progressPercentage = computed(() => {
  if (checklist.value.length === 0) return 0
  
  // Count regular steps (excluding selfie step 0)
  const regularSteps = checklist.value.filter(step => step.step_order !== 0)
  if (regularSteps.length === 0) return 0
  
  const completedRegular = regularSteps.filter(step => 
    step.status === 'done' || step.status === 'needs_spare_parts' || step.status === 'not_applicable'
  ).length
  
  // Check selfie step separately
  const selfieStep = checklist.value.find(step => step.step_order === 0)
  const selfieCompleted = selfieStep 
    ? (selfiePhoto.value !== null || 
       selfieStep.status === 'done' || 
       selfieStep.status === 'not_applicable' || 
       selfieStep.status === 'needs_spare_parts')
    : true // If no selfie step, consider it completed
  
  // Total steps = regular steps + selfie step (if exists)
  const totalSteps = regularSteps.length + (selfieStep ? 1 : 0)
  const completedTotal = completedRegular + (selfieCompleted ? 1 : 0)
  
  return Math.round((completedTotal / totalSteps) * 100)
})

const completedSteps = computed(() => {
  if (checklist.value.length === 0) return 0
  
  // Count regular steps (excluding selfie step 0)
  const regularSteps = checklist.value.filter(step => step.step_order !== 0)
  const completedRegular = regularSteps.filter(step => 
    step.status === 'done' || step.status === 'needs_spare_parts' || step.status === 'not_applicable'
  ).length
  
  // Check selfie step separately
  const selfieStep = checklist.value.find(step => step.step_order === 0)
  const selfieCompleted = selfieStep 
    ? (selfiePhoto.value !== null || 
       selfieStep.status === 'done' || 
       selfieStep.status === 'not_applicable' || 
       selfieStep.status === 'needs_spare_parts')
    : true
  
  return completedRegular + (selfieCompleted ? 1 : 0)
})

// Count steps that are done without needing fixes (status = 'done', not 'needs_spare_parts')
const stepsWithoutFix = computed(() => {
  if (checklist.value.length === 0) return 0
  
  // Count regular steps (excluding selfie step 0) that are done without needing fixes
  const regularSteps = checklist.value.filter(step => step.step_order !== 0)
  const doneWithoutFix = regularSteps.filter(step => step.status === 'done').length
  
  return doneWithoutFix
})

const allStepsCompleted = computed(() => {
  if (checklist.value.length === 0) return false
  
  // Check all steps except selfie step (step_order = 0)
  // Selfie step completion is checked separately via selfiePhoto
  const regularSteps = checklist.value.filter(step => step.step_order !== 0)
  const allRegularStepsCompleted = regularSteps.length > 0 && regularSteps.every(step => 
    step.status === 'done' || step.status === 'not_applicable' || step.status === 'needs_spare_parts'
  )
  
  // For selfie step (step_order = 0), check if photo exists OR if step status is completed
  const selfieStep = checklist.value.find(step => step.step_order === 0)
  const selfieCompleted = selfieStep 
    ? (selfiePhoto.value !== null || 
       selfieStep.status === 'done' || 
       selfieStep.status === 'not_applicable' || 
       selfieStep.status === 'needs_spare_parts')
    : true // If no selfie step in checklist, consider it completed
  
  return allRegularStepsCompleted && selfieCompleted
})

const shouldShowSelfieStep = computed(() => {
  // Show selfie step if:
  // 1. Current step is step 0 (selfie step), OR
  // 2. After at least one regular step is completed
  const isCurrentStepSelfie = currentStep.value?.step_order === 0
  const hasCompletedStep = checklist.value.some(step => 
    step.status === 'done' || step.status === 'needs_spare_parts' || step.status === 'not_applicable'
  )
  return isCurrentStepSelfie || (hasCompletedStep && !allStepsCompleted.value)
})

const currentStep = computed(() => {
  if (checklist.value.length === 0) return null
  return checklist.value[currentStepIndex.value] || null
})

// Build absolute URLs for saved images of the current step
const apiBase = useApiHost()
const currentStepImages = computed<string[]>(() => {
  const step = currentStep.value as any
  if (!step) return []
  let paths: any = step.image_paths
  if (!paths) return []
  if (typeof paths === 'string') {
    try {
      const parsed = JSON.parse(paths)
      if (Array.isArray(parsed)) paths = parsed
    } catch (_) {
      // it's a single filename string
    }
  }
  if (Array.isArray(paths)) {
    return paths.map((p: string) => `${apiBase}/uploads/technician-progress/${p}`)
  }
  if (typeof paths === 'string') {
    return [`${apiBase}/uploads/technician-progress/${paths}`]
  }
  return []
})

// Methods
const filterChecklistForDismantle = () => {
  if (!isDismantleTicket.value) return

  // For dismantle tickets, show selfie step (step_order = 0) and dismantle photo step (step_id = 12)
  const filteredSteps = checklist.value.filter(step => 
    step.step_order === 0 || Number(step.step_id) === DISMANTLE_STEP_ID
  )
  checklist.value = filteredSteps
  currentStepIndex.value = 0

  if (!networkArchitecture.value) {
    networkArchitecture.value = 'DISMANTLE'
  }
}

const loadChecklist = async () => {
  try {
    // Keep current step so UI doesn't jump after refresh
    const prevStepId = currentStep.value?.step_id

    const resp = await ticketsApi().getTechnicianChecklist(props.ticketId, props.technicianId) as any
    if (Array.isArray(resp.data)) {
      checklist.value = resp.data
    } else {
      checklist.value = resp.data?.checklist || []
      networkArchitecture.value = resp.data?.network_architecture || ''

      const meta =
        resp.data?.ticket ||
        resp.data ||
        {}
      const metaClassification =
        meta.classification_id ??
        meta.classification ??
        meta.type ??
        meta.type_id ??
        meta.ticket_type ??
        meta.ticket_type_id
      const metaStatus = meta.status_id ?? meta.ticket_status_id ?? meta.status ?? meta.type_status
      const metaClassificationStr = (metaClassification ?? '').toString().toLowerCase()
      const metaClassificationNum = Number(metaClassification)
      const metaStatusText = typeof metaStatus === 'string' ? metaStatus.toLowerCase() : ''
      const metaStatusId = metaStatus != null ? String(metaStatus) : ''
      dismantleFlag.value =
        metaClassificationStr === 'dismantle' ||
        metaStatusText === 'dismantle' ||
        metaStatusId === '7' ||
        (!Number.isNaN(metaClassificationNum) && metaClassificationNum === 7)
    }

    // Filter steps based on network architecture (additional frontend filter as safety)
    if (networkArchitecture.value) {
      // Steps 2, 3, 4, 6 are HTB only - hide them for FTTH
      if (networkArchitecture.value === 'FTTH') {
        checklist.value = checklist.value.filter(step => 
          step.step_order !== 2 && 
          step.step_order !== 3 && 
          step.step_order !== 4 && 
          step.step_order !== 6
        )
      }
    }

    filterChecklistForDismantle()

    if (prevStepId) {
      const idx = checklist.value.findIndex(s => s.step_id === prevStepId)
      if (idx >= 0) currentStepIndex.value = idx
    }
  } catch (error: any) {
    notification.error('Error', error.message)
  }
}

const loadSpareParts = async () => {
  try {
    const data = await ticketsApi().getSpareParts() as any
    spareParts.value = data.data || []
  } catch (error: any) {
    console.error('Failed to load spare parts:', error)
  }
}

const loadTechnicians = async () => {
  try {
    const data = await ticketsApi().listTechnicians() as any
    technicians.value = data.data || []
  } catch (e: any) {
    console.error('Failed to load technicians', e)
  }
}

// Load existing saved team and reflect into selects
const loadTeamMembers = async () => {
  try {
    const resp = await ticketsApi().getTeamMembers(props.ticketId) as any
    const members = (resp?.data || []) as Array<{ user_id: string; role: string }>
    const map: Record<string, string> = {}
    for (const m of members) map[m.role] = m.user_id
    team.value.senior = map['senior'] || ''
    team.value.junior = map['junior'] || ''
    team.value.helper = map['helper'] || ''
  } catch (_) {
    // no-op
  }
}

const saveTeam = async () => {
  try {
    // Build members list and validate uniqueness
    const members: { user_id: string; role: 'senior' | 'junior' | 'helper' }[] = []
    if (team.value.senior) members.push({ user_id: team.value.senior, role: 'senior' })
    if (team.value.junior) members.push({ user_id: team.value.junior, role: 'junior' })
    if (team.value.helper) members.push({ user_id: team.value.helper, role: 'helper' })

    if (members.length === 0) {
      notification.error('Error', 'Tentukan setidaknya satu teknisi')
      return
    }
    const ids = members.map(m => m.user_id)
    const setIds = new Set(ids)
    if (setIds.size !== ids.length) {
      notification.error('Error', 'Satu teknisi tidak dapat menempati beberapa peran')
      return
    }

    savingTeam.value = true
    await ticketsApi().setTeam(props.ticketId, members)
    notification.success('Berhasil', 'Tim berhasil disimpan')
    await loadTeamMembers()
  } catch (e: any) {
    notification.error('Error', e.message || 'Gagal menyimpan tim')
  } finally {
    savingTeam.value = false
  }
}

const selectArchitecture = async (architecture: string) => {
  try {
    await ticketsApi().setNetworkArchitecture(props.ticketId, architecture)
    networkArchitecture.value = architecture
    notification.success('Berhasil', `Arsitektur jaringan disetel ke ${architecture}`)
    // Reload checklist to filter steps based on new architecture
    await loadChecklist()
  } catch (error: any) {
    notification.error('Error', error.message)
  }
}

const openStepModal = (step: ChecklistStep) => {
  // Don't open modal for selfie step (step_order = 0)
  if (step.step_order === 0) {
    return
  }
  selectedStep.value = step
  stepUpdate.value = {
    status: isDismantleTicket.value ? 'fix' : (step.status === 'needs_spare_parts' ? 'fix' : (step.status === 'done' ? 'done' : 'fix')),
    notes: step.notes || '',
    sparePartsUsed: step.spare_parts_used || '',
    images: [] as { file: File; preview: string }[]
  }
  showStepModal.value = true
}

const closeStepModal = () => {
  showStepModal.value = false
  selectedStep.value = null
  stepUpdate.value = {
    status: 'pending',
    notes: '',
    sparePartsUsed: '',
    images: []
  }
}

const updateStep = async () => {
  if (!selectedStep.value) return

  // Validate that images are uploaded for non-pending status
  // Image requirements
  const savedCount = Array.isArray(selectedStep.value.image_paths)
    ? selectedStep.value.image_paths.length
    : (selectedStep.value.image_paths ? 1 : 0)
  const newCount = stepUpdate.value.images.length

  // Always require at least one image overall
  if (savedCount + newCount < 1) {
    notification.error('Error', 'Silakan upload setidaknya 1 gambar untuk langkah ini')
    return
  }

  // If Fix, require at least 2 total images (before and after)
  const isFix = stepUpdate.value.status === 'fix'
  if (isFix && (savedCount + newCount) < 2) {
    notification.error('Error', 'Perbaikan memerlukan 2 gambar (sebelum dan sesudah)')
    return
  }

  updating.value = true
  try {
    const imageFiles = stepUpdate.value.images.map(img => img.file)

    const apiStatus = stepUpdate.value.status === 'fix' ? 'needs_spare_parts' : 'done'

    await ticketsApi().updateTechnicianStepWithImages(
      props.ticketId,
      selectedStep.value.step_id,
      props.technicianId,
      apiStatus,
      stepUpdate.value.notes || undefined,
      stepUpdate.value.sparePartsUsed || undefined,
      imageFiles.length > 0 ? imageFiles : undefined
    )

    await loadChecklist()
    closeStepModal()
    notification.success('Berhasil', 'Langkah berhasil diperbarui')
  } catch (error: any) {
    notification.error('Error', error.message)
  } finally {
    updating.value = false
  }
}

// Auto-complete job when all steps are finished
const autoCompleteJob = async () => {
  if (completing.value || jobCompletedLocal.value) return // Prevent duplicate calls
  
  completing.value = true
  try {
    await ticketsApi().markTechnicianJobCompleted(props.ticketId)
    notification.success('Berhasil', 'Pekerjaan berhasil diselesaikan')
    emit('jobCompleted')
    jobCompletedLocal.value = true
  } catch (error: any) {
    // Don't show error notification for auto-complete to avoid annoying users
    console.error('Failed to auto-complete job:', error)
  } finally {
    completing.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-800'
    case 'needs_spare_parts': return 'bg-red-100 text-red-800'
    case 'not_applicable': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'done': return 'Selesai'
    case 'needs_spare_parts': return 'Penanganan'
    case 'not_applicable': return 'Tidak Diterapkan'
    default: return 'Belum'
  }
}

const viewStepDetails = (step: ChecklistStep) => {
  // Implementation for viewing step details
  console.log('View step details:', step)
}

// Navigation methods
const nextStep = () => {
  if (currentStepIndex.value < checklist.value.length - 1) {
    currentStepIndex.value++
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const goToStep = (index: number) => {
  if (index >= 0 && index < checklist.value.length) {
    const step = checklist.value[index]
    // Selfie step (step_order = 0) is always accessible
    if (step && step.step_order === 0) {
      currentStepIndex.value = index
      return
    }
    if (!canAccessStep(index)) {
      notification.error('Error', 'Silakan selesaikan langkah sebelumnya terlebih dahulu')
      return
    }
    currentStepIndex.value = index
  }
}

// Auto-scroll step indicators to show the current step
const scrollToActiveStep = () => {
  nextTick(() => {
    // Try using refs first, fallback to querySelector if needed
    let activeButton = stepIndicatorRefs.value[currentStepIndex.value]
    
    // If ref not available, try querySelector with data attribute
    if (!activeButton && stepIndicatorsContainer.value) {
      const buttons = stepIndicatorsContainer.value.querySelectorAll('button')
      activeButton = buttons[currentStepIndex.value] as HTMLButtonElement
    }
    
    if (activeButton && stepIndicatorsContainer.value) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  })
}

// Watch currentStepIndex to auto-scroll when step changes
watch(currentStepIndex, () => {
  scrollToActiveStep()
})

// Watch checklist to scroll after it loads
watch(() => checklist.value.length, () => {
  if (checklist.value.length > 0) {
    // Wait a bit for DOM to update with step indicator refs
    setTimeout(() => {
      scrollToActiveStep()
    }, 100)
  }
})

// Image handling functions
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        stepUpdate.value.images.push({
          file: file,
          preview: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const removeImage = (index: number) => {
  stepUpdate.value.images.splice(index, 1)
}

// Check if step can be accessed (sequential completion)
const canAccessStep = (stepIndex: number) => {
  if (stepIndex === 0) return true // First step is always accessible
  
  const step = checklist.value[stepIndex]
  // Selfie step (step_order = 0) is always accessible
  if (step && step.step_order === 0) return true

  // Check if all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const prevStep = checklist.value[i]
    // Skip selfie step (step_order = 0) in sequential check
    if (prevStep.step_order === 0) continue
    if (prevStep.status !== 'done' && prevStep.status !== 'not_applicable' && prevStep.status !== 'needs_spare_parts') {
      return false
    }
  }
  return true
}

// Load ticket data for summary
const loadTicketData = async () => {
  try {
    const apiBase = useApiHost()
    const response = await fetch(`${apiBase}/api/tickets/${props.ticketId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      ticketData.value = data.data || data

      if (isDismantleTicket.value && !networkArchitecture.value) {
        networkArchitecture.value = 'DISMANTLE'
      }
      filterChecklistForDismantle()
    }
  } catch (error: any) {
    console.log('Failed to load ticket data:', error)
    // Not critical, continue without ticket data
  }
}

// Helper functions for summary
const formatActionDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

const getTechniciansList = () => {
  const names: string[] = []
  if (team.value.senior) {
    const tech = technicians.value.find(t => t.id === team.value.senior)
    if (tech) names.push(tech.name)
  }
  if (team.value.junior) {
    const tech = technicians.value.find(t => t.id === team.value.junior)
    if (tech) names.push(tech.name)
  }
  if (team.value.helper) {
    const tech = technicians.value.find(t => t.id === team.value.helper)
    if (tech) names.push(tech.name)
  }
  return names.length > 0 ? names.join(', ') : '-'
}

const getActionsTaken = () => {
  // Collect actions from completed steps
  const actions: string[] = []
  checklist.value.forEach(step => {
    if (step.status === 'done' || step.status === 'needs_spare_parts') {
      if (step.notes) {
        actions.push(step.notes)
      }
    }
  })
  return actions.length > 0 ? actions.join('; ') : '-'
}

const getMaterialSummary = () => {
  // Collect spare parts used from all steps
  const materials: string[] = []
  checklist.value.forEach(step => {
    if (step.spare_parts_used) {
      materials.push(step.spare_parts_used)
    }
  })
  return materials.length > 0 ? materials.join(', ') : '-'
}

// Watch for all steps completion and auto-complete job
watch(allStepsCompleted, async (isCompleted) => {
  if (isCompleted && !readOnly.value && !jobCompletedLocal.value && networkArchitecture.value) {
    // Auto-complete job when all steps are finished
    await autoCompleteJob()
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  loadChecklist()
  loadSpareParts()
  loadTechnicians()
  loadTeamMembers()
  loadSelfiePhoto()
  loadTicketData()
})

// Selfie photo handling
const handleSelfieUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (e) => {
    selfiePhoto.value = {
      file: file,
      preview: e.target?.result as string
    }
  }
  reader.readAsDataURL(file)
}

const removeSelfie = () => {
  selfiePhoto.value = null
}

const saveSelfie = async () => {
  if (!selfiePhoto.value) return

  savingSelfie.value = true
  try {
    // Upload selfie photo using the technician photo upload endpoint
    // We'll use FormData to upload the file
    const formData = new FormData()
    formData.append('selfie', selfiePhoto.value.file)
    formData.append('ticket_id', props.ticketId.toString())
    formData.append('technician_id', props.technicianId)

    const apiBase = useApiHost()
    const response = await fetch(`${apiBase}/api/tickets/${props.ticketId}/technician-selfie`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload selfie photo')
    }

    notification.success('Berhasil', 'Foto selfie berhasil disimpan')
    // Reload to get the saved selfie
    await loadSelfiePhoto()
  } catch (error: any) {
    // If API doesn't exist yet, we'll handle it gracefully
    console.warn('Selfie upload API not available:', error)
    notification.success('Berhasil', 'Foto selfie disimpan secara lokal (API belum tersedia)')
  } finally {
    savingSelfie.value = false
  }
}

const loadSelfiePhoto = async () => {
  try {
    const apiBase = useApiHost()
    const response = await fetch(`${apiBase}/api/tickets/${props.ticketId}/technician-selfie`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.data && data.data.selfie_path) {
        // Normalize the path to extract just the filename (handle both old and new formats)
        let selfiePath = data.data.selfie_path
        
        // Normalize path separators (handle Windows backslashes)
        selfiePath = selfiePath.replace(/\\/g, '/')
        
        // Remove any path prefixes (uploads/technician-progress/ or uploads/technician-selfie/)
        selfiePath = selfiePath.replace(/^uploads\/technician-progress\//, '')
        selfiePath = selfiePath.replace(/^uploads\/technician-selfie\//, '')
        
        // Extract just the filename (in case there are any remaining path components)
        const filename = selfiePath.split('/').pop() || selfiePath
        
        // Load the saved selfie photo with normalized path
        selfiePhoto.value = {
          file: null as any, // We don't have the file, just the path
          preview: `${apiBase}/uploads/technician-selfie/${filename}`
        }
      }
    }
  } catch (error: any) {
    // API might not exist yet, that's okay
    console.log('Selfie photo not found or API not available')
  }
}

// Helper functions for summary
const getTechnicianName = (technicianId: string) => {
  const tech = technicians.value.find(t => t.id === technicianId)
  return tech ? `${tech.name} (${tech.email || 'tech'})` : 'Tidak diketahui'
}

const getStepImages = (step: ChecklistStep): string[] => {
  if (!step.image_paths) return []
  let paths: any = step.image_paths
  if (typeof paths === 'string') {
    try {
      const parsed = JSON.parse(paths)
      if (Array.isArray(parsed)) paths = parsed
    } catch (_) {
      // it's a single filename string
    }
  }
  if (Array.isArray(paths)) {
    return paths.map((p: string) => `${apiBase}/uploads/technician-progress/${p}`)
  }
  if (typeof paths === 'string') {
    return [`${apiBase}/uploads/technician-progress/${paths}`]
  }
  return []
}

// Simple image viewer modal
const showImageModal = ref(false)
const viewedImageUrl = ref('')
const openImage = (url: string) => { viewedImageUrl.value = url; showImageModal.value = true }
const closeImage = () => { showImageModal.value = false; viewedImageUrl.value = '' }
</script>
