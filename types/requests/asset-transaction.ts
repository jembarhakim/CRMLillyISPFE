export type CreateAssetTransactionRequest = {
  customer_installation_id: string;
  asset_id: string;
  transaction_type: 'out' | 'in';
  quantity: number;
  notes?: string;
  transaction_date?: string;
}

export type AssetTransaction = {
  id: string;
  customer_installation_id: string;
  asset_id: string;
  transaction_type: 'out' | 'in';
  quantity: number;
  notes?: string;
  transaction_date: string;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    type: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  customer_installation?: {
    id: string;
    customer_id: string;
    installation_type: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

