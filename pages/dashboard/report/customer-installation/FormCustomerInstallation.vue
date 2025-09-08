<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { userManagementAdminApi } from "@/api/admin/user-management";
import { uploadFileAdminApi } from "@/api/admin/file-upload";

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

// Define props to receive customer data
const props = defineProps<{
  isEdit?: boolean;
  data?: any;
}>();

const schema = object({
  customer_id: string().required("Customer is required"),
  technician_id: string().required("Technician is required"),
  date: string().required("Date is required"),
  description: string(),
});

const state = reactive({
  customer_id: "",
  technician_id: "",
  date: "",
  description: "",
  image_ids: [] as string[],
  previews: [] as string[],
});

const isSubmitting = ref(false);

type Schema = InferType<typeof schema>;

// Manual submit handler
async function handleManualSubmit() {
  console.log("=== MANUAL SUBMIT CLICKED ===");
  console.log("Current state:", state);
  
  if (isSubmitting.value) return;
  
  // Validate required fields
  if (!state.customer_id) {
    useToast().add({
      title: "Please select a customer",
      color: "red",
    });
    return;
  }
  
  if (!state.technician_id) {
    useToast().add({
      title: "Please select a technician",
      color: "red",
    });
    return;
  }
  
  if (!state.date) {
    useToast().add({
      title: "Please select a date",
      color: "red",
    });
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Prepare data for API
    const submitData = {
      customer_id: state.customer_id,
      technician_id: state.technician_id,
      date: state.date,
      description: state.description || "",
      image_ids: state.image_ids || [],
      previews: state.previews || [],
      selectedImage: "",
      showModal: false
    };
    
    console.log("Manual submitting data:", submitData);
    
    const response = await customerAdminApi().createCustomerInstallation(submitData);
    console.log("Manual API response:", response);
    
    useToast().add({
      title: "Customer installation report created successfully",
      color: "green",
    });
    
    // Emit custom event to refresh report data
    window.dispatchEvent(new CustomEvent('installation-created'));
    
    onSuccess();
  } catch (error: any) {
    console.error("Manual submission error:", error);
    useToast().add({
      title: error.message || "Failed to create installation report",
      color: "red",
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Debug function to check button click
function handleSubmitClick(event: Event) {
  console.log("Submit button clicked!");
  console.log("Current state:", state);
  console.log("Form validation:", {
    customer_id: !!state.customer_id,
    technician_id: !!state.technician_id,
    date: !!state.date,
    isSubmitting: isSubmitting.value
  });
  console.log("Button disabled:", !state.customer_id || !state.technician_id || !state.date || isSubmitting.value);
}

// Test function to bypass form validation
async function testSubmit() {
  console.log("=== TEST SUBMIT CLICKED ===");
  console.log("Current state:", state);
  
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    // Prepare data for API
    const submitData = {
      customer_id: state.customer_id || "test-customer-id",
      technician_id: state.technician_id || "test-technician-id", 
      date: state.date || new Date().toISOString().split('T')[0],
      description: state.description || "Test description",
      image_ids: state.image_ids || [],
      previews: state.previews || [],
      selectedImage: "",
      showModal: false
    };
    
    console.log("Test submitting data:", submitData);
    
    const response = await customerAdminApi().createCustomerInstallation(submitData);
    console.log("Test API response:", response);
    
    useToast().add({
      title: "Test submission successful!",
      color: "green",
    });
    
    // Emit custom event to refresh report data
    window.dispatchEvent(new CustomEvent('installation-created'));
    
    onSuccess();
  } catch (error: any) {
    console.error("Test submission error:", error);
    useToast().add({
      title: `Test submission failed: ${error.message}`,
      color: "red",
    });
  } finally {
    isSubmitting.value = false;
  }
}

const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log("=== FORM SUBMIT TRIGGERED ===");
  console.log("Form submitted with data:", state);
  console.log("Event:", event);
  
  if (isSubmitting.value) {
    console.log("Already submitting, returning...");
    return; // Prevent double submission
  }
  
  console.log("Setting isSubmitting to true");
  isSubmitting.value = true;
  
  try {
    // Validate required fields
    if (!state.customer_id) {
      throw new Error("Customer is required");
    }
    if (!state.technician_id) {
      throw new Error("Technician is required");
    }
    if (!state.date) {
      throw new Error("Date is required");
    }
    
    // Prepare data for API
    const submitData = {
      customer_id: state.customer_id,
      technician_id: state.technician_id,
      date: state.date,
      description: state.description || "",
      image_ids: state.image_ids || [],
      previews: state.previews || [],
      selectedImage: "",
      showModal: false
    };
    
    console.log("Submitting data:", submitData);
    
    const response = await customerAdminApi().createCustomerInstallation(submitData);
    console.log("API response:", response);
    
    useToast().add({
      title: "Customer installation report created successfully",
      color: "green",
    });
    
    // Emit custom event to refresh report data
    window.dispatchEvent(new CustomEvent('installation-created'));
    
    onSuccess();
  } catch (error: any) {
    console.error("Error creating installation:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      data: error.data
    });
    
    useToast().add({
      title: error.message || "Failed to create installation report",
      color: "red",
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  if (files && files.length > 0) {
    state.image_ids = [];
    state.previews = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type.startsWith("image/")) {
        try {
          // Upload file and get ID
          const response = await uploadFileAdminApi().createUploadFile({
            name: `installation_${Date.now()}_${i}`,
            path: `installations/${state.technician_id}/${state.customer_id}`,
            file: file,
          });
          
          if (response.data?.id) {
            state.image_ids.push(response.data.id);
          }
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              state.previews.push(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    }
  }
};

const customers = ref<any[]>([]);
const technicians = ref<any[]>([]);

async function getCustomers() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    customers.value = response.data.map((customer: any) => ({
      label: customer.name,
      value: customer.id,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

async function getTechnicians() {
  try {
    const response = await userManagementAdminApi().getAllUsers({ 
      query: { role: "TECHNICIAN" } 
    });
    technicians.value = response.data.map((tech: any) => ({
      label: tech.name,
      value: tech.id,
    }));
  } catch (error) {
    console.error("Error fetching technicians:", error);
  }
}

onMounted(() => {
  console.log("Form mounted with props:", props);
  getCustomers();
  getTechnicians();
  
  // Pre-fill customer if data is provided
  if (props.data && props.data.id) {
    state.customer_id = props.data.id;
    console.log("Pre-filled customer ID:", props.data.id);
    console.log("Customer data:", props.data);
  } else {
    console.log("No customer data provided in props");
  }
});
</script>

<template>
  <UModal>
    <div class="p-4">

        <div class="p-2 mb-4 text-2xl font-bold text-center">
            <h1>Add New Customer Installation</h1>
        </div>
        
        <!-- Debug info -->
        <div class="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <strong>Debug Info:</strong><br>
          Customer ID: {{ state.customer_id || 'Not set' }}<br>
          Technician ID: {{ state.technician_id || 'Not set' }}<br>
          Date: {{ state.date || 'Not set' }}<br>
          Props Data: {{ props.data ? 'Received' : 'Not received' }}
        </div>
        <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
        >
        <UFormGroup label="Customer" name="customer_id">
            <USelectMenu 
              v-model="state.customer_id" 
              :options="customers" 
              value-attribute="value"
              option-attribute="label"
              placeholder="Select customer"
              :disabled="!!props.data?.id"
            />
        </UFormGroup>
        <UFormGroup label="Technician" name="technician_id">
            <USelectMenu 
              v-model="state.technician_id" 
              :options="technicians" 
              value-attribute="value"
              option-attribute="label"
              placeholder="Select technician"
            />
        </UFormGroup>
        <UFormGroup label="Description" name="description">
            <UTextarea v-model="state.description" placeholder="Installation description..." />
        </UFormGroup>
        <UFormGroup label="Date Installation" name="date">
            <UInput v-model="state.date" type="date" />
        </UFormGroup>
        <UFormGroup label="Upload Photos" name="images">
            <UInput
              type="file"
              multiple
              accept="image/*"
              @change="handleFileUpload"
              placeholder="Select installation photos"
            />
            <p class="text-xs text-gray-500 mt-1">Select multiple images (PNG, JPG, etc.)</p>
        </UFormGroup>
        
        <!-- Image Previews -->
        <div v-if="state.previews.length > 0" class="grid grid-cols-3 gap-2 mt-4">
          <img
            v-for="(preview, index) in state.previews"
            :key="index"
            :src="preview"
            alt="Preview"
            class="object-cover w-full h-32 rounded-md border"
          />
        </div>
        
        <div class="flex gap-2">
          <UButton 
            type="button" 
            :disabled="isSubmitting" 
            :loading="isSubmitting"
            @click="handleManualSubmit"
            color="green"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </UButton>
          
          <UButton 
            color="gray" 
            variant="outline"
            @click="testSubmit"
          >
            Test Submit
          </UButton>
        </div>
    </UForm>
</div>
  </UModal>
</template>
