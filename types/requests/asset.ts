export type CreateAssetRequest = {
  type: string,
  brand: string,
  model: string,
  serial_number: string,
  date: Date,
  company_id?: string,
  price: number,
  description: string,
  site: string,
  }