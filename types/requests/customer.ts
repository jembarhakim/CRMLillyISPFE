export type CreateCustomerRequest = {
  name: String
  alias?: String
  address: String
  area_id: String
  phone: String
  latitude: Number
  longitude: Number
  service_request_date: String
  proposed_package: String
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
}