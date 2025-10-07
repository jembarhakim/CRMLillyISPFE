// Purchase Stock Request Types
export interface PurchaseItem {
  asset_id: string;
  serial_number?: string;
  qty_masuk: number;
  harga_satuan: number;
  sub_total: number;
}

export interface CreatePurchaseRequest {
  date: string;
  notes?: string;
  items: PurchaseItem[];
}

// Asset Deployment Request Types
export interface CreateDeploymentRequest {
  asset_item_id: string;
  transaction_type: 'in' | 'out';
  notes?: string;
  customer_installation_id?: string;
  trouble_ticket_id?: number;
}

// Inventory Status Query Types
export interface InventoryStatusRequest {
  brand?: string;
  model?: string;
  status?: string;
}

// Response Types
export interface AssetItemDetail {
  id: string;
  mac_address: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStatusResponse {
  brand: string;
  model: string;
  status: string;
  count: number;
  items: AssetItemDetail[];
}

export interface PurchaseResponse {
  id_masuk: string;
  date: string;
  total_items: number;
  total_amount: number;
  created_items: number;
}

export interface DeploymentResponse {
  id: string;
  asset_item_id: string;
  transaction_type: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}
