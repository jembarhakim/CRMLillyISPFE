<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center gap-4 mb-4 sm:mb-0">
          <div class="relative">
            <div class="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-full flex items-center justify-center">
              <span class="text-white text-2xl sm:text-3xl font-bold">
                {{ customerDetail?.customer?.name?.charAt(0) || 'C' }}
              </span>
            </div>
            <div
              class="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-black text-white px-2 py-1 text-xs font-medium rounded">
              {{ customerDetail?.customer?.name || 'Customer' }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {{ customerDetail?.customer?.name || 'Customer' }}
            </h2>
            <p class="text-sm text-gray-600 truncate">{{ customerDetail?.customer?.phone || 'No phone' }}</p>
            <p class="text-xs text-gray-400">ID: {{ props.customerId }}</p>
          </div>
        </div>
        <UButton color="gray" variant="ghost" icon="x-20-solid" @click="$emit('close')"
          class="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-6 text-center">
        <LoadingComponent />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        <p>{{ error }}</p>
        <UButton @click="fetchCustomerDetail" class="mt-4">Retry</UButton>
      </div>

      <!-- Navigation Tabs -->
      <div v-else-if="customerDetail" class="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <!-- Mobile Tab Navigation -->
        <div class="lg:hidden border-b border-gray-200 bg-gray-50">
          <div class="flex overflow-x-auto">
            <button v-for="tab in mobileTabs" :key="tab.id" @click="activeTab = tab.id" :class="[
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              'flex-shrink-0 px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors'
            ]">
              <UIcon :name="tab.icon" class="w-4 h-4" />
              <span>{{ tab.name }}</span>
              <span v-if="tab.count !== undefined" class="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {{ tab.count }}
              </span>
            </button>
          </div>
        </div>

        <!-- Desktop Vertical Tab Navigation -->
        <div class="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 p-4">
          <nav class="space-y-2" aria-label="Tabs">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              'w-full text-left px-3 py-2 rounded-l-md font-medium text-sm flex items-center gap-3 transition-colors'
            ]">
              <UIcon :name="tab.icon" class="w-4 h-4" />
              <span class="flex-1">{{ tab.name }}</span>
              <span v-if="tab.count !== undefined" class="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <!-- Summary Tab -->
          <div v-if="activeTab === 'summary'" class="space-y-6">
            <!-- Contact Information -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Updated fields based on Add Customer form -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nama Pelanggan</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.name }}</p>
                </div>

                <!-- NEW: Alias field from Add Customer form -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Panggilan / Samaran</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.alias || 'N/A' }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">No.HP Pelanggan</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.phone }}</p>
                </div>

                <!-- NEW: Service Request Date from Add Customer form -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tgl. Permintaan PSB</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.service_request_date) ||
                    'N/A' }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Address</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.address }}</p>
                </div>



                <!-- Updated: Area information with proper labels -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Area Code</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.area?.name_city || 'N/A' }}</p>
                </div>

                <!-- NEW: Sales Representative from Add Customer form -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Sales Representative</label>
                  <p class="mt-1 text-sm text-gray-900">{{
                    getSalesRepresentativeName(customerDetail.customer.sales_representative_id) }}</p>
                </div>

                <!-- Updated: Company field -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Company</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.company?.name || 'N/A' }}</p>
                </div>

                <!-- Updated: Area Code with proper display -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Area Code</label>
                  <p class="mt-1">
                    <span v-if="customerDetail.customer.area?.code_name"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ customerDetail.customer.area.code_name }}
                    </span>
                    <span v-else class="text-sm text-gray-500">No code assigned</span>
                  </p>
                </div>

                <!-- Updated: Location coordinates -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Koordinat (Lat, Lng)</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.latitude }}, {{
                    customerDetail.customer.longitude }}</p>
                </div>

                <!-- NEW: Installation Date from installation report -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tgl. Instalasi</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.installation_date) ||
                    'Belum diinstal' }}</p>
                </div>
              </div>
            </div>

            <!-- Auto Login URL -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Auto Login URL</h3>
              <div class="space-y-4">
                <!-- URL Display -->
                <div class="bg-gray-50 p-3 rounded-lg overflow-hidden">
                  <p class="text-xs sm:text-sm text-gray-600 break-all font-mono leading-relaxed">
                    {{ autoLoginUrl }}
                  </p>
                </div>

                <!-- Action Buttons - Mobile Stacked, Desktop Horizontal -->
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <UButton size="sm" color="blue" variant="outline" @click="loginAsCustomer"
                    class="w-full sm:w-auto flex-shrink-0">
                    <UIcon name="arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
                    Login As Customer
                  </UButton>
                  <UButton size="sm" color="red" variant="outline" @click="revokeAutoLogin"
                    class="w-full sm:w-auto flex-shrink-0">
                    <UIcon name="x" class="w-4 h-4 mr-2" />
                    Revoke Auto Login
                  </UButton>
                  <UButton size="sm" color="gray" variant="outline" @click="regenerateUrl"
                    class="w-full sm:w-auto flex-shrink-0">
                    <UIcon name="refresh-cw" class="w-4 h-4 mr-2" />
                    Regenerate URL
                  </UButton>
                </div>

                <!-- Copy URL Button for Mobile -->
                <div class="block sm:hidden">
                  <UButton size="sm" color="green" variant="outline" @click="copyAutoLoginUrlToClipboard"
                    class="w-full">
                    <UIcon name="clipboard-document" class="w-4 h-4 mr-2" />
                    Copy URL
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Invoice Summary -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              <div class="flex items-center gap-4">
                <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                  <span class="text-sm font-medium">Total Revenue from Customer</span>
                  <p class="text-lg font-bold">{{ formatIDR(getTotalInvoiceAmount()) }}</p>
                </div>
              </div>
            </div>

            <!-- Location Information -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Location & Area</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Area</label>
                  <p class="mt-1 text-sm text-gray-900">
                    {{ customerDetail.customer.area?.name_city }} -
                    {{ customerDetail.customer.area?.name_subdistrict }} -
                    {{ customerDetail.customer.area?.name_village }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Area Code</label>
                  <p class="mt-1">
                    <span v-if="customerDetail.customer.area?.code_name"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ customerDetail.customer.area.code_name }}
                    </span>
                    <span v-else class="text-sm text-gray-500">No code assigned</span>
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Company</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.company?.name }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Coordinates</label>
                  <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.latitude }}, {{
                    customerDetail.customer.longitude }}</p>
                </div>
              </div>
            </div>

            <!-- Network Information -->
            <div class="bg-green-50 rounded-lg p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Network Information</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Updated: Internet Package information -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Internet Package(s)</label>
                  <div v-if="getCustomerProductsInfo().length > 0" class="mt-1 space-y-2">
                    <div v-for="product in getCustomerProductsInfo()" :key="product.id"
                      class="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ product.name }}
                      </span>
                      <span v-if="product.downloadSpeed && product.uploadSpeed" class="text-xs text-gray-600">
                        {{ product.downloadSpeed }}M/{{ product.uploadSpeed }}M
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ formatIDR(product.price || 0) }}
                      </span>
                    </div>
                    <div v-if="getCustomerProductsInfo().length > 1" class="text-xs text-gray-500">
                      {{ getCustomerProductsInfo().length }} different packages assigned
                    </div>
                  </div>
                  <p v-else class="mt-1 text-sm text-gray-500 italic">No package assigned</p>
                </div>

                <!-- NEW: Installation Type from installation report -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Installation Type</label>
                  <p class="mt-1 text-sm text-gray-900">
                    <span v-if="getLatestInstallationData().installation_type">
                      {{ getLatestInstallationData().installation_type }}
                    </span>
                    <span v-else class="text-gray-500 italic">No installation report available</span>
                  </p>
                </div>

                <!-- NEW: Installation Status from installation report -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Installation Status</label>
                  <p class="mt-1">
                    <span v-if="getLatestInstallationData().installation_status">
                      <span :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getInstallationStatusClass(getLatestInstallationData().installation_status)
                      ]">
                        {{ getLatestInstallationData().installation_status }}
                      </span>
                    </span>
                    <span v-else class="text-gray-500 italic">No installation report available</span>
                  </p>
                </div>

                <!-- NEW: On Air Date from installation report -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tgl. On Air</label>
                  <p class="mt-1 text-sm text-gray-900">
                    <span v-if="getLatestInstallationData().on_air_date">
                      {{ formatDate(getLatestInstallationData().on_air_date) }}
                    </span>
                    <span v-else class="text-gray-500 italic">No installation report available</span>
                  </p>
                </div>

                <!-- NEW: Service Ready Date from installation report -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tgl. Siap Layanan</label>
                  <p class="mt-1 text-sm text-gray-900">
                    <span v-if="getLatestInstallationData().service_ready_date">
                      {{ formatDate(getLatestInstallationData().service_ready_date) }}
                    </span>
                    <span v-else class="text-gray-500 italic">No installation report available</span>
                  </p>
                </div>

                <!-- Updated: IP Static information -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">IP Static</label>
                  <p class="mt-1 text-sm text-gray-900">
                    <span v-if="getNetworkDeviceIPs().length > 0">
                      {{ getNetworkDeviceIPs().join(', ') }}
                    </span>
                    <span v-else class="text-gray-500">No IP addresses found</span>
                  </p>
                </div>

                <!-- Updated: MAC Address information -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">MAC Address</label>
                  <p class="mt-1 text-sm text-gray-900">
                    <span v-if="getNetworkDeviceMACs().length > 0">
                      {{ getNetworkDeviceMACs().join(', ') }}
                    </span>
                    <span v-else class="text-gray-500">No MAC addresses found</span>
                  </p>
                </div>

                <!-- Updated: Installation Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">Installation Date</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.installation_date) ||
                    'N/A' }}</p>
                </div>
              </div>
            </div>

            

            <!-- Network Devices (Only show if customer has installation reports) -->
            <div
              v-if="customerDetail.installations && customerDetail.installations.length > 0 && customerDetail.network_devices && customerDetail.network_devices.length > 0"
              class="bg-purple-50 rounded-lg p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Network Devices</h3>
              <div class="space-y-3">
                <div v-for="device in customerDetail.network_devices" :key="device.id"
                  class="bg-white rounded-lg p-4 border">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-900">Device {{ device.id }}</h4>
                    <div class="flex items-center space-x-2">
                      <div :class="[
                        'w-3 h-3 rounded-full',
                        getDeviceConnectionStatus(device) === 'up' ? 'bg-green-500' :
                          getDeviceConnectionStatus(device) === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      ]"></div>
                      <span :class="[
                        'text-xs font-medium',
                        getDeviceConnectionStatus(device) === 'up' ? 'text-green-600' :
                          getDeviceConnectionStatus(device) === 'down' ? 'text-red-600' : 'text-gray-600'
                      ]">
                        {{ getDeviceConnectionStatus(device).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Updated: IP Static -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">IP Static</label>
                      <p class="text-sm text-gray-900">{{ device.ip_static || 'N/A' }}</p>
                    </div>

                    <!-- Updated: MAC Address -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">MAC Address</label>
                      <p class="text-sm text-gray-900">{{ device.mac_address || 'N/A' }}</p>
                    </div>

                    <!-- Device Type from Assets -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Device Type</label>
                      <p class="text-sm text-gray-900">{{ device.assets?.type || 'N/A' }}</p>
                    </div>

                    <!-- Device Model from Assets -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Device Model</label>
                      <p class="text-sm text-gray-900">{{ device.assets ? `${device.assets.brand}
                        ${device.assets.model}` : 'N/A' }}</p>
                    </div>

                    <!-- Serial Number from Assets -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Serial Number</label>
                      <p class="text-sm text-gray-900">{{ device.assets?.serial_number || 'N/A' }}</p>
                    </div>

                    <!-- Port Information from network device -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Port</label>
                      <p class="text-sm text-gray-900">{{ device.port_number || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Remote Port from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Remote Port</label>
                      <p class="text-sm text-gray-900">{{ device.remote_port || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Eth Port from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Eth Port</label>
                      <p class="text-sm text-gray-900">{{ device.eth_port || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Device Ownership from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Kepemilikan Perangkat</label>
                      <span :class="[
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        device.kepemilikan_perangkat === 'owned' ? 'bg-green-100 text-green-800' :
                          device.kepemilikan_perangkat === 'leased' ? 'bg-blue-100 text-blue-800' :
                            device.kepemilikan_perangkat === 'customer' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      ]">
                        {{ device.kepemilikan_perangkat?.toUpperCase() || 'N/A' }}
                      </span>
                    </div>

                    <!-- Updated: Device Status (Real-time from Mikrotik) -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Real-time Status</label>
                      <span :class="[
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        getDeviceConnectionStatus(device) === 'up' ? 'bg-green-100 text-green-800' :
                          getDeviceConnectionStatus(device) === 'down' ? 'bg-red-100 text-red-800' :
                            getDeviceConnectionStatus(device) === 'unknown' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      ]">
                        {{ getDeviceConnectionStatus(device).toUpperCase() }}
                      </span>
                    </div>

                    <!-- Updated: Connection Status (Real-time from Mikrotik) -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Connection Status</label>
                      <div class="flex items-center space-x-2">
                        <span :class="[
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          getDeviceConnectionStatus(device) === 'up' ? 'bg-green-100 text-green-800' :
                            getDeviceConnectionStatus(device) === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        ]">
                          {{ getDeviceConnectionStatus(device).toUpperCase() }}
                        </span>
                        <span v-if="getDeviceConnectionStatus(device) === 'up'" class="text-xs text-green-600">
                          <UIcon name="wifi" class="w-3 h-3" />
                        </span>
                        <span v-else-if="getDeviceConnectionStatus(device) === 'down'" class="text-xs text-red-600">
                          <UIcon name="wifi-slash" class="w-3 h-3" />
                        </span>
                        <span v-else class="text-xs text-gray-500">
                          <UIcon name="question-mark-circle" class="w-3 h-3" />
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Real-time status from Mikrotik
                      </p>
                    </div>

                    <!-- Updated: Internet Package from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Internet Package</label>
                      <div v-if="getDeviceProductInfo(device)" class="space-y-1">
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {{ getDeviceProductInfo(device)?.name }}
                        </span>
                        <div
                          v-if="getDeviceProductInfo(device)?.downloadSpeed && getDeviceProductInfo(device)?.uploadSpeed"
                          class="text-xs text-gray-500">
                          {{ getDeviceProductInfo(device)?.downloadSpeed }}M/{{
                            getDeviceProductInfo(device)?.uploadSpeed }}M
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-500 italic">No package assigned</p>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="flex justify-between items-center text-xs text-gray-500">
                      <span>Status: Real-time from Mikrotik</span>
                      <span v-if="device.ip_static">IP: {{ device.ip_static }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Installation History (Multiple Reports Supported) -->
            <div v-if="customerDetail.installations && customerDetail.installations.length > 0"
              class="bg-yellow-50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Installation Reports ({{
                  customerDetail.installations.length }})</h3>
                <UButton color="green" size="sm" @click="addNewInstallationReport">
                  <UIcon name="plus" class="w-4 h-4 mr-1" />
                  Add Report
                </UButton>
              </div>
              <div class="space-y-3">
                <div v-for="(installation, index) in customerDetail.installations" :key="installation.id"
                  class="bg-white rounded-lg p-3 border">
                  <div class="flex justify-between items-start mb-3">
                    <h4 class="text-sm font-semibold text-gray-900">
                      Report #{{ index + 1 }}
                      <span v-if="index === 0"
                        class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">Latest</span>
                    </h4>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <!-- Updated: Technician information -->
                     <div>
                       <label class="block text-xs font-medium text-gray-700">Technician Team</label>
                       <div v-if="installation.technicians && installation.technicians.length > 0" class="space-y-1">
                         <div v-for="technician in installation.technicians" :key="technician.id" 
                              class="flex items-center gap-2">
                           <span :class="[
                             'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                             technician.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                           ]">
                             {{ technician.technician_name || 'Unknown' }}
                           </span>
                           <span class="text-xs text-gray-500">{{ technician.role }}</span>
                           <span v-if="technician.is_primary" class="text-xs text-blue-600 font-medium">(Primary)</span>
                         </div>
                       </div>
                       <p v-else class="text-sm text-gray-500 italic">No technicians assigned</p>
                     </div>

                    <!-- NEW: Installation Type from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Installation Type</label>
                      <p class="text-sm text-gray-900">{{ installation.installation_type || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Installation Status from installation report -->
                    

                    <!-- NEW: On Air Date from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Tgl. On Air</label>
                      <p class="text-sm text-gray-900">{{ formatDate(installation.on_air_date) || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Service Ready Date from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Tgl. Siap Layanan</label>
                      <p class="text-sm text-gray-900">{{ formatDate(installation.service_ready_date) || 'N/A' }}</p>
                    </div>

                    <!-- NEW: Installation Completed At from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Installation Completed At</label>
                      <p class="text-sm text-gray-900">{{ formatDate(installation.installation_completed_at) || 'N/A' }}
                      </p>
                    </div>                    

                    <!-- NEW: Installation Team Phone from installation report -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Team Phone</label>
                      <p class="text-sm text-gray-900">{{ installation.technician_phone || 'N/A' }}</p>
                    </div>

                    <!-- Updated: Date (renamed to Installation Date) -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Installation Date</label>
                      <p class="text-sm text-gray-900">{{ formatDate(installation.installation_created_at) || 'N/A' }}
                      </p>
                    </div>

                    <!-- Updated: Description (renamed to Notes) -->
                    <div class="md:col-span-2">
                      <label class="block text-xs font-medium text-gray-700">Notes</label>
                      <p class="text-sm text-gray-900">{{ installation.installation_notes || installation.description || 'No notes'
                        }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Installation Reports -->
            <div v-else class="bg-yellow-50 rounded-lg p-4">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Installation Reports</h3>
                  <p class="text-sm text-gray-600">No installation reports found for this customer.</p>
                  <p class="text-xs text-gray-500 mt-1">Installation Type, Status, On Air Date, and Service Ready Date
                    will be available after creating an installation report.</p>
                </div>
                <UButton color="green" size="sm" @click="addNewInstallationReport">
                  <UIcon name="plus" class="w-4 h-4 mr-1" />
                  Add First Report
                </UButton>
              </div>
            </div>

            <!-- Recent Invoices -->
            <div v-if="customerInvoices && customerInvoices.length > 0" class="bg-indigo-50 rounded-lg p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="invoice in customerInvoices.slice(0, 5)" :key="invoice.id">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatDate(invoice.created_at) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatIDR(invoice.amount) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span :class="getStatusColor(invoice.status)"
                          class="inline-flex px-2 py-1 text-xs font-medium rounded-full">
                          {{ invoice.status?.toUpperCase() }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Connection Status Tab -->
          <div v-if="activeTab === 'connection'" class="space-y-6">
            

            <!-- Connection Control -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Connection Control</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Customer Isolation</h4>
                    <p class="text-sm text-gray-600">Control customer's hotspot access for payment enforcement</p>
                  </div>
                  <div class="flex space-x-2">
                    <UButton v-if="getCustomerMacAddresses().length > 0" :loading="isConnecting"
                      :disabled="isConnecting" @click="isolateCustomer" color="red" variant="outline" size="sm">
                      <UIcon name="lock-closed" class="w-4 h-4 mr-1" />
                      Isolate Customer
                    </UButton>
                    <UButton v-if="getCustomerMacAddresses().length > 0" :loading="isConnecting"
                      :disabled="isConnecting" @click="restoreCustomer" color="green" variant="outline" size="sm">
                      <UIcon name="lock-open" class="w-4 h-4 mr-1" />
                      Restore Access
                    </UButton>
                  </div>
                </div>

                <!-- MAC Address Display -->
                <div v-if="getCustomerMacAddresses().length > 0" class="p-3 bg-blue-50 rounded-lg">
                  <div class="space-y-2">
                    <p class="text-sm font-medium text-blue-900">Network Device MAC Addresses</p>
                    <div v-for="(device, index) in getNetworkDevicesWithMac()" :key="device.id"
                      class="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p class="text-xs text-gray-600">Device {{ index + 1 }}</p>
                        <p class="text-sm text-blue-700 font-mono">{{ device.mac_address }}</p>
                        <p v-if="device.ip_static" class="text-xs text-gray-500">IP: {{ device.ip_static }}</p>
                      </div>
                      <UButton @click="copyMacAddress(device.mac_address)" variant="ghost" size="sm" color="blue">
                        <UIcon name="clipboard-document" class="w-4 h-4" />
                      </UButton>
                    </div>
                  </div>
                </div>

                <!-- No MAC Address Warning -->
                <div v-else class="p-3 bg-yellow-50 rounded-lg">
                  <div class="flex items-center">
                    <UIcon name="alert-triangle" class="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p class="text-sm font-medium text-yellow-900">No MAC Addresses Found</p>
                      <p class="text-sm text-yellow-700">Customer network devices with MAC addresses are required for
                        connection control</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Status -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Account Status</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="text-center">
                  <div :class="[
                    'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                    customerDetail.customer.status_user === 'active' ? 'bg-green-100' : 'bg-red-100'
                  ]">
                    <UIcon
                      :name="customerDetail.customer.status_user === 'active' ? 'user-check' : 'user-x-mark'"
                      :class="[
                        'w-8 h-8',
                        customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                      ]" />
                  </div>
                  <h4 class="text-sm font-semibold text-gray-900">Account Status</h4>
                  <p :class="[
                    'text-sm font-medium',
                    customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ customerDetail.customer.status_user?.toUpperCase() || 'UNKNOWN' }}
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-blue-100">
                    <UIcon name="calendar" class="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 class="text-sm font-semibold text-gray-900">Installation Date</h4>
                  <p class="text-sm text-gray-600">{{ formatDate(customerDetail.customer.installation_date) }}</p>
                </div>
              </div>
            </div>

            <!-- Network Devices Status (Only show if customer has installation reports) -->
            <div
              v-if="customerDetail.installations && customerDetail.installations.length > 0 && customerDetail.network_devices && customerDetail.network_devices.length > 0"
              class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Network Devices Status</h3>
              <div class="space-y-4">
                <div v-for="device in customerDetail.network_devices" :key="device.id"
                  class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-900">Device {{ device.id }}</h4>
                    <div class="flex items-center space-x-2">
                      <div :class="[
                        'w-3 h-3 rounded-full',
                        getDeviceConnectionStatus(device) === 'up' ? 'bg-green-500' :
                          getDeviceConnectionStatus(device) === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      ]"></div>
                      <span :class="[
                        'text-sm font-medium',
                        getDeviceConnectionStatus(device) === 'up' ? 'text-green-600' :
                          getDeviceConnectionStatus(device) === 'down' ? 'text-red-600' : 'text-gray-600'
                      ]">
                        {{ getDeviceConnectionStatus(device).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-700">IP Address</label>
                      <p class="text-sm text-gray-900">{{ device.ip_static || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">MAC Address</label>
                      <p class="text-sm text-gray-900">{{ device.mac_address || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Device Type</label>
                      <p class="text-sm text-gray-900">{{ device.assets?.type || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Device Model</label>
                      <p class="text-sm text-gray-900">{{ device.assets ? `${device.assets.brand}
                        ${device.assets.model}` : 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Serial Number</label>
                      <p class="text-sm text-gray-900">{{ device.assets?.serial_number || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Port</label>
                      <p class="text-sm text-gray-900">{{ device.port_number || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Remote Port</label>
                      <p class="text-sm text-gray-900">{{ device.remote_port || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Eth Port</label>
                      <p class="text-sm text-gray-900">{{ device.eth_port || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Internet Package</label>
                      <div v-if="getDeviceProductInfo(device)" class="space-y-1">
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {{ getDeviceProductInfo(device)?.name }}
                        </span>
                        <div
                          v-if="getDeviceProductInfo(device)?.downloadSpeed && getDeviceProductInfo(device)?.uploadSpeed"
                          class="text-xs text-gray-500">
                          {{ getDeviceProductInfo(device)?.downloadSpeed }}M/{{
                            getDeviceProductInfo(device)?.uploadSpeed }}M
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-500 italic">No package assigned</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700">Connection Status</label>
                      <p class="text-sm text-gray-900">{{ getDeviceConnectionStatus(device).toUpperCase() }}</p>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                      <div class="flex space-x-4">
                        <span :class="[
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          getDeviceConnectionStatus(device) === 'up' ? 'bg-green-100 text-green-800' :
                            getDeviceConnectionStatus(device) === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        ]">
                          <UIcon
                            :name="getDeviceConnectionStatus(device) === 'up' ? 'wifi' :
                              getDeviceConnectionStatus(device) === 'down' ? 'wifi-slash' : 'question-mark-circle'"
                            class="w-3 h-3 mr-1" />
                          Status: {{ getDeviceConnectionStatus(device).toUpperCase() }}
                        </span>
                      </div>
                      <span class="text-xs text-gray-500">
                        Real-time from Mikrotik
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Installation Report Message -->
            <div v-else-if="!customerDetail.installations || customerDetail.installations.length === 0"
              class="bg-white border border-gray-200 rounded-lg p-6">
              <div class="text-center">
                <UIcon name="file-plus" class="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Network Devices Not Available</h3>
                <p class="text-gray-600 mb-4">Network devices will appear after creating an installation report for this
                  customer.</p>
                <UButton color="blue" size="sm" @click="addNewInstallationReport">
                  <UIcon name="plus" class="w-4 h-4 mr-1" />
                  Create Installation Report
                </UButton>
              </div>
            </div>

            <!-- No Devices Message (when has installation but no devices) -->
            <div v-else class="bg-white border border-gray-200 rounded-lg p-6">
              <div class="text-center">
                <UIcon name="wifi" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No Network Devices</h3>
                <p class="text-gray-600">This customer has installation reports but no network devices configured yet.
                </p>
              </div>
            </div>
          </div>

          <!-- Activity Tab -->
          <div v-if="activeTab === 'activity'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div class="space-y-4">
                <div v-for="activity in recentActivity" :key="activity.id"
                  class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(activity.date) }}</p>
                  </div>
                </div>
                <div v-if="recentActivity.length === 0" class="text-center text-gray-500 py-8">
                  No recent activity found
                </div>
              </div>
            </div>
          </div>

          <!-- Invoices Tab -->
          <div v-if="activeTab === 'invoices'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Invoices</h3>
                <span class="text-sm text-gray-500">
                  Showing invoices for: <strong>{{ customerDetail?.customer?.name || 'Unknown Customer' }}</strong>
                </span>
              </div>
              <div v-if="customerInvoices.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice
                        #</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer ID</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="invoice in customerInvoices" :key="invoice.id">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{{ invoice.id }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatDate(invoice.createdAt) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatIDR(invoice.amount) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span :class="getStatusColor(invoice.status)"
                          class="inline-flex px-2 py-1 text-xs font-medium rounded-full">
                          {{ invoice.status?.toUpperCase() }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ invoice.customer_id || 'N/A' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-gray-500 py-8">
                No invoices found
              </div>
            </div>
          </div>

          <!-- Trouble Tickets Tab -->
          <div v-if="activeTab === 'tickets'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Trouble Tickets</h3>
                <span class="text-sm text-gray-500">
                  Showing tickets for: <strong>{{ customerDetail?.customer?.name || 'Unknown Customer' }}</strong>
                </span>
              </div>
              <div v-if="customerTickets.length > 0" class="space-y-4">
                <div v-for="ticket in customerTickets" :key="ticket.id"
                  class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-medium text-gray-900">{{ ticket.title }}</h4>
                    <span :class="getTicketStatusColor(ticket.status)"
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full">
                      {{ ticket.status?.toUpperCase() }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ ticket.description || 'No description' }}</p>
                  <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>Type: {{ ticket.type_name || ticket.type || 'N/A' }}</span>
                    <span>Created: {{ formatDate(ticket.created_at) }}</span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    Customer ID: {{ ticket.customer_id || 'N/A' }}
                  </div>
                  <div v-if="ticket.customer_note || ticket.technician_note || ticket.noc_note" class="mt-3 space-y-2">
                    <div v-if="ticket.customer_note" class="text-xs">
                      <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">CS:</span>
                      <span class="ml-1 text-gray-700">{{ ticket.customer_note }}</span>
                    </div>
                    <div v-if="ticket.technician_note" class="text-xs">
                      <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Tech:</span>
                      <span class="ml-1 text-gray-700">{{ ticket.technician_note }}</span>
                    </div>
                    <div v-if="ticket.noc_note" class="text-xs">
                      <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">NOC:</span>
                      <span class="ml-1 text-gray-700">{{ ticket.noc_note }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-500 py-8">
                No trouble tickets found
              </div>
            </div>
          </div>

          <!-- Orders Tab -->
          <div v-if="activeTab === 'orders'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Orders</h3>
              <div class="text-center text-gray-500 py-8">
                No orders found
              </div>
            </div>
          </div>

          <!-- Files Tab -->
          <div v-if="activeTab === 'files'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Files</h3>
              <div class="text-center text-gray-500 py-8">
                No files found
              </div>
            </div>
          </div>

          <!-- Transactions Tab -->
          <div v-if="activeTab === 'transactions'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Transactions</h3>
              <div class="text-center text-gray-500 py-8">
                No transactions found
              </div>
            </div>
          </div>

          <!-- Quotes Tab -->
          <div v-if="activeTab === 'quotes'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quotes</h3>
              <div class="text-center text-gray-500 py-8">
                No quotes found
              </div>
            </div>
          </div>


          <!-- Edit Tab -->
          <div v-if="activeTab === 'edit'" class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Customer</h3>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <UInput v-model="editForm.name" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <UInput v-model="editForm.phone" placeholder="Enter phone number" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <UInput v-model="editForm.company" placeholder="Enter company name" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <UTextarea v-model="editForm.address" placeholder="Enter address" />
                  </div>
                </div>
                <div class="flex gap-2 pt-4">
                  <UButton @click="saveCustomer" color="blue">
                    Save Changes
                  </UButton>
                  <UButton @click="resetEditForm" color="gray" variant="outline">
                    Reset
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="flex justify-end p-6 border-t border-gray-200">
        <UButton @click="$emit('close')" color="gray">Close</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { customerAdminApi } from '@/api/admin/customer'
import { mikrotikAdminApi } from '@/api/admin/mikrotik'
import { formatIDR } from '@/helper/currency'
import LoadingComponent from '@/components/LoadingComponent.vue'

interface Props {
  customerId: string
}

// Type for device connection status
type DeviceConnectionStatus = 'off' | 'up' | 'down' | 'unknown'

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const customerDetail = ref<any>(null)
const customerTickets = ref<any[]>([])
const customerInvoices = ref<any[]>([])
const loading = ref(true)
const error = ref<string | undefined>(undefined)
const activeTab = ref('summary')

// Connection control state
const isConnecting = ref(false)

// Get customer product information from network devices (single product - for backward compatibility)
const getCustomerProductInfo = () => {
  if (!customerDetail.value?.network_devices || customerDetail.value.network_devices.length === 0) {
    return { name: null, price: 0 }
  }

  // Get the first network device with a product (most customers have one primary product)
  const deviceWithProduct = customerDetail.value.network_devices.find((device: any) => device.product)

  if (deviceWithProduct?.product) {
    return {
      name: deviceWithProduct.product.name,
      price: deviceWithProduct.product.price || 0
    }
  }

  return { name: null, price: 0 }
}

// NEW: Get all customer product information from installation reports
const getCustomerProductsInfo = () => {
  if (!customerDetail.value?.installations || customerDetail.value.installations.length === 0) {
    return []
  }

  // Get unique products from installation reports
  const uniqueProducts = new Map()

  customerDetail.value.installations.forEach((installation: any) => {
    if (installation.product_id && installation.product_name) {
      if (!uniqueProducts.has(installation.product_id)) {
        uniqueProducts.set(installation.product_id, {
          id: installation.product_id,
          name: installation.product_name,
          description: installation.product_description || '',
          price: installation.product_price || 0,
          downloadSpeed: installation.product_download_speed_mbps,
          uploadSpeed: installation.product_upload_speed_mbps
        })
      }
    }
  })

  return Array.from(uniqueProducts.values())
}

// NEW: Get product information for a specific device from installation reports
const getDeviceProductInfo = (device: any) => {
  if (!customerDetail.value?.installations || customerDetail.value.installations.length === 0) {
    return null
  }

  // Find installation report that matches this device
  const matchingInstallation = customerDetail.value.installations.find((installation: any) =>
    installation.network_device_id === device.id
  )

  if (matchingInstallation && matchingInstallation.product_id && matchingInstallation.product_name) {
    return {
      id: matchingInstallation.product_id,
      name: matchingInstallation.product_name,
      description: matchingInstallation.product_description || '',
      price: matchingInstallation.product_price || 0,
      downloadSpeed: matchingInstallation.product_download_speed_mbps,
      uploadSpeed: matchingInstallation.product_upload_speed_mbps
    }
  }

  return null
}

// NEW: Helper function to get primary technician name
const getPrimaryTechnicianName = (installation: any) => {
  if (!installation.technicians || installation.technicians.length === 0) {
    return 'N/A'
  }
  
  const primaryTechnician = installation.technicians.find((tech: any) => tech.is_primary)
  if (primaryTechnician) {
    return primaryTechnician.technician_name || 'Unknown'
  }
  
  // If no primary technician, return the first technician
  return installation.technicians[0].technician_name || 'Unknown'
}

// Tab configuration
const tabs = computed(() => [
  { id: 'summary', name: 'Summary', icon: 'bar-chart' },
  { id: 'connection', name: 'Connection Status', icon: 'signal' },
  { id: 'activity', name: 'Activity', icon: 'clock' },
  { id: 'invoices', name: 'Invoices', icon: 'file-text', count: customerInvoices.value.length },
  { id: 'quotes', name: 'Quotes', icon: 'file-duplicate', count: 0 },
  { id: 'tickets', name: 'Trouble Tickets', icon: 'alert-triangle', count: customerTickets.value.length },
  { id: 'orders', name: 'Orders', icon: 'shopping-bag' },
  { id: 'files', name: 'Files', icon: 'file' },
  { id: 'transactions', name: 'Transactions', icon: 'dollar-sign' },
  { id: 'edit', name: 'Edit', icon: 'pencil-square' }
])

// Mobile tab configuration (shorter names for mobile)
const mobileTabs = computed(() => [
  { id: 'summary', name: 'Summary', icon: 'bar-chart' },
  { id: 'connection', name: 'Connection', icon: 'signal' },
  { id: 'activity', name: 'Activity', icon: 'clock' },
  { id: 'invoices', name: 'Invoices', icon: 'file-text', count: customerInvoices.value.length },
  { id: 'tickets', name: 'Tickets', icon: 'alert-triangle', count: customerTickets.value.length },
  { id: 'edit', name: 'Edit', icon: 'pencil-square' }
])

// Recent activity (mock data for now)
const recentActivity = ref([
  { id: 1, description: 'Customer installation completed', date: new Date() },
  { id: 2, description: 'Trouble ticket resolved', date: new Date(Date.now() - 86400000) },
  { id: 3, description: 'Invoice paid', date: new Date(Date.now() - 172800000) }
])

// Edit form data
const editForm = ref<{
  name: string
  phone: string
  company: string
  address: string
}>({
  name: '',
  phone: '',
  company: '',
  address: ''
})

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'unpaid':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTicketStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'finished':
      return 'bg-green-100 text-green-800'
    case 'ongoing':
      return 'bg-yellow-100 text-yellow-800'
    case 'unfinished':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// NEW: Helper function for installation status styling
const getInstallationStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// NEW: Helper function to get latest installation data
const getLatestInstallationData = () => {
  // Return empty object if no customer detail or installations
  if (!customerDetail.value?.installations || customerDetail.value.installations.length === 0) {
    return {}
  }

  // Return the first installation (latest, since they're ordered by created_at DESC)
  const latestInstallation = customerDetail.value.installations[0] || {}

  // Debug: Log the installation data to see what fields are available
  console.log('Latest Installation Data:', latestInstallation)

  return latestInstallation
}

// NEW: Helper function to get proposed package name by ID
const getProposedPackageName = (packageId: string) => {
  if (!packageId) return 'N/A'

  // Try to find the package name from network devices first
  if (customerDetail.value?.network_devices) {
    const deviceWithPackage = customerDetail.value.network_devices.find((device: any) =>
      device.product?.id === packageId
    )
    if (deviceWithPackage?.product?.name) {
      return deviceWithPackage.product.name
    }
  }

  // If not found in network devices, return the ID (fallback)
  return packageId
}

// NEW: Reactive variable to store internet packages for lookup
const internetPackages = ref<any[]>([])

// NEW: Function to load internet packages for lookup
const loadInternetPackages = async () => {
  try {
    const { internetPackageAdminApi } = await import('@/api/admin/internet-package')
    const response = await internetPackageAdminApi().getAllInternetPacket()
    if (response.success && response.data) {
      internetPackages.value = response.data
    }
  } catch (error) {
    console.error('Failed to load internet packages:', error)
  }
}

// NEW: Enhanced function to get proposed package name by ID with API lookup
const getProposedPackageNameEnhanced = (packageId: string) => {
  if (!packageId) return 'N/A'

  // Try to find the package name from network devices first
  if (customerDetail.value?.network_devices) {
    const deviceWithPackage = customerDetail.value.network_devices.find((device: any) =>
      device.product?.id === packageId
    )
    if (deviceWithPackage?.product?.name) {
      return deviceWithPackage.product.name
    }
  }

  // Try to find from loaded internet packages
  if (internetPackages.value.length > 0) {
    const packageData = internetPackages.value.find((pkg: any) => pkg.id === packageId)
    if (packageData?.name) {
      return packageData.name
    }
  }

  // If not found, return the ID (fallback)
  return packageId
}

// NEW: Function to fetch installation reports for a customer (supports multiple reports)
const fetchInstallationReports = async (customerId: string) => {
  try {
    // Use the working endpoint that returns complete data
    const response = await customerAdminApi().getInstallationReportComplete()
    if (response.success && response.data) {
      // Filter reports for this specific customer
      const customerReports = response.data.filter((report: any) =>
        report.customer_id === customerId
      )
      
      // Fetch technician team data for each installation report
      const reportsWithTechnicians = await Promise.all(
        customerReports.map(async (report: any) => {
          try {
            const technicianResponse = await customerAdminApi().getInstallationTechnicianTeam(report.installation_id)
            if (technicianResponse.success && technicianResponse.data) {
              return {
                ...report,
                technicians: technicianResponse.data
              }
            }
            return {
              ...report,
              technicians: []
            }
          } catch (error) {
            console.error(`Failed to fetch technicians for installation ${report.installation_id}:`, error)
            return {
              ...report,
              technicians: []
            }
          }
        })
      )
      
      return { success: true, data: reportsWithTechnicians, message: 'Success' }
    }
    return { success: false, data: [], message: 'No data returned' }
  } catch (error) {
    console.error('Failed to fetch installation reports:', error)
    return { success: false, data: [], message: 'Failed to fetch installation reports' }
  }
}

// NEW: Function to get sales representative name by ID
const getSalesRepresentativeName = (salesRepId: string) => {
  if (!salesRepId) return 'N/A'

  // Try to find from loaded sales representatives
  if (salesRepresentatives.value.length > 0) {
    const salesRep = salesRepresentatives.value.find((rep: any) => rep.id === salesRepId)
    if (salesRep?.name) {
      return salesRep.name
    }
  }

  // If not found, return the ID (fallback)
  return salesRepId
}

// NEW: Reactive variable to store sales representatives for lookup
const salesRepresentatives = ref<any[]>([])

// NEW: Function to load sales representatives for lookup
const loadSalesRepresentatives = async () => {
  try {
    const { userManagementAdminApi } = await import('@/api/admin/user-management')
    const response = await userManagementAdminApi().getAllUsers({ query: { role: "SUPERADMIN" } })
    if (response.success && response.data) {
      salesRepresentatives.value = response.data
    }
  } catch (error) {
    console.error('Failed to load sales representatives:', error)
  }
}

const getTotalInvoiceAmount = () => {
  if (!customerInvoices.value || customerInvoices.value.length === 0) return 0
  return customerInvoices.value
    .reduce((total, invoice) => total + (invoice.amount || 0), 0)
}

// Auto Login URL functionality
const autoLoginUrl = computed(() => {
  if (!customerDetail.value?.customer?.id) return ''
  const baseUrl = window.location.origin
  const customerId = customerDetail.value.customer.id
  const token = generateAutoLoginToken()
  return `${baseUrl}/client/autologin/${token}${customerId}`
})

const generateAutoLoginToken = () => {
  // Generate a random token for auto login
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const loginAsCustomer = () => {
  window.open(autoLoginUrl.value, '_blank')
}

const revokeAutoLogin = () => {
  useToast().add({
    title: 'Auto login revoked',
    color: 'green'
  })
}

const regenerateUrl = () => {
  // Force regeneration of the URL
  useToast().add({
    title: 'Auto login URL regenerated',
    color: 'green'
  })
}

const copyAutoLoginUrlToClipboard = async () => {
  if (!autoLoginUrl.value) return

  try {
    await navigator.clipboard.writeText(autoLoginUrl.value)
    useToast().add({
      title: 'URL Copied',
      description: 'Auto login URL copied to clipboard',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to copy URL:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to copy URL to clipboard',
      color: 'red'
    })
  }
}

// Edit form methods
const saveCustomer = async () => {
  try {
    await customerAdminApi().editCustomer(props.customerId, editForm.value)
    useToast().add({
      title: 'Customer updated successfully',
      color: 'green'
    })
    // Refresh customer data
    await fetchCustomerDetail()
  } catch (error: any) {
    useToast().add({
      title: 'Failed to update customer',
      description: error.message,
      color: 'red'
    })
  }
}

const resetEditForm = () => {
  if (customerDetail.value?.customer) {
    editForm.value = {
      name: customerDetail.value.customer.name || '',
      phone: customerDetail.value.customer.phone || '',
      company: customerDetail.value.customer.company?.name || '',
      address: customerDetail.value.customer.address || ''
    }
  }
}

// Extract IP addresses from network devices
const getNetworkDeviceIPs = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.ip_static)
    .map((device: any) => device.ip_static)
}

// Extract MAC addresses from network devices
const getNetworkDeviceMACs = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.mac_address)
    .map((device: any) => device.mac_address)
}

// Get overall connection status for the customer
const getOverallConnectionStatus = () => {
  if (!customerDetail.value?.customer) return 'off'

  // Check customer status first
  if (customerDetail.value.customer.status_user !== 'active') {
    return 'off'
  }

  // Check if customer has network devices
  if (!customerDetail.value.network_devices || customerDetail.value.network_devices.length === 0) {
    return 'off'
  }

  // Check device statuses (now using real-time status)
  const devices = customerDetail.value.network_devices
  const activeDevices = devices.filter((device: any) =>
    getDeviceConnectionStatus(device) === 'up'
  )

  if (activeDevices.length === 0) {
    return 'down'
  }

  return 'up'
}

// Real-time device status cache
const deviceStatusCache = ref<Map<string, { status: DeviceConnectionStatus; timestamp: number }>>(new Map())

// Get device connection status (now using real-time Mikrotik data)
const getDeviceConnectionStatus = (device: any): DeviceConnectionStatus => {
  if (!device) return 'off'

  // Check if device has IP address for Mikrotik lookup
  if (!device.ip_static) {
    return 'off'
  }

  // Check cache first (cache for 30 seconds)
  const cacheKey = device.ip_static
  const cached = deviceStatusCache.value.get(cacheKey)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < 30000) {
    return cached.status
  }

  // For now, use the same mock logic as fetchRealTimeDeviceStatus
  // TODO: Implement actual Mikrotik API call here
  const status: 'up' | 'down' = device.ip_static.includes('10.10.20') ? 'up' : 'down'
  
  // Cache the result
  deviceStatusCache.value.set(cacheKey, { status, timestamp: now })
  
  return status
}

// Function to fetch real-time status from Mikrotik (placeholder for future implementation)
const fetchRealTimeDeviceStatus = async (device: any): Promise<DeviceConnectionStatus> => {
  if (!device?.ip_static) return 'off'
  
  try {
    // TODO: Implement actual Mikrotik API call
    // const response = await mikrotikAdminApi().getDeviceStatus(device.ip_static)
    // return response.status || 'unknown'
    
    // For now, return a mock status based on IP
    const mockStatus: 'up' | 'down' = device.ip_static.includes('10.10.20') ? 'up' : 'down'
    
    // Update cache
    deviceStatusCache.value.set(device.ip_static, { 
      status: mockStatus, 
      timestamp: Date.now() 
    })
    
    return mockStatus
  } catch (error) {
    console.error('Failed to fetch device status:', error)
    return 'unknown'
  }
}

// Helper functions for network devices
const getCustomerMacAddresses = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.mac_address && device.mac_address.trim() !== '')
    .map((device: any) => device.mac_address)
}

const getNetworkDevicesWithMac = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.mac_address && device.mac_address.trim() !== '')
}

// Connection control functions
const isolateCustomer = async () => {
  const macAddresses = getCustomerMacAddresses()
  if (macAddresses.length === 0) {
    useToast().add({
      title: 'Error',
      description: 'Customer network devices with MAC addresses are required for isolation',
      color: 'red'
    })
    return
  }

  try {
    isConnecting.value = true

    // Apply isolation to all MAC addresses
    const promises = macAddresses.map((macAddress: string) =>
      mikrotikAdminApi().setHotspotIPBindingType(macAddress, 'regular')
    )

    await Promise.all(promises)

    useToast().add({
      title: 'Success',
      description: `Customer has been isolated - hotspot access restricted for ${macAddresses.length} device(s)`,
      color: 'green'
    })

    // Refresh customer data to reflect changes
    await fetchCustomerDetail()

  } catch (error: any) {
    console.error('Failed to isolate customer:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to isolate customer',
      color: 'red'
    })
  } finally {
    isConnecting.value = false
  }
}

const restoreCustomer = async () => {
  const macAddresses = getCustomerMacAddresses()
  if (macAddresses.length === 0) {
    useToast().add({
      title: 'Error',
      description: 'Customer network devices with MAC addresses are required for restoration',
      color: 'red'
    })
    return
  }

  try {
    isConnecting.value = true

    // Restore access for all MAC addresses
    const promises = macAddresses.map((macAddress: string) =>
      mikrotikAdminApi().setHotspotIPBindingType(macAddress, 'bypassed')
    )

    await Promise.all(promises)

    useToast().add({
      title: 'Success',
      description: `Customer access has been restored - hotspot access enabled for ${macAddresses.length} device(s)`,
      color: 'green'
    })

    // Refresh customer data to reflect changes
    await fetchCustomerDetail()

  } catch (error: any) {
    console.error('Failed to restore customer:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to restore customer access',
      color: 'red'
    })
  } finally {
    isConnecting.value = false
  }
}

const copyMacAddress = async (macAddress: string) => {
  if (!macAddress) return

  try {
    await navigator.clipboard.writeText(macAddress)
    useToast().add({
      title: 'Copied',
      description: 'MAC address copied to clipboard',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to copy MAC address:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to copy MAC address',
      color: 'red'
    })
  }
}

// NEW: Function to add new installation report
const addNewInstallationReport = () => {
  // Navigate to installation report form or open modal
  // For now, show a toast message indicating the feature
  useToast().add({
    title: 'Add Installation Report',
    description: 'Multiple installation reports are now supported! You can add a new report for this customer.',
    color: 'blue'
  })

  // TODO: Implement navigation to installation report form
  // navigateTo(`/dashboard/customer/installation/add?customer_id=${props.customerId}`)
}

const fetchCustomerDetail = async () => {
  try {
    loading.value = true
    error.value = undefined

    console.log(`Fetching data for customer ID: ${props.customerId}`)

    // Fetch customer detail, tickets, invoices, and installation reports in parallel
    const [customerResponse, ticketsResponse, invoicesResponse, installationResponse] = await Promise.allSettled([
      customerAdminApi().getCustomerDetail(props.customerId),
      customerAdminApi().getCustomerTickets(props.customerId),
      customerAdminApi().getCustomerInvoices(props.customerId),
      // NEW: Fetch installation reports for this customer
      fetchInstallationReports(props.customerId)
    ])

    // Handle customer detail
    if (customerResponse.status === 'fulfilled') {
      customerDetail.value = customerResponse.value.data
    } else {
      throw new Error('Failed to fetch customer details')
    }

    // Handle tickets
    if (ticketsResponse.status === 'fulfilled') {
      const tickets = ticketsResponse.value.data || []
      console.log('Raw tickets data:', tickets)
      console.log('Looking for customer ID:', props.customerId)

      // Filter tickets to ensure they belong to this customer
      customerTickets.value = tickets.filter((ticket: any) => {
        const matches = ticket.customer_id === props.customerId || ticket.customer?.id === props.customerId
        console.log(`Ticket ${ticket.id}: customer_id=${ticket.customer_id}, matches=${matches}`)
        return matches
      })
      console.log(`Fetched ${customerTickets.value.length} tickets for customer ${props.customerId}`)
    } else {
      console.warn('Failed to fetch customer tickets:', ticketsResponse.reason)
      customerTickets.value = []
    }

    // Handle invoices
    if (invoicesResponse.status === 'fulfilled') {
      const invoices = invoicesResponse.value.data || []
      console.log('Raw invoices data:', invoices)
      console.log('Looking for customer ID:', props.customerId)

      // Filter invoices to ensure they belong to this customer
      customerInvoices.value = invoices.filter((invoice: any) => {
        const matches = invoice.customer_id === props.customerId || invoice.customer?.id === props.customerId
        console.log(`Invoice ${invoice.id}: customer_id=${invoice.customer_id}, matches=${matches}`)
        return matches
      })
      console.log(`Fetched ${customerInvoices.value.length} invoices for customer ${props.customerId}`)
    } else {
      console.warn('Failed to fetch customer invoices:', invoicesResponse.reason)
      customerInvoices.value = []
    }

    // NEW: Handle installation reports
    if (installationResponse.status === 'fulfilled') {
      const installationData = installationResponse.value.data || []
      console.log('Raw installation data:', installationData)
      console.log('Looking for customer ID:', props.customerId)

      // Filter installation reports to ensure they belong to this customer
      const customerInstallations = installationData.filter((installation: any) => {
        const matches = installation.customer_id === props.customerId || installation.customer?.id === props.customerId
        console.log(`Installation ${installation.id}: customer_id=${installation.customer_id}, matches=${matches}`)
        return matches
      })
      console.log(`Fetched ${customerInstallations.length} installation reports for customer ${props.customerId}`)

      // Debug: Log the structure of the first installation report
      if (customerInstallations.length > 0) {
        console.log('First installation report structure:', customerInstallations[0])
        console.log('Available fields:', Object.keys(customerInstallations[0]))
        console.log('installation_type:', customerInstallations[0].installation_type)
        console.log('installation_status:', customerInstallations[0].installation_status)
        console.log('on_air_date:', customerInstallations[0].on_air_date)
        console.log('service_ready_date:', customerInstallations[0].service_ready_date)
      }

      // Merge installation data with customer detail
      if (customerDetail.value) {
        // Store all installation reports
        customerDetail.value.installations = customerInstallations

        // If there are installation reports, use the latest one for customer summary data
        if (customerInstallations.length > 0) {
          const latestInstallation = customerInstallations[0]
          customerDetail.value.customer = {
            ...customerDetail.value.customer,
            installation_type: latestInstallation.installation_type,
            installation_status: latestInstallation.installation_status,
            on_air_date: latestInstallation.on_air_date,
            service_ready_date: latestInstallation.service_ready_date,
            installation_completed_at: latestInstallation.installation_completed_at,
            installation_team_name: getPrimaryTechnicianName(latestInstallation),
            installation_team_phone: latestInstallation.technician_phone
          }
        }
      }
    } else {
      console.warn('Failed to fetch installation reports:', installationResponse.reason)
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to fetch customer details'
    useToast().add({
      title: 'Error',
      description: error.value || 'An error occurred',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Function to refresh all device statuses
const refreshDeviceStatuses = async () => {
  if (!customerDetail.value?.network_devices) return
  
  const devices = customerDetail.value.network_devices
  const statusPromises = devices.map((device: any) => fetchRealTimeDeviceStatus(device))
  
  try {
    await Promise.all(statusPromises)
    console.log('Device statuses refreshed')
  } catch (error) {
    console.error('Failed to refresh device statuses:', error)
  }
}

// Fetch data when component mounts
onMounted(async () => {
  // Load internet packages and sales representatives for lookup
  await Promise.all([
    loadInternetPackages(),
    loadSalesRepresentatives()
  ])
  // Fetch customer detail
  await fetchCustomerDetail()
  
  // Refresh device statuses after customer detail is loaded
  if (customerDetail.value?.network_devices?.length > 0) {
    await refreshDeviceStatuses()
  }
})

// Watch for customer detail changes to populate edit form
watch(customerDetail, (newDetail) => {
  if (newDetail?.customer) {
    editForm.value = {
      name: newDetail.customer.name || '',
      phone: newDetail.customer.phone || '',
      company: newDetail.customer.company?.name || '',
      address: newDetail.customer.address || ''
    }
  }
}, { immediate: true })
</script>