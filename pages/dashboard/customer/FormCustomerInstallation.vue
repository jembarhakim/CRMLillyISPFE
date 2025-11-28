<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { userManagementAdminApi } from "@/api/admin/user-management";
import { customerAdminApi } from "@/api/admin/customer";
import { assetAdminApi } from "@/api/admin/asset";
import { assetItemAdminApi } from "@/api/admin/asset-item";
import { mikrotikAdminApi } from "@/api/admin/mikrotik";
import { uploadFileAdminApi } from "@/api/admin/file-upload";
import { useNotificationStore } from "@/stores/notification";
import { useAuthStore } from "@/stores/auth";
import { computed, nextTick, watch, reactive, ref, onMounted, onUnmounted } from "vue";
import { useApiHost } from "@/composables/useApiHost";
import LucideIcon from '@/components/LucideIcon.vue';
import { useCustomToast } from "@/composables/useCustomToast";

const notification = useNotificationStore();
const authStore = useAuthStore();

// Add debugging for component initialization
console.log('[FormCustomerInstallation] Component initializing...');

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({
      id: "",
      technician_id: "",
    }),
  },
  // Add modelValue prop to handle the warning
  modelValue: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// Define emits to handle the afterLeave event warning
const emit = defineEmits([
  "success",
  "close",
  "update:modelValue",
  "afterLeave"
]);

// Add debugging for props
console.log('[FormCustomerInstallation] Props received:', {
  isEdit: props.isEdit,
  data: props.data,
  modelValue: props.modelValue
});



const schema = object({
  customer_id: string().required("Customer is required"),
  assets_id: string().required("Asset is required"),
  product_id: string().required("Package/Product is required"),
  cable_type: string().required("Cable type is required"),
  cable_length: string()
    .required("Cable length is required")
    .test('is-positive', 'Cable length must be greater than 0', (value) => {
      const num = parseFloat(value || '0');
      return num > 0;
    }),
});

const state = reactive({
  // Basic Installation Information
  customer_id: "",
  technician_id: "", // Legacy - kept for backward compatibility
  status: "completed", // Always completed since technician already finished the installation
  notes: "",
  document_type: "KTP",
  document_photo: null as File | null,
  installation_type: "new_installation", // Always new_installation for this form
  on_air_date: "",
  trial_end_date: "",
  service_ready_date: "",
  installation_completed_at: "",
  is_terminal: "no", // Whether this is a terminal installation ('yes' or 'no')
  terminal_customer_installation_id: "", // Installation ID of the terminal installation (from customer_installations table)
  latitude: null as number | null,
  longitude: null as number | null,

  // Multiple Technicians with Roles
  technicians: [] as Array<{
    technician_id: string;
    role: 'senior' | 'junior' | 'helper';
    is_primary: boolean;
    notes: string;
  }>,

  // MikroTik Provisioning Fields
  mac_address: "",
  max_limit: "", // e.g., "10M/10M"
  auto_provision: false,
  dry_run: false,

  // Network Device Information
  assets_id: "",
  product_id: "", // Package/Product selection
  switch_id: "",
  port_number: "",
  remote_port: "",
  eth_port: "",
  ip_static: "",
  kepemilikan_perangkat: "owned",
  status_perangkat: "active",
  last_ping_status: "unknown",

  // Customer Service Information
  cable_type: "UTP Cat6",
  cable_length: "",
  end_port_type: "RJ45",
  user_login: "",
  password: "",
  user_status: "Active",
  installation_notes: "",

  // UI State
  loading: false,
  fetchingDHCP: false,
  dhcpStatus: null as { success: boolean; message: string } | null,
  isTrial: false, // Whether this is a trial installation (affects service_activation_date)
  customers: [] as any[],
  availableTechnicians: [] as any[], // List of available technicians from DB
  assets: [] as any[],
  products: [] as any[], // Available products/packages
  documentPreview: "",
  terminalInstallations: [] as any[], // List of terminal installations (from customer_installations where is_terminal = 'yes')

  // Asset item tracking
  asset_item_id: "" as string | any, // Track the specific asset item selected

  // Technician Photo Documentation
  technician_photos: [] as string[], // Stores uploaded file paths/URLs (after successful form submission)
  technician_photos_notes: "",
  technician_photo_previews: [] as string[], // Stores Data URLs for previews
  selectedTechnicianImage: "",
  showTechnicianModal: false,
  // Local storage for files before upload
  technician_photo_files: [] as File[], // Stores local files before upload
});

// Create a ref for the file input
const fileInputRef = ref<HTMLInputElement | null>(null);
const technicianPhotoInput = ref<HTMLInputElement | null>(null);
const formRef = ref<HTMLFormElement | null>(null);

// Technician photo tracking
const technicianPhotoSizes = ref<number[]>([]);
const isCompressing = ref(false);

// Available asset items for MAC address selection
const availableAssetItems = ref<{ [assetId: string]: any[] }>({});

// Watch for asset changes to clear MAC address selection
watch(() => state.assets_id, (newAssetId: string, oldAssetId: string) => {
  if (newAssetId !== oldAssetId) {
    // Clear MAC address selection when asset changes (affects both Network Device and MikroTik sections)
    state.mac_address = "";
    state.asset_item_id = "";
  }
});

// Watch for asset item ID changes to update MAC address
watch(() => state.asset_item_id, (newAssetItemId: any) => {
  if (!newAssetItemId) {
    state.mac_address = ""; // Clear MAC address
    return;
  }

  // USelectMenu returns the entire object, so we can directly access the mac_address
  if (newAssetItemId && typeof newAssetItemId === 'object' && (newAssetItemId as any).mac_address) {
    state.mac_address = (newAssetItemId as any).mac_address;
    console.log('Updated MAC address to:', state.mac_address);
  }
});

// Helper to normalize the selected asset item ID (USelect can return value or full object)
function getSelectedAssetItemId(): string {
  if (!state.asset_item_id) return "";

  if (typeof state.asset_item_id === "string") {
    return state.asset_item_id;
  }

  if (typeof state.asset_item_id === "object") {
    return (state.asset_item_id as any).id || (state.asset_item_id as any).value || "";
  }

  return "";
}

// Persist the shifted MAC address back to the asset item so records stay accurate
async function updateAssetItemMacToShifted(shiftedMac: string, stickerMac: string) {
  const assetItemId = getSelectedAssetItemId();
  if (!assetItemId) {
    console.warn("No asset item selected; skipping MAC update to shifted value");
    return;
  }

  try {
    const detail = await assetItemAdminApi().getAssetItem(assetItemId);
    if (!detail.success || !detail.data) {
      console.warn("Failed to fetch asset item details for MAC update", detail);
      return;
    }

    const assetItem = detail.data;
    const payload: any = {
      asset_id: assetItem.asset_id || state.assets_id,
      mac_address: shiftedMac,
      mac_sticker: stickerMac || assetItem.mac_sticker || assetItem.mac_address,
      serial_number: assetItem.serial_number ?? null,
      status: assetItem.status || "in_stock",
      company_id: assetItem.company_id ?? null,
      site: assetItem.site ?? "",
    };

    const updateResult = await assetItemAdminApi().editAssetItem(assetItemId, payload);
    if (!updateResult.success) {
      console.warn("Asset item MAC update did not succeed", updateResult);
      return;
    }

    // Update local state/display to use the shifted MAC
    state.mac_address = shiftedMac;

    // Refresh the option in the select so the UI shows the new MAC
    const options = availableAssetItems.value[state.assets_id] || [];
    const optionIndex = options.findIndex((opt: any) => (opt.id || opt.value) === assetItemId);
    if (optionIndex !== -1) {
      const currentOption = options[optionIndex];
      const updatedOption = {
        ...currentOption,
        mac_address: shiftedMac,
        label: `${shiftedMac} (${currentOption.status})`
      };
      const updatedOptions = [...options];
      updatedOptions[optionIndex] = updatedOption;
      availableAssetItems.value = {
        ...availableAssetItems.value,
        [state.assets_id]: updatedOptions
      };

      // Preserve the current selection type (string or object)
      state.asset_item_id = typeof state.asset_item_id === "object" ? updatedOption : assetItemId;
    }

    notification.success("MAC Address Updated", "Device MAC updated to shifted MAC from DHCP lookup");
  } catch (err) {
    console.error("Failed to update asset item MAC to shifted value:", err);
    notification.error("Asset MAC Update Failed", "Could not save shifted MAC address to the device record");
  }
}

// Watch for props changes
watch(() => props.isEdit, (newValue, oldValue) => {
  console.log('[FormCustomerInstallation] isEdit prop changed:', { oldValue, newValue });
}, { immediate: true });

watch(() => props.data, (newValue: any, oldValue: any) => {
  console.log('[FormCustomerInstallation] data prop changed:', { oldValue, newValue });
}, { immediate: true });

watch(
  () => props.isEdit,
  (newValue: boolean) => {
    if (newValue && props.data) {
      // 1. Set the ID as usual
      state.customer_id = props.data.id;

      // 2. ADD THIS: Set location immediately from the prop data
      // This bypasses the need to wait for the customer list to load
      if (props.data.latitude && props.data.longitude) {
        state.latitude = parseFloat(props.data.latitude);
        state.longitude = parseFloat(props.data.longitude);
        console.log('[Init] Location set directly from props:', state.latitude, state.longitude);
      }
    }
  },
  { immediate: true }
);

// Add this to ensure you always have the latest customers (including new ones like Tegar)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    console.log('[Form] Modal opened, refreshing customer list...');
    loadCustomers();
  }
});

// Update your watcher to this safer version
watch(() => state.customer_id, (newCustomerId) => {
  console.log('[Watcher] Customer ID changed to:', newCustomerId);

  if (!newCustomerId) {
    state.latitude = null;
    state.longitude = null;
    return;
  }

  const selectedCustomer = state.customers.find(c => c.id === newCustomerId);
  
  if (selectedCustomer) {
    console.log('[Watcher] Found customer:', selectedCustomer.name, selectedCustomer);
    
    // Check if not null/undefined (allows 0)
    if (selectedCustomer.latitude != null && selectedCustomer.longitude != null) {
      state.latitude = parseFloat(selectedCustomer.latitude);
      state.longitude = parseFloat(selectedCustomer.longitude);
      console.log('[Watcher] Location set to:', state.latitude, state.longitude);
    } else {
      console.warn('[Watcher] Customer exists but has NO location data');
      state.latitude = null;
      state.longitude = null;
    }
  } else {
    // THIS IS LIKELY YOUR ISSUE: The ID exists, but the object is missing from the list
    console.error('[Watcher] ❌ Customer ID selected but NOT found in customers list. List might be stale.');
    // Optional: Trigger a reload here if needed
    // loadCustomers(); 
  }
});

// Watch for product selection to update MikroTik bandwidth automatically
watch(() => state.product_id, (newProductId: string) => {
  if (!newProductId) {
    state.max_limit = ""; // Clear bandwidth limit
    return;
  }

  // Find the selected product and update bandwidth
  const selectedProduct = state.products.find((p: any) => p.id === newProductId);
  if (selectedProduct) {
    console.log('Selected product:', selectedProduct);
    console.log('Raw download_speed_mbps:', selectedProduct.download_speed_mbps);
    console.log('Raw upload_speed_mbps:', selectedProduct.upload_speed_mbps);

    const downloadMbps = selectedProduct.download_speed_mbps || 10;
    const uploadMbps = selectedProduct.upload_speed_mbps || 10;
    state.max_limit = `${downloadMbps}M/${uploadMbps}M`;
    console.log('Updated MikroTik bandwidth to:', state.max_limit, 'for product:', selectedProduct.name);
  }
});

// Watch for is_terminal checkbox - clear terminal installation selection when this record IS the terminal
watch(() => state.is_terminal, (isTerminal: string) => {
  if (isTerminal === 'yes') {
    // Terminal installations cannot point to another terminal
    state.terminal_customer_installation_id = "";
  }
});

// File input ref is now simplified - just used for the UInput component

// Image compression function
const compressImage = (file: File, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1200px width, maintain aspect ratio)
      let { width, height } = img;
      const maxWidth = 1200;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Try different quality levels to achieve target size
      const tryCompress = (quality: number) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const sizeKB = blob.size / 1024;
          console.log(`Compressed image: ${sizeKB.toFixed(1)}KB (quality: ${quality})`);

          if (sizeKB <= maxSizeKB || quality <= 0.1) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            // Try with lower quality
            tryCompress(quality - 0.1);
          }
        }, 'image/jpeg', quality);
      };

      // Start with 0.8 quality
      tryCompress(0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Unified file processing function
const processFile = async (file: File) => {
  console.log('Processing file:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.log('File type validation failed:', file.type);
    alert('Please select an image file (JPG, PNG)');
    return null;
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    console.log('File size validation failed:', file.size);
    alert('File size must be less than 10MB');
    return null;
  }

  let processedFile = file;

  // Compress if file is larger than 1MB
  if (file.size > 1 * 1024 * 1024) {
    console.log('File is large, compressing...');
    try {
      processedFile = await compressImage(file, 500); // Compress to max 500KB
      console.log(`✅ File compressed: ${file.size} bytes → ${processedFile.size} bytes`);
    } catch (error) {
      console.error('Compression failed, using original file:', error);
      // Continue with original file if compression fails
    }
  }

  return processedFile;
};

// Simplified file upload handler

// Set default dates
const today = new Date();
state.on_air_date = today.toISOString().split('T')[0];
state.trial_end_date = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
state.service_ready_date = today.toISOString().split('T')[0];
state.installation_completed_at = today.toISOString().slice(0, 16);

watch(
  () => props.isEdit,
  (newValue: boolean) => {
    if (newValue) {
      state.customer_id = props.data.id;
    }
  },
  { immediate: true }
);

type Schema = InferType<typeof schema>;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log('[FormCustomerInstallation] onSubmit called with event:', event);
  state.loading = true;

  try {
    // Validate required fields
    if (state.technicians.length === 0) {
      notification.error('Validation Error', 'Please assign at least one technician');
      return;
    }

    if (!state.product_id) {
      notification.error('Validation Error', 'Please select a package/product');
      return;
    }

    // Terminal linkage validation:
    // 1. If this is a regular customer (NOT a terminal), we enforce that they must connect to a parent Terminal.
    if (state.is_terminal === 'no') {
      const terminalId = typeof state.terminal_customer_installation_id === 'string'
        ? state.terminal_customer_installation_id.trim()
        : state.terminal_customer_installation_id;

      if (!terminalId) {
        notification.error('Validation Error', 'Please select a terminal installation (HTB) this customer connects to');
        return;
      }
    } 

    // Validate at least one senior technician
    const hasSenior = state.technicians.some((t: any) => t.role === 'senior');
    if (!hasSenior) {
      notification.error('Validation Error', 'At least one senior technician is required');
      return;
    }

    // Terminal customer selection is optional - no validation needed
    // But if is_terminal is 'yes', terminal_customer_id should be set (optional validation)
    // Note: Removed required validation - terminal selection is always optional

    // Check for duplicate technician assignments
    const technicianIds = state.technicians
      .map((tech: any) => tech.technician_id)
      .filter((id: string) => id && id.trim() !== '');

    const uniqueTechnicianIds = [...new Set(technicianIds)];

    if (technicianIds.length !== uniqueTechnicianIds.length) {
      notification.error('Validation Error', 'Cannot assign the same technician multiple times. Please remove duplicate assignments.');
      return;
    }

    // Create FormData for multipart form submission
    const formData = new FormData();

    // Append all form fields
    formData.append('customer_id', state.customer_id);
    formData.append('assets_id', state.assets_id);
    formData.append('status', state.status);
    formData.append('notes', state.notes);
    formData.append('document_type', state.document_type);
    formData.append('installation_type', state.installation_type);
    formData.append('on_air_date', state.on_air_date);
    formData.append('trial_end_date', state.trial_end_date);
    formData.append('service_ready_date', state.service_ready_date);
    formData.append('installation_completed_at', state.installation_completed_at);
    formData.append('is_terminal', state.is_terminal);
    // Terminal installation ID can be set for any installation (not just terminal installations)
    if (state.terminal_customer_installation_id) {
      formData.append('terminal_customer_installation_id', state.terminal_customer_installation_id);
    }

    // Append location data if available
    if (state.latitude !== null && state.longitude !== null) {
      formData.append('latitude', state.latitude.toString());
      formData.append('longitude', state.longitude.toString());
      console.log('✅ Appending location to form data:', { lat: state.latitude, lng: state.longitude });
    } else {
      console.log('⚠️ No location data to append');
    }

    // Multiple technicians (send as JSON)
    formData.append('technicians', JSON.stringify(state.technicians));

    // MikroTik provisioning fields - use MAC address from Network Device section
    const networkMacAddress = state.mac_address || '';
    if (networkMacAddress) formData.append('mac_address', networkMacAddress);
    if (state.max_limit) formData.append('max_limit', state.max_limit);
    formData.append('auto_provision', state.auto_provision.toString());
    formData.append('dry_run', state.dry_run.toString());

    // Network device fields - extract ID from object if it's an object
    let assetItemId = '';
    if (state.asset_item_id) {
      if (typeof state.asset_item_id === 'object' && (state.asset_item_id as any).id) {
        assetItemId = (state.asset_item_id as any).id;
      } else if (typeof state.asset_item_id === 'string') {
        assetItemId = state.asset_item_id;
      }
    }
    formData.append('asset_item_id', assetItemId); // Include specific asset item ID
    if (state.product_id) formData.append('product_id', state.product_id); // Include selected product/package
    formData.append('switch_id', state.switch_id);
    formData.append('port_number', state.port_number);
    formData.append('remote_port', state.remote_port);
    formData.append('eth_port', state.eth_port);
    formData.append('ip_static', state.ip_static);
    formData.append('kepemilikan_perangkat', state.kepemilikan_perangkat);
    formData.append('status_perangkat', state.status_perangkat);
    formData.append('last_ping_status', state.last_ping_status);

    // Customer service fields
    formData.append('cable_type', state.cable_type);
    formData.append('cable_length', state.cable_length.toString());
    formData.append('end_port_type', state.end_port_type);
    formData.append('user_login', state.user_login);
    formData.append('password', state.password);
    formData.append('user_status', state.user_status);
    formData.append('installation_notes', state.installation_notes);

    // Append document photo if selected
    if (state.document_photo) {
      console.log('✅ Appending document photo to form data:', {
        name: state.document_photo.name,
        size: state.document_photo.size,
        type: state.document_photo.type
      });

      // Ensure we're appending the actual File object, not a string
      if (state.document_photo instanceof File) {
        formData.append('document_photo', state.document_photo, state.document_photo.name);
        console.log('✅ File object appended with name:', state.document_photo.name);
      } else {
        console.error('❌ document_photo is not a File object:', typeof state.document_photo);
        return;
      }

      // Log FormData contents for debugging
      console.log('FormData contents after appending document photo:');
      for (let [key, value] of formData.entries()) {
        if (key === 'document_photo') {
          console.log(`  ${key}: [File] ${(value as File).name} (${(value as File).size} bytes, ${(value as File).type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    } else {
      console.log('❌ No document photo selected - document_photo is null or undefined');
      // Try to get file from the native input as fallback
      console.log('🔍 Attempting fallback: getting file from native input...');
      const nativeInput = document.querySelector('input[name="document_photo"]') as HTMLInputElement;
      if (nativeInput && nativeInput.files && nativeInput.files[0]) {
        const file = nativeInput.files[0];
        console.log('✅ Found file via fallback method:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        formData.append('document_photo', file, file.name);
        console.log('✅ File appended via fallback method');
      } else {
        console.log('❌ No file found via fallback method either');
      }
    }

    // Append technician photo files directly to form data (don't upload yet)
    console.log('=== FRONTEND TECHNICIAN PHOTOS DEBUG ===');
    console.log('state.technician_photo_files.length:', state.technician_photo_files.length);

    if (state.technician_photo_files.length > 0) {
      console.log('📤 Adding technician photo files to form data...');
      for (let i = 0; i < state.technician_photo_files.length; i++) {
        const file = state.technician_photo_files[i];
        console.log(`Processing technician photo ${i + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        formData.append(`technician_photo_${i}`, file, file.name);
        console.log(`✅ Added technician photo ${i + 1}/${state.technician_photo_files.length} to form data: ${file.name}`);
      }
      formData.append('technician_photos_count', state.technician_photo_files.length.toString());
      console.log('✅ Added technician_photos_count:', state.technician_photo_files.length);
    } else {
      console.log('❌ No technician photo files to add');
    }
    console.log('=== END FRONTEND TECHNICIAN PHOTOS DEBUG ===');

    if (state.technician_photos_notes) {
      formData.append('technician_photos_notes', state.technician_photos_notes);
      console.log('✅ Appending technician photos notes to form data:', state.technician_photos_notes);
    }

    // Validate IP address format before submitting
    if (state.ip_static && state.ip_static.trim() !== '') {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(state.ip_static.trim())) {
        notification.error('Invalid IP Address', 'Please enter a valid IP address format (e.g., 192.168.1.1)');
        return;
      }
    }

    // Submit using the new API endpoint
    console.log('🚀 Submitting installation report with FormData...');
    console.log('FormData size:', formData.get('document_photo') ? 'File included' : 'No file');

    const response = await customerAdminApi().createReportInstallation(formData);

    console.log("✅ Success creating installation report", response);

    // Check if there's provisioning information in the response
    if (response.data?.provisioning) {
      const prov = response.data.provisioning;
      if (prov.status === 'success') {
        if (prov.dry_run) {
          notification.success('Installation Created & Provisioning Preview',
            `Installation created. Dry-run completed with ${prov.commands?.length || 0} commands. Check console for details.`);
          console.log('Provisioning commands (dry-run):', prov.commands);
        } else {
          notification.success('Installation Created & Provisioned',
            `Installation created and customer provisioned successfully! Code: ${prov.code_name || 'N/A'}`);
        }
      } else if (prov.status === 'failed') {
        notification.warning('Installation Created (Provisioning Failed)',
          `Installation created but provisioning failed: ${prov.error || 'Unknown error'}`);
      } else {
        notification.success('Installation Created',
          `Installation created. Provisioning ${prov.message || 'skipped'}.`);
      }
    } else {
      // Show success notification
      notification.success('Success', 'Installation report created successfully');
    }

    onSuccess();

  } catch (error: any) {
    console.error("❌ Error creating installation report:", error);
    console.error("Error details:", error);

    // Clean up any uploaded technician photos since form submission failed
    if (state.technician_photos.length > 0) {
      console.log('🧹 Cleaning up uploaded technician photos due to form submission failure...');
      // Note: In a production environment, you might want to implement a cleanup API endpoint
      // For now, we'll just clear the local state
      state.technician_photos = [];
      state.technician_photo_files = [];
      state.technician_photo_previews = [];
      technicianPhotoSizes.value = [];
    }

    // Show user-friendly error notification
    let errorMessage = error.message || 'Failed to create installation report';

    // Handle specific error types
    if (errorMessage.includes('Duplicate entry') || errorMessage.includes('duplicate')) {
      errorMessage = 'Cannot assign the same technician multiple times. Please check your technician assignments and remove any duplicates.';
    } else if (errorMessage.includes('IP address format') || errorMessage.includes('Invalid IP')) {
      notification.error('Invalid IP Address', 'Please enter a valid IP address format (e.g., 192.168.1.1)');
      state.loading = false;
      return;
    }

    notification.error('Error', errorMessage);
  } finally {
    state.loading = false;
  }
}

function onSuccess() {
  console.log('[FormCustomerInstallation] onSuccess called');
  emit("success");
  // Dispatch event to refresh installation list
  window.dispatchEvent(new CustomEvent('installation-created'));
}

// Helper function to submit form from outside
function submitForm() {
  const form = document.querySelector('.form-container')?.closest('form') as HTMLFormElement;
  if (form) {
    form.requestSubmit();
  }
}

// Load test data for debugging
const loadTestData = () => {
  // Get current date/time
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const nextMonth = new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0];

  // Basic Installation Information
  state.status = "completed"; // Always completed since technician already finished
  state.notes = "Test installation report - debugging";
  state.document_type = "KTP";
  state.installation_type = "new_installation"; // Always new_installation for this form
  state.on_air_date = today;
  state.trial_end_date = nextMonth;
  state.service_ready_date = today;
  state.installation_completed_at = `${today}T${currentTime}`;

  // Clear and add test technicians if available
  if (state.availableTechnicians.length > 0) {
    state.technicians = [];
    // Add first available as senior primary
    if (state.availableTechnicians[0]) {
      state.technicians.push({
        technician_id: state.availableTechnicians[0].id,
        role: 'senior',
        is_primary: true,
        notes: 'Lead technician - test'
      });
    }
    // Add second available as junior if exists
    if (state.availableTechnicians.length > 1) {
      state.technicians.push({
        technician_id: state.availableTechnicians[1].id,
        role: 'junior',
        is_primary: false,
        notes: 'Assistant technician - test'
      });
    }
  }

  // MikroTik Provisioning Fields
  // Note: MAC address will be automatically set from Network Device section
  state.max_limit = "10M/10M";
  state.auto_provision = true;
  state.dry_run = true; // Safe for testing

  // Network Device Information
  // Select first available product for testing
  if (state.products.length > 0) {
    state.product_id = state.products[0].id;
    console.log('Test data: Selected product:', state.products[0].name);
  }
  state.switch_id = "SW-TEST-001";
  state.port_number = "10";
  state.remote_port = "2000";
  state.eth_port = "eth0";
  state.ip_static = "192.168.1.100";
  state.kepemilikan_perangkat = "owned";
  state.status_perangkat = "active";
  state.last_ping_status = "up";

  // Customer Service Information
  state.cable_type = "UTP Cat6";
  state.cable_length = 20;
  state.end_port_type = "RJ45";
  state.user_login = "testuser@example.com";
  state.password = "testpassword123";
  state.user_status = "Active";
  state.installation_notes = "Test installation with all fields populated";

  notification.success('Test Data Loaded', 'All fields have been filled with test data. Select a customer and asset to complete.');
};

// Handle document photo upload
const handleDocumentPhotoUpload = async (event: Event) => {
  console.log('File input change event triggered');
  console.log('Event details:', {
    type: event.type,
    target: event.target,
    currentTarget: event.currentTarget
  });

  // Get the file from the event
  const input = event.target as HTMLInputElement;
  console.log('Input element:', input);
  console.log('Input files:', input?.files);
  console.log('Input files length:', input?.files?.length);

  // Also try to get file from ref as backup
  if (fileInputRef.value) {
    console.log('File input ref:', fileInputRef.value);
    console.log('File input ref files:', fileInputRef.value.files);
    console.log('File input ref files length:', fileInputRef.value.files?.length);
  }

  const file = input?.files?.[0] || fileInputRef.value?.files?.[0];
  console.log('Selected file:', file);

  if (!file) {
    console.log('❌ No file selected');
    state.document_photo = null;
    state.documentPreview = '';
    // Don't clear the input value - this might be causing the issue
    return;
  }

  // Prevent the input from being cleared
  if (input && file) {
    console.log('Preserving file input value');
  }

  console.log('✅ File selected:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // First, create preview directly from the file to test
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    state.documentPreview = result;
    console.log('✅ Document preview created successfully (direct):', {
      previewLength: result?.length || 0,
      previewType: typeof result,
      previewStart: result?.substring(0, 50) + '...'
    });
  };
  reader.onerror = (e) => {
    console.error('❌ FileReader error:', e);
    state.documentPreview = '';
  };
  reader.readAsDataURL(file);

  try {
    // Process the file (validate and compress if needed)
    const processedFile = await processFile(file);

    if (processedFile) {
      state.document_photo = processedFile;
      console.log('✅ Document photo file processed successfully:', {
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type
      });
    } else {
      console.log('❌ File processing failed, but keeping original file');
      state.document_photo = file; // Keep the original file if processing fails
    }
  } catch (error) {
    console.error('❌ Error processing file:', error);
    state.document_photo = file; // Keep the original file if processing fails
  }
};

// Technician photo functions
function triggerTechnicianPhotoUpload() {
  technicianPhotoInput.value?.click();
}

// Helper function to add click outside handler for toast
function addToastClickOutsideHandler(toastId: string, toast: ReturnType<typeof useCustomToast>) {
  // Use multiple ticks to ensure DOM is ready
  nextTick(() => {
    nextTick(() => {
      // Try multiple selectors to find the toast element
      let toastElement: HTMLElement | null = null;

      // Try finding by data attribute first
      toastElement = document.querySelector(`[data-toast-id="${toastId}"]`) as HTMLElement;

      // If not found, try finding by ID
      if (!toastElement) {
        toastElement = document.querySelector(`#${toastId}`) as HTMLElement;
      }

      // If still not found, try finding the last toast notification
      if (!toastElement) {
        const allToasts = document.querySelectorAll('[role="alert"], .ui-notification, [class*="notification"]');
        if (allToasts.length > 0) {
          toastElement = allToasts[allToasts.length - 1] as HTMLElement;
        }
      }

      if (toastElement) {
        // Set data attribute for easier selection
        toastElement.setAttribute('data-toast-id', toastId);

        // Add click outside handler
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
          const target = event.target as HTMLElement;

          // Check if click is outside the toast element
          if (toastElement && !toastElement.contains(target)) {
            // Don't close if clicking on another toast
            const clickedToast = target.closest('[role="alert"], .ui-notification, [class*="notification"]');
            if (!clickedToast || clickedToast === toastElement) {
              toast.remove(toastId);
              document.removeEventListener('click', handleClickOutside);
              document.removeEventListener('touchstart', handleClickOutside);
            }
          }
        };

        // Add event listeners after a short delay to avoid immediate trigger
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside as EventListener, true);
          document.addEventListener('touchstart', handleClickOutside as EventListener, true);
        }, 150);
      }
    });
  });
}

async function handleTechnicianPhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files) return;

  const currentCount = state.technician_photo_previews.length;
  const newFilesCount = files.length;

  if (currentCount + newFilesCount > 10) {
    const toast = useCustomToast();
    const toastId = `error-max-photos-${Date.now()}`;
    toast.add({
      id: toastId,
      title: "Error",
      description: `Maximum 10 photos allowed. You currently have ${currentCount} photos and are trying to add ${newFilesCount} more.`,
      color: "red",
      actions: [{
        label: '✕',
        click: () => {
          toast.remove(toastId);
        },
        variant: 'ghost'
      }]
    });
    addToastClickOutsideHandler(toastId, toast);
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      const toast = useCustomToast();
      const toastId = `error-validation-${Date.now()}-${i}`;
      toast.add({
        id: toastId,
        title: "Error",
        description: validation.message,
        color: "red",
        actions: [{
          label: '✕',
          click: () => {
            toast.remove(toastId);
          },
          variant: 'ghost'
        }]
      });
      addToastClickOutsideHandler(toastId, toast);
      continue;
    }

    // Compress image using existing compression function (2MB limit)
    const originalSize = file.size;
    const compressedFile = await compressImageFile(file, 2 * 1024 * 1024);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Store compressed file locally (don't upload yet)
    state.technician_photo_files.push(compressedFile);

    // Create preview for the compressed file
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      state.technician_photo_previews.push(dataUrl);
    };
    reader.readAsDataURL(compressedFile);

    technicianPhotoSizes.value.push(compressedSize);

    const toast = useCustomToast();
    const toastId = `success-photo-${Date.now()}-${i}`;
    toast.add({
      id: toastId,
      title: "Success",
      description: `Photo added successfully. Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% reduction). Will be uploaded when form is submitted.`,
      color: "green",
      actions: [{
        label: '✕',
        click: () => {
          toast.remove(toastId);
        },
        variant: 'ghost'
      }]
    });
    addToastClickOutsideHandler(toastId, toast);
  }

  input.value = ''; // Clear input
}

function removeTechnicianPhoto(index: number) {
  state.technician_photos.splice(index, 1);
  state.technician_photo_previews.splice(index, 1);
  technicianPhotoSizes.value.splice(index, 1);
  state.technician_photo_files.splice(index, 1);
}

// Computed property for total size
const totalTechnicianPhotoSize = computed(() => {
  return technicianPhotoSizes.value.reduce((total: number, size: number) => total + size, 0);
});

// File size formatting utility
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Use the existing compression function from tickets page
async function compressImageFile(file: File, maxBytes: number): Promise<File> {
  try {
    // Skip compression for non-images
    if (!file.type.startsWith('image/')) return file
    // Already small enough
    if (file.size <= maxBytes) return file

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Scale down if image is huge; keep aspect ratio
    const maxDim = 2000 // cap the longest side to limit memory
    let { width, height } = bitmap
    const ratio = Math.min(1, maxDim / Math.max(width, height))
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
    canvas.width = width
    canvas.height = height
    ctx.drawImage(bitmap, 0, 0, width, height)

    // Binary search quality to fit under maxBytes
    let low = 0.5, high = 0.92, bestBlob: Blob | null = null
    for (let i = 0; i < 6; i++) {
      const q = (low + high) / 2
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', q))
      if (blob.size > 0 && blob.size <= maxBytes) { bestBlob = blob; high = q } else { low = q }
    }
    const out = bestBlob || await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', 0.85))
    // If still larger, accept and let backend reject
    if (out.size >= file.size) return file
    return new File([out], file.name.replace(/\.(png|jpeg|jpg|webp)$/i, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// File validation function (reused from tickets)
function validateFile(file: File): { isValid: boolean; message: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  if (file.size > maxSize) {
    return { isValid: false, message: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'File type not supported. Please use JPG, PNG, or GIF' };
  }

  return { isValid: true, message: 'File is valid' };
}

// Load data functions
async function loadCustomers() {
  console.log('[FormCustomerInstallation] Loading customers...');
  try {
    const response = await customerAdminApi().getAllCustomers();
    state.customers = response.data || [];
    console.log('[FormCustomerInstallation] Customers loaded:', state.customers.length);
  } catch (error) {
    console.error('[FormCustomerInstallation] Failed to load customers:', error);
  }
}

async function loadTechnicians() {
  console.log('[FormCustomerInstallation] Loading technicians...');
  try {
    const response = await userManagementAdminApi().getAllUsers({ query: { role: "TECHNICIAN" } });
    state.availableTechnicians = response.data || [];
    console.log('[FormCustomerInstallation] Technicians loaded:', state.availableTechnicians.length);
  } catch (error) {
    console.error('[FormCustomerInstallation] Failed to load technicians:', error);
  }
}

async function loadAssets() {
  console.log('[FormCustomerInstallation] Loading assets...');
  try {
    const response = await assetAdminApi().getAllAssets();
    if (response.success) {
      state.assets = response.data.map((asset: any) => ({
        id: asset.id,
        name: `${asset.brand} ${asset.model} (${asset.serial_number})`,
        brand: asset.brand,
        model: asset.model,
        serial_number: asset.serial_number,
        display: `${asset.brand} ${asset.model} (${asset.serial_number})`
      }));
      console.log('[FormCustomerInstallation] Assets loaded:', state.assets.length);
    } else {
      console.warn('[FormCustomerInstallation] Assets response not successful:', response);
    }
  } catch (error) {
    console.error('[FormCustomerInstallation] Failed to load assets:', error);
  }
}

async function loadProducts() {
  console.log('[FormCustomerInstallation] Loading products...');
  try {
    const response = await customerAdminApi().getAllProducts();
    if (response.success) {
      state.products = response.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        download_speed_mbps: product.download_speed_mbps,
        upload_speed_mbps: product.upload_speed_mbps,
        price: product.price,
        display: `${product.name} (${product.download_speed_mbps || 'N/A'}M/${product.upload_speed_mbps || 'N/A'}M) - ${product.description || 'No description'}`
      }));
      console.log('[FormCustomerInstallation] Products loaded:', state.products.length);
      // Debug: Log the first product to see its structure
      if (state.products.length > 0) {
        console.log('[FormCustomerInstallation] First product structure:', state.products[0]);
        console.log('[FormCustomerInstallation] Download speed:', state.products[0].download_speed_mbps);
        console.log('[FormCustomerInstallation] Upload speed:', state.products[0].upload_speed_mbps);
      }
    } else {
      console.warn('[FormCustomerInstallation] Products response not successful:', response);
    }
  } catch (error) {
    console.error('[FormCustomerInstallation] Failed to load products:', error);
  }
}

async function loadTerminalCustomers() {
  console.log('[FormCustomerInstallation] Loading terminal installations...');
  try {
    // Use the API endpoint to get terminal installations
    const api = useApiHost();
    const url = `${api}/api/admin/customer-installation?is_terminal=yes`;
    console.log('[FormCustomerInstallation] Fetching from URL:', url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    console.log('[FormCustomerInstallation] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FormCustomerInstallation] Response error:', errorText);
      throw new Error(`Failed to fetch terminal installations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[FormCustomerInstallation] Raw API response:', data);

    // Handle both response formats: {success: true, data: [...]} or direct array
    const installations = data.success ? (data.data || []) : (data.data || data || []);
    console.log('[FormCustomerInstallation] Extracted installations:', installations.length, installations);

    if (installations && installations.length > 0) {
      // First drop any soft-deleted installations
      const activeInstallations = installations.filter((inst: any) => {
        const deletedAtRaw = inst.deleted_at ?? inst.deletedAt;

        // Consider it deleted if deleted_at is present and not explicitly null/invalid
        let isDeleted = false;
        if (deletedAtRaw !== undefined) {
          if (deletedAtRaw === null) {
            isDeleted = false;
          } else if (typeof deletedAtRaw === 'string') {
            const trimmed = deletedAtRaw.trim().toLowerCase();
            isDeleted = trimmed !== '' && trimmed !== 'null';
          } else if (typeof deletedAtRaw === 'object') {
            // GORM DeletedAt struct: { Time: "...", Valid: true }
            const validFlag = (deletedAtRaw as any).Valid ?? (deletedAtRaw as any).valid;
            const timeVal = (deletedAtRaw as any).Time ?? (deletedAtRaw as any).time;
            isDeleted = validFlag === true || !!timeVal;
          } else {
            // Any other truthy value means deleted
            isDeleted = !!deletedAtRaw;
          }
        }

        if (isDeleted) {
          console.log('[FormCustomerInstallation] Skipping soft-deleted installation:', inst.id, deletedAtRaw);
        }
        return !isDeleted;
      });

      // Backend should already filter by is_terminal=yes, but double-check for safety
      const terminalInstallations = activeInstallations.filter((inst: any) => {
        const isTerminal = inst.is_terminal === 'yes' || inst.is_terminal === 'Yes' || inst.is_terminal === true;
        console.log('[FormCustomerInstallation] Installation:', inst.id, 'is_terminal:', inst.is_terminal, 'matches:', isTerminal);
        return isTerminal;
      });

      console.log('[FormCustomerInstallation] Terminal installations after filter:', terminalInstallations.length);

      // Map installations to options with installation ID as value and customer info as display
      state.terminalInstallations = terminalInstallations.map((inst: any) => {
        // Get customer name from relationship or customer_id
        let customerName = 'Unknown Customer';
        let customerPhone = '';

        if (inst.customer && inst.customer.name) {
          customerName = inst.customer.name;
          customerPhone = inst.customer.phone || '';
        } else if (inst.Customer && inst.Customer.name) {
          customerName = inst.Customer.name;
          customerPhone = inst.Customer.phone || '';
        }

        // Format installation date if available
        const installDate = inst.installation_completed_at || inst.createdAt || '';
        const dateStr = installDate ? new Date(installDate).toLocaleDateString() : '';

        // Create display string: "Customer Name - Installation ID (Date)"
        const display = `${customerName} - ${inst.id.substring(0, 8)}${dateStr ? ` (${dateStr})` : ''}`;

        console.log('[FormCustomerInstallation] Mapped installation:', {
          id: inst.id,
          customer_name: customerName,
          display: display
        });

        return {
          id: inst.id, // Installation ID as value
          installation_id: inst.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_id: inst.customer_id || inst.CustomerID,
          display: display
        };
      });

      console.log('[FormCustomerInstallation] Terminal installations loaded:', state.terminalInstallations.length, state.terminalInstallations);
    } else {
      console.warn('[FormCustomerInstallation] No installations returned from API');
      state.terminalInstallations = [];
    }
  } catch (error) {
    console.error('[FormCustomerInstallation] Failed to load terminal installations:', error);
    state.terminalInstallations = [];
  }
}

// Load available asset items when an asset is selected
async function onAssetChange(assetId: string) {
  // Always clear the MAC address selection when asset changes
  state.mac_address = ""; // This clears both Network Device and MikroTik MAC address
  state.asset_item_id = "";

  if (!assetId) {
    return;
  }

  try {
    // Always reload asset items for the selected asset (don't cache to ensure fresh data)
    const response = await assetItemAdminApi().getAvailableAssetItems(assetId);
    if (response.success) {
      availableAssetItems.value[assetId] = response.data.map((item: any) => ({
        value: item.id, // Use item ID as value for better tracking
        label: `${item.mac_address} (${item.status})`,
        id: item.id,
        mac_address: item.mac_address,
        status: item.status
      }));
    } else {
      availableAssetItems.value[assetId] = [];
    }
  } catch (error) {
    console.error("Failed to load available asset items:", error);
    availableAssetItems.value[assetId] = [];
    notification.error('Error', 'Failed to load available MAC addresses');
  }
}


// Close modal function
function closeModal() {
  console.log('[FormCustomerInstallation] closeModal called');

  // Clear any pending technician photo files when closing modal
  if (state.technician_photo_files.length > 0) {
    console.log('🧹 Clearing pending technician photo files on modal close');
    state.technician_photo_files = [];
    state.technician_photo_previews = [];
    technicianPhotoSizes.value = [];
  }

  emit("close");
}

// Helper functions for managing technicians
function addTechnician() {
  state.technicians.push({
    technician_id: "",
    role: "junior",
    is_primary: state.technicians.length === 0, // First technician is primary by default
    notes: "",
  });
}

// Get available technicians (excluding already assigned ones)
function getAvailableTechniciansForIndex(currentIndex: number) {
  const assignedTechnicianIds = state.technicians
    .map((tech: any, index: number) => index !== currentIndex ? tech.technician_id : null)
    .filter((id: string | null) => id && id.trim() !== '');

  return state.availableTechnicians.filter((tech: any) =>
    !assignedTechnicianIds.includes(tech.id)
  );
}

function removeTechnician(index: number) {
  const removedTech = state.technicians[index];
  state.technicians.splice(index, 1);

  // If we removed the primary, make the first senior primary
  if (removedTech.is_primary && state.technicians.length > 0) {
    const firstSenior = state.technicians.find((t: any) => t.role === 'senior');
    if (firstSenior) {
      firstSenior.is_primary = true;
    } else if (state.technicians.length > 0) {
      state.technicians[0].is_primary = true;
    }
  }
}

function setPrimaryTechnician(index: number) {
  state.technicians.forEach((tech: any, i: number) => {
    tech.is_primary = i === index;
  });
}

// Fetch DHCP lease for the selected MAC address
async function fetchDHCPLease() {
  if (!state.mac_address) {
    notification.error('Error', 'Please select a MAC address first');
    return;
  }

  state.fetchingDHCP = true;
  state.dhcpStatus = null;

  try {
    console.log('Fetching DHCP lease for MAC:', state.mac_address);

    const result = await mikrotikAdminApi().getDHCPLease(state.mac_address);

    if (result.success) {
      const shiftedMac = result.data?.shifted_mac || result.data?.mac_address;
      const stickerMac = result.data?.sticker_mac || result.data?.mac_sticker || state.mac_address;

      // Persist the shifted MAC back to the asset item (so asset records match the actual router MAC)
      if (shiftedMac) {
        await updateAssetItemMacToShifted(shiftedMac, stickerMac);
      }

      state.ip_static = result.data.found_ip;
      state.dhcpStatus = {
        success: true,
        message: `DHCP lease found: MAC ${result.data.mac_address}, IP ${result.data.found_ip}`
      };
      notification.success('DHCP Lease Found', `MAC ${result.data.mac_address}, IP address ${result.data.found_ip} fetched successfully`);
      console.log('DHCP lease response:', result);
    } else {
      const errorMessage = result.message || 'Failed to fetch DHCP lease';
      state.dhcpStatus = {
        success: false,
        message: errorMessage
      };
      notification.error('DHCP Error', errorMessage);
      console.error('DHCP lease error:', result);
    }
  } catch (error: any) {
    console.error('DHCP fetch error:', error);

    let errorMessage = 'Network error while fetching DHCP lease';
    if (error.message) {
      errorMessage = error.message;
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'DHCP API endpoint not found. Please check server configuration.';
      } else if (error.message.includes('MikroTik service not initialized') || error.message.includes('MikroTik service not connected')) {
        errorMessage = 'MikroTik router is not connected. Please connect to MikroTik first in the MikroTik management section.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
    }

    state.dhcpStatus = {
      success: false,
      message: errorMessage
    };
    notification.error('DHCP Error', errorMessage);
  } finally {
    state.fetchingDHCP = false;
  }
}

// Load data on component mount
onMounted(async () => {
  console.log('[FormCustomerInstallation] Component mounted, loading data...');
  console.log('[FormCustomerInstallation] Component should now be rendered inside modal');

  // Setup date input click handler to open calendar picker
  nextTick(() => {
    const setupDateInput = () => {
      const dateInputs = document.querySelectorAll('.date-input-clickable input[type="date"], .date-input-clickable input[type="datetime-local"]');
      dateInputs.forEach((dateInput) => {
        const input = dateInput as HTMLInputElement;
        // Check if listener already added
        if (!(input as any).__datePickerSetup) {
          (input as any).__datePickerSetup = true;

          // Add click handler to open date picker
          input.addEventListener('click', function (e) {
            // Use showPicker() if available (modern browsers)
            if (this.showPicker && typeof this.showPicker === 'function') {
              try {
                const pickerResult = (this.showPicker as () => Promise<void>)();
                pickerResult?.catch(() => {
                  // Fallback: just focus
                  this.focus();
                });
              } catch (error) {
                // Fallback: just focus if showPicker fails
                this.focus();
              }
            }
          });

          // Also handle focus event
          input.addEventListener('focus', function () {
            // Small delay to ensure input is fully focused
            setTimeout(() => {
              if (this.showPicker && typeof this.showPicker === 'function') {
                try {
                  const pickerResult = (this.showPicker as () => Promise<void>)();
                  pickerResult?.catch(() => {
                    // Silently fail if showPicker is not available
                  });
                } catch (error) {
                  // Silently fail if showPicker fails
                }
              }
            }, 100);
          });
        }
      });
    };

    // Setup immediately
    setupDateInput();

    // Also setup when DOM changes (for dynamic content)
    const dateInputObserver = new MutationObserver(() => {
      setupDateInput();
    });

    dateInputObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup observer when component unmounts
    onUnmounted(() => {
      dateInputObserver.disconnect();
    });
  });

  // Debug: Check if component is visible
  setTimeout(() => {
    const componentElement = document.querySelector('.bg-gradient-to-br.from-gray-50');
    console.log('[FormCustomerInstallation] Component element found:', !!componentElement);
    if (componentElement) {
      console.log('[FormCustomerInstallation] Component styles:', {
        display: getComputedStyle(componentElement).display,
        visibility: getComputedStyle(componentElement).visibility,
        opacity: getComputedStyle(componentElement).opacity
      });
    }
  }, 100);

  try {
    await Promise.all([
      loadCustomers(),
      loadTechnicians(),
      loadAssets(),
      loadProducts()
    ]);

    // Always load terminal installations (available for all installations)
    await loadTerminalCustomers();

    // Load edit mode data if applicable
    if (props.isEdit && props.data) {
      state.is_terminal = props.data.is_terminal || 'no';
      state.terminal_customer_installation_id = props.data.terminal_customer_installation_id || "";
    }

    console.log('[FormCustomerInstallation] Data loaded successfully:', {
      customers: state.customers.length,
      technicians: state.availableTechnicians.length,
      assets: state.assets.length,
      products: state.products.length
    });

    // Add one technician by default
    if (state.technicians.length === 0) {
      console.log('[FormCustomerInstallation] Adding default technician...');
      addTechnician();
    }

    console.log('[FormCustomerInstallation] Component fully initialized');
  } catch (error) {
    console.error('[FormCustomerInstallation] Error during component initialization:', error);
  }
});
</script>

<style scoped>
/* Fix dropdown z-index issue */
:deep(.usm-container) {
  z-index: 50 !important;
}

:deep(.usm-menu) {
  z-index: 50 !important;
}

/* Ensure document type dropdown appears above technician photo section */
.document-info-section {
  position: relative;
  z-index: 10;
}

/* Override any conflicting z-index from technician photo section */
:deep(.technician-photo-section) {
  z-index: 5 !important;
}

/* Prevent layout shift during scroll */
.technician-card {
  contain: layout style paint;
  will-change: auto;
}

/* Smooth scrolling for better UX */
.overflow-y-auto {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* Prevent text selection during scroll on mobile */
@media (max-width: 640px) {
  .technician-card {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .technician-card input,
  .technician-card select,
  .technician-card textarea {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }
}

/* Ensure proper touch scrolling on mobile */
@media (hover: none) and (pointer: coarse) {
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }
}

/* Fix MikroTik section scrolling alignment issues */
.mikrotik-section {
  contain: layout style paint;
  will-change: auto;
}

.mikrotik-form {
  contain: layout;
}

.mikrotik-field {
  contain: layout style;
  transform: translateZ(0);
  /* Force hardware acceleration */
  backface-visibility: hidden;
}

.mikrotik-field label {
  position: relative;
  z-index: 1;
  display: block;
}

.mikrotik-field .relative {
  position: relative;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Prevent text and input misalignment during scroll */
.mikrotik-field input,
.mikrotik-field .relative {
  transform: translateZ(0);
  will-change: auto;
}

/* Ensure consistent rendering context */
.mikrotik-field * {
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Form container optimization */
.form-container {
  contain: layout style;
  transform: translateZ(0);
}

/* Prevent any layout shifts during scroll */
.form-container>div {
  contain: layout style;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Optimize form inputs for smooth scrolling */
.form-container input,
.form-container select,
.form-container textarea {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Fix toggle switches alignment during scroll */
.toggle-switch {
  contain: layout style;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.toggle-switch * {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Fix modal footer positioning and remove gaps */
.sticky {
  position: sticky;
  z-index: 10;
}

/* Ensure proper spacing for scrollable content */
.overflow-y-auto {
  padding-bottom: 2rem !important;
  /* Extra space for footer visibility */
}

/* Ensure footer is always visible */
.flex-shrink-0 {
  flex-shrink: 0 !important;
}

/* Ensure form container takes full height and allows scrolling */
.form-container {
  min-height: 0 !important;
}

/* Ensure the main container structure is correct */
.installation-card {
  display: flex !important;
  flex-direction: column !important;
}

:deep(.installation-card [class*="body"]) {
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
}

/* Ensure form wrapper doesn't clip footer */
:deep(.installation-card [class*="body"] > div) {
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  flex: 1 !important;
  height: 100% !important;
}

/* Ensure main form container uses full height */
.flex.flex-col.h-full {
  height: 100% !important;
  min-height: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

/* Ensure footer doesn't overflow */
.overflow-hidden.max-w-full {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Ensure footer content doesn't overflow */
.overflow-hidden.max-w-full>div {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Ensure text wrapping works properly */
.break-words {
  word-wrap: break-word !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}

/* Ensure footer text doesn't overflow on mobile */
@media (max-width: 640px) {
  .break-words {
    max-width: 100% !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
  }
}

/* Add Technician Button - Enhanced styling with hover */
:deep(.add-technician-button),
.add-technician-button {
  font-weight: 600 !important;
  border: 2px solid #6366F1 !important;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2) !important;
  transition: all 0.2s ease-in-out !important;
}

:deep(.add-technician-button:hover:not(:disabled)),
.add-technician-button:hover:not(:disabled) {
  background-color: #4F46E5 !important;
  border-color: #4F46E5 !important;
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3) !important;
  transform: translateY(-1px) !important;
}

:deep(.add-technician-button:active:not(:disabled)),
.add-technician-button:active:not(:disabled) {
  transform: translateY(0) !important;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2) !important;
}

/* Primary Button - Enhanced styling with hover */
:deep(.primary-button),
.primary-button {
  font-weight: 600 !important;
  transition: all 0.2s ease-in-out !important;
}

:deep(.primary-button:not(:disabled):hover),
.primary-button:not(:disabled):hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

:deep(.primary-button:not(:disabled):active),
.primary-button:not(:disabled):active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

/* Primary button when not primary (gray outline) - hover effect */
:deep(.primary-button[class*="bg-gray"]:not(:disabled):hover),
:deep(.primary-button[class*="border-gray"]:not(:disabled):hover) {
  background-color: #F3F4F6 !important;
  border-color: #9CA3AF !important;
  color: #1F2937 !important;
}

/* Primary button when is primary (green solid) */
:deep(.primary-button[class*="bg-green"]),
:deep(.primary-button.bg-green) {
  background-color: #10B981 !important;
  border-color: #10B981 !important;
  color: #FFFFFF !important;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2) !important;
}

:deep(.primary-button[class*="bg-green"]:hover),
:deep(.primary-button.bg-green:hover) {
  background-color: #059669 !important;
  border-color: #059669 !important;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3) !important;
}

/* Primary button disabled state */
:deep(.primary-button:disabled),
.primary-button:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

/* Toast notification close button styling */
:deep([role="alert"] [role="button"]),
:deep([role="alert"] button),
:deep(.ui-notification button),
:deep([class*="ui-notification"] button),
:deep([role="alert"] [class*="actions"] button) {
  min-width: 32px !important;
  min-height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  color: #374151 !important;
  background-color: transparent !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease-in-out !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
}

:deep([role="alert"] [role="button"]:hover),
:deep([role="alert"] button:hover),
:deep(.ui-notification button:hover),
:deep([class*="ui-notification"] button:hover),
:deep([role="alert"] [class*="actions"] button:hover) {
  background-color: rgba(0, 0, 0, 0.1) !important;
  border-color: rgba(0, 0, 0, 0.2) !important;
  color: #111827 !important;
  transform: scale(1.1) !important;
}

:deep([role="alert"] [role="button"]:active),
:deep([role="alert"] button:active),
:deep(.ui-notification button:active),
:deep([class*="ui-notification"] button:active),
:deep([role="alert"] [class*="actions"] button:active) {
  transform: scale(0.95) !important;
}

/* Ensure toast notification actions are visible */
:deep([role="alert"] [class*="actions"]),
:deep(.ui-notification [class*="actions"]) {
  display: flex !important;
  align-items: center !important;
}

/* Custom input styling - white background, clean borders - same as Add Customer form */
:deep(.customer-input input),
:deep(.customer-input) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.customer-input input:focus),
:deep(.customer-input:focus-within) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

:deep(.customer-input input::placeholder) {
  color: #6B7280 !important;
}

/* Date input calendar icon styling - make it black and visible */
/* For Chrome, Safari, Edge (WebKit browsers) */
:deep(.customer-input input[type="date"]::-webkit-calendar-picker-indicator),
:deep(.customer-input input[type="datetime-local"]::-webkit-calendar-picker-indicator) {
  filter: brightness(0) !important;
  opacity: 1 !important;
  cursor: pointer !important;
  background-color: transparent !important;
  width: 20px !important;
  height: 20px !important;
  padding: 2px !important;
  margin-right: 5px !important;
}

:deep(.customer-input input[type="date"]::-webkit-calendar-picker-indicator:hover),
:deep(.customer-input input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover) {
  opacity: 0.8 !important;
  filter: brightness(0) opacity(0.8) !important;
}

/* For Firefox */
:deep(.customer-input input[type="date"]),
:deep(.customer-input input[type="datetime-local"]) {
  color-scheme: light !important;
}

:deep(.customer-input input[type="date"]::-moz-calendar-picker-indicator),
:deep(.customer-input input[type="datetime-local"]::-moz-calendar-picker-indicator) {
  filter: brightness(0) saturate(100%) !important;
  opacity: 1 !important;
  cursor: pointer !important;
}

/* Ensure date input text is black */
:deep(.customer-input input[type="date"]),
:deep(.customer-input input[type="datetime-local"]) {
  color: #000000 !important;
}

/* Make date input clickable and ensure calendar opens */
:deep(.date-input-clickable input[type="date"]),
:deep(.date-input-clickable input[type="datetime-local"]) {
  cursor: pointer !important;
  pointer-events: auto !important;
}

:deep(.date-input-clickable) {
  cursor: pointer !important;
  pointer-events: auto !important;
}

:deep(.date-input-clickable input[type="date"]:focus),
:deep(.date-input-clickable input[type="datetime-local"]:focus) {
  cursor: pointer !important;
}

/* Custom select menu styling - clean white background - same as Add Customer form */
:deep(.customer-select button),
:deep(.customer-select [role="combobox"]),
:deep(.customer-select button[type="button"]),
:deep(.customer-select [type="button"]) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.customer-select button:focus),
:deep(.customer-select [role="combobox"]:focus),
:deep(.customer-select:focus-within button),
:deep(.customer-select button:not(:disabled):hover) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

/* Select menu text color */
:deep(.customer-select button span),
:deep(.customer-select [role="combobox"] span),
:deep(.customer-select button div),
:deep(.customer-select [role="combobox"] div) {
  color: #000000 !important;
}

/* Select menu dropdown items */
:deep(.customer-select [role="option"]),
:deep(.customer-select [role="listbox"] [role="option"]) {
  color: #000000 !important;
  background-color: #FFFFFF !important;
}

:deep(.customer-select [role="option"]:hover),
:deep(.customer-select [role="listbox"] [role="option"]:hover) {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

/* Force all USelectMenu components to have white background - override Nuxt UI defaults */
:deep(.form-container [class*="USelectMenu"] button),
:deep(.form-container [class*="USelectMenu"] [role="combobox"]),
:deep(.form-container button[role="combobox"]),
:deep(.form-container [class*="ui-select-menu"] button),
:deep(.form-container [class*="ui-select-menu"] [role="combobox"]),
:deep(.form-container [class*="SelectMenu"] button),
:deep(.form-container [class*="SelectMenu"] [role="combobox"]) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.form-container [class*="USelectMenu"] button span),
:deep(.form-container [class*="USelectMenu"] button div),
:deep(.form-container button[role="combobox"] span),
:deep(.form-container button[role="combobox"] div),
:deep(.form-container [class*="USelectMenu"] button *),
:deep(.form-container button[role="combobox"] *) {
  color: #000000 !important;
}

/* Override dark mode styles for select menus */
:deep(.form-container [class*="USelectMenu"] button.dark\:bg-gray-800),
:deep(.form-container button[role="combobox"].dark\:bg-gray-800),
:deep(.form-container [class*="USelectMenu"] button.dark\:text-gray-200),
:deep(.form-container button[role="combobox"].dark\:text-gray-200) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

/* Dropdown menu container */
:deep(.form-container [role="listbox"]),
:deep(.form-container [class*="ui-select-menu"] [role="listbox"]),
:deep(.form-container [class*="USelectMenu"] [role="listbox"]) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
}

/* Dropdown menu items */
:deep(.form-container [role="listbox"] [role="option"]),
:deep(.form-container [class*="ui-select-menu"] [role="listbox"] [role="option"]),
:deep(.form-container [class*="USelectMenu"] [role="listbox"] [role="option"]) {
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

:deep(.form-container [role="listbox"] [role="option"]:hover),
:deep(.form-container [class*="ui-select-menu"] [role="listbox"] [role="option"]:hover),
:deep(.form-container [class*="USelectMenu"] [role="listbox"] [role="option"]:hover) {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

/* Fallback for form-container if classes not added */
:deep(.form-container input[type="text"]),
:deep(.form-container input[type="number"]),
:deep(.form-container input[type="date"]),
:deep(.form-container input[type="datetime-local"]),
:deep(.form-container input[type="password"]),
:deep(.form-container input[type="tel"]),
:deep(.form-container textarea) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.form-container input:focus),
:deep(.form-container textarea:focus),
:deep(.form-container input:focus-within),
:deep(.form-container textarea:focus-within) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

:deep(.form-container input::placeholder),
:deep(.form-container textarea::placeholder) {
  color: #6B7280 !important;
}

:deep(.form-container button[role="combobox"]),
:deep(.form-container [role="combobox"]),
:deep(.form-container select) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.form-container button[role="combobox"]:focus),
:deep(.form-container [role="combobox"]:focus),
:deep(.form-container select:focus),
:deep(.form-container:focus-within button[role="combobox"]) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

/* Form labels - ensure high contrast - same as Add Customer form */
.form-container label {
  color: #000000 !important;
  font-weight: 500 !important;
}

/* UFormGroup label styling - same as Add Customer form */
:deep(.form-container [class*="UFormGroup"] label),
:deep(.form-container [class*="form-group"] label),
:deep(.form-container [class*="UFormGroup"] span),
:deep(.form-container [class*="form-group"] span) {
  color: #000000 !important;
  font-weight: 500 !important;
}

/* Ensure all span labels in form groups are black */
:deep(.form-container .flex.items-center span:not(.text-red-500):not(.text-gray-500):not(.text-green-600):not(.text-orange-600)) {
  color: #000000 !important;
}

/* Upload area styling */
:deep(.form-container input[type="file"]) {
  border: 2px dashed #D1D5DB !important;
  border-radius: 0.5rem !important;
  padding: 1rem !important;
  background-color: #F9FAFB !important;
}

:deep(.form-container input[type="file"]:hover) {
  border-color: #2563EB !important;
  background-color: #F0F4FF !important;
}

/* Checkbox styling - white background and black text */
:deep(.form-container input[type="checkbox"]),
:deep(input[type="checkbox"]) {
  border-color: #D1D5DB !important;
  background-color: #FFFFFF !important;
  accent-color: #2563EB !important;
}

:deep(.form-container input[type="checkbox"]:checked),
:deep(input[type="checkbox"]:checked) {
  background-color: #2563EB !important;
  border-color: #2563EB !important;
  accent-color: #2563EB !important;
}

:deep(.form-container input[type="checkbox"]:focus),
:deep(input[type="checkbox"]:focus) {
  ring: 2px !important;
  ring-color: #2563EB !important;
  outline: none !important;
  border-color: #2563EB !important;
}

/* Checkbox container styling */
:deep(.form-container .toggle-switch),
:deep(.toggle-switch) {
  background-color: #FFFFFF !important;
}

:deep(.form-container .toggle-switch label),
:deep(.toggle-switch label) {
  color: #000000 !important;
}

:deep(.form-container .toggle-switch p),
:deep(.toggle-switch p) {
  color: #374151 !important;
}

/* Ensure all text is readable on white background */
.form-container {
  color: #000000 !important;
}

/* MAC Address display field */
:deep(.form-container .bg-gray-50),
:deep(.form-container .p-3.bg-gray-50) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
}

:deep(.form-container .bg-gray-50 span),
:deep(.form-container .p-3.bg-gray-50 span) {
  color: #000000 !important;
}

/* Ensure all div containers with bg-gray-50 have light background */
:deep(.form-container div.bg-gray-50) {
  background-color: #F9FAFB !important;
}

/* Override any remaining dark backgrounds */
:deep(.form-container *[class*="dark:bg"]),
:deep(.form-container *[class*="dark:text"]) {
  background-color: transparent !important;
  color: inherit !important;
}

/* Additional aggressive overrides for Nuxt UI components */
:deep(.form-container button[aria-expanded]),
:deep(.form-container button[aria-haspopup="listbox"]),
:deep(.form-container [data-headlessui-state]) {
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

/* Ensure all select menu buttons have white background regardless of state */
:deep(.form-container button[role="combobox"][aria-expanded="true"]),
:deep(.form-container button[role="combobox"][aria-expanded="false"]) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

/* Override Nuxt UI select menu default styles */
:deep(.form-container .ui-select-menu),
:deep(.form-container [class*="ui-select-menu"]) {
  background-color: #FFFFFF !important;
}

:deep(.form-container .ui-select-menu button),
:deep(.form-container [class*="ui-select-menu"] button) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

/* Ensure placeholder text is visible */
:deep(.form-container button[role="combobox"]:empty::before),
:deep(.form-container button[role="combobox"]::placeholder) {
  color: #6B7280 !important;
}

/* Global override for all select menus and dropdowns in form */
:deep(.form-container button[type="button"]),
:deep(.form-container [role="combobox"]) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

:deep(.form-container button[type="button"]:hover),
:deep(.form-container [role="combobox"]:hover) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

/* Checkbox specific overrides - ensure they're visible */
:deep(.form-container input[type="checkbox"]),
:deep(input[type="checkbox"]) {
  -webkit-appearance: checkbox !important;
  -moz-appearance: checkbox !important;
  appearance: checkbox !important;
  width: 1.5rem !important;
  height: 1.5rem !important;
  border: 2px solid #D1D5DB !important;
  background-color: #FFFFFF !important;
  border-radius: 0.25rem !important;
}

:deep(.form-container input[type="checkbox"]:checked),
:deep(input[type="checkbox"]:checked) {
  background-color: #2563EB !important;
  border-color: #2563EB !important;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L4.5 11.086l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e") !important;
  background-size: 100% 100% !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

/* Force all buttons in form to have proper styling */
:deep(.form-container button:not(.close-button):not([type="submit"])) {
  background-color: #FFFFFF !important;
  color: #000000 !important;
  border-color: #D1D5DB !important;
}

/* Ensure all disabled/readonly inputs have light background */
:deep(.form-container input[readonly]),
:deep(.form-container input[disabled]) {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

/* Info boxes and alerts */
:deep(.form-container .bg-indigo-100),
:deep(.form-container .bg-orange-50),
:deep(.form-container .bg-green-50),
:deep(.form-container .bg-gray-50) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
}

:deep(.form-container .text-indigo-900),
:deep(.form-container .text-orange-900),
:deep(.form-container .text-green-900) {
  color: #000000 !important;
}

:deep(.form-container .text-indigo-800),
:deep(.form-container .text-orange-800),
:deep(.form-container .text-green-800) {
  color: #374151 !important;
}

/* Card styling inside sections */
:deep(.form-container .technician-card) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
}

/* Remove dark mode specific styles */
:deep(.dark) {
  /* Override dark mode styles for form */
}

/* FINAL GLOBAL OVERRIDES - Force white background and black text for ALL form elements */
/* This ensures all dropdowns, selects, and checkboxes have proper styling */

/* All combobox/dropdown buttons - SPECIFIC targeting */
:deep(.form-container button[role="combobox"]),
:deep(.form-container [role="combobox"]),
:deep(.form-container .customer-select button),
:deep(.form-container .customer-select [role="combobox"]) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #000000 !important;
}

:deep(.form-container button[role="combobox"] *),
:deep(.form-container [role="combobox"] *),
:deep(.form-container .customer-select button *),
:deep(.form-container .customer-select [role="combobox"] *) {
  color: #000000 !important;
}

/* All dropdown menu items - SPECIFIC targeting */
:deep(.form-container [role="listbox"] [role="option"]),
:deep(.form-container [role="option"]) {
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

:deep(.form-container [role="listbox"] [role="option"] *),
:deep(.form-container [role="option"] *) {
  color: #000000 !important;
}

:deep(.form-container [role="listbox"] [role="option"]:hover),
:deep(.form-container [role="option"]:hover) {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

:deep(.form-container [role="listbox"] [role="option"]:hover *),
:deep(.form-container [role="option"]:hover *) {
  color: #000000 !important;
}

/* All checkboxes - SPECIFIC targeting */
:deep(.form-container input[type="checkbox"]),
:deep(.form-container .toggle-switch input[type="checkbox"]) {
  background-color: #FFFFFF !important;
  border: 2px solid #D1D5DB !important;
  color: #000000 !important;
  appearance: checkbox !important;
  -webkit-appearance: checkbox !important;
  -moz-appearance: checkbox !important;
}

:deep(.form-container input[type="checkbox"]:checked),
:deep(.form-container .toggle-switch input[type="checkbox"]:checked) {
  background-color: #2563EB !important;
  border-color: #2563EB !important;
}

/* Override any inline dark styles */
:deep(.form-container *[style*="background-color: rgb(31, 41, 55)"]),
:deep(.form-container *[style*="background-color: rgb(17, 24, 39)"]),
:deep(.form-container *[style*="background-color: #1F2937"]),
:deep(.form-container *[style*="background-color: #111827"]) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
}

:deep(.form-container *[style*="color: rgb(229, 231, 235)"]),
:deep(.form-container *[style*="color: rgb(209, 213, 219)"]),
:deep(.form-container *[style*="color: #E5E7EB"]),
:deep(.form-container *[style*="color: #D1D5DB"]) {
  color: #000000 !important;
}
</style>

<template>
  <div class="flex flex-col h-full bg-white overflow-hidden">
    <div class="flex-1 overflow-y-auto scroll-smooth p-6 min-h-0">

      <!-- Header -->
      <div class="mb-6 text-center pb-6 border-b border-gray-200">
        <div class="inline-flex items-center justify-center bg-blue-600 p-3 rounded-xl mb-4 shadow-sm">
          <LucideIcon name="file-plus" :size="40" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-black mb-2">
          Add Installation Report
        </h1>
        <p class="text-base text-gray-600 max-w-2xl mx-auto">
          Document completed new installation with team assignment and optional MikroTik auto-provisioning
        </p>

        <!-- Load Test Data Button for Debugging -->
        <div class="mt-4">
          <button type="button" @click="loadTestData"
            class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <LucideIcon name="refresh-cw" :size="20" />
            Load Test Data (Debug)
          </button>
        </div>
      </div>

      <UForm ref="formRef" :schema="schema" :state="state" class="form-container space-y-6" @submit="onSubmit">
        <!-- Basic Installation Information -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <LucideIcon name="info" :size="20" class="text-blue-600" />
            Customer Information
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup name="customer_id">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="user" :size="16" class="text-gray-600" />
                  <span class="text-black font-medium">Customer <span class="text-red-500">*</span></span>
                </div>
              </template>
              <USelectMenu v-model="state.customer_id" :options="state.customers" placeholder="Select customer"
                searchable searchable-placeholder="Search by customer name" option-attribute="name" value-attribute="id"
                :search-attributes="['name', 'phone']" class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="status">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="check-circle" :size="16" class="text-gray-600" />
                  <span class="text-black font-medium">Status</span>
                </div>
              </template>
              <UInput v-model="state.status" readonly disabled class="bg-gray-100 customer-input" />
              <p class="text-xs text-gray-600 mt-1">
                <LucideIcon name="info" :size="14" class="inline mr-1" />
                Installation reports are always "completed" since technicians document after finishing the work
              </p>
            </UFormGroup>

            <UFormGroup name="installation_type">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="tag" :size="16" class="text-gray-600" />
                  <span class="text-black font-medium">Installation Type</span>
                </div>
              </template>
              <UInput v-model="state.installation_type" readonly disabled class="bg-gray-100 customer-input" />
              <p class="text-xs text-gray-600 mt-1">
                <LucideIcon name="info" :size="14" class="inline mr-1" />
                This form is for new installations only. Use separate forms for maintenance (from trouble tickets) or
                upgrades
              </p>
            </UFormGroup>

            <UFormGroup name="on_air_date">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="calendar" :size="16" class="text-gray-600" />
                  <span>On Air Date</span>
                </div>
              </template>
              <UInput v-model="state.on_air_date" type="date" class="w-full customer-input date-input-clickable" />
            </UFormGroup>

            <UFormGroup name="trial_end_date">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="calendar" :size="16" class="text-gray-600" />
                  <span>Trial End Date</span>
                </div>
              </template>
              <UInput v-model="state.trial_end_date" type="date" class="w-full customer-input date-input-clickable" />
            </UFormGroup>

            <UFormGroup name="service_ready_date">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="calendar" :size="16" class="text-gray-600" />
                  <span>Service Ready Date</span>
                </div>
              </template>
              <UInput v-model="state.service_ready_date" type="date"
                class="w-full customer-input date-input-clickable" />
            </UFormGroup>

            <UFormGroup name="installation_completed_at">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="check-circle" :size="16" class="text-gray-600" />
                  <span>Installation Completed At</span>
                </div>
              </template>
              <UInput v-model="state.installation_completed_at" type="datetime-local"
                class="w-full customer-input date-input-clickable" />
            </UFormGroup>

            <!-- Terminal Installation Checkbox -->
            <div class="sm:col-span-2">
              <div
                class="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <input type="checkbox" :checked="state.is_terminal === 'yes'"
                  @change="state.is_terminal = ($event.target as HTMLInputElement).checked ? 'yes' : 'no'"
                  id="is_terminal"
                  class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                <label for="is_terminal"
                  class="ml-3 text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                  <div class="flex items-center gap-2">
                    <LucideIcon name="server" :size="18" class="text-blue-600" />
                    <span>Terminal Installation</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 font-normal">
                    Check this if this installation is for a terminal (HTB) that will serve multiple customers
                  </p>
                </label>
              </div>
            </div>

            <!-- Terminal Installation Selection (always available) -->
            <UFormGroup name="terminal_customer_installation_id" class="sm:col-span-2">
              <template #label>
                <div class="flex items-center gap-2">
              <LucideIcon name="server" :size="16" class="text-gray-600" />
              <span>Select Terminal Installation</span>
            </div>
          </template>
          <USelectMenu v-model="state.terminal_customer_installation_id" :options="state.terminalInstallations"
            placeholder="Select terminal installation (HTB)" searchable
            searchable-placeholder="Search by customer name or installation ID" option-attribute="display"
            value-attribute="id" :search-attributes="['customer_name', 'installation_id']"
            :loading="state.loading" :disabled="state.is_terminal === 'yes'" />
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <LucideIcon name="info" :size="14" class="inline mr-1" />
            If this is a non-terminal installation (is_terminal = no), you must select which terminal installation (HTB)
            it connects to. Leave it empty only when this installation itself is the terminal (is_terminal = yes).
          </p>
          <p v-if="state.terminalInstallations.length === 0 && !state.loading"
            class="text-xs text-orange-600 dark:text-orange-400 mt-1">
            <LucideIcon name="alert-triangle" :size="14" class="inline mr-1" />
            No terminal installations found. Please create a terminal installation first.
          </p>
            </UFormGroup>
          </div>

          <UFormGroup name="notes" class="mt-4">
            <template #label>
              <div class="flex items-center gap-2">
                <LucideIcon name="document-text" :size="16" class="text-gray-600" />
                <span>Notes</span>
              </div>
            </template>
            <UTextarea v-model="state.notes" placeholder="Additional notes about the installation" :rows="3"
              class="w-full customer-input" />
          </UFormGroup>
        </div>

        <!-- Technician Team Section -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
            <div>
              <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="user-group" :size="20" class="text-blue-600" />
                Installation Details
                <span class="text-red-500">*</span>
              </h3>
              <p class="text-sm text-gray-600 mt-1">Assign technicians with their roles and responsibilities</p>
            </div>
            <UButton @click="addTechnician" size="lg" color="indigo" class="add-technician-button">
              <template #leading>
                <LucideIcon name="plus-circle" :size="20" />
              </template>
              Add Technician
            </UButton>
          </div>

          <div v-if="state.technicians.length === 0"
            class="text-center py-8 px-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <LucideIcon name="user-group" :size="64" class="text-gray-400 mx-auto mb-3" />
            <p class="text-gray-600 font-medium">No technicians assigned yet</p>
            <p class="text-sm text-gray-500 mt-1">Click "Add Technician" to assign your installation team</p>
          </div>

          <div v-else class="space-y-4 overflow-hidden">
            <div v-for="(tech, index) in state.technicians" :key="index"
              class="technician-card bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">

              <!-- Header Section -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="bg-indigo-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
                    {{ index + 1 }}
                  </div>
                  <span class="text-base font-semibold text-gray-700">Technician {{ index + 1 }}</span>
                </div>
                <div v-if="tech.is_primary"
                  class="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                  <LucideIcon name="star" :size="16" />
                  PRIMARY
                </div>
              </div>

              <!-- Main Content - Mobile First Layout -->
              <div class="space-y-4">
                <!-- Technician Selection -->
                <div class="w-full">
                  <label class="block text-sm font-semibold text-black mb-2">
                    Select Technician <span class="text-red-500">*</span>
                  </label>
                  <USelectMenu v-model="tech.technician_id" :options="getAvailableTechniciansForIndex(index)"
                    placeholder="Choose a technician" searchable searchable-placeholder="Search by name"
                    option-attribute="name" value-attribute="id" :search-attributes="['name']" size="lg"
                    class="w-full customer-select" />
                  <p v-if="getAvailableTechniciansForIndex(index).length === 0" class="text-xs text-orange-600 mt-1">
                    ⚠️ All available technicians have been assigned. Remove other assignments to see more options.
                  </p>
                </div>

                <!-- Role and Actions Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Role Selection -->
                  <div class="w-full">
                    <label class="block text-sm font-semibold text-black mb-2">
                      Role <span class="text-red-500">*</span>
                    </label>
                    <USelectMenu v-model="tech.role" :options="[
                      { value: 'senior', label: '👨‍🔧 Senior', description: 'Lead technician' },
                      { value: 'junior', label: '👷 Junior', description: 'Supporting role' },
                      { value: 'helper', label: '🔧 Helper', description: 'Assistant' }
                    ]" value-attribute="value" option-attribute="label" size="lg" class="w-full customer-select" />
                  </div>

                  <!-- Action Buttons -->
                  <div class="w-full">
                    <label class="block text-sm font-semibold text-black mb-2">Actions</label>
                    <div class="flex gap-2 w-full">
                      <UButton @click="setPrimaryTechnician(index)" :color="tech.is_primary ? 'green' : 'gray'"
                        :variant="tech.is_primary ? 'solid' : 'outline'" size="lg" class="flex-1 min-w-0 primary-button"
                        :disabled="tech.is_primary">
                        <LucideIcon name="star" :size="16" />
                        <span class="hidden xs:inline">{{ tech.is_primary ? 'Primary' : 'Set Primary' }}</span>
                        <span class="xs:hidden">Primary</span>
                      </UButton>
                      <UButton @click="removeTechnician(index)" color="red" variant="outline" size="lg"
                        class="flex-shrink-0" :disabled="state.technicians.length === 1">
                        <LucideIcon name="trash-2" :size="16" />
                      </UButton>
                    </div>
                  </div>
                </div>

                <!-- Notes Section -->
                <div class="w-full">
                  <label class="block text-sm font-semibold text-black mb-2">
                    Notes <span class="text-gray-500 text-xs font-normal">(optional)</span>
                  </label>
                  <UInput v-model="tech.notes"
                    placeholder="e.g., Responsible for fiber splicing, familiar with this area, etc." size="lg"
                    class="w-full customer-input" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-start gap-2">
              <LucideIcon name="info" :size="20" class="text-blue-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-black">
                <p class="font-semibold mb-1">Team Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                  <li>At least one <strong>Senior</strong> technician is required</li>
                  <li>Primary technician will be the main point of contact</li>
                  <li>You can assign multiple technicians for complex installations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Network Device Information -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <LucideIcon name="cpu-chip" :size="20" class="text-blue-600" />
            Network Device Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup name="assets_id">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="package" :size="16" class="text-gray-600" />
                  <span>Asset <span class="text-red-500">*</span></span>
                </div>
              </template>
              <USelectMenu v-model="state.assets_id" :options="state.assets" placeholder="Select asset" searchable
                searchable-placeholder="Search by brand/model" option-attribute="display" value-attribute="id"
                :search-attributes="['brand', 'type', 'model']" @change="onAssetChange(state.assets_id)"
                class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="product_id">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="wifi" :size="16" class="text-gray-600" />
                  <span>Package/Product <span class="text-red-500">*</span></span>
                </div>
              </template>
              <USelectMenu v-model="state.product_id" :options="state.products" placeholder="Select internet package"
                searchable searchable-placeholder="Search by package name or speed" option-attribute="display"
                value-attribute="id" :search-attributes="['name', 'description']" class="w-full customer-select" />
              <p class="text-xs text-gray-600 mt-1">
                <LucideIcon name="info" :size="14" class="inline mr-1" />
                Package selection will automatically set the bandwidth limit for MikroTik provisioning
              </p>
            </UFormGroup>

            <UFormGroup name="switch_id">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="network" :size="16" class="text-gray-600" />
                  <span>Switch ID</span>
                </div>
              </template>
              <UInput v-model="state.switch_id" placeholder="Enter switch ID" class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="port_number">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="activity" :size="16" class="text-gray-600" />
                  <span>Port Number</span>
                </div>
              </template>
              <UInput v-model="state.port_number" placeholder="Enter port number" class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="remote_port">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="activity" :size="16" class="text-gray-600" />
                  <span>Remote Port</span>
                </div>
              </template>
              <UInput v-model="state.remote_port" placeholder="Enter remote port" class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="eth_port">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="cable" :size="16" class="text-gray-600" />
                  <span>ETH Port</span>
                </div>
              </template>
              <UInput v-model="state.eth_port" placeholder="Enter ETH port" class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="mac_address">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="network" :size="16" class="text-gray-600" />
                  <span>MAC Address</span>
                </div>
              </template>
              <div>
                <USelectMenu v-model="state.asset_item_id" :options="availableAssetItems[state.assets_id] || []"
                  :placeholder="!state.assets_id ? 'Select an asset first' : 'Select MAC Address'"
                  :disabled="!state.assets_id || (availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length === 0)"
                  class="w-full customer-select" />
                <div
                  v-if="state.assets_id && availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length === 0"
                  class="text-xs text-red-500 mt-1 flex items-center">
                  <LucideIcon name="alert-triangle" :size="12" class="mr-1" />
                  No available devices for this asset
                </div>
                <div
                  v-else-if="state.assets_id && availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length > 0"
                  class="text-xs text-green-600 mt-1">
                  {{ availableAssetItems[state.assets_id].length }} device(s) available
                </div>
              </div>
            </UFormGroup>

            <UFormGroup name="ip_static">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="map-pin" :size="16" class="text-gray-600" />
                  <span>IP Static</span>
                </div>
              </template>
              <div class="flex gap-2">
                <UInput v-model="state.ip_static" placeholder="192.168.1.100" class="flex-1 customer-input" />
                <UButton @click="fetchDHCPLease" color="blue" variant="outline" size="sm" :loading="state.fetchingDHCP"
                  :disabled="!state.mac_address" title="Fetch actual IP address from MikroTik DHCP lease">
                  <template #leading>
                    <LucideIcon name="refresh-cw" :size="16" />
                  </template>
                  Fetch DHCP
                </UButton>
              </div>
              <p v-if="state.dhcpStatus" class="text-xs mt-1"
                :class="state.dhcpStatus.success ? 'text-green-600' : 'text-red-600'">
                {{ state.dhcpStatus.message }}
              </p>
              <p v-else class="text-xs text-gray-500 mt-1">
                <LucideIcon name="info" :size="14" class="inline mr-1" />
                This button will fetch the actual IP address assigned by your MikroTik router's DHCP server
              </p>
            </UFormGroup>

            <UFormGroup name="kepemilikan_perangkat">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="key" :size="16" class="text-gray-600" />
                  <span>Device Ownership</span>
                </div>
              </template>
              <USelectMenu v-model="state.kepemilikan_perangkat" :options="[
                { value: 'owned', label: 'Owned' },
                { value: 'leased', label: 'Leased' },
                { value: 'customer', label: 'Customer' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select ownership"
                class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="status_perangkat">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="activity" :size="16" class="text-gray-600" />
                  <span>Device Status</span>
                </div>
              </template>
              <USelectMenu v-model="state.status_perangkat" :options="[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'faulty', label: 'Faulty' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select device status"
                class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="last_ping_status">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="signal" :size="16" class="text-gray-600" />
                  <span>Last Ping Status</span>
                </div>
              </template>
              <USelectMenu v-model="state.last_ping_status" :options="[
                { value: 'up', label: 'Up' },
                { value: 'down', label: 'Down' },
                { value: 'unknown', label: 'Unknown' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select ping status"
                class="w-full customer-select" />
            </UFormGroup>
          </div>
        </div>

        <!-- MikroTik Provisioning Section -->
        <div class="mikrotik-section bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="mb-5">
            <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
              <LucideIcon name="server-stack" :size="20" class="text-blue-600" />
              MikroTik Auto-Provisioning
              <span class="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
            </h3>
            <p class="text-sm text-gray-600 mt-1">Automatically configure customer on RouterOS/Winbox</p>
          </div>

          <!-- MAC Address Preview -->
          <div class="mb-4">
            <label class="block text-sm font-bold text-black mb-2">
              MAC Address
              <span class="text-xs text-gray-500 ml-2">(from Network Device)</span>
            </label>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span v-if="state.mac_address" class="font-mono text-black text-sm">
                {{ state.mac_address }}
              </span>
              <span v-else class="text-gray-500 text-sm italic">
                Select a MAC address in Network Device section above
              </span>
            </div>
          </div>

          <div class="mikrotik-form grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="mikrotik-field">
              <label class="block text-sm font-bold text-black mb-2">
                Max Bandwidth Limit
                <span v-if="state.product_id" class="text-green-600 text-xs font-normal ml-2">(Auto-set from
                  package)</span>
              </label>
              <div class="relative">
                <UInput v-model="state.max_limit" placeholder="10M/10M" size="lg" icon="arrow-trending-up"
                  :readonly="!!state.product_id"
                  :class="state.product_id ? 'bg-green-50 border-green-300 customer-input' : 'customer-input'" />
                <div v-if="state.product_id" class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <LucideIcon name="check-circle" :size="20" class="text-green-500" />
                </div>
              </div>
              <p class="text-xs text-gray-600 mt-1">
                <span v-if="state.product_id" class="text-green-600">
                  <LucideIcon name="info" :size="14" class="inline mr-1" />
                  Bandwidth automatically set from selected package. Select a package above to override.
                </span>
                <span v-else>Format: Download/Upload (e.g., 10M/10M, 50M/50M). Select a package above for automatic
                  configuration.</span>
              </p>
            </div>



            <!-- Provisioning Toggle Switches -->
            <div class="sm:col-span-2 space-y-3 mt-4">
              <div
                class="toggle-switch flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="bg-blue-100 p-2 rounded-lg">
                    <LucideIcon name="bolt" :size="20" class="text-blue-600" />
                  </div>
                  <div>
                    <label for="auto_provision" class="text-sm font-bold text-black cursor-pointer">
                      Enable Auto-Provisioning
                    </label>
                    <p class="text-xs text-gray-600">Automatically configure customer on MikroTik after creation</p>
                  </div>
                </div>
                <input type="checkbox" v-model="state.auto_provision" id="auto_provision"
                  class="w-6 h-6 text-cyan-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer" />
              </div>

              <div
                class="toggle-switch flex items-center justify-between p-4 bg-white rounded-lg border-2 transition-all"
                :class="state.auto_provision ? 'border-orange-200' : 'border-gray-200 opacity-50'">
                <div class="flex items-center gap-3">
                  <div class="bg-orange-100 p-2 rounded-lg">
                    <LucideIcon name="eye" :size="20" class="text-orange-600" />
                  </div>
                  <div>
                    <label for="dry_run" class="text-sm font-bold text-black cursor-pointer"
                      :class="!state.auto_provision && 'opacity-50'">
                      Dry Run Mode
                    </label>
                    <p class="text-xs text-gray-600" :class="!state.auto_provision && 'opacity-50'">
                      Preview commands without executing (test mode)
                    </p>
                  </div>
                </div>
                <input type="checkbox" v-model="state.dry_run" id="dry_run"
                  class="w-6 h-6 text-orange-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!state.auto_provision" />
              </div>
            </div>

            <!-- Status Alert -->
            <div v-if="state.auto_provision" class="md:col-span-2 mt-2">
              <div class="p-4 rounded-lg border-2 flex items-start gap-3" :class="state.dry_run
                ? 'bg-orange-50 border-orange-300'
                : 'bg-green-50 border-green-300'">
                <LucideIcon :name="state.dry_run ? 'eye' : 'check-circle'" :size="24" class="flex-shrink-0"
                  :class="state.dry_run ? 'text-orange-600' : 'text-green-600'" />
                <div>
                  <p class="font-bold text-sm" :class="state.dry_run ? 'text-orange-900' : 'text-green-900'">
                    {{ state.dry_run ? '🔍 Dry Run Mode Active' : '⚡ Live Provisioning Mode' }}
                  </p>
                  <p class="text-sm mt-1" :class="state.dry_run ? 'text-orange-800' : 'text-green-800'">
                    <span v-if="state.dry_run">
                      Commands will be <strong>generated and displayed</strong> in the browser console but <strong>not
                        executed</strong> on MikroTik. Use this to preview what will happen.
                    </span>
                    <span v-else>
                      Customer will be <strong>automatically provisioned</strong> on MikroTik RouterOS immediately after
                      installation creation. Queue rules and IP bindings will be created.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div v-else class="md:col-span-2 mt-2">
              <div class="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-start gap-3">
                <LucideIcon name="power" :size="24" class="text-gray-400 flex-shrink-0" />
                <div>
                  <p class="font-bold text-sm text-black">
                    Auto-Provisioning Disabled
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    Enable auto-provisioning to automatically configure this customer on MikroTik RouterOS. Manual
                    provisioning
                    will be required otherwise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Information -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 document-info-section">
          <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <LucideIcon name="file-text" :size="20" class="text-blue-600" />
            Document Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup name="document_type">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="file-text" :size="16" class="text-gray-600" />
                  <span>Document Type</span>
                </div>
              </template>
              <USelectMenu v-model="state.document_type" :options="[
                { value: 'KTP', label: 'KTP' },
                { value: 'SIM', label: 'SIM' },
                { value: 'Paspor', label: 'Paspor' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select document type"
                class="w-full customer-select" :ui="{
                  container: 'relative z-50'
                }" :popper="{
                  placement: 'bottom-start'
                }" />
            </UFormGroup>

            <UFormGroup name="document_photo">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="camera" :size="16" class="text-gray-600" />
                  <span>Document Photo</span>
                </div>
              </template>
              <input ref="fileInputRef" type="file" accept="image/*" @change="handleDocumentPhotoUpload"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                placeholder="Upload document photo" />
              <div v-if="state.documentPreview" class="mt-2">
                <img :src="state.documentPreview" alt="Document Preview"
                  class="w-32 h-20 object-cover rounded border" />
              </div>
            </UFormGroup>
          </div>
        </div>

        <!-- Technician Photo Documentation -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 technician-photo-section">
          <div class="flex items-center mb-6">
            <h3 class="text-lg font-semibold text-black flex items-center gap-2">
              <LucideIcon name="camera" :size="20" class="text-blue-600" />
              Technician Notes
            </h3>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-4">
              Document your PSB progress with photos (maximum 10 images). Images will be automatically compressed to
              reduce file
              size.
            </p>


          </div>

          <UFormGroup label="Upload Progress Photos" name="technician_photos">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="(preview, index) in state.technician_photo_previews" :key="index"
                class="relative group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                @click="state.selectedTechnicianImage = preview; state.showTechnicianModal = true">
                <img :src="preview" :alt="`Technician Photo ${index + 1}`" class="w-full h-32 object-cover" />
                <div
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <LucideIcon name="eye" :size="24"
                    class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <UButton @click.stop="removeTechnicianPhoto(index)" size="xs" color="red" variant="solid"
                  class="absolute -top-2 -right-2 shadow-lg">
                  <LucideIcon name="x" :size="16" />
                </UButton>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                  <div class="flex justify-between items-center">
                    <span>Photo {{ index + 1 }}</span>
                    <span v-if="technicianPhotoSizes[index]" class="text-xs opacity-75">
                      {{ formatFileSize(technicianPhotoSizes[index]) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="state.technician_photo_previews.length < 10"
                class="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 bg-white dark:bg-gray-800"
                @click="triggerTechnicianPhotoUpload">
                <div class="text-center">
                  <LucideIcon name="plus" :size="32" class="text-gray-400 dark:text-gray-500 mb-2 mx-auto" />
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Add Photo</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ state.technician_photo_previews.length }}/10
                  </p>
                </div>
              </div>
            </div>

            <input ref="technicianPhotoInput" type="file" accept="image/*" multiple class="hidden"
              @change="handleTechnicianPhotoUpload" />

            <div v-if="state.technician_photo_previews.length > 0"
              class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div class="flex items-center text-sm text-amber-800 dark:text-amber-200">
                <LucideIcon name="info" :size="16" class="mr-2" />
                <span>
                  {{ state.technician_photo_previews.length }} photo(s) uploaded.
                  Total size: {{ formatFileSize(totalTechnicianPhotoSize) }}
                </span>
              </div>
            </div>
          </UFormGroup>
        </div>

        <!-- Customer Service Information -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <LucideIcon name="wrench" :size="20" class="text-blue-600" />
            Customer Service Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup name="cable_type">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="cable" :size="16" class="text-gray-600" />
                  <span>Cable Type <span class="text-red-500">*</span></span>
                </div>
              </template>
              <USelectMenu v-model="state.cable_type" :options="[
                { value: 'UTP Cat5e', label: 'UTP Cat5e' },
                { value: 'UTP Cat6', label: 'UTP Cat6' },
                { value: 'Single Mode Fiber', label: 'Single Mode Fiber' },
                { value: 'Multi Mode Fiber', label: 'Multi Mode Fiber' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select cable type"
                class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="cable_length">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="cable" :size="16" class="text-gray-600" />
                  <span>Cable Length (meters) <span class="text-red-500">*</span></span>
                </div>
              </template>
              <UInput v-model="state.cable_length" type="number" min="1" step="1" placeholder="Enter cable length"
                class="w-full customer-input" />
              <p class="text-xs text-gray-500 mt-1">
                <LucideIcon name="info" :size="14" class="inline mr-1" />
                Minimum cable length is 1 meter
              </p>
            </UFormGroup>

            <UFormGroup name="end_port_type">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="activity" :size="16" class="text-gray-600" />
                  <span>End Port Type</span>
                </div>
              </template>
              <USelectMenu v-model="state.end_port_type" :options="[
                { value: 'RJ45', label: 'RJ45' },
                { value: 'Fiber', label: 'Fiber' },
                { value: 'SC', label: 'SC' },
                { value: 'LC', label: 'LC' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select end port type"
                class="w-full customer-select" />
            </UFormGroup>

            <UFormGroup name="user_login">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="user" :size="16" class="text-gray-600" />
                  <span>User Login</span>
                </div>
              </template>
              <UInput v-model="state.user_login" placeholder="Enter user login" class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="password">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="lock" :size="16" class="text-gray-600" />
                  <span>Password</span>
                </div>
              </template>
              <UInput v-model="state.password" type="password" placeholder="Enter password"
                class="w-full customer-input" />
            </UFormGroup>

            <UFormGroup name="user_status">
              <template #label>
                <div class="flex items-center gap-2">
                  <LucideIcon name="check-circle" :size="16" class="text-gray-600" />
                  <span>User Status</span>
                </div>
              </template>
              <USelectMenu v-model="state.user_status" :options="[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
                { value: 'Pending', label: 'Pending' }
              ]" value-attribute="value" option-attribute="label" placeholder="Select user status"
                class="w-full customer-select" />
            </UFormGroup>
          </div>

          <UFormGroup name="installation_notes" class="mt-4">
            <template #label>
              <div class="flex items-center gap-2">
                <LucideIcon name="document-text" :size="16" class="text-gray-600" />
                <span>Installation Notes</span>
              </div>
            </template>
            <UTextarea v-model="state.installation_notes" placeholder="Additional notes about the installation process"
              :rows="3" class="w-full customer-input" />
          </UFormGroup>
        </div>


      </UForm>
    </div>

    <!-- Fixed Footer Bar - Always visible at bottom -->
    <div
      class="flex-shrink-0 p-4 sm:p-6 bg-white border-t border-gray-200 shadow-lg mt-auto overflow-hidden max-w-full">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 max-w-full">
        <!-- Requirements Check -->
        <div class="text-sm text-gray-700 flex-1 min-w-0 w-full sm:w-auto">
          <div class="flex items-start sm:items-center gap-2">
            <LucideIcon
              v-if="!state.customer_id || state.technicians.length === 0 || !state.assets_id || !state.product_id"
              name="alert-triangle" :size="20" class="flex-shrink-0 text-orange-600 mt-0.5 sm:mt-0" />
            <LucideIcon v-else name="check-circle" :size="20" class="flex-shrink-0 text-green-600 mt-0.5 sm:mt-0" />
            <span v-if="!state.customer_id || state.technicians.length === 0 || !state.assets_id || !state.product_id"
              class="font-semibold text-orange-600 break-words">
              Please complete required fields (Customer, Technicians, Asset, Package)
            </span>
            <span v-else class="font-semibold text-green-600">
              Ready to submit
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 w-full sm:w-auto flex-shrink-0">
          <UButton type="button" color="gray" variant="outline" size="lg" @click="closeModal"
            class="flex-1 sm:flex-initial bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300 whitespace-nowrap">
            <template #leading>
              <LucideIcon name="x-circle" :size="20" />
            </template>
            Cancel
          </UButton>
          <UButton type="button" color="blue" size="lg" :loading="state.loading"
            :disabled="!state.customer_id || state.technicians.length === 0 || !state.assets_id || !state.product_id"
            class="flex-1 sm:flex-initial bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
            @click="submitForm">
            <template #leading>
              <LucideIcon name="file-check" :size="20" />
            </template>
            <span class="font-bold">Save Report</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Technician Photo Modal -->
  <UModal v-model="state.showTechnicianModal">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Technician Photo Preview</h3>
          <UButton @click="state.showTechnicianModal = false" variant="ghost" size="sm">
            <LucideIcon name="x" :size="16" />
          </UButton>
        </div>
      </template>

      <div class="text-center">
        <img :src="state.selectedTechnicianImage" alt="Technician photo preview"
          class="max-w-full max-h-96 mx-auto rounded-lg" />
      </div>
    </UCard>
  </UModal>
</template>
