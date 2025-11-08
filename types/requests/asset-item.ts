export type CreateAssetItemRequest = {
  asset_id: string;
  mac_address: string;
  serial_number?: string;
  status: 'in_stock' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
  company_id?: string;
  site?: string;
}

export type AssetItem = {
  id: string;
  asset_id: string;
  mac_address: string;
  serial_number?: string;
  status: 'in_stock' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
  company_id?: string;
  site?: string;
  created_at: string;
  updated_at: string;
  asset?: {
    id: string;
    type: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

