import type { CreateNetworkDeviceRequest } from "@/types/requests/customer";

export const networkDeviceAdminApi = () => {
  const api = useApiHost();
  return {
    getNetworkDevice: async (deviceId: string) => {
      const response = await fetch(`${api}/api/admin/network-device/${deviceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch network device');
      }
      return response.json();
    },

    getAllNetworkDevices: async () => {
      const response = await fetch(`${api}/api/admin/network-device`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch network devices');
      }
      return response.json();
    },

    createNetworkDevice: async (data: CreateNetworkDeviceRequest) => {
      const response = await fetch(`${api}/api/admin/network-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create network device');
      }
      return response.json();
    },

    editNetworkDevice: async (deviceId: string, data: CreateNetworkDeviceRequest) => {
      const response = await fetch(`${api}/api/admin/network-device/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update network device');
      }
      return response.json();
    },

    deleteNetworkDevice: async (deviceId: string) => {
      const response = await fetch(`${api}/api/admin/network-device/${deviceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete network device');
      }
      return response.json();
    },

    getNetworkDevicesByCustomer: async (customerId: string) => {
      const response = await fetch(`${api}/api/admin/network-device/customer/${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customer network devices');
      }
      return response.json();
    },
  };
};
