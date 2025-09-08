export type CreateCustomerRequest = {
  type_of_service: String
  email: String
  name: String
  company_id: String
  gender: String
  card_identition: String
  no_identition: Number
  area_id: String
  phone: String
  address: String
  latitude: Number
  longitude: Number
  password: String
  product_id: String
  job: String
}

export type UpdateCustomerRequest = {
  name?: String
  email?: String
  phone?: String
  address?: String
  company?: String
}

export type CreateCustomerInstallationRequest = {
  customer_id: String,
  technician_id: String,
  date: String,
  description:  String,
  image_ids: string[] ,
  previews: String[] ,
  selectedImage: String,
  showModal: boolean,
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