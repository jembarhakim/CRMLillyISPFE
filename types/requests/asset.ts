export type CreateAssetRequest = {
  type: string,
  brand: string,
  model: string,
  serial_number: string,
  date: Date,
  company_id?: string,
  quantity: number,
  status: string,
  price: number,
  description: string,
  status_in_out: string,
  }