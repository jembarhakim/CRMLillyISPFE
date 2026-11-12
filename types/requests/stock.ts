export type StockKind = "in" | "out" | "transfer_in" | "transfer_out";

export interface StockBalanceItem {
  item_id: string;
  item_name: string;
  unit: string;
  holder_id: string | null; // null = warehouse (Gudang Utama)
  holder_name: string;
  balance: number;
}

export interface StockMutationItem {
  ref: string;
  kind: StockKind;
  transfer_ref?: string;
  date: string; // YYYY-MM-DD
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number; // always positive; direction is from kind
  holder_id: string | null; // null = warehouse
  holder_name: string;
  recorded_by_name: string;
  notes?: string;
  item_notes?: string;
  created_at: string;
}

export interface StockMutationsResponse {
  total: number;
  limit: number;
  offset: number;
  items: StockMutationItem[];
}

export interface GetStockBalanceParams {
  item_id?: string;
  holder_id?: string; // empty = all, "warehouse" = warehouse, else user id
  unit?: string;
  include_zero?: boolean;
}

export interface GetStockMutationsParams {
  item_id?: string;
  holder_id?: string;
  kind?: StockKind;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
