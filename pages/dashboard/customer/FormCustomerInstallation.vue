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
import { computed } from "vue";

const notification = useNotificationStore();

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

// Watch for props changes
watch(() => props.isEdit, (newValue, oldValue) => {
  console.log('[FormCustomerInstallation] isEdit prop changed:', { oldValue, newValue });
}, { immediate: true });

watch(() => props.data, (newValue, oldValue) => {
  console.log('[FormCustomerInstallation] data prop changed:', { oldValue, newValue });
}, { immediate: true });

const schema = object({
  customer_id: string().required("Customer is required"),
  assets_id: string().required("Asset is required"),
  product_id: string().required("Package/Product is required"),
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
  cable_length: 0,
  end_port_type: "RJ45",
  user_login: "",
  password: "",
  user_status: "Active",
  installation_notes: "",

  // UI State
  loading: false,
  fetchingDHCP: false,
  dhcpStatus: null as { success: boolean; message: string } | null,
  customers: [] as any[],
  availableTechnicians: [] as any[], // List of available technicians from DB
  assets: [] as any[],
  products: [] as any[], // Available products/packages
  documentPreview: "",
  
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

// Technician photo tracking
const technicianPhotoSizes = ref<number[]>([]);
const isCompressing = ref(false);

// Available asset items for MAC address selection
const availableAssetItems = ref<{[assetId: string]: any[]}>({});

// Watch for asset changes to clear MAC address selection
watch(() => state.assets_id, (newAssetId, oldAssetId) => {
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
  (newValue) => {
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

    // Validate at least one senior technician
    const hasSenior = state.technicians.some(t => t.role === 'senior');
    if (!hasSenior) {
      notification.error('Validation Error', 'At least one senior technician is required');
      return;
    }

    // Check for duplicate technician assignments
    const technicianIds = state.technicians
      .map(tech => tech.technician_id)
      .filter(id => id && id.trim() !== '');
    
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

async function handleTechnicianPhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  if (!files) return;
  
  const currentCount = state.technician_photo_previews.length;
  const newFilesCount = files.length;
  
  if (currentCount + newFilesCount > 10) {
    useToast().add({
      title: "Error",
      description: `Maximum 10 photos allowed. You currently have ${currentCount} photos and are trying to add ${newFilesCount} more.`,
      color: "red",
    });
    return;
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      useToast().add({
        title: "Error",
        description: validation.message,
        color: "red",
      });
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
    
    useToast().add({
      title: "Success",
      description: `Photo added successfully. Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% reduction). Will be uploaded when form is submitted.`,
      color: "green",
    });
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
  return technicianPhotoSizes.value.reduce((total, size) => total + size, 0);
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
    .map((tech, index) => index !== currentIndex ? tech.technician_id : null)
    .filter(id => id && id.trim() !== '');
  
  return state.availableTechnicians.filter(tech => 
    !assignedTechnicianIds.includes(tech.id)
  );
}

function removeTechnician(index: number) {
  const removedTech = state.technicians[index];
  state.technicians.splice(index, 1);
  
  // If we removed the primary, make the first senior primary
  if (removedTech.is_primary && state.technicians.length > 0) {
    const firstSenior = state.technicians.find(t => t.role === 'senior');
    if (firstSenior) {
      firstSenior.is_primary = true;
    } else if (state.technicians.length > 0) {
      state.technicians[0].is_primary = true;
    }
  }
}

function setPrimaryTechnician(index: number) {
  state.technicians.forEach((tech, i) => {
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
      state.ip_static = result.data.ip_address;
      state.dhcpStatus = {
        success: true,
        message: `DHCP lease found: ${result.data.ip_address}`
      };
      notification.success('DHCP Lease Found', `IP address ${result.data.ip_address} fetched successfully`);
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
  transform: translateZ(0); /* Force hardware acceleration */
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
.form-container > div {
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

/* Ensure no gap at bottom of modal */
.overflow-y-auto {
  padding-bottom: 0 !important;
}
</style>

<template>
  <div class="max-h-[85vh] overflow-y-auto relative bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 scroll-smooth">
      
      <!-- Header -->
      <div class="mb-8 text-center pb-6 border-b-2 border-blue-200 dark:border-blue-800">
        <div class="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-lucide-file-plus" class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">
          Add Installation Report
        </h1>
        <p class="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Document completed new installation with team assignment and optional MikroTik auto-provisioning
        </p>
        
        <!-- Load Test Data Button for Debugging -->
        <div class="mt-4">
          <button
            type="button"
            @click="loadTestData"
            class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UIcon name="i-lucide-beaker" class="w-5 h-5" />
            Load Test Data (Debug)
          </button>
        </div>
      </div>
      
      <UForm
        :schema="schema"
        :state="state"
        class="form-container space-y-6"
        @submit="onSubmit"
      >
        <!-- Basic Installation Information -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
            <UIcon name="i-lucide-info" class="mr-2" />
            Basic Installation Information
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Customer *" name="customer_id">
              <USelectMenu
                v-model="state.customer_id"
                :options="state.customers"
                placeholder="Select customer"
                searchable
                searchable-placeholder="Search by customer name"
                option-attribute="name"
                value-attribute="id"
                :search-attributes="['name', 'phone']"
              />
            </UFormGroup>
            
            <UFormGroup label="Status" name="status">
              <UInput 
                v-model="state.status" 
                readonly 
                disabled
                class="bg-gray-100 dark:bg-gray-700"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <UIcon name="i-lucide-info" class="inline mr-1" />
                Installation reports are always "completed" since technicians document after finishing the work
              </p>
            </UFormGroup>
            
            <UFormGroup label="Installation Type" name="installation_type">
              <UInput 
                v-model="state.installation_type" 
                readonly 
                disabled
                class="bg-gray-100 dark:bg-gray-700"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <UIcon name="i-lucide-info" class="inline mr-1" />
                This form is for new installations only. Use separate forms for maintenance (from trouble tickets) or upgrades
              </p>
            </UFormGroup>
            
            <UFormGroup label="On Air Date" name="on_air_date">
              <UInput v-model="state.on_air_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Trial End Date" name="trial_end_date">
              <UInput v-model="state.trial_end_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Service Ready Date" name="service_ready_date">
              <UInput v-model="state.service_ready_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Installation Completed At" name="installation_completed_at">
              <UInput v-model="state.installation_completed_at" type="datetime-local" />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Notes" name="notes">
            <UTextarea 
              v-model="state.notes" 
              placeholder="Additional notes about the installation"
              :rows="3"
            />
          </UFormGroup>
        </div>

        <!-- Technician Team Section -->
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:to-purple-900/30 p-4 sm:p-6 rounded-xl border-2 border-indigo-100 dark:border-indigo-800 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
            <div>
              <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <div class="bg-indigo-500 p-2 rounded-lg">
                  <UIcon name="i-lucide-user-group" class="text-white w-5 h-5" />
                </div>
                Installation Team
                <span class="text-red-500">*</span>
              </h3>
              <p class="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Assign technicians with their roles and responsibilities</p>
            </div>
            <UButton @click="addTechnician" size="lg" color="indigo">
              <UIcon name="i-lucide-plus-circle" class="mr-2 w-5 h-5" />
              Add Technician
            </UButton>
          </div>
          
          <div v-if="state.technicians.length === 0" class="text-center py-8 px-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700">
            <UIcon name="i-lucide-user-group" class="w-16 h-16 text-indigo-300 dark:text-indigo-600 mx-auto mb-3" />
            <p class="text-gray-600 dark:text-gray-300 font-medium">No technicians assigned yet</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "Add Technician" to assign your installation team</p>
          </div>
          
          <div v-else class="space-y-4 overflow-hidden">
            <div v-for="(tech, index) in state.technicians" :key="index" 
              class="technician-card bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
              
              <!-- Header Section -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="bg-indigo-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
                    {{ index + 1 }}
                  </div>
                  <span class="text-base font-semibold text-gray-700 dark:text-gray-200">Technician {{ index + 1 }}</span>
                </div>
                <div v-if="tech.is_primary" class="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                  <UIcon name="i-lucide-star-solid" class="w-4 h-4" />
                  PRIMARY
                </div>
              </div>
              
              <!-- Main Content - Mobile First Layout -->
              <div class="space-y-4">
                <!-- Technician Selection -->
                <div class="w-full">
                  <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Select Technician <span class="text-red-500">*</span>
                  </label>
                  <USelectMenu
                    v-model="tech.technician_id"
                    :options="getAvailableTechniciansForIndex(index)"
                    placeholder="Choose a technician"
                    searchable
                    searchable-placeholder="Search by name"
                    option-attribute="name"
                    value-attribute="id"
                    :search-attributes="['name']"
                    size="lg"
                    class="w-full"
                  />
                  <p v-if="getAvailableTechniciansForIndex(index).length === 0" class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ All available technicians have been assigned. Remove other assignments to see more options.
                  </p>
                </div>
                
                <!-- Role and Actions Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Role Selection -->
                  <div class="w-full">
                    <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Role <span class="text-red-500">*</span>
                    </label>
                    <USelectMenu
                      v-model="tech.role"
                      :options="[
                        { value: 'senior', label: '👨‍🔧 Senior', description: 'Lead technician' },
                        { value: 'junior', label: '👷 Junior', description: 'Supporting role' },
                        { value: 'helper', label: '🔧 Helper', description: 'Assistant' }
                      ]"
                      value-attribute="value"
                      option-attribute="label"
                      size="lg"
                      class="w-full"
                    />
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="w-full">
                    <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Actions</label>
                    <div class="flex gap-2 w-full">
                      <UButton 
                        @click="setPrimaryTechnician(index)"
                        :color="tech.is_primary ? 'green' : 'gray'"
                        :variant="tech.is_primary ? 'solid' : 'outline'"
                        size="lg"
                        class="flex-1 min-w-0"
                        :disabled="tech.is_primary"
                      >
                        <UIcon :name="tech.is_primary ? 'i-lucide-star-solid' : 'i-lucide-star'" class="mr-1 w-4 h-4" />
                        <span class="hidden xs:inline">{{ tech.is_primary ? 'Primary' : 'Set Primary' }}</span>
                        <span class="xs:hidden">Primary</span>
                      </UButton>
                      <UButton 
                        @click="removeTechnician(index)"
                        color="red"
                        variant="outline"
                        size="lg"
                        class="flex-shrink-0"
                        :disabled="state.technicians.length === 1"
                      >
                        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                      </UButton>
                    </div>
                  </div>
                </div>
                
                <!-- Notes Section -->
                <div class="w-full">
                  <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Notes <span class="text-gray-500 text-xs font-normal">(optional)</span>
                  </label>
                  <UInput 
                    v-model="tech.notes" 
                    placeholder="e.g., Responsible for fiber splicing, familiar with this area, etc."
                    size="lg"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-indigo-900 dark:text-indigo-100">
                <p class="font-semibold mb-1">Team Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
                  <li>At least one <strong>Senior</strong> technician is required</li>
                  <li>Primary technician will be the main point of contact</li>
                  <li>You can assign multiple technicians for complex installations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- MikroTik Provisioning Section -->
        <div class="mikrotik-section bg-gradient-to-br from-cyan-50 to-blue-50 dark:bg-gradient-to-br dark:from-cyan-900/30 dark:to-blue-900/30 p-4 sm:p-6 rounded-xl border-2 border-cyan-100 dark:border-cyan-800 shadow-sm">
          <div class="mb-5">
            <h3 class="text-xl font-bold text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
              <div class="bg-cyan-500 p-2 rounded-lg">
                <UIcon name="i-lucide-server-stack" class="text-white w-5 h-5" />
              </div>
              MikroTik Auto-Provisioning
              <span class="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">(Optional)</span>
            </h3>
            <p class="text-sm text-cyan-700 dark:text-cyan-300 mt-1">Automatically configure customer on RouterOS/Winbox</p>
          </div>
          
          <!-- MAC Address Preview -->
          <div class="mb-4">
            <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              MAC Address
              <span class="text-xs text-gray-500 ml-2">(from Network Device)</span>
            </label>
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span v-if="state.mac_address" class="font-mono text-gray-900 dark:text-gray-100 text-sm">
                {{ state.mac_address }}
              </span>
              <span v-else class="text-gray-500 dark:text-gray-400 text-sm italic">
                Select a MAC address in Network Device section above
              </span>
            </div>
          </div>
          
          <div class="mikrotik-form grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="mikrotik-field">
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                Max Bandwidth Limit
                <span v-if="state.product_id" class="text-green-600 text-xs font-normal ml-2">(Auto-set from package)</span>
              </label>
              <div class="relative">
                <UInput 
                  v-model="state.max_limit" 
                  placeholder="10M/10M"
                  size="lg"
                  icon="i-lucide-arrow-trending-up"
                  :readonly="!!state.product_id"
                  :class="state.product_id ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' : ''"
                />
                <div v-if="state.product_id" class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span v-if="state.product_id" class="text-green-600">
                  <UIcon name="i-lucide-info" class="inline mr-1" />
                  Bandwidth automatically set from selected package. Select a package above to override.
                </span>
                <span v-else>Format: Download/Upload (e.g., 10M/10M, 50M/50M). Select a package above for automatic configuration.</span>
              </p>
            </div>
            
            
            
            <!-- Provisioning Toggle Switches -->
            <div class="sm:col-span-2 space-y-3 mt-4">
              <div class="toggle-switch flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-cyan-200 dark:border-cyan-700">
                <div class="flex items-center gap-3">
                  <div class="bg-cyan-100 dark:bg-cyan-900/50 p-2 rounded-lg">
                    <UIcon name="i-lucide-bolt" class="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <label for="auto_provision" class="text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                      Enable Auto-Provisioning
                    </label>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Automatically configure customer on MikroTik after creation</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  v-model="state.auto_provision" 
                  id="auto_provision"
                  class="w-6 h-6 text-cyan-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
              
              <div 
                class="toggle-switch flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 transition-all"
                :class="state.auto_provision ? 'border-orange-200 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700 opacity-50'"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                    <UIcon name="i-lucide-eye" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <label for="dry_run" class="text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer" :class="!state.auto_provision && 'opacity-50'">
                      Dry Run Mode
                    </label>
                    <p class="text-xs text-gray-600 dark:text-gray-400" :class="!state.auto_provision && 'opacity-50'">
                      Preview commands without executing (test mode)
                    </p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  v-model="state.dry_run" 
                  id="dry_run"
                  class="w-6 h-6 text-orange-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!state.auto_provision"
                />
              </div>
            </div>
            
            <!-- Status Alert -->
            <div v-if="state.auto_provision" class="md:col-span-2 mt-2">
              <div 
                class="p-4 rounded-lg border-2 flex items-start gap-3"
                :class="state.dry_run 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                  : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'"
              >
                <UIcon 
                  :name="state.dry_run ? 'i-lucide-eye' : 'i-lucide-check-badge'" 
                  class="w-6 h-6 flex-shrink-0"
                  :class="state.dry_run ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'"
                />
                <div>
                  <p class="font-bold text-sm" :class="state.dry_run ? 'text-orange-900 dark:text-orange-100' : 'text-green-900 dark:text-green-100'">
                    {{ state.dry_run ? '🔍 Dry Run Mode Active' : '⚡ Live Provisioning Mode' }}
                  </p>
                  <p class="text-sm mt-1" :class="state.dry_run ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'">
                    <span v-if="state.dry_run">
                      Commands will be <strong>generated and displayed</strong> in the browser console but <strong>not executed</strong> on MikroTik. Use this to preview what will happen.
                    </span>
                    <span v-else>
                      Customer will be <strong>automatically provisioned</strong> on MikroTik RouterOS immediately after installation creation. Queue rules and IP bindings will be created.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div v-else class="md:col-span-2 mt-2">
              <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-start gap-3">
                <UIcon name="i-lucide-power" class="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div>
                  <p class="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Auto-Provisioning Disabled
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Enable auto-provisioning to automatically configure this customer on MikroTik RouterOS. Manual provisioning will be required otherwise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Information -->
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg document-info-section">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
            <UIcon name="i-lucide-file-text" class="mr-2" />
            Document Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Document Type" name="document_type">
              <USelectMenu
                v-model="state.document_type"
                :options="[
                  { value: 'KTP', label: 'KTP' },
                  { value: 'SIM', label: 'SIM' },
                  { value: 'Paspor', label: 'Paspor' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select document type"
                :ui="{
                  container: 'relative z-50'
                }"
                :popper="{
                  placement: 'bottom-start'
                }"
              />
            </UFormGroup>
            
            <UFormGroup label="Document Photo" name="document_photo">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleDocumentPhotoUpload"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                placeholder="Upload document photo"
              /> 
              <div v-if="state.documentPreview" class="mt-2">
                <img :src="state.documentPreview" alt="Document Preview" class="w-32 h-20 object-cover rounded border" />
              </div>
            </UFormGroup>
          </div>
        </div>

        <!-- Technician Photo Documentation -->
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:bg-gradient-to-br dark:from-amber-900/30 dark:to-orange-900/30 p-4 sm:p-6 rounded-xl border-2 border-amber-100 dark:border-amber-800 shadow-sm technician-photo-section">
          <div class="flex items-center mb-6">
            <div class="bg-amber-500 p-2 rounded-lg mr-3">
              <UIcon name="i-lucide-camera" class="text-white text-lg" />
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">Technician Photo Documentation</h3>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Document your PSB progress with photos (maximum 10 images). Images will be automatically compressed to reduce file size.
            </p>
            
            
          </div>
          
          <UFormGroup label="Upload Progress Photos" name="technician_photos">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(preview, index) in state.technician_photo_previews"
                :key="index"
                class="relative group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                @click="state.selectedTechnicianImage = preview; state.showTechnicianModal = true"
              >
                <img
                  :src="preview"
                  :alt="`Technician Photo ${index + 1}`"
                  class="w-full h-32 object-cover"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <UIcon name="i-lucide-eye" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl" />
                </div>
                <UButton
                  @click.stop="removeTechnicianPhoto(index)"
                  size="xs"
                  color="red"
                  variant="solid"
                  class="absolute -top-2 -right-2 shadow-lg"
                >
                  <UIcon name="i-lucide-x" />
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
              
              <div
                v-if="state.technician_photo_previews.length < 10"
                class="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 bg-white dark:bg-gray-800"
                @click="triggerTechnicianPhotoUpload"
              >
                <div class="text-center">
                  <UIcon name="i-lucide-plus" class="text-gray-400 dark:text-gray-500 text-3xl mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Add Photo</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ state.technician_photo_previews.length }}/10</p>
                </div>
              </div>
            </div>
            
            <input
              ref="technicianPhotoInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleTechnicianPhotoUpload"
            />
            
            <div v-if="state.technician_photo_previews.length > 0" class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div class="flex items-center text-sm text-amber-800 dark:text-amber-200">
                <UIcon name="i-lucide-info" class="mr-2" />
                <span>
                  {{ state.technician_photo_previews.length }} photo(s) uploaded. 
                  Total size: {{ formatFileSize(totalTechnicianPhotoSize) }}
                </span>
              </div>
            </div>
          </UFormGroup>
        </div>

        <!-- Network Device Information -->
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
            <UIcon name="i-lucide-cpu-chip" class="mr-2" />
            Network Device Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Asset *" name="assets_id">
              <USelectMenu
                v-model="state.assets_id"
                :options="state.assets"
                placeholder="Select asset"
                searchable
                searchable-placeholder="Search by brand/model"
                option-attribute="display"
                value-attribute="id"
                :search-attributes="['brand', 'type', 'model']"
                @change="onAssetChange(state.assets_id)"
              />
            </UFormGroup>

            <UFormGroup label="Package/Product *" name="product_id">
              <USelectMenu
                v-model="state.product_id"
                :options="state.products"
                placeholder="Select internet package"
                searchable
                searchable-placeholder="Search by package name or speed"
                option-attribute="display"
                value-attribute="id"
                :search-attributes="['name', 'description']"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <UIcon name="i-lucide-info" class="inline mr-1" />
                Package selection will automatically set the bandwidth limit for MikroTik provisioning
              </p>
            </UFormGroup>
            
            <UFormGroup label="Switch ID" name="switch_id">
              <UInput v-model="state.switch_id" placeholder="Enter switch ID" />
            </UFormGroup>
            
            <UFormGroup label="Port Number" name="port_number">
              <UInput v-model="state.port_number" placeholder="Enter port number" />
            </UFormGroup>
            
            <UFormGroup label="Remote Port" name="remote_port">
              <UInput v-model="state.remote_port" placeholder="Enter remote port" />
            </UFormGroup>
            
            <UFormGroup label="ETH Port" name="eth_port">
              <UInput v-model="state.eth_port" placeholder="Enter ETH port" />
            </UFormGroup>
            
            <UFormGroup label="MAC Address" name="mac_address">
              <div>
                <USelectMenu
                  v-model="state.asset_item_id"
                  :options="availableAssetItems[state.assets_id] || []"
                  :placeholder="!state.assets_id ? 'Select an asset first' : 'Select MAC Address'"
                  :disabled="!state.assets_id || (availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length === 0)"
                />
                <div v-if="state.assets_id && availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length === 0" class="text-xs text-red-500 mt-1 flex items-center">
                  <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 mr-1" />
                  No available devices for this asset
                </div>
                <div v-else-if="state.assets_id && availableAssetItems[state.assets_id] && availableAssetItems[state.assets_id].length > 0" class="text-xs text-green-600 mt-1">
                  {{ availableAssetItems[state.assets_id].length }} device(s) available
                </div>
              </div>
            </UFormGroup>
            
            <UFormGroup label="IP Static" name="ip_static">
              <div class="flex gap-2">
                <UInput 
                  v-model="state.ip_static" 
                  placeholder="192.168.1.100" 
                  class="flex-1"
                />
                <UButton 
                  @click="fetchDHCPLease"
                  color="blue"
                  variant="outline"
                  size="sm"
                  :loading="state.fetchingDHCP"
                  :disabled="!state.mac_address"
                  title="Fetch actual IP address from MikroTik DHCP lease"
                >
                  <UIcon name="i-lucide-refresh-cw" class="mr-1" />
                  Fetch DHCP
                </UButton>
              </div>
              <p v-if="state.dhcpStatus" class="text-xs mt-1" :class="state.dhcpStatus.success ? 'text-green-600' : 'text-red-600'">
                {{ state.dhcpStatus.message }}
              </p>
              <p v-else class="text-xs text-gray-500 mt-1">
                <UIcon name="i-lucide-info" class="inline mr-1" />
                This button will fetch the actual IP address assigned by your MikroTik router's DHCP server
              </p>
            </UFormGroup>
            
            <UFormGroup label="Device Ownership" name="kepemilikan_perangkat">
              <USelectMenu
                v-model="state.kepemilikan_perangkat"
                :options="[
                  { value: 'owned', label: 'Owned' },
                  { value: 'leased', label: 'Leased' },
                  { value: 'customer', label: 'Customer' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select ownership"
              />
            </UFormGroup>
            
            <UFormGroup label="Device Status" name="status_perangkat">
              <USelectMenu
                v-model="state.status_perangkat"
                :options="[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'faulty', label: 'Faulty' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select device status"
              />
            </UFormGroup>
            
            <UFormGroup label="Last Ping Status" name="last_ping_status">
              <USelectMenu
                v-model="state.last_ping_status"
                :options="[
                  { value: 'up', label: 'Up' },
                  { value: 'down', label: 'Down' },
                  { value: 'unknown', label: 'Unknown' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select ping status"
              />
            </UFormGroup>
          </div>
        </div>

        <!-- Customer Service Information -->
        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <UIcon name="i-lucide-wrench-screwdriver" class="mr-2" />
            Customer Service Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Cable Type" name="cable_type">
              <USelectMenu
                v-model="state.cable_type"
                :options="[
                  { value: 'UTP Cat5e', label: 'UTP Cat5e' },
                  { value: 'UTP Cat6', label: 'UTP Cat6' },
                  { value: 'Single Mode Fiber', label: 'Single Mode Fiber' },
                  { value: 'Multi Mode Fiber', label: 'Multi Mode Fiber' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select cable type"
              />
            </UFormGroup>
            
            <UFormGroup label="Cable Length (meters)" name="cable_length">
              <UInput v-model="state.cable_length" type="number" placeholder="Enter cable length" />
            </UFormGroup>
            
            <UFormGroup label="End Port Type" name="end_port_type">
              <USelectMenu
                v-model="state.end_port_type"
                :options="[
                  { value: 'RJ45', label: 'RJ45' },
                  { value: 'Fiber', label: 'Fiber' },
                  { value: 'SC', label: 'SC' },
                  { value: 'LC', label: 'LC' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select end port type"
              />
            </UFormGroup>
            
            <UFormGroup label="User Login" name="user_login">
              <UInput v-model="state.user_login" placeholder="Enter user login" />
            </UFormGroup>
            
            <UFormGroup label="Password" name="password">
              <UInput v-model="state.password" type="password" placeholder="Enter password" />
            </UFormGroup>
            
            <UFormGroup label="User Status" name="user_status">
              <USelectMenu
                v-model="state.user_status"
                :options="[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Suspended', label: 'Suspended' },
                  { value: 'Pending', label: 'Pending' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select user status"
              />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Installation Notes" name="installation_notes">
            <UTextarea 
              v-model="state.installation_notes" 
              placeholder="Additional notes about the installation process"
              :rows="3"
            />
          </UFormGroup>
        </div>


        <!-- Submit Button -->
        <div class="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-4 sm:p-6 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-950 border-t-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <!-- Requirements Check -->
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <div class="flex items-center gap-2">
                <div v-if="!state.customer_id || state.technicians.length === 0 || !state.assets_id || !state.product_id" class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
                  <span class="font-semibold">Please complete required fields (Customer, Technicians, Asset, Package)</span>
                </div>
                <div v-else class="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <UIcon name="i-lucide-check-circle" class="w-5 h-5" />
                  <span class="font-semibold">Ready to submit</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 w-full sm:w-auto">
              <UButton 
                type="button" 
                color="gray" 
                variant="outline"
                size="xl"
                @click="closeModal"
                class="flex-1 sm:flex-initial"
              >
                <UIcon name="i-lucide-x-circle" class="mr-2 w-5 h-5" />
                Cancel
              </UButton>
              <UButton 
                type="submit" 
                color="blue"
                size="xl"
                :loading="state.loading"
                :disabled="!state.customer_id || state.technicians.length === 0 || !state.assets_id || !state.product_id"
                class="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <UIcon name="i-lucide-file-check" class="mr-2 w-5 h-5" />
                <span class="font-bold">Create Installation Report</span>
              </UButton>
            </div>
          </div>
        </div>
      </UForm>
    </div>

  <!-- Technician Photo Modal -->
  <UModal v-model="state.showTechnicianModal">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Technician Photo Preview</h3>
          <UButton @click="state.showTechnicianModal = false" variant="ghost" size="sm">
            <UIcon name="i-lucide-x" />
          </UButton>
        </div>
      </template>
      
      <div class="text-center">
        <img
          :src="state.selectedTechnicianImage"
          alt="Technician photo preview"
          class="max-w-full max-h-96 mx-auto rounded-lg"
        />
      </div>
    </UCard>
  </UModal>
</template>
