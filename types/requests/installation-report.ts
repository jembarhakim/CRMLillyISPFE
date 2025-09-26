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
  total_assets_out?: number;
  total_assets_in?: number;
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

export type AssetTransactionRequest = {
  asset_id: string;
  transaction_type: 'out' | 'in';
  quantity: number;
  notes?: string;
  transaction_date?: string;
}

export type NetworkDeviceRequest = {
  assets_id: string;
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  mac_address?: string;
  ip_static?: string;
  kepemilikan_perangkat?: 'owned' | 'leased' | 'customer';
  status_perangkat?: 'active' | 'inactive' | 'maintenance' | 'faulty';
  last_ping_status?: 'up' | 'down' | 'unknown';
  product_id?: string;
}

export type CustomerServiceRequest = {
  device_id?: string;
  cable_id?: string;
  cable_length?: number;
  end_port_type?: string;
  user_login?: string;
  password?: string;
  user_status?: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  installation_notes?: string;
  installation_team_phone?: string;
  installation_team_name?: string;
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
  total_installations: number;
  completed_installations: number;
  pending_installations: number;
  in_progress_installations: number;
  latest_on_air_date?: string;
  latest_completion_date?: string;
}

export type InstallationAssetReportResponse = {
  installation_id: string;
  customer_name: string;
  installation_type: string;
  installation_status: string;
  on_air_date?: string;
  installation_completed_at?: string;
  total_assets_out: number;
  total_quantity_out: number;
  total_assets_in: number;
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
  total_assets_out: number;
  total_assets_in: number;
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
    status_perangkat: string;
    last_ping_status: string;
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
  document_type?: string;
  document_photo?: string;
  total_assets_out?: number;
  total_assets_in?: number;
  network_device_id?: string;
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  mac_address?: string;
  ip_static?: string;
  status_perangkat?: string;
  kepemilikan_perangkat?: string;
  last_ping_status?: string;
  last_ping_timestamp?: string;
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
  cable_id?: string;
  cable_name?: string;
  cable_type?: string;
  cable_length?: number;
  cable_status?: string;
  end_port_type?: string;
  installation_created_at?: string;
  installation_updated_at?: string;
}