export type CreateCustomerRequest = {
  name: String
  alias?: String
  address: String
  area_id: String
  phone: String
  latitude: Number
  longitude: Number
  service_request_date: String
  sales_representative_id?: String
  company_id?: String
}

export type Customer = {
  id: string
  name: string
  alias?: string
  address: string
  area_id: string
  phone: string
  latitude: number
  longitude: number
  service_request_date?: string
  proposed_package?: string
  sales_representative_id?: string
  company_id?: string
  created_at?: string
  updated_at?: string
  installation_date?: string
}

export type UpdateCustomerRequest = {
  name?: String
  phone?: String
  address?: String
  company?: String
}

export type CreateCustomerInstallationRequest = {
  customer_id: String,
  technician_id: String,
  status?: String,
  notes?: String,
  document_type?: String,
  document_photo?: String,
  image_ids: string[],
  on_air_date?: String,
}

export type CreateNetworkDeviceRequest = {
  customer_id: String
  assets_id?: String
  switch_id?: String
  port_number?: String
  remote_port?: String
  eth_port?: String
  kepemilikan_perangkat?: String
  status_perangkat?: String
  last_ping_status?: String
  mac_address?: String
  ip_static?: String
  product_id?: String
}

export type UpdateNetworkDeviceRequest = {
  id: String
  customer_id: String
  assets_id?: String
  switch_id?: String
  port_number?: String
  remote_port?: String
  eth_port?: String
  kepemilikan_perangkat?: String
  status_perangkat?: String
  last_ping_status?: String
  mac_address?: String
  ip_static?: String
  product_id?: String
}

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  download_speed_mbps?: number
  upload_speed_mbps?: number
  created_at?: string
  updated_at?: string
}

export type NetworkDevice = {
  id: string
  customer_id: string
  assets_id?: string
  customer_installation_id?: string
  switch_id?: string
  port_number?: string
  remote_port?: string
  eth_port?: string
  kepemilikan_perangkat: string
  status_perangkat: string
  last_ping_status: string
  last_ping_timestamp?: string
  mac_address?: string
  ip_static?: string
  product_id?: string
  product?: Product
  created_at: string
  updated_at: string
}