export interface Item {
  id: string;
  name: string;
  default_unit: string;
  category?: string;
  description?: string;
  asset_id?: string;
  asset?: {
    id: string;
    brand: string;
    model: string;
    type: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequest {
  name: string;
  default_unit: "PCS" | "M" | "KG" | "BOX" | "ROLL";
  category?: string;
  description?: string;
  asset_id?: string;
}

export interface UpdateItemRequest extends CreateItemRequest {
  id: string;
}

export interface GetItemsRequest {
  category?: string;
  asset_id?: string;
}

