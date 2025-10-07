<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { userManagementAdminApi } from "@/api/admin/user-management";
import { customerAdminApi } from "@/api/admin/customer";
import { assetAdminApi } from "@/api/admin/asset";
import { assetItemAdminApi } from "@/api/admin/asset-item";
import { mikrotikAdminApi } from "@/api/admin/mikrotik";
import { useNotificationStore } from "@/stores/notification";

const notification = useNotificationStore();

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
  },
  data: {
    type: Object,
    default: () => ({
      id: {
        type: string,
        default: "",
      },
      technician_id: {
        type: string,
        default: "",
      },
    }),
  },
});

const schema = object({
  customer_id: string().required("Customer is required"),
  assets_id: string().required("Asset is required"),
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
  psb_date: "",
  psb_time: "",
  max_limit: "", // e.g., "10M/10M"
  ip_binding_type: "bypassed", // Default to bypassed for new installations
  auto_provision: false,
  dry_run: false,

  // Network Device Information
  assets_id: "",
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
  documentPreview: "",
  
  // Asset item tracking
  asset_item_id: "" as string | any, // Track the specific asset item selected
});

// Create a ref for the file input
const fileInputRef = ref<HTMLInputElement | null>(null);

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

// Watch for changes in the file input ref
watch(fileInputRef, (newRef) => {
  console.log('fileInputRef changed:', newRef);
  if (newRef && (newRef as any).$el) {
    console.log('File input ref is now available with $el');
    // Add a direct event listener as a fallback - use $el for Vue component
    const nativeElement = (newRef as any).$el as HTMLInputElement;
    if (nativeElement && nativeElement.addEventListener) {
      nativeElement.addEventListener('change', (event) => {
        console.log('Direct event listener triggered on ref');
        const target = event.target as HTMLInputElement;
        if (target && target.files && target.files[0]) {
          console.log('File found via direct event listener:', target.files[0].name);
          handleFileUploadDirect();
        }
      });
    }
  } else if (newRef && newRef.addEventListener) {
    // If it's a native HTML element
    console.log('File input ref is now available (native element)');
    newRef.addEventListener('change', (event) => {
      console.log('Direct event listener triggered on ref');
      const target = event.target as HTMLInputElement;
      if (target && target.files && target.files[0]) {
        console.log('File found via direct event listener:', target.files[0].name);
        handleFileUploadDirect();
      }
    });
  }
}, { immediate: true });

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

// Alternative file upload handler that doesn't rely on event target
const handleFileUploadDirect = async () => {
  console.log('🔍 === DEBUG: CHECK FILE ===');
  console.log('Direct file upload handler called');
  console.log('fileInputRef.value:', fileInputRef.value);
  
  if (fileInputRef.value) {
    console.log('✅ File input ref exists');
    
    // Try to access the native HTML input element through $el
    const nativeInput = (fileInputRef.value as any)?.$el as HTMLInputElement;
    console.log('Native input element:', nativeInput);
    console.log('Native input files:', nativeInput?.files);
    console.log('Number of files:', nativeInput?.files?.length || 0);
    
    if (nativeInput && nativeInput.files && nativeInput.files[0]) {
      console.log('✅ File found in native input');
      const file = nativeInput.files[0];
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const processedFile = await processFile(file);
      
      if (processedFile) {
        state.document_photo = processedFile;
        console.log('✅ Document photo file set successfully via direct method:', processedFile.name, processedFile.size, processedFile.type);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          state.documentPreview = e.target?.result as string;
          console.log('✅ Document preview created successfully');
        };
        reader.readAsDataURL(processedFile);
      }
    } else {
      console.log('❌ No file found in native input');
      console.log('💡 This means the UInput component is not properly exposing the file');
      
      // Fallback: check if we have a file in state
      if (state.document_photo) {
        console.log('✅ But we DO have a file in state:', {
          name: state.document_photo.name,
          size: state.document_photo.size,
          type: state.document_photo.type
        });
        console.log('💡 This means the file was processed by the event handler, not the ref');
      } else {
        console.log('❌ No file in state either');
        console.log('💡 Click "Choose File" first, then click this debug button');
      }
    }
  } else {
    console.log('❌ File input ref is null/undefined');
    console.log('💡 This might happen if the component is still loading');
  }
  
  console.log('=== END DEBUG ===');
};

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
  state.loading = true;
  
  try {
    // Validate at least one technician is assigned
    if (state.technicians.length === 0) {
      notification.error('Validation Error', 'Please assign at least one technician');
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
    if (state.psb_date) formData.append('psb_date', state.psb_date);
    formData.append('ip_binding_type', state.ip_binding_type);
    if (state.psb_time) formData.append('psb_time', state.psb_time);
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
      formData.append('document_photo', state.document_photo);
      
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

const emit = defineEmits(["success", "close"]);

function onSuccess() {
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
  state.psb_date = today;
  state.psb_time = currentTime;
  state.max_limit = "10M/10M";
  state.ip_binding_type = "bypassed"; // Default to bypassed for new installations
  state.auto_provision = true;
  state.dry_run = true; // Safe for testing
  
  // Network Device Information
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
  console.log('Event object:', event);
  console.log('Event target:', event.target);
  
  const input = event.target as HTMLInputElement;
  console.log('Input element after casting:', input);
  console.log('Input files:', input?.files);
  
  // Alternative way to get the input element
  if (!input || !input.files) {
    console.log('Input element is null/undefined, trying alternative approaches...');
    
    // Try using the ref first
    console.log('Trying ref approach...');
    console.log('fileInputRef.value:', fileInputRef.value);
    console.log('fileInputRef.value?.files:', fileInputRef.value?.files);
    
    if (fileInputRef.value && fileInputRef.value.files && fileInputRef.value.files[0]) {
      console.log('Using ref input element');
      const file = fileInputRef.value.files[0];
      const processedFile = await processFile(file);
      
      if (processedFile) {
        state.document_photo = processedFile;
        console.log('✅ Document photo file set successfully via ref method:', processedFile.name, processedFile.size, processedFile.type);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          state.documentPreview = e.target?.result as string;
          console.log('✅ Document preview created successfully');
        };
        reader.readAsDataURL(processedFile);
      }
      return;
    }
    
    // Try DOM query as fallback
    console.log('Trying DOM query approach...');
    const altInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    console.log('Alternative input element:', altInput);
    console.log('Alternative input files:', altInput?.files);
    
    if (altInput && altInput.files && altInput.files[0]) {
      console.log('Using DOM query input element');
      const file = altInput.files[0];
      const processedFile = await processFile(file);
      
      if (processedFile) {
        state.document_photo = processedFile;
        console.log('✅ Document photo file set successfully via DOM query method:', processedFile.name, processedFile.size, processedFile.type);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          state.documentPreview = e.target?.result as string;
          console.log('✅ Document preview created successfully');
        };
        reader.readAsDataURL(processedFile);
      }
      return;
    }
  }
  
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const processedFile = await processFile(file);
    
      if (processedFile) {
        state.document_photo = processedFile;
        console.log('✅ Document photo file set successfully:', processedFile.name, processedFile.size, processedFile.type);
        
        // Debug: Check if the ref can now access the file
        console.log('🔍 === CHECKING REF AFTER FILE SET ===');
        const nativeInput = (fileInputRef.value as any)?.$el as HTMLInputElement;
        console.log('Native input after file set:', nativeInput);
        console.log('Native input files after file set:', nativeInput?.files);
        console.log('=== END REF CHECK ===');
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          state.documentPreview = e.target?.result as string;
          console.log('✅ Document preview created successfully');
        };
        reader.readAsDataURL(processedFile);
      }
  } else {
    console.log('❌ No file selected or input.files is empty');
    state.document_photo = null;
    state.documentPreview = '';
  }
};

// Load data functions
async function loadCustomers() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    state.customers = response.data || [];
  } catch (error) {
    console.error("Failed to load customers:", error);
  }
}

async function loadTechnicians() {
  try {
    const response = await userManagementAdminApi().getAllUsers({ query: { role: "TECHNICIAN" } });
    state.availableTechnicians = response.data || [];
  } catch (error) {
    console.error("Failed to load technicians:", error);
  }
}

async function loadAssets() {
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
    }
  } catch (error) {
    console.error("Failed to load assets:", error);
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
  // Close modal directly without confirmation
  useModal().close();
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
  await Promise.all([
    loadCustomers(),
    loadTechnicians(),
    loadAssets()
  ]);
  
  // Add one technician by default
  if (state.technicians.length === 0) {
    addTechnician();
  }
});
</script>

<style scoped>
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
  <UModal :prevent-close="true">
    <div class="p-4 sm:p-6 max-w-7xl max-h-[92vh] overflow-y-auto relative bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 scroll-smooth">
      <!-- Close Button -->
      <button 
        @click="closeModal"
        class="absolute top-4 right-4 z-20 p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
        title="Close modal"
      >
        <UIcon name="i-heroicons-x-mark" class="w-7 h-7" />
      </button>
      
      <!-- Header -->
      <div class="mb-8 text-center pb-6 border-b-2 border-blue-200 dark:border-blue-800">
        <div class="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-heroicons-document-plus" class="w-10 h-10 text-white" />
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
            <UIcon name="i-heroicons-beaker" class="w-5 h-5" />
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
            <UIcon name="i-heroicons-information-circle" class="mr-2" />
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
                <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
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
                <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
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
                  <UIcon name="i-heroicons-user-group" class="text-white w-5 h-5" />
                </div>
                Installation Team
                <span class="text-red-500">*</span>
              </h3>
              <p class="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Assign technicians with their roles and responsibilities</p>
            </div>
            <UButton @click="addTechnician" size="lg" color="indigo">
              <UIcon name="i-heroicons-plus-circle" class="mr-2 w-5 h-5" />
              Add Technician
            </UButton>
          </div>
          
          <div v-if="state.technicians.length === 0" class="text-center py-8 px-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700">
            <UIcon name="i-heroicons-user-group" class="w-16 h-16 text-indigo-300 dark:text-indigo-600 mx-auto mb-3" />
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
                  <UIcon name="i-heroicons-star-solid" class="w-4 h-4" />
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
                        <UIcon :name="tech.is_primary ? 'i-heroicons-star-solid' : 'i-heroicons-star'" class="mr-1 w-4 h-4" />
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
                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
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
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
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
                <UIcon name="i-heroicons-server-stack" class="text-white w-5 h-5" />
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
              </label>
              <div class="relative">
                <UInput 
                  v-model="state.max_limit" 
                  placeholder="10M/10M"
                  size="lg"
                  icon="i-heroicons-arrow-trending-up"
                  class="w-full"
                />
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Format: Download/Upload (e.g., 10M/10M, 50M/50M)</p>
            </div>
            
            <div class="mikrotik-field">
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                IP Binding Type
              </label>
              <USelectMenu
                v-model="state.ip_binding_type"
                :options="[
                  { value: 'bypassed', label: 'Bypassed (Auto-connect)' },
                  { value: 'regular', label: 'Regular (Manual login)' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select IP binding type"
                size="lg"
                icon="i-heroicons-shield-check"
                class="w-full"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <strong>Bypassed:</strong> Internet works automatically after installation<br>
                <strong>Regular:</strong> Requires manual login through hotspot
              </p>
            </div>
            
            <div class="mikrotik-field">
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                PSB Date
              </label>
              <div class="relative">
                <UInput 
                  v-model="state.psb_date" 
                  type="date"
                  size="lg"
                  class="w-full"
                />
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Provisioning service begin date</p>
            </div>
            
            <div class="mikrotik-field">
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                PSB Time
              </label>
              <div class="relative">
                <UInput 
                  v-model="state.psb_time" 
                  type="time"
                  size="lg"
                  class="w-full"
                />
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Service activation time</p>
            </div>
            
            <!-- Provisioning Toggle Switches -->
            <div class="sm:col-span-2 space-y-3 mt-4">
              <div class="toggle-switch flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-cyan-200 dark:border-cyan-700">
                <div class="flex items-center gap-3">
                  <div class="bg-cyan-100 dark:bg-cyan-900/50 p-2 rounded-lg">
                    <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
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
                    <UIcon name="i-heroicons-eye" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
                  :name="state.dry_run ? 'i-heroicons-eye' : 'i-heroicons-check-badge'" 
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
                <UIcon name="i-heroicons-power" class="w-6 h-6 text-gray-400 flex-shrink-0" />
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
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-document-text" class="mr-2" />
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
              />
            </UFormGroup>
            
            <UFormGroup label="Document Photo" name="document_photo">
              <UInput
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleDocumentPhotoUpload"
                @input="handleFileUploadDirect"
                placeholder="Upload document photo"
              /> 
              <div v-if="state.documentPreview" class="mt-2">
                <img :src="state.documentPreview" alt="Document Preview" class="w-32 h-20 object-cover rounded border" />
              </div>
              <!-- Debug button -->
              <div class="mt-2">
                <UButton 
                  @click="handleFileUploadDirect" 
                  size="sm" 
                  color="gray" 
                  variant="outline"
                  class="text-xs"
                >
                  Debug: Check File
                </UButton>
              </div>
            </UFormGroup>
          </div>
        </div>

        <!-- Network Device Information -->
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-cpu-chip" class="mr-2" />
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
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1" />
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
                  <UIcon name="i-heroicons-arrow-path" class="mr-1" />
                  Fetch DHCP
                </UButton>
              </div>
              <p v-if="state.dhcpStatus" class="text-xs mt-1" :class="state.dhcpStatus.success ? 'text-green-600' : 'text-red-600'">
                {{ state.dhcpStatus.message }}
              </p>
              <p v-else class="text-xs text-gray-500 mt-1">
                <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
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
            <UIcon name="i-heroicons-wrench-screwdriver" class="mr-2" />
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
                <div v-if="!state.customer_id || state.technicians.length === 0 || !state.assets_id" class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                  <span class="font-semibold">Please complete required fields</span>
                </div>
                <div v-else class="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
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
                <UIcon name="i-heroicons-x-circle" class="mr-2 w-5 h-5" />
                Cancel
              </UButton>
              <UButton 
                type="submit" 
                color="blue"
                size="xl"
                :loading="state.loading"
                :disabled="!state.customer_id || state.technicians.length === 0 || !state.assets_id"
                class="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <UIcon name="i-heroicons-document-check" class="mr-2 w-5 h-5" />
                <span class="font-bold">Create Installation Report</span>
              </UButton>
            </div>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
