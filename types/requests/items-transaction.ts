export type CreateItemsTransactionDetail = {
  id_items: string;
  quantity: number;
  unit: string;
  harga_satuan?: number; // Required for 'in', optional for 'out'
  notes?: string;
}

export type CreateItemsTransactionRequest = {
  transaction_type: 'out' | 'in';
  date: string; // YYYY-MM-DD format
  notes?: string;
  items: CreateItemsTransactionDetail[];
}

export type ItemsTransactionDetailResponse = {
  id_items: string;
  asset?: {
    id: string;
    brand: string;
    model: string;
    type: string;
    serial_number: string;
  };
  quantity: number;
  unit: string;
  harga_satuan?: number;
  sub_total?: number;
  notes?: string;
  created_at: string;
}

export type ItemsTransactionResponse = {
  id: string;
  transaction_type: 'out' | 'in';
  date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: ItemsTransactionDetailResponse[];
  user?: {
    id: string;
    name: string;
  };
}

