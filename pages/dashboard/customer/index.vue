<script setup lang="ts">
import { watch, onMounted, computed } from "vue";
import FormCustomerInstallation from "./FormCustomerInstallation.vue";
import FormAddComponent from "./FormAddComponent.vue";
import CustomerDetailModal from "./CustomerDetailModal.vue";
import BroadcastFeature from "@/components/BroadcastFeature.vue";
import LucideIcon from "@/components/LucideIcon.vue";
import { customerAdminApi } from "@/api/admin/customer";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { useNotification } from "@/composables/useNotification";
import { useNavigationContext } from "@/composables/useNavigationContext";
// Set page title
useHead({
  title: "Customer Management - CRM System",
});

// Watch for route changes to reset modal state
const route = useRoute();
watch(
  () => route.path,
  (newPath, oldPath) => {
    // Reset modal state when navigating away from customer index page
    if (
      oldPath === "/dashboard/customer" &&
      newPath !== "/dashboard/customer"
    ) {
      showInstallationModal.value = false;
      modalData.value = { isEdit: false, data: null };
    }
  }
);

// Listen for global modal clear events
onMounted(() => {
  window.addEventListener("clear-all-modals", () => {
    showInstallationModal.value = false;
    modalData.value = { isEdit: false, data: null };
  });
});

let customer = ref<any[]>([]);
let installationReports = ref<any[]>([]);
let invoices = ref<any[]>([]);

// Real-time device status cache
const deviceStatusCache = ref<
  Map<string, { status: string; timestamp: number }>
>(new Map());

// Get device connection status (now using real-time Mikrotik data)
function getDeviceConnectionStatus(device: any) {
  if (!device) return "off";

  // Check if device has IP address for Mikrotik lookup
  if (!device.ip_static) {
    return "off";
  }

  // Check cache first (cache for 30 seconds)
  const cacheKey = device.ip_static;
  const cached = deviceStatusCache.value.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < 30000) {
    return cached.status;
  }

  // For now, use mock status based on IP (same logic as fetchRealTimeDeviceStatus)
  // TODO: Implement actual Mikrotik API call here
  const status = device.ip_static.includes("10.10.20") ? "up" : "down";

  // Debug logging
  console.log(`[Device Status] IP: ${device.ip_static} → Status: ${status}`);

  // Cache the result
  deviceStatusCache.value.set(cacheKey, { status, timestamp: now });

  return status;
}

// Function to fetch real-time status from Mikrotik (placeholder for future implementation)
async function fetchRealTimeDeviceStatus(device: any) {
  if (!device?.ip_static) return "off";

  try {
    // TODO: Implement actual Mikrotik API call
    // const response = await mikrotikAdminApi().getDeviceStatus(device.ip_static)
    // return response.status || 'unknown'

    // For now, return a mock status based on IP
    const mockStatus = device.ip_static.includes("10.10.20") ? "up" : "down";

    // Update cache
    deviceStatusCache.value.set(device.ip_static, {
      status: mockStatus,
      timestamp: Date.now(),
    });

    return mockStatus;
  } catch (error) {
    console.error("Failed to fetch device status:", error);
    return "unknown";
  }
}

// Function to get customer's device status
function getCustomerDeviceStatus(customer: any) {
  if (!customer.hasInstallationReport) return "off";

  // Find the customer's installation reports
  const customerReports = installationReports.value.filter(
    (report: any) => report.customer_id === customer.id
  );

  if (customerReports.length === 0) return "off";

  // Get all unique IP addresses from customer's reports
  const uniqueIPs = [
    ...new Set(
      customerReports
        .filter((report: any) => report.ip_static)
        .map((report: any) => report.ip_static)
    ),
  ];

  if (uniqueIPs.length === 0) return "off";

  // Check status of all devices
  const deviceStatuses = uniqueIPs.map((ip) =>
    getDeviceConnectionStatus({ ip_static: ip })
  );

  // Debug logging
  console.log(
    `[Customer Status] Customer: ${customer.name}, IPs: ${uniqueIPs.join(
      ", "
    )}, Statuses: ${deviceStatuses.join(", ")}`
  );

  // Determine overall status
  const hasUp = deviceStatuses.includes("up");
  const hasDown = deviceStatuses.includes("down");
  const hasUnknown = deviceStatuses.includes("unknown");

  // Mixed status: some up, some down
  if (hasUp && hasDown) return "mixed";

  // All down
  if (hasDown && !hasUp) return "down";

  // All up
  if (hasUp && !hasDown) return "up";

  // All unknown
  if (hasUnknown && !hasUp && !hasDown) return "unknown";

  // Default fallback
  return "off";
}

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  area_code: string;
  gmaps_link: string;
  packet_internet: string;
  hasInstallationReport?: boolean;
  installationReportCount?: number;
  is_internet?: string;
  is_collaborator?: string;
  is_terminal?: boolean; // Whether this customer has a terminal installation (is_terminal = 'yes')
  // NEW: Product-related fields from installation reports
  products?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    downloadSpeed: number;
    uploadSpeed: number;
  }>;
  product_names?: string[];
  product_name?: string;
  product_count?: number;
  // NEW: Invoice-related fields
  hasUnpaidInvoice?: boolean;
  hasPendingInvoice?: boolean;
  unpaidInvoiceCount?: number;
  pendingInvoiceCount?: number;
  totalUnpaidPendingInvoices?: number;
};

type DropdownItem = {
  label: string;
  icon: string;
  click: () => void;
  disabled?: boolean;
};

async function getData() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    response.data.forEach((customer: any) => {
      customer.number = response.data.indexOf(customer) + 1;
      customer.area_name =
        customer.area.name_city +
        "-" +
        customer.area.name_subdistrict +
        "-" +
        customer.area.name_village;
      customer.gmaps_link =
        "https://www.google.com/maps/place/" +
        customer.latitude +
        "," +
        customer.longitude;
    });

    customer.value = [...response.data];

    // Load installation reports to get product information and check which customers have reports
    await loadInstallationReports();

    // Update packet internet information from installation reports
    updatePacketInternetInfo();

    // Load invoices to check for unpaid/pending invoices
    await loadInvoices();
  } catch (err) {
    console.error("Error loading customers:", err);
    // Only show notification if it's available
    if (notification && notification.error) {
      notification.error("Error", String(err));
    }
  }
}

// Function to refresh all device statuses
async function refreshDeviceStatuses() {
  if (!installationReports.value.length) return;

  const statusPromises = installationReports.value
    .filter((report: any) => report.ip_static)
    .map((report: any) =>
      fetchRealTimeDeviceStatus({ ip_static: report.ip_static })
    );

  try {
    await Promise.all(statusPromises);
    console.log("Device statuses refreshed for customer list");
  } catch (error) {
    console.error("Failed to refresh device statuses:", error);
  }
}

async function loadInstallationReports() {
  try {
    console.log("🔍 [DEBUG] Loading installation reports...");
    const response = await customerAdminApi().getInstallationReportComplete();
    installationReports.value = response.data || [];

    console.log("🔍 [DEBUG] Installation reports loaded:", {
      totalReports: installationReports.value.length,
      sampleReport: installationReports.value[0],
      allReports: installationReports.value,
    });

    // Update customer data with installation report status (for display purposes only)
    customer.value.forEach((customerItem: any) => {
      const customerReports = installationReports.value.filter(
        (report: any) => report.customer_id === customerItem.id
      );
      const reportCount = customerReports.length;
      customerItem.hasInstallationReport = reportCount > 0;
      customerItem.installationReportCount = reportCount;

      // Check if customer has any terminal installation (is_terminal = 'yes')
      customerItem.is_terminal = customerReports.some(
        (report: any) => report.is_terminal === "yes"
      );

      if (reportCount > 0) {
        console.log(
          `🔍 [DEBUG] Customer ${customerItem.name} has ${reportCount} installation reports:`,
          customerReports
        );
      }
    });

    // Refresh device statuses after loading installation reports
    await refreshDeviceStatuses();
  } catch (error) {
    console.error("❌ [ERROR] Failed to load installation reports:", error);
    // Set all customers as not having installation reports if API fails
    customer.value.forEach((customerItem: any) => {
      customerItem.hasInstallationReport = false;
      customerItem.installationReportCount = 0;
    });
  }
}

// NEW: Function to update packet internet information from installation reports
function updatePacketInternetInfo() {
  customer.value.forEach((customerItem: any) => {
    // Get all installation reports for this customer
    const customerReports = installationReports.value.filter(
      (report: any) => report.customer_id === customerItem.id
    );

    if (customerReports.length > 0) {
      // Get unique product names from installation reports
      const uniqueProducts = new Set<string>();
      const products: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        downloadSpeed: number;
        uploadSpeed: number;
      }> = [];

      customerReports.forEach((report: any) => {
        if (report.product_name && !uniqueProducts.has(report.product_id)) {
          uniqueProducts.add(report.product_id);
          products.push({
            id: report.product_id,
            name: report.product_name,
            description: report.product_description,
            price: report.product_price,
            downloadSpeed: report.product_download_speed_mbps,
            uploadSpeed: report.product_upload_speed_mbps,
          });
        }
      });

      // Update customer with product information
      customerItem.products = products;
      customerItem.product_names = products.map((p: any) => p.name);
      customerItem.product_name =
        products.length > 0 ? products[0].name : "No Package";
      customerItem.product_count = products.length;
    } else {
      // No installation reports, no product information
      customerItem.products = [];
      customerItem.product_names = [];
      customerItem.product_name = "No Package";
      customerItem.product_count = 0;
    }
  });
}

// NEW: Function to load invoices and mark customers with unpaid/pending invoices
async function loadInvoices() {
  try {
    console.log("🔍 [DEBUG] Loading invoices...");
    const response = await invoiceAdminApi().getAllInvoices();
    invoices.value = response.data || [];

    console.log("🔍 [DEBUG] Invoices loaded:", {
      totalInvoices: invoices.value.length,
      sampleInvoice: invoices.value[0],
    });

    // Update customer data with invoice status
    customer.value.forEach((customerItem: any) => {
      // Get all invoices for this customer
      const customerInvoices = invoices.value.filter(
        (invoice: any) => invoice.customer_id === customerItem.id
      );

      // Filter unpaid and pending invoices
      const unpaidInvoices = customerInvoices.filter(
        (invoice: any) => invoice.status === "unpaid"
      );
      const pendingInvoices = customerInvoices.filter(
        (invoice: any) => invoice.status === "pending"
      );

      // Update customer with invoice information
      customerItem.hasUnpaidInvoice = unpaidInvoices.length > 0;
      customerItem.hasPendingInvoice = pendingInvoices.length > 0;
      customerItem.unpaidInvoiceCount = unpaidInvoices.length;
      customerItem.pendingInvoiceCount = pendingInvoices.length;
      customerItem.totalUnpaidPendingInvoices =
        unpaidInvoices.length + pendingInvoices.length;

      if (customerItem.totalUnpaidPendingInvoices > 0) {
        console.log(
          `🔍 [DEBUG] Customer ${customerItem.name} has ${customerItem.totalUnpaidPendingInvoices} unpaid/pending invoices:`,
          {
            unpaid: customerItem.unpaidInvoiceCount,
            pending: customerItem.pendingInvoiceCount,
          }
        );
      }
    });
  } catch (error) {
    console.error("❌ [ERROR] Failed to load invoices:", error);
    // Set all customers as having no unpaid/pending invoices if API fails
    customer.value.forEach((customerItem: any) => {
      customerItem.hasUnpaidInvoice = false;
      customerItem.hasPendingInvoice = false;
      customerItem.unpaidInvoiceCount = 0;
      customerItem.pendingInvoiceCount = 0;
      customerItem.totalUnpaidPendingInvoices = 0;
    });
  }
}

async function deleteData(id: string) {
  try {
    const response = await customerAdminApi().deleteCustomer(id);
    await getData();
    if (notification && notification.success) {
      notification.success("Success", response.message);
    }
  } catch (err) {
    console.error("Error deleting customer:", err);

    // Enhanced error handling for installation report validation
    let errorMessage = String(err);
    if (errorMessage.includes("installation report(s) are associated")) {
      errorMessage =
        errorMessage +
        '\n\n💡 Tip: You can either:\n• Delete the installation reports first using the "Delete Installation Report" feature\n• Use "Delete with Related Records" to remove everything at once';
    }

    if (notification && notification.error) {
      notification.error("Cannot Delete Customer", errorMessage);
    }
  }
}

// Enhanced delete with confirmation
const showDeleteModal = ref(false);
const deleteCustomerId = ref<string | null>(null);
const deleteCustomerName = ref("");
const deleteCustomerPhone = ref("");

function openDeleteConfirmation(customer: Customer) {
  deleteCustomerId.value = customer.id;
  deleteCustomerName.value = customer.name;
  deleteCustomerPhone.value = customer.phone;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deleteCustomerId.value = null;
  deleteCustomerName.value = "";
  deleteCustomerPhone.value = "";
}

function onCustomerDeleted() {
  getData(); // Refresh the customer list
}

// Load data after component is mounted to ensure notification system is ready
onMounted(async () => {
  await getData();
});

const columns = [
  {
    key: "number",
    label: "Number",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "phone",
    label: "Phone",
  },
  {
    key: "address",
    label: "Address",
  },
  {
    key: "area_name",
    label: "Area Code",
  },
  {
    key: "product_name",
    label: "Packet Internet",
  },
  {
    key: "customer_type",
    label: "Customer Type",
  },
  {
    key: "actions",
    label: "Actions",
  },
];

const page = ref(1);
const pageCount = 5;

const q = ref("");
const statusFilter = ref("all"); // Device status filter: 'all', 'down', 'mixed', 'up', 'unknown', 'off'
const invoiceFilter = ref("all"); // Invoice status filter: 'all', 'unpaid', 'pending', 'unpaid_pending'

// Reset page when filters change
watch([q, statusFilter, invoiceFilter], () => {
  page.value = 1;
});

const rows = computed(() => {
  let dataToShow = customer.value;

  // Apply search filter if query exists
  if (q.value) {
    dataToShow = customerData.value.filter((customer) => {
      return Object.values(customer).some((value) => {
        return String(value).toLowerCase().includes(q.value.toLowerCase());
      });
    });
  }

  // Apply device status filter
  if (statusFilter.value !== "all") {
    dataToShow = dataToShow.filter((customer) => {
      const customerStatus = getCustomerDeviceStatus(customer);
      return customerStatus === statusFilter.value;
    });
  }

  // Apply invoice status filter
  if (invoiceFilter.value !== "all") {
    dataToShow = dataToShow.filter((customer) => {
      if (invoiceFilter.value === "unpaid") {
        return customer.hasUnpaidInvoice === true;
      } else if (invoiceFilter.value === "pending") {
        return customer.hasPendingInvoice === true;
      } else if (invoiceFilter.value === "unpaid_pending") {
        return (
          customer.hasUnpaidInvoice === true ||
          customer.hasPendingInvoice === true
        );
      }
      return true;
    });
  }

  // Sort customers: down devices first, then mixed, then by name
  const sortedData = dataToShow.sort((a: any, b: any) => {
    const aStatus = getCustomerDeviceStatus(a);
    const bStatus = getCustomerDeviceStatus(b);

    // Priority order: down > mixed > up > unknown > off
    const statusPriority = { down: 0, mixed: 1, up: 2, unknown: 3, off: 4 };
    const aPriority = statusPriority[aStatus] || 4;
    const bPriority = statusPriority[bStatus] || 4;

    // If different priorities, sort by priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort by name
    return a.name.localeCompare(b.name);
  });

  return sortedData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

let customerData = customer;

// const filteredRows = computed(() => {
//     if (!q.value) {
//         customerData = customer
//         return customer.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
//     }

//     const newData = customer.value.filter((person) => {
//         return Object.values(person).some((value) => {
//             // person with paginate
//             return String(value).toLowerCase().includes(q.value.toLowerCase())
//         })
//     })
//     customerData.value = newData
//     return newData.slice((page.value - 1) * pageCount, (page.value) * pageCount)
// })

const isOpen = ref(false);
const showDetailModal = ref(false);
const selectedCustomerId = ref<string | null>(null);

const items = (row: Customer) => {
  const baseItems: DropdownItem[][] = [
    [
      {
        label: "View Detail Customer",
        icon: "eye-20-solid",
        click: () => OpenCustomerDetailModal(row.id),
      },
      {
        label: "Edit",
        icon: "pencil-square-20-solid",
        click: () => OpenModalAddCustomer(true, row),
      },
    ],
  ];

  // Only show "Add Report Installation" for internet customers (not collaborator-only)
  if (row.is_internet === "yes") {
    baseItems.push([
      {
        label: row.hasInstallationReport
          ? "Add Another Installation"
          : "Add Installation Report",
        icon: "archive-box-20-solid",
        click: () => OpenModalReportInstallation(true, row),
      },
    ]);
  } else if (row.is_collaborator === "yes" && row.is_internet !== "yes") {
    // Show disabled option for collaborator-only customers
    baseItems.push([
      {
        label: "Installation Report (Not Available)",
        icon: "archive-box-20-solid",
        disabled: true,
        click: () => {
          notification.warning(
            "Installation Report",
            "Installation reports are not available for collaborator-only customers. Only internet customers can have installation reports."
          );
        },
      },
    ]);
  }

  // Add "View Installation Reports" if customer has reports and is internet customer
  if (row.hasInstallationReport && row.is_internet === "yes") {
    // Get installation reports for this customer and sort by date (most recent first)
    const customerReports = installationReports.value
      .filter((report: any) => report.customer_id === row.id)
      .sort((a: any, b: any) => {
        const dateA = new Date(
          a.installation_completed_at ||
            a.on_air_date ||
            a.installation_created_at ||
            0
        );
        const dateB = new Date(
          b.installation_completed_at ||
            b.on_air_date ||
            b.installation_created_at ||
            0
        );
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });

    // Create individual menu items for each installation report
    // Number them in reverse order so newest report has highest number
    const installationMenuItems = customerReports.map(
      (report: any, index: number) => {
        console.log("🔍 [DEBUG] Creating menu item for report:", {
          index,
          reportId: report.installation_id,
          status: report.installation_status,
          date: report.installation_completed_at || report.on_air_date,
          fullReport: report,
        });

        return {
          label: `Installation #${customerReports.length - index} (${
            report.installation_status || "Unknown"
          }) - ${formatDate(
            report.installation_completed_at || report.on_air_date
          )}`,
          icon: "file-text-20-solid",
          click: () => {
            console.log(
              "🔍 [DEBUG] Menu item clicked for report:",
              report.installation_id
            );
            viewInstallationReportDetail(report.installation_id);
          },
        };
      }
    );

    // Add each report as a separate menu item
    installationMenuItems.forEach((item, index) => {
      baseItems.push([item]);
    });
  }

  baseItems.push(
    [
      {
        label: "View Maps",
        icon: "arrow-right-circle-20-solid",
        click: () => window.open(row.gmaps_link, "_blank"),
      },
    ],
    [
      {
        label: "Delete",
        icon: "trash-2-20-solid",
        click: () => openDeleteConfirmation(row),
      },
    ]
  );

  return baseItems;
};

const notification = useNotification();
const modal = useModal();

function OpenModalAddCustomer(isEdit: boolean, data: any) {
  modal.open(FormAddComponent, {
    isEdit,
    data,
    async onSuccess() {
      await getData();
      modal.close();
    },
  });
}

// Simple modal state
const showInstallationModal = ref(false);
const modalData = ref({ isEdit: false, data: null as any });

function OpenModalReportInstallation(isEdit: boolean, data: any) {
  console.log("[CustomerIndex] OpenModalReportInstallation called:", {
    isEdit,
    data,
  });

  modalData.value = { isEdit, data };
  showInstallationModal.value = true;

  console.log("[CustomerIndex] Modal state set:", {
    showInstallationModal: showInstallationModal.value,
    modalData: modalData.value,
  });
}

function closeInstallationModal() {
  showInstallationModal.value = false;
  modalData.value = { isEdit: false, data: null };
}

async function onInstallationSuccess() {
  console.log("[CustomerIndex] Installation report success callback");
  await getData();
  if (notification && notification.success) {
    notification.success(
      "Success!",
      "Installation report created successfully"
    );
  }
  closeInstallationModal();
}

function OpenCustomerDetailModal(customerId: string) {
  selectedCustomerId.value = customerId;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedCustomerId.value = null;
}

function navigateToInstallationReports(customerId: string) {
  // Navigate to installation reports page with customer filter
  navigateTo(
    `/dashboard/report/customer-installation/reports?customer_id=${customerId}`
  );
}

function viewInstallationReportDetail(installationId: string) {
  console.log(
    "🔍 [DEBUG] viewInstallationReportDetail called with installationId:",
    installationId
  );

  // Check if installationId is valid
  if (!installationId) {
    console.error("❌ [ERROR] installationId is empty or undefined");
    notification.error(
      "Error",
      "Installation ID is missing. Cannot open installation report."
    );
    return;
  }

  // Set navigation context to indicate we came from customer page
  const { setNavigationContext } = useNavigationContext();
  setNavigationContext({
    from: "customer",
    returnUrl: "/dashboard/customer",
    returnLabel: "Back to Customer",
  });

  console.log(
    "🔍 [DEBUG] Navigating to installation report detail page:",
    `/dashboard/report/customer-installation/detail/${installationId}`
  );

  try {
    // Navigate to the specific installation report detail page
    navigateTo(
      `/dashboard/report/customer-installation/detail/${installationId}`
    );
  } catch (error) {
    console.error("❌ [ERROR] Navigation failed:", error);
    notification.error(
      "Navigation Error",
      "Failed to navigate to installation report detail page."
    );
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function debugInstallationReports() {
  console.log("🔍 [DEBUG] === INSTALLATION REPORTS DEBUG ===");
  console.log("Total installation reports:", installationReports.value.length);
  console.log("All installation reports:", installationReports.value);

  console.log("🔍 [DEBUG] === CUSTOMERS WITH REPORTS ===");
  customer.value.forEach((customerItem: any) => {
    if (customerItem.hasInstallationReport) {
      const customerReports = installationReports.value.filter(
        (report: any) => report.customer_id === customerItem.id
      );
      console.log(`Customer: ${customerItem.name} (${customerItem.id})`, {
        reportCount: customerReports.length,
        reports: customerReports.map((report) => ({
          id: report.installation_id,
          status: report.installation_status,
          date: report.installation_completed_at || report.on_air_date,
          customer_id: report.customer_id,
        })),
      });
    }
  });

  // Test navigation with first available report
  const firstReport = installationReports.value[0];
  if (firstReport) {
    console.log(
      "🔍 [DEBUG] Testing navigation with first report:",
      firstReport.installation_id
    );
    viewInstallationReportDetail(firstReport.installation_id);
  } else {
    console.log("❌ [ERROR] No installation reports found to test with");
  }
}

// Function to get count of customers by status
function getStatusCount(status: string) {
  return customer.value.filter((customer: any) => {
    return getCustomerDeviceStatus(customer) === status;
  }).length;
}

// Computed property for related customers (for broadcast feature)
// Only shows customers with unpaid or pending invoices for payment reminders
const relatedCustomers = computed(() => {
  return customer.value
    .filter((c: Customer) => {
      // Only include customers with unpaid or pending invoices
      return c.hasUnpaidInvoice === true || c.hasPendingInvoice === true;
    })
    .map((c: Customer) => ({
      name: c.name,
      phone: c.phone,
      is_internet: c.is_internet,
      is_collaborator: c.is_collaborator,
    }));
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p class="text-sm text-gray-600">Manage your customer database</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <BroadcastFeature
          :related-customers="relatedCustomers"
          class="w-full sm:w-auto"
          :title="`Send payment reminder to ${relatedCustomers.length} customer(s) with unpaid/pending invoices`"
        >
          <template #leading>
            <LucideIcon name="send" :size="16" />
          </template>
        </BroadcastFeature>
        <UButton
          label="Add Customer"
          @click="OpenModalAddCustomer(false, null)"
          class="w-full sm:w-auto"
        >
          <template #leading>
            <LucideIcon name="plus" :size="16" />
          </template>
        </UButton>
        <UButton
          label="Add Installation Report"
          @click="OpenModalReportInstallation(false, null)"
          class="w-full sm:w-auto"
          color="green"
        >
          <template #leading>
            <LucideIcon name="plus" :size="16" />
          </template>
        </UButton>
        <UButton
          label="Refresh Device Status"
          @click="refreshDeviceStatuses"
          class="w-full sm:w-auto"
          color="blue"
          variant="outline"
        >
          <template #leading>
            <LucideIcon name="rotate-cw" :size="16" />
          </template>
        </UButton>
        <UButton
          v-if="statusFilter !== 'all' || invoiceFilter !== 'all'"
          label="Clear Filters"
          @click="
            statusFilter = 'all';
            invoiceFilter = 'all';
          "
          class="w-full sm:w-auto hover:bg-gray-900 hover:text-white transition-colors"
          color="gray"
          variant="outline"
        >
          <template #leading>
            <LucideIcon name="x" :size="16" />
          </template>
        </UButton>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="q"
          placeholder="Search customers by name, email, phone..."
          icon="search"
          class="w-full"
        />
      </div>
    </div>

    <!-- Status Filter Buttons -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap gap-2 items-center">
        <!-- Device Status Filters -->
        <UButton
          :color="statusFilter === 'all' ? 'primary' : 'gray'"
          :variant="statusFilter === 'all' ? 'solid' : 'outline'"
          @click="
            statusFilter = 'all';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>All</span>
          <span class="ml-1 text-xs opacity-75">({{ customer.length }})</span>
        </UButton>
        <UButton
          :color="statusFilter === 'down' ? 'red' : 'gray'"
          :variant="statusFilter === 'down' ? 'solid' : 'outline'"
          @click="
            statusFilter = statusFilter === 'down' ? 'all' : 'down';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Down</span>
          <span class="ml-1 text-xs opacity-75"
            >({{ getStatusCount("down") }})</span
          >
        </UButton>
        <UButton
          :color="statusFilter === 'mixed' ? 'orange' : 'gray'"
          :variant="statusFilter === 'mixed' ? 'solid' : 'outline'"
          @click="
            statusFilter = statusFilter === 'mixed' ? 'all' : 'mixed';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Mixed</span>
          <span class="ml-1 text-xs opacity-75"
            >({{ getStatusCount("mixed") }})</span
          >
        </UButton>
        <UButton
          :color="statusFilter === 'up' ? 'green' : 'gray'"
          :variant="statusFilter === 'up' ? 'solid' : 'outline'"
          @click="
            statusFilter = statusFilter === 'up' ? 'all' : 'up';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Up</span>
          <span class="ml-1 text-xs opacity-75"
            >({{ getStatusCount("up") }})</span
          >
        </UButton>
        <UButton
          :color="statusFilter === 'unknown' ? 'gray' : 'gray'"
          :variant="statusFilter === 'unknown' ? 'solid' : 'outline'"
          @click="
            statusFilter = statusFilter === 'unknown' ? 'all' : 'unknown';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span>Unknown</span>
          <span class="ml-1 text-xs opacity-75"
            >({{ getStatusCount("unknown") }})</span
          >
        </UButton>
        <UButton
          :color="statusFilter === 'off' ? 'gray' : 'gray'"
          :variant="statusFilter === 'off' ? 'solid' : 'outline'"
          @click="
            statusFilter = statusFilter === 'off' ? 'all' : 'off';
            invoiceFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>No Devices</span>
          <span class="ml-1 text-xs opacity-75"
            >({{ getStatusCount("off") }})</span
          >
        </UButton>

        <!-- Separator -->
        <div class="w-px h-6 bg-gray-300 mx-1"></div>

        <!-- Invoice Status Filters -->
        <UButton
          :color="invoiceFilter === 'unpaid_pending' ? 'yellow' : 'gray'"
          :variant="invoiceFilter === 'unpaid_pending' ? 'solid' : 'outline'"
          @click="
            invoiceFilter =
              invoiceFilter === 'unpaid_pending' ? 'all' : 'unpaid_pending';
            statusFilter = 'all';
          "
          class="flex items-center gap-2"
        >
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Unpaid/Pending</span>
          <span class="ml-1 text-xs opacity-75"
            >({{
              customer.filter(
                (c: any) => c.hasUnpaidInvoice || c.hasPendingInvoice
              ).length
            }})</span
          >
        </UButton>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="block sm:hidden space-y-4">
      <div
        v-for="customer in rows"
        :key="customer.id"
        :class="[
          'bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow',
          customer.hasUnpaidInvoice || customer.hasPendingInvoice
            ? 'border-yellow-400 border-2 bg-yellow-50'
            : 'border-gray-200',
        ]"
      >
        <!-- Customer Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <button
              @click="OpenCustomerDetailModal(customer.id)"
              :class="[
                'text-lg font-semibold hover:underline',
                getCustomerDeviceStatus(customer) === 'down'
                  ? 'text-red-600 hover:text-red-800'
                  : getCustomerDeviceStatus(customer) === 'mixed'
                  ? 'text-orange-600 hover:text-orange-800'
                  : 'text-blue-600 hover:text-blue-800',
              ]"
            >
              {{ customer.name }}
            </button>
            <div class="flex items-center gap-3 mt-2 flex-wrap">
              <span
                v-if="customer.hasInstallationReport"
                class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap"
              >
                <UIcon name="check-circle" class="w-3 h-3 mr-1.5" />
                {{
                  customer.installationReportCount > 1
                    ? `${customer.installationReportCount} Reports`
                    : "Report"
                }}
              </span>
              <!-- Invoice Status Badge -->
              <span
                v-if="customer.hasUnpaidInvoice"
                class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap"
                :title="`${customer.unpaidInvoiceCount || 0} unpaid invoice(s)`"
              >
                <UIcon name="alert-circle" class="w-3 h-3 mr-1.5" />
                {{ customer.unpaidInvoiceCount || 0 }} Unpaid
              </span>
              <span
                v-if="customer.hasPendingInvoice"
                class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap"
                :title="`${
                  customer.pendingInvoiceCount || 0
                } pending invoice(s)`"
              >
                <UIcon name="clock" class="w-3 h-3 mr-1.5" />
                {{ customer.pendingInvoiceCount || 0 }} Pending
              </span>
              <!-- Device Status Indicator -->
              <span
                v-if="customer.hasInstallationReport"
                :class="[
                  'inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                  getCustomerDeviceStatus(customer) === 'down'
                    ? 'bg-red-100 text-red-800'
                    : getCustomerDeviceStatus(customer) === 'mixed'
                    ? 'bg-orange-100 text-orange-800'
                    : getCustomerDeviceStatus(customer) === 'up'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800',
                ]"
                :title="`Device Status: ${getCustomerDeviceStatus(
                  customer
                ).toUpperCase()}`"
              >
                <UIcon
                  :name="
                    getCustomerDeviceStatus(customer) === 'down'
                      ? 'x-circle'
                      : getCustomerDeviceStatus(customer) === 'mixed'
                      ? 'alert-triangle'
                      : getCustomerDeviceStatus(customer) === 'up'
                      ? 'check-circle'
                      : 'question-mark-circle'
                  "
                  class="w-3 h-3 mr-1.5"
                />
                {{ getCustomerDeviceStatus(customer).toUpperCase() }}
              </span>
            </div>
          </div>
          <UDropdown :items="items(customer)">
            <UButton
              color="gray"
              variant="ghost"
              icon="ellipsis-horizontal-20-solid"
            />
          </UDropdown>
        </div>

        <!-- Customer Details -->
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="phone" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.phone }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="map-pin" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.address }}</span>
          </div>
          <div v-if="customer.area" class="flex items-center gap-2">
            <UIcon name="building" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.area.name_city }}</span>
            <span
              v-if="customer.area.code_name"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ customer.area.code_name }}
            </span>
          </div>

          <!-- Customer Type Indicators -->
          <div class="flex items-center gap-2 flex-wrap">
            <UIcon name="tag" class="w-4 h-4 text-gray-400" />
            <div class="flex gap-1 flex-wrap">
              <span
                v-if="customer.is_internet === 'yes'"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                <UIcon name="wifi" class="w-3 h-3 mr-1" />
                Internet
              </span>
              <span
                v-if="customer.is_collaborator === 'yes'"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                <UIcon name="handshake" class="w-3 h-3 mr-1" />
                Collaborator
              </span>
              <span
                v-if="customer.is_terminal"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
              >
                <UIcon name="server" class="w-3 h-3 mr-1" />
                Terminal
              </span>
              <span
                v-if="
                  customer.is_internet !== 'yes' &&
                  customer.is_collaborator !== 'yes' &&
                  !customer.is_terminal
                "
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <UIcon name="user" class="w-3 h-3 mr-1" />
                Regular
              </span>
            </div>
          </div>
          <!-- NEW: Packet Internet Information -->
          <div class="flex items-start gap-2">
            <UIcon name="wifi" class="w-4 h-4 text-gray-400 mt-0.5" />
            <div class="flex-1">
              <div
                v-if="customer.products && customer.products.length > 0"
                class="space-y-1"
              >
                <div
                  v-for="(product, index) in customer.products"
                  :key="product.id"
                  class="flex items-center gap-2"
                >
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ product.name }}
                  </span>
                  <span
                    v-if="product.downloadSpeed && product.uploadSpeed"
                    class="text-xs text-gray-500"
                  >
                    {{ product.downloadSpeed }}M/{{ product.uploadSpeed }}M
                  </span>
                </div>
                <div
                  v-if="customer.product_count > 1"
                  class="text-xs text-gray-500"
                >
                  {{ customer.product_count }} different packages
                </div>
              </div>
              <div v-else class="text-gray-500 italic">No package assigned</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden sm:block">
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <UTable :rows="rows" :columns="columns" class="w-full">
          <template #name-data="{ row }">
            <div class="flex items-center space-x-3 flex-wrap">
              <button
                @click="OpenCustomerDetailModal(row.id)"
                :class="[
                  'hover:underline font-medium',
                  getCustomerDeviceStatus(row) === 'down'
                    ? 'text-red-600 hover:text-red-800'
                    : getCustomerDeviceStatus(row) === 'mixed'
                    ? 'text-orange-600 hover:text-orange-800'
                    : 'text-blue-600 hover:text-blue-800',
                ]"
              >
                {{ row.name }}
              </button>
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  v-if="row.hasInstallationReport"
                  class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap"
                  :title="`Has ${row.installationReportCount} Installation Report(s)`"
                >
                  <UIcon name="check-circle" class="w-3 h-3 mr-1.5" />
                  {{
                    row.installationReportCount > 1
                      ? `${row.installationReportCount} Reports`
                      : "Report"
                  }}
                </span>
                <!-- Invoice Status Badge -->
                <span
                  v-if="row.hasUnpaidInvoice"
                  class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap"
                  :title="`${row.unpaidInvoiceCount || 0} unpaid invoice(s)`"
                >
                  <UIcon name="alert-circle" class="w-3 h-3 mr-1.5" />
                  {{ row.unpaidInvoiceCount || 0 }} Unpaid
                </span>
                <span
                  v-if="row.hasPendingInvoice"
                  class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap"
                  :title="`${row.pendingInvoiceCount || 0} pending invoice(s)`"
                >
                  <UIcon name="clock" class="w-3 h-3 mr-1.5" />
                  {{ row.pendingInvoiceCount || 0 }} Pending
                </span>
                <!-- Device Status Indicator -->
                <span
                  v-if="row.hasInstallationReport"
                  :class="[
                    'inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                    getCustomerDeviceStatus(row) === 'down'
                      ? 'bg-red-100 text-red-800'
                      : getCustomerDeviceStatus(row) === 'mixed'
                      ? 'bg-orange-100 text-orange-800'
                      : getCustomerDeviceStatus(row) === 'up'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800',
                  ]"
                  :title="`Device Status: ${getCustomerDeviceStatus(
                    row
                  ).toUpperCase()}`"
                >
                  <UIcon
                    :name="
                      getCustomerDeviceStatus(row) === 'down'
                        ? 'x-circle'
                        : getCustomerDeviceStatus(row) === 'mixed'
                        ? 'alert-triangle'
                        : getCustomerDeviceStatus(row) === 'up'
                        ? 'check-circle'
                        : 'question-mark-circle'
                    "
                    class="w-3 h-3 mr-1.5"
                  />
                  {{ getCustomerDeviceStatus(row).toUpperCase() }}
                </span>
              </div>
            </div>
          </template>

          <template #area_name-data="{ row }">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{{
                row.area?.name_city || "N/A"
              }}</span>
              <span
                v-if="row.area?.code_name"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ row.area.code_name }}
              </span>
            </div>
          </template>

          <template #product_name-data="{ row }">
            <div
              v-if="row.products && row.products.length > 0"
              class="space-y-1"
            >
              <div
                v-for="(product, index) in row.products"
                :key="product.id"
                class="flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {{ product.name }}
                </span>
                <span
                  v-if="product.downloadSpeed && product.uploadSpeed"
                  class="text-xs text-gray-500"
                >
                  {{ product.downloadSpeed }}M/{{ product.uploadSpeed }}M
                </span>
              </div>
              <div v-if="row.product_count > 1" class="text-xs text-gray-500">
                {{ row.product_count }} different packages
              </div>
            </div>
            <div v-else class="text-gray-500 italic">No package assigned</div>
          </template>

          <template #customer_type-data="{ row }">
            <div class="flex flex-col gap-1">
              <span
                v-if="row.is_internet === 'yes'"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                <UIcon name="wifi" class="w-3 h-3 mr-1" />
                Internet
              </span>
              <span
                v-if="row.is_collaborator === 'yes'"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                <UIcon name="handshake" class="w-3 h-3 mr-1" />
                Collaborator
              </span>
              <span
                v-if="row.is_terminal"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
              >
                <UIcon name="server" class="w-3 h-3 mr-1" />
                Terminal
              </span>
              <span
                v-if="
                  row.is_internet !== 'yes' &&
                  row.is_collaborator !== 'yes' &&
                  !row.is_terminal
                "
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <UIcon name="user" class="w-3 h-3 mr-1" />
                Regular
              </span>
            </div>
          </template>

          <template #actions-data="{ row }">
            <UDropdown :items="items(row)">
              <UButton color="gray">
                <LucideIcon name="ellipsis-vertical" :size="20" />
              </UButton>
            </UDropdown>
          </template>
        </UTable>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center sm:justify-end">
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="customer.length"
      />
    </div>

    <!-- Customer Detail Modal -->
    <CustomerDetailModal
      v-if="showDetailModal && selectedCustomerId"
      :customer-id="selectedCustomerId"
      @close="closeDetailModal"
    />

    <!-- Delete Confirmation Modal -->
    <CustomerDeleteConfirmationModal
      v-if="showDeleteModal"
      :is-open="showDeleteModal"
      :customer-id="deleteCustomerId"
      :customer-name="deleteCustomerName"
      :customer-phone="deleteCustomerPhone"
      @close="closeDeleteModal"
      @deleted="onCustomerDeleted"
    />

    <!-- Installation Report Modal -->
    <UModal v-model="showInstallationModal" :prevent-close="false">
      <UCard class="max-w-7xl max-h-[95vh] overflow-hidden">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Installation Report</h3>
            <UButton @click="closeInstallationModal" variant="ghost" size="sm">
              <UIcon name="x" />
            </UButton>
          </div>
        </template>

        <FormCustomerInstallation
          :is-edit="modalData.isEdit"
          :data="modalData.data"
          @success="onInstallationSuccess"
          @close="closeInstallationModal"
        />
      </UCard>
    </UModal>
  </div>
</template>
