<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto m-4">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
              <span class="text-white text-3xl font-bold">
                {{ customerDetail?.customer?.name?.charAt(0) || 'C' }}
              </span>
            </div>
            <div class="absolute -bottom-2 -left-2 bg-black text-white px-2 py-1 text-xs font-medium rounded">
              {{ customerDetail?.customer?.name || 'Customer' }}
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-600">{{ customerDetail?.customer?.phone || 'No phone' }}</p>
            <p class="text-xs text-gray-400">Customer ID: {{ props.customerId }}</p>
          </div>
        </div>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          @click="$emit('close')"
        />
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
      <div v-else-if="customerDetail" class="flex">
        <!-- Vertical Tab Navigation -->
        <div class="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <nav class="space-y-2" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                'w-full text-left px-3 py-2 rounded-l-md font-medium text-sm flex items-center gap-3 transition-colors'
              ]"
            >
              <UIcon :name="tab.icon" class="w-4 h-4" />
              <span class="flex-1">{{ tab.name }}</span>
              <span v-if="tab.count !== undefined" class="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-6">
        <!-- Summary Tab -->
        <div v-if="activeTab === 'summary'" class="space-y-6">
          <!-- Contact Information -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.name }}</p>
            </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Company Name</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.company?.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.email || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.phone }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Address</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.address }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">City</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.area?.name_city || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">State/Region</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.area?.name_subdistrict || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.area?.name_village || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Country</label>
                <p class="mt-1 text-sm text-gray-900">Indonesia</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Tags</label>
                <p class="mt-1 text-sm text-gray-900">N/A</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Group</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.area?.name_city || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Location</label>
                <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.latitude }}, {{ customerDetail.customer.longitude }}</p>
              </div>
            </div>
          </div>

          <!-- Auto Login URL -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Auto Login URL</h3>
            <div class="space-y-3">
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600 break-all">
                  {{ autoLoginUrl }}
                </p>
              </div>
              <div class="flex gap-2">
                <UButton size="sm" color="blue" variant="outline" @click="loginAsCustomer">
                  Login As Customer
                </UButton>
                <UButton size="sm" color="red" variant="outline" @click="revokeAutoLogin">
                  Revoke Auto Login
                </UButton>
                <UButton size="sm" color="gray" variant="outline" @click="regenerateUrl">
                  Re Generate URL
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
        </div>

        <!-- Connection Status Tab -->
        <div v-if="activeTab === 'connection'" class="space-y-6">
          <!-- Overall Connection Status -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Overall Connection Status</h3>
            <div class="flex items-center justify-center">
              <div class="text-center">
                <div 
                  :class="[
                    'w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center',
                    getOverallConnectionStatus() === 'up' ? 'bg-green-100' : 
                    getOverallConnectionStatus() === 'down' ? 'bg-red-100' : 'bg-gray-100'
                  ]"
                >
                  <UIcon 
                    :name="getOverallConnectionStatus() === 'up' ? 'i-heroicons-check-circle' : 
                           getOverallConnectionStatus() === 'down' ? 'i-heroicons-x-circle' : 'i-heroicons-power'"
                    :class="[
                      'w-12 h-12',
                      getOverallConnectionStatus() === 'up' ? 'text-green-600' : 
                      getOverallConnectionStatus() === 'down' ? 'text-red-600' : 'text-gray-600'
                    ]"
                  />
                </div>
                <h4 class="text-xl font-semibold text-gray-900">Connection Status</h4>
                <p 
                  :class="[
                    'text-2xl font-bold mt-2',
                    getOverallConnectionStatus() === 'up' ? 'text-green-600' : 
                    getOverallConnectionStatus() === 'down' ? 'text-red-600' : 'text-gray-600'
                  ]"
                >
                  {{ getOverallConnectionStatus().toUpperCase() }}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                  {{ getOverallConnectionStatus() === 'up' ? 'All systems operational' : 
                     getOverallConnectionStatus() === 'down' ? 'Connection issues detected' : 
                     'No active connection' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Customer Status -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Account Status</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="text-center">
                <div 
                  :class="[
                    'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                    customerDetail.customer.status_user === 'active' ? 'bg-green-100' : 'bg-red-100'
                  ]"
                >
                  <UIcon 
                    :name="customerDetail.customer.status_user === 'active' ? 'i-heroicons-user-check' : 'i-heroicons-user-x-mark'"
                    :class="[
                      'w-8 h-8',
                      customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                    ]"
                  />
                </div>
                <h4 class="text-sm font-semibold text-gray-900">Account Status</h4>
                <p 
                  :class="[
                    'text-sm font-medium',
                    customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                  ]"
                >
                  {{ customerDetail.customer.status_user?.toUpperCase() || 'UNKNOWN' }}
                </p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-blue-100">
                  <UIcon name="i-heroicons-calendar" class="w-8 h-8 text-blue-600" />
                </div>
                <h4 class="text-sm font-semibold text-gray-900">Next Payment</h4>
                <p class="text-sm text-gray-600">{{ formatDate(customerDetail.customer.next_payment_date) }}</p>
              </div>
            </div>
          </div>

          <!-- Network Devices Status -->
          <div v-if="customerDetail.network_devices && customerDetail.network_devices.length > 0" class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Network Devices Status</h3>
            <div class="space-y-4">
              <div 
                v-for="device in customerDetail.network_devices" 
                :key="device.id"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-semibold text-gray-900">Device {{ device.id }}</h4>
                  <div class="flex items-center space-x-2">
                    <div 
                      :class="[
                        'w-3 h-3 rounded-full',
                        getDeviceConnectionStatus(device) === 'up' ? 'bg-green-500' : 
                        getDeviceConnectionStatus(device) === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      ]"
                    ></div>
                    <span 
                      :class="[
                        'text-sm font-medium',
                        getDeviceConnectionStatus(device) === 'up' ? 'text-green-600' : 
                        getDeviceConnectionStatus(device) === 'down' ? 'text-red-600' : 'text-gray-600'
                      ]"
                    >
                      {{ getDeviceConnectionStatus(device).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700">IP Address</label>
                    <p class="text-sm text-gray-900">{{ device.ip_static || 'N/A' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700">MAC Address</label>
                    <p class="text-sm text-gray-900">{{ device.mac_address || 'N/A' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700">Last Ping</label>
                    <p class="text-sm text-gray-900">{{ device.last_ping_time ? formatDate(device.last_ping_time) : 'N/A' }}</p>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200">
                  <div class="flex justify-between items-center">
                    <div class="flex space-x-4">
                      <span 
                        :class="[
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          device.status_perangkat === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        ]"
                      >
                        Device: {{ device.status_perangkat?.toUpperCase() }}
                      </span>
                      <span 
                        :class="[
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          device.last_ping_status === 'up' ? 'bg-green-100 text-green-800' : 
                          device.last_ping_status === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        ]"
                      >
                        Ping: {{ device.last_ping_status?.toUpperCase() }}
                      </span>
                    </div>
                    <span v-if="device.ping_response_time" class="text-xs text-gray-500">
                      Response: {{ device.ping_response_time }}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Devices Message -->
          <div v-else class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="text-center">
              <UIcon name="i-heroicons-wifi" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">No Network Devices</h3>
              <p class="text-gray-600">This customer doesn't have any network devices configured yet.</p>
            </div>
          </div>
        </div>

        <!-- Activity Tab -->
        <div v-if="activeTab === 'activity'" class="space-y-6">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div class="space-y-4">
              <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
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
                      <span 
                        :class="getStatusColor(invoice.status)"
                        class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                      >
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
              <div 
                v-for="ticket in customerTickets" 
                :key="ticket.id"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="text-sm font-medium text-gray-900">{{ ticket.title }}</h4>
                  <span 
                    :class="getTicketStatusColor(ticket.status)"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  >
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

        <!-- Email Tab -->
        <div v-if="activeTab === 'email'" class="space-y-6">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Email History</h3>
            <div class="text-center text-gray-500 py-8">
              No email history found
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <UInput v-model="editForm.email" type="email" placeholder="Enter email" />
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

        <!-- Location Information -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Location & Area</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Area</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ customerDetail.customer.area?.name_city }} - 
                {{ customerDetail.customer.area?.name_subdistrict }} - 
                {{ customerDetail.customer.area?.name_village }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Company</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.company?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Latitude</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.latitude }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Longitude</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.longitude }}</p>
            </div>
          </div>
        </div>

        <!-- Network Information -->
        <div class="bg-green-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Network Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Internet Package</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.product?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Package Price</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatIDR(customerDetail.customer.product?.price || 0) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">IP Static</label>
              <p class="mt-1 text-sm text-gray-900">
                <span v-if="getNetworkDeviceIPs().length > 0">
                  {{ getNetworkDeviceIPs().join(', ') }}
                </span>
                <span v-else class="text-gray-500">No IP addresses found</span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">MAC Address</label>
              <p class="mt-1 text-sm text-gray-900">
                <span v-if="getNetworkDeviceMACs().length > 0">
                  {{ getNetworkDeviceMACs().join(', ') }}
                </span>
                <span v-else class="text-gray-500">No MAC addresses found</span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Installation Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.installation_date) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Next Payment Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.next_payment_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Connection Status</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Overall Status -->
            <div class="text-center">
              <div 
                :class="[
                  'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                  getOverallConnectionStatus() === 'up' ? 'bg-green-100' : 
                  getOverallConnectionStatus() === 'down' ? 'bg-red-100' : 'bg-gray-100'
                ]"
              >
                <UIcon 
                  :name="getOverallConnectionStatus() === 'up' ? 'i-heroicons-check-circle' : 
                         getOverallConnectionStatus() === 'down' ? 'i-heroicons-x-circle' : 'i-heroicons-power'"
                  :class="[
                    'w-8 h-8',
                    getOverallConnectionStatus() === 'up' ? 'text-green-600' : 
                    getOverallConnectionStatus() === 'down' ? 'text-red-600' : 'text-gray-600'
                  ]"
                />
              </div>
              <h4 class="text-sm font-semibold text-gray-900">Overall Status</h4>
              <p 
                :class="[
                  'text-sm font-medium',
                  getOverallConnectionStatus() === 'up' ? 'text-green-600' : 
                  getOverallConnectionStatus() === 'down' ? 'text-red-600' : 'text-gray-600'
                ]"
              >
                {{ getOverallConnectionStatus().toUpperCase() }}
              </p>
            </div>

            <!-- Customer Status -->
            <div class="text-center">
              <div 
                :class="[
                  'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                  customerDetail.customer.status_user === 'active' ? 'bg-green-100' : 'bg-red-100'
                ]"
              >
                <UIcon 
                  :name="customerDetail.customer.status_user === 'active' ? 'i-heroicons-user-check' : 'i-heroicons-user-x-mark'"
                  :class="[
                    'w-8 h-8',
                    customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                  ]"
                />
              </div>
              <h4 class="text-sm font-semibold text-gray-900">Customer Status</h4>
              <p 
                :class="[
                  'text-sm font-medium',
                  customerDetail.customer.status_user === 'active' ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ customerDetail.customer.status_user?.toUpperCase() || 'UNKNOWN' }}
              </p>
            </div>

            <!-- Last Activity -->
            <div class="text-center">
              <div class="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-blue-100">
                <UIcon name="i-heroicons-clock" class="w-8 h-8 text-blue-600" />
              </div>
              <h4 class="text-sm font-semibold text-gray-900">Last Activity</h4>
              <p class="text-sm text-gray-600">{{ formatDate(customerDetail.customer.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Network Devices -->
        <div v-if="customerDetail.network_devices && customerDetail.network_devices.length > 0" class="bg-purple-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Network Devices</h3>
          <div class="space-y-3">
            <div 
              v-for="device in customerDetail.network_devices" 
              :key="device.id"
              class="bg-white rounded-lg p-4 border"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900">Device {{ device.id }}</h4>
                <div class="flex items-center space-x-2">
                  <div 
                    :class="[
                      'w-3 h-3 rounded-full',
                      getDeviceConnectionStatus(device) === 'up' ? 'bg-green-500' : 
                      getDeviceConnectionStatus(device) === 'down' ? 'bg-red-500' : 'bg-gray-500'
                    ]"
                  ></div>
                  <span 
                    :class="[
                      'text-xs font-medium',
                      getDeviceConnectionStatus(device) === 'up' ? 'text-green-600' : 
                      getDeviceConnectionStatus(device) === 'down' ? 'text-red-600' : 'text-gray-600'
                    ]"
                  >
                    {{ getDeviceConnectionStatus(device).toUpperCase() }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700">IP Static</label>
                  <p class="text-sm text-gray-900">{{ device.ip_static || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">MAC Address</label>
                  <p class="text-sm text-gray-900">{{ device.mac_address || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Device Status</label>
                  <span 
                    :class="device.status_perangkat === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ device.status_perangkat?.toUpperCase() }}
                  </span>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Ping Status</label>
                  <span 
                    :class="device.last_ping_status === 'up' ? 'bg-green-100 text-green-800' : device.last_ping_status === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ device.last_ping_status?.toUpperCase() }}
                  </span>
                </div>
              </div>
              <div v-if="device.last_ping_time" class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>Last Ping: {{ formatDate(device.last_ping_time) }}</span>
                  <span v-if="device.ping_response_time">Response Time: {{ device.ping_response_time }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Installation History -->
        <div v-if="customerDetail.installations && customerDetail.installations.length > 0" class="bg-yellow-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Installation History</h3>
          <div class="space-y-3">
            <div 
              v-for="installation in customerDetail.installations" 
              :key="installation.id"
              class="bg-white rounded-lg p-3 border"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700">Technician</label>
                  <p class="text-sm text-gray-900">{{ installation.technician?.name || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Date</label>
                  <p class="text-sm text-gray-900">{{ formatDate(installation.date) }}</p>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-700">Description</label>
                  <p class="text-sm text-gray-900">{{ installation.description || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div v-if="customerInvoices && customerInvoices.length > 0" class="bg-indigo-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                    <span 
                      :class="getStatusColor(invoice.status)"
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ invoice.status?.toUpperCase() }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
import { customerAdminApi } from '@/api/admin/customer'
import { formatIDR } from '@/helper/currency'
import LoadingComponent from '@/components/LoadingComponent.vue'

interface Props {
  customerId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const customerDetail = ref<any>(null)
const customerTickets = ref<any[]>([])
const customerInvoices = ref<any[]>([])
const loading = ref(true)
const error = ref<string | undefined>(undefined)
const activeTab = ref('summary')

// Tab configuration
const tabs = computed(() => [
  { id: 'summary', name: 'Summary', icon: 'i-heroicons-chart-bar' },
  { id: 'connection', name: 'Connection Status', icon: 'i-heroicons-signal' },
  { id: 'activity', name: 'Activity', icon: 'i-heroicons-clock' },
  { id: 'invoices', name: 'Invoices', icon: 'i-heroicons-document-text', count: customerInvoices.value.length },
  { id: 'quotes', name: 'Quotes', icon: 'i-heroicons-document-duplicate', count: 0 },
  { id: 'tickets', name: 'Trouble Tickets', icon: 'i-heroicons-exclamation-triangle', count: customerTickets.value.length },
  { id: 'orders', name: 'Orders', icon: 'i-heroicons-shopping-bag' },
  { id: 'files', name: 'Files', icon: 'i-heroicons-document' },
  { id: 'transactions', name: 'Transactions', icon: 'i-heroicons-currency-dollar' },
  { id: 'email', name: 'Email', icon: 'i-heroicons-envelope' },
  { id: 'edit', name: 'Edit', icon: 'i-heroicons-pencil-square' }
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
  email: string
  phone: string
  company: string
  address: string
}>({
  name: '',
  email: '',
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
      email: customerDetail.value.customer.email || '',
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
  
  // Check device statuses
  const devices = customerDetail.value.network_devices
  const activeDevices = devices.filter((device: any) => 
    device.status_perangkat === 'active' && device.last_ping_status === 'up'
  )
  
  if (activeDevices.length === 0) {
    return 'down'
  }
  
  return 'up'
}

// Get device connection status
const getDeviceConnectionStatus = (device: any) => {
  if (!device) return 'off'
  
  // Check device status
  if (device.status_perangkat !== 'active') {
    return 'off'
  }
  
  // Check ping status
  if (device.last_ping_status === 'up') {
    return 'up'
  } else if (device.last_ping_status === 'down') {
    return 'down'
  }
  
  return 'off'
}

const fetchCustomerDetail = async () => {
  try {
    loading.value = true
    error.value = undefined
    
    console.log(`Fetching data for customer ID: ${props.customerId}`)
    
    // Fetch customer detail, tickets, and invoices in parallel
    const [customerResponse, ticketsResponse, invoicesResponse] = await Promise.allSettled([
      customerAdminApi().getCustomerDetail(props.customerId),
      customerAdminApi().getCustomerTickets(props.customerId),
      customerAdminApi().getCustomerInvoices(props.customerId)
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

// Fetch data when component mounts
onMounted(() => {
  fetchCustomerDetail()
})

// Watch for customer detail changes to populate edit form
watch(customerDetail, (newDetail) => {
  if (newDetail?.customer) {
    editForm.value = {
      name: newDetail.customer.name || '',
      email: newDetail.customer.email || '',
      phone: newDetail.customer.phone || '',
      company: newDetail.customer.company?.name || '',
      address: newDetail.customer.address || ''
    }
  }
}, { immediate: true })
</script>