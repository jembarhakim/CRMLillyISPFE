// Installation Report Types

export type CreateCompleteInstallationReportRequest = {
  // Basic Installation Data
  customer_id: string;
  technician_id: string;
  status?: string;
  notes?: string;
  document_type?: string;
  document_photo?: string;
  installation_type?: string;
  on_air_date?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  installation_completed_at?: string;
  
  // Asset Tracking
  asset_transactions?: AssetTransactionRequest[];
  
  // Network Devices
  network_devices?: NetworkDeviceRequest[];
  
  // Customer Services
  customer_services?: CustomerServiceRequest[];
  
  // Cables
  cables?: CableRequest[];
  
  // Images
  image_ids: string[];
}

export type UpdateCompleteInstallationReportRequest = {
  // Basic Installation Data
  customer_id: string;
  technician_id: string;
  status?: string;
  notes?: string;
  document_type?: string;
  document_photo?: string;
  installation_type?: string;
  on_air_date?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  installation_completed_at?: string;
  is_terminal?: string; // 'yes' or 'no'
  terminal_customer_installation_id?: string; // Installation ID of the terminal installation (from customer_installations table)
  latitude?: number; // Installation location latitude
  longitude?: number; // Installation location longitude
  
  // Network Devices (multiple devices support)
  network_devices?: NetworkDeviceRequest[];
  
  // Customer Services (multiple services support)
  customer_services?: CustomerServiceRequest[];
  
  // Cables (multiple cables support)
  cables?: CableRequest[];
  
  // Images
  image_ids?: string[];
  
  // Technician Photo Documentation
  technician_photos?: string[];
  technician_photos_notes?: string;
}

export type AssetTransactionRequest = {
  asset_id: string;
  transaction_type: 'out' | 'in';
  quantity: number;
  notes?: string;
  transaction_date?: string;
}

export type NetworkDeviceRequest = {
  assets_id: string;
  asset_item_id?: string; // Specific asset item ID for MAC address tracking
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  mac_address?: string;
  ip_static?: string;
  kepemilikan_perangkat?: 'owned' | 'leased' | 'customer';
  product_id?: string;
  router_brand?: string;
  router_type?: string;
}

export type CustomerServiceRequest = {
  device_id?: string;
  cable_type?: string;
  cable_length?: number;
  end_port_type?: string;
  user_login?: string;
  password?: string;
  user_status?: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  installation_notes?: string;
  service_activation_date?: string;
}

export type CableRequest = {
  name: string;
  type?: string;
  length?: number;
  status?: 'available' | 'in_use' | 'damaged' | 'retired';
}

// Response Types
export type InstallationSummaryResponse = {
  customer_id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  tgl_permintaan_psb?: string;
  total_installations: number;
  completed_installations: number;
  pending_installations: number;
  in_progress_installations: number;
  latest_on_air_date?: string;
  latest_completion_date?: string;
  avg_durasi_psb?: number;
  tepat_waktu_count?: number;
  terlambat_count?: number;
}

export type InstallationAssetReportResponse = {
  installation_id: string;
  customer_name: string;
  installation_type: string;
  installation_status: string;
  on_air_date?: string;
  installation_completed_at?: string;
  total_quantity_out: number;
  total_quantity_in: number;
  assets_out_details?: string;
  assets_in_details?: string;
}

export type InstallationTechnicianReportResponse = {
  technician_id: string;
  technician_name: string;
  technician_phone?: string;
  total_installations: number;
  completed_installations: number;
  pending_installations: number;
  in_progress_installations: number;
  avg_completion_days?: number;
  latest_completion_date?: string;
}

export type CompleteInstallationReportResponse = {
  id: string;
  customer_id: string;
  technician_id: string;
  status: string;
  notes?: string;
  document_type?: string;
  document_photo?: string;
  installation_type: string;
  installation_completed_at?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  on_air_date?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  technician?: {
    id: string;
    name: string;
    phone?: string;
  };
  images?: Array<{
    id: string;
    file: string;
    full_path: string;
  }>;
  asset_transactions?: Array<{
    id: string;
    asset_id: string;
    transaction_type: string;
    quantity: number;
    notes?: string;
    transaction_date: string;
  }>;
  network_devices?: Array<{
    id: string;
    switch_id?: string;
    port_number?: string;
    remote_port?: string;
    eth_port?: string;
    mac_address?: string;
    ip_static?: string;
    kepemilikan_perangkat: string;
    assets?: {
      id: string;
      brand: string;
      type: string;
      model: string;
      serial_number: string;
    };
  }>;
  customer_services?: Array<{
    id: string;
    user_login?: string;
    password?: string;
    user_status: string;
    installation_notes?: string;
    installation_team_phone?: string;
    end_port_type?: string;
  }>;
  cables?: Array<{
    id: string;
    name: string;
    type?: string;
    length?: number;
    status: string;
  }>;
}

// Installation Report Complete Response (for the view)
export type InstallationReportCompleteResponse = {
  installation_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  tgl_permintaan_psb?: string;
  technician_id?: string;
  technician_name?: string;
  technician_phone?: string;
  installation_status?: string;
  installation_type?: string;
  installation_notes?: string;
  on_air_date?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  installation_completed_at?: string;
  durasi_psb?: number;
  status_psb?: string;
  document_type?: string;
  document_photo?: string;
  network_device_id?: string;
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  mac_address?: string;
  ip_static?: string;
  kepemilikan_perangkat?: string;
  router_brand?: string;
  router_type?: string;
  router_model?: string;
  router_serial?: string;
  customer_service_id?: string;
  user_login?: string;
  password?: string;
  user_status?: string;
  service_notes?: string;
  installation_team_name?: string;
  installation_team_phone?: string;
  cable_type?: string;
  cable_length?: number;
  end_port_type?: string;
  installation_created_at?: string;
  installation_updated_at?: string;
  // Product information
  product_id?: string;
  product_name?: string;
  product_description?: string;
  product_price?: number;
  download_speed_mbps?: number;
  upload_speed_mbps?: number;
  
  // Images relationship (for technician photos)
  images?: Array<{
    id: string;
    file: string;
    full_path: string;
    archive_installation_id: string;
    created_at: string;
    updated_at?: string;
  }>;
  
  // Technician Photo Documentation (computed from Images relationship)
  technician_photos_notes?: string;
}

// Installation Technician Team Response
export type InstallationTechnicianTeamResponse = {
  id: string;
  customer_installation_id: string;
  technician_id: string;
  technician_name: string;
  technician_phone: string;
  technician_email: string;
  role: string;
  is_primary: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Complete Installation Report with Technician Photos Response (includes Images relationship)
export type CompleteInstallationReportWithTechnicianPhotosResponse = {
  // Basic fields from CustomerInstallation entity
  id: string;
  customer_id?: string;
  technician_id?: string;
  status?: string;
  notes?: string;
  document_type?: string;
  document_photo?: string;
  installation_type?: string;
  installation_completed_at?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  on_air_date?: string;
  created_at: string;
  updated_at: string;
  
  // Customer and Technician relationships
  customer?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  technician?: {
    id: string;
    name: string;
    phone?: string;
  };
  
  // Images relationship (for technician photos)
  images?: Array<{
    id: string;
    file: string;
    full_path: string;
    archive_installation_id: string;
    created_at: string;
    updated_at?: string;
  }>;
  
  // Other relationships
  asset_transactions?: Array<any>;
  network_devices?: Array<any>;
  customer_services?: Array<any>;
  cables?: Array<any>;
  installation_technicians?: Array<any>;
  
  // Computed technician photo fields (for backward compatibility)
  technician_photos?: string[];
  technician_photos_count?: number;
  technician_photos_uploaded_at?: string;
  technician_photos_notes?: string;
  
  // Additional fields that the template expects (from database view)
  installation_id?: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  tgl_permintaan_psb?: string;
  technician_name?: string;
  technician_phone?: string;
  installation_status?: string;
  installation_notes?: string;
  durasi_psb?: number;
  status_psb?: string;
  network_device_id?: string;
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  mac_address?: string;
  ip_static?: string;
  kepemilikan_perangkat?: string;
  router_brand?: string;
  router_type?: string;
  router_model?: string;
  router_serial?: string;
  customer_service_id?: string;
  user_login?: string;
  password?: string;
  user_status?: string;
  service_notes?: string;
  installation_team_name?: string;
  installation_team_phone?: string;
  cable_type?: string;
  cable_length?: number;
  end_port_type?: string;
  installation_created_at?: string;
  installation_updated_at?: string;
  product_id?: string;
  product_name?: string;
  product_description?: string;
  product_price?: number;
  download_speed_mbps?: number;
  upload_speed_mbps?: number;
  
  // Terminal information
  is_terminal?: string;
  terminal_customer_installation_id?: string;
  
  // Installation location
  latitude?: number;
  longitude?: number;
}
