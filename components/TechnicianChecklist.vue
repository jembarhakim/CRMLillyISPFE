<template>
  <div class="technician-checklist">
    <!-- Main Container with Enhanced Styling - Full screen on mobile -->
    <div class="bg-white rounded-xl md:rounded-xl shadow-xl border border-gray-100 overflow-hidden h-screen md:h-auto md:max-h-none flex flex-col">
      <!-- Header Section - Mobile optimized -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <h2 class="text-lg md:text-xl font-bold text-white truncate">Technician Checklist</h2>
            <p class="text-blue-100 text-xs md:text-sm mt-1">Complete your assigned tasks step by step</p>
          </div>
          <div class="text-right ml-3 flex-shrink-0">
            <div class="text-white text-sm md:text-base font-medium">
              Step {{ currentStepIndex + 1 }} of {{ checklist.length }}
            </div>
            <div class="text-blue-200 text-xs mt-1">
              {{ progressPercentage }}% Complete
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
              <h3 class="text-sm font-medium text-green-800">Job Completed Successfully!</h3>
              <p class="text-sm text-green-700 mt-1">You can safely close this task.</p>
            </div>
          </div>
        </div>

        <!-- Team Assignment Section -->
        <div class="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div class="flex items-center mb-4">
            <svg class="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900">Assign Technician Team</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Senior Technician</label>
              <select v-model="team.senior" 
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Select senior technician...</option>
                <option v-for="t in technicians" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Junior Technician</label>
              <select v-model="team.junior" 
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Select junior technician...</option>
                <option v-for="t in technicians" :key="t.id + '-j'" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Helper</label>
              <select v-model="team.helper" 
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      :disabled="readOnly"
                      :class="{ 'bg-gray-100 cursor-not-allowed': readOnly }">
                <option value="">Select helper...</option>
                <option v-for="t in technicians" :key="t.id + '-h'" :value="t.id">
                  {{ t.name }} ({{ t.email || 'tech' }})
                </option>
              </select>
            </div>
          </div>
          
          <div class="mt-4 text-right" v-if="!readOnly">
            <button @click="saveTeam" 
                    :disabled="savingTeam"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg v-if="savingTeam" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ savingTeam ? 'Saving...' : 'Save Team' }}
            </button>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="bg-white border border-gray-200 rounded-lg p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Progress Overview</h3>
            <div class="text-sm text-gray-600">
              {{ completedSteps }} of {{ checklist.length }} steps completed
            </div>
          </div>
          
          <!-- Enhanced Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                   :style="{ width: `${progressPercentage}%` }"></div>
            </div>
            <div class="mt-2 text-center">
              <span class="text-sm font-medium text-gray-700">{{ progressPercentage }}% Complete</span>
            </div>
          </div>
          
          <!-- Step Indicators -->
          <div class="mt-4 flex justify-center space-x-2">
            <button v-for="(step, index) in checklist" 
                    :key="step.step_id" 
                    @click="goToStep(index)"
                    class="w-3 h-3 rounded-full transition-all duration-200 hover:scale-110"
                    :class="{
                      'bg-green-500 shadow-lg': step.status === 'done',
                      'bg-yellow-500 shadow-lg': step.status === 'needs_spare_parts',
                      'bg-red-500 shadow-lg': step.status === 'not_applicable',
                      'bg-gray-300': step.status === 'pending',
                      'ring-2 ring-blue-500 ring-offset-2': index === currentStepIndex
                    }"
                    :title="`Step ${index + 1}: ${step.title}`">
            </button>
          </div>
        </div>

        <!-- Network Architecture Selection -->
        <div v-if="!networkArchitecture" class="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <svg class="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-yellow-800">Select Network Architecture</h3>
          </div>
          <p class="text-sm text-yellow-700 mb-4">Please select the network architecture type before proceeding with the checklist.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button @click="selectArchitecture('FTTH')" 
                    :disabled="readOnly"
                    class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              FTTH (Fiber to the Home)
            </button>
            <button @click="selectArchitecture('HTB')" 
                    :disabled="readOnly"
                    class="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              HTB (High-speed Terminal Box)
            </button>
          </div>
        </div>

        <!-- Current Step Display -->
        <div v-if="networkArchitecture && currentStep" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <!-- Step Header - Mobile optimized -->
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-5 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 md:w-8 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-base md:text-sm font-semibold">
                    {{ currentStep.step_order }}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg md:text-lg font-semibold text-gray-900 break-words">{{ currentStep.title }}</h3>
                  <p class="text-sm md:text-sm text-gray-600 break-words mt-1">{{ currentStep.description }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="px-3 py-1 text-xs font-medium rounded-full" :class="getStatusClass(currentStep.status)">
                  {{ getStatusText(currentStep.status) }}
                </span>
                <button v-if="!readOnly && currentStep.status === 'needs_spare_parts'" 
                        @click="openStepModal(currentStep)"
                        class="px-3 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full hover:bg-pink-200 transition-colors">
                  Fix
                </button>
              </div>
            </div>
          </div>

          <!-- Step Content - Mobile optimized spacing -->
          <div class="p-4 md:p-5 space-y-4">
            <!-- Step Details Grid - Stacked on mobile for simplicity -->
            <div class="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
              <div class="space-y-3">
                <div class="bg-blue-50 rounded-lg p-3 md:p-3">
                  <h4 class="text-base md:text-sm font-semibold text-blue-800 mb-2 md:mb-1 flex items-center">
                    <svg class="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Tools Required
                  </h4>
                  <p class="text-base md:text-sm text-blue-700 leading-relaxed">{{ currentStep.tools }}</p>
                </div>
                
                <div class="bg-orange-50 rounded-lg p-3 md:p-3">
                  <h4 class="text-base md:text-sm font-semibold text-orange-800 mb-2 md:mb-1 flex items-center">
                    <svg class="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    Spare Parts
                  </h4>
                  <p class="text-base md:text-sm text-orange-700 leading-relaxed">{{ currentStep.spare_parts }}</p>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="bg-green-50 rounded-lg p-3 md:p-3">
                  <h4 class="text-base md:text-sm font-semibold text-green-800 mb-2 md:mb-1 flex items-center">
                    <svg class="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Procedure
                  </h4>
                  <p class="text-base md:text-sm text-green-700 whitespace-pre-line leading-relaxed">{{ currentStep.procedure }}</p>
                </div>
                
                <div class="bg-purple-50 rounded-lg p-3 md:p-3">
                  <h4 class="text-base md:text-sm font-semibold text-purple-800 mb-2 md:mb-1 flex items-center">
                    <svg class="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    Solution
                  </h4>
                  <p class="text-base md:text-sm text-purple-700 whitespace-pre-line leading-relaxed">{{ currentStep.solution }}</p>
                </div>
              </div>
            </div>

            <!-- Progress Notes -->
            <div v-if="currentStep.notes" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 class="text-sm font-semibold text-blue-800 mb-1 flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Notes
              </h4>
              <p class="text-sm text-blue-700">{{ currentStep.notes }}</p>
            </div>

            <!-- Existing Images -->
            <div v-if="currentStepImages.length" class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-700 flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Previous Uploads
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

            <!-- Spare Parts Used -->
            <div v-if="currentStep.spare_parts_used" class="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 class="text-sm font-semibold text-orange-800 mb-1 flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                Spare Parts Used
              </h4>
              <p class="text-sm text-orange-700">{{ currentStep.spare_parts_used }}</p>
            </div>

            <!-- Action Button -->
            <div v-if="!readOnly" class="pt-4 border-t border-gray-200">
              <div v-if="!canAccessStep(currentStepIndex)" class="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center">
                <svg class="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                Please complete all previous steps (Done or Not Applicable) before updating this step.
              </div>
              <button @click="openStepModal(currentStep)" 
                      :disabled="!canAccessStep(currentStepIndex)"
                      class="w-full flex items-center justify-center px-6 py-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-semibold md:font-medium touch-manipulation">
                <svg class="h-6 w-6 md:h-5 md:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Update Step Status
              </button>
            </div>
          </div>
        </div>

        <!-- Navigation Controls - Mobile optimized with larger touch targets -->
        <div v-if="networkArchitecture && checklist.length > 0" class="flex-shrink-0 flex items-center justify-between bg-gray-50 rounded-lg p-3 md:p-4">
          <button @click="previousStep" 
                  :disabled="currentStepIndex === 0"
                  class="flex items-center px-5 py-3 md:px-4 md:py-2 text-gray-600 border-2 md:border border-gray-300 rounded-lg hover:bg-white hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-medium touch-manipulation">
            <svg class="h-5 w-5 md:h-4 md:w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span class="hidden sm:inline">Previous</span>
            <span class="sm:hidden">Prev</span>
          </button>

          <div ref="stepIndicatorsContainer" class="flex space-x-1.5 md:space-x-1 mx-2 overflow-x-auto max-w-[60%] md:max-w-none px-2 scroll-smooth no-scrollbar">
            <button v-for="(step, index) in checklist" 
                    :key="step.step_id"
                    :ref="el => { if (el) stepIndicatorRefs[index] = el as HTMLButtonElement }"
                    @click="goToStep(index)"
                    class="w-4 h-4 md:w-3 md:h-3 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0 touch-manipulation"
                    :class="{
                      'bg-green-500 shadow-lg': step.status === 'done',
                      'bg-yellow-500 shadow-lg': step.status === 'needs_spare_parts',
                      'bg-red-500 shadow-lg': step.status === 'not_applicable',
                      'bg-gray-300': step.status === 'pending',
                      'ring-2 ring-blue-500 ring-offset-2': index === currentStepIndex
                    }"
                    :title="`Step ${index + 1}: ${step.title}`">
            </button>
          </div>

          <button @click="nextStep" 
                  :disabled="currentStepIndex === checklist.length - 1"
                  class="flex items-center px-5 py-3 md:px-4 md:py-2 text-gray-600 border-2 md:border border-gray-300 rounded-lg hover:bg-white hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-medium touch-manipulation">
            <span>Next</span>
            <svg class="h-5 w-5 md:h-4 md:w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- Complete Job Section -->
        <div v-if="!readOnly && networkArchitecture && allStepsCompleted" class="bg-green-50 border border-green-200 rounded-lg p-5">
          <div class="text-center">
            <div class="flex items-center justify-center mb-3">
              <svg class="h-8 w-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-lg font-semibold text-green-800">All Steps Completed!</h3>
            </div>
            <p class="text-sm text-green-700 mb-4">You can now mark this job as completed.</p>
            <button @click="completeJob" 
                    :disabled="completing"
                    class="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 md:px-6 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-semibold md:font-medium touch-manipulation">
              <svg v-if="completing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ completing ? 'Completing...' : 'Complete Job' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Step Update Modal - Full screen on mobile -->
    <div v-if="showStepModal" class="fixed inset-0 bg-black bg-opacity-50 md:bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div class="bg-white rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:w-full md:max-w-2xl md:max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header - Mobile optimized -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-6 py-4 flex-shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="text-base md:text-lg font-semibold text-white">Update Step</h3>
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
                    class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation">
              <option value="done">✅ Done</option>
              <option value="fix">🔧 Fix</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Notes</label>
            <textarea v-model="stepUpdate.notes" 
                      rows="4" 
                      class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-base md:text-sm"
                      placeholder="Add any notes about this step..."></textarea>
          </div>

          <!-- Image Upload -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              Progress Images 
              <span class="text-gray-500 font-normal">(Fix requires 2 images)</span>
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <input type="file" 
                     multiple 
                     accept="image/*" 
                     @change="handleImageUpload"
                     class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p class="text-xs text-gray-500 mt-2">Upload images showing your progress on this step</p>
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
            <label class="block text-sm font-medium text-gray-700">Spare Parts Used</label>
            <select v-model="stepUpdate.sparePartsUsed" 
                    class="w-full px-4 py-3 md:px-3 md:py-2.5 border-2 md:border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base md:text-sm touch-manipulation">
              <option value="">Select spare parts...</option>
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
            Cancel
          </button>
          <button @click="updateStep" 
                  :disabled="updating"
                  class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base md:text-sm font-semibold md:font-medium touch-manipulation">
            <svg v-if="updating" class="animate-spin -ml-1 mr-2 h-5 w-5 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ updating ? 'Updating...' : 'Update Step' }}
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

const props = defineProps<{
  ticketId: number
  technicianId: string
  readOnly?: boolean
}>()

const readOnly = computed(() => !!props.readOnly)

const emit = defineEmits<{
  jobCompleted: []
}>()

// Simple notification system
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  // Simple alert for now - you can replace with your preferred notification system
  if (type === 'error') {
    alert(`Error: ${message}`)
  } else {
    alert(`Success: ${message}`)
  }
}

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

// Refs for step indicators auto-scroll
const stepIndicatorsContainer = ref<HTMLElement | null>(null)
const stepIndicatorRefs = ref<Record<number, HTMLButtonElement>>({})

// Computed
const progressPercentage = computed(() => {
  if (checklist.value.length === 0) return 0
  const completed = checklist.value.filter(step => step.status === 'done' || step.status === 'needs_spare_parts').length
  return Math.round((completed / checklist.value.length) * 100)
})

const completedSteps = computed(() => {
  if (checklist.value.length === 0) return 0
  return checklist.value.filter(step => step.status === 'done' || step.status === 'needs_spare_parts').length
})

const allStepsCompleted = computed(() => {
  return checklist.value.length > 0 && checklist.value.every(step => step.status === 'done' || step.status === 'needs_spare_parts')
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
    }

    if (prevStepId) {
      const idx = checklist.value.findIndex(s => s.step_id === prevStepId)
      if (idx >= 0) currentStepIndex.value = idx
    }
  } catch (error: any) {
    showNotification(error.message, 'error')
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
      showNotification('Assign at least one technician', 'error')
      return
    }
    const ids = members.map(m => m.user_id)
    const setIds = new Set(ids)
    if (setIds.size !== ids.length) {
      showNotification('One technician cannot occupy multiple roles', 'error')
      return
    }

    savingTeam.value = true
    await ticketsApi().setTeam(props.ticketId, members)
    showNotification('Team saved', 'success')
    await loadTeamMembers()
  } catch (e: any) {
    showNotification(e.message || 'Failed to save team', 'error')
  } finally {
    savingTeam.value = false
  }
}

const selectArchitecture = async (architecture: string) => {
  try {
    await ticketsApi().setNetworkArchitecture(props.ticketId, architecture)
    networkArchitecture.value = architecture
    showNotification(`Network architecture set to ${architecture}`, 'success')
  } catch (error: any) {
    showNotification(error.message, 'error')
  }
}

const openStepModal = (step: ChecklistStep) => {
  selectedStep.value = step
  stepUpdate.value = {
    status: step.status === 'needs_spare_parts' ? 'fix' : (step.status === 'done' ? 'done' : 'fix'),
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
    showNotification('Please upload at least 1 image for this step', 'error')
    return
  }

  // If Fix, require at least 2 total images (before and after)
  const isFix = stepUpdate.value.status === 'fix'
  if (isFix && (savedCount + newCount) < 2) {
    showNotification('Fix requires 2 images (before and after)', 'error')
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
    showNotification('Step updated successfully', 'success')
  } catch (error: any) {
    showNotification(error.message, 'error')
  } finally {
    updating.value = false
  }
}

const completeJob = async () => {
  completing.value = true
  try {
    await ticketsApi().markTechnicianJobCompleted(props.ticketId)
    showNotification('Job completed successfully', 'success')
    emit('jobCompleted')
    jobCompletedLocal.value = true
  } catch (error: any) {
    showNotification(error.message, 'error')
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
    case 'done': return 'Done'
    case 'needs_spare_parts': return 'Fix'
    case 'not_applicable': return 'N/A'
    default: return 'Pending'
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
    if (!canAccessStep(index)) {
      showNotification('Please complete previous steps first', 'error')
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

  // Check if all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const step = checklist.value[i]
    if (step.status !== 'done' && step.status !== 'not_applicable' && step.status !== 'needs_spare_parts') {
      return false
    }
  }
  return true
}

// Lifecycle
onMounted(() => {
  loadChecklist()
  loadSpareParts()
  loadTechnicians()
  loadTeamMembers()
})

// Simple image viewer modal
const showImageModal = ref(false)
const viewedImageUrl = ref('')
const openImage = (url: string) => { viewedImageUrl.value = url; showImageModal.value = true }
const closeImage = () => { showImageModal.value = false; viewedImageUrl.value = '' }
</script>
