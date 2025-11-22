import type { CreateAssetItemRequest } from "@/types/requests/asset-item";
import { defaultStringValidation } from "@/utilities/constants";
import { object, string, type InferType } from "yup";

export const assetItemSchema = object({
  asset_id: defaultStringValidation(),
  mac_address: defaultStringValidation(),
  status: defaultStringValidation(),
});

export type AssetItemSchema = InferType<typeof assetItemSchema>;

export const assetItem: CreateAssetItemRequest = {
  asset_id: "",
  mac_address: "",
  serial_number: "",
  mac_sticker: "",
  status: "in_stock",
  company_id: undefined,
  site: "",
};

export const assetItemStatus = [
  { label: "In Stock", value: "in_stock" },
  { label: "In Use", value: "in_use" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Damaged", value: "damaged" },
  { label: "Retired", value: "retired" },
];

export const defaultAssetItems = ref<any[]>([])
