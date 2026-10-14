export const mikrotikAdminApi = () => {
  const api = useApiHost();
  const authStore = useAuthStore();

  const requestRouterOS = async <T>(
    path: string,
    method = "GET",
    body?: Record<string, unknown>,
  ): Promise<T> => {
    const token = authStore.getToken;
    if (!token || token === "null" || token === "undefined") {
      throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
    }

    const response = await fetch(`${api}/api/admin/mikrotik/routeros${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Permintaan RouterOS API gagal");
    }
    return result as T;
  };

  return {
    // Connection management
    connect: async (config: { host: string; port: number; username: string; password: string }) => {
      const response = await fetch(`${api}/api/admin/mikrotik/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection failed');
      }
      return response.json();
    },

    disconnect: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Disconnection failed');
      }
      return response.json();
    },

    getStatus: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get status');
      }
      return response.json();
    },

    // Hotspot IP binding management
    setHotspotIPBindingType: async (macAddress: string, type: 'regular' | 'bypassed') => {
      const response = await fetch(`${api}/api/admin/mikrotik/hotspot/ip-binding/set-type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify({
          mac_address: macAddress,
          type: type
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set IP binding type');
      }
      return response.json();
    },

    getHotspotIPBindings: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/hotspot/ip-bindings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get IP bindings');
      }
      return response.json();
    },

    getHotspotIPBindingByMAC: async (macAddress: string) => {
      const response = await fetch(`${api}/api/admin/mikrotik/hotspot/ip-binding/${macAddress}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get IP binding');
      }
      return response.json();
    },

    // Execute custom command
    executeCommand: async (command: string) => {
      const response = await fetch(`${api}/api/admin/mikrotik/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify({ command }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Command execution failed');
      }
      return response.json();
    },

    // Get DHCP lease for sticker MAC address
    getDHCPLease: async (stickerMac: string) => {
      const response = await fetch(`${api}/api/admin/mikrotik/dhcp-lease`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify({ sticker_mac: stickerMac }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get DHCP lease');
      }
      return response.json();
    },

    routerOS: {
      connect: (config: {
        host: string;
        port: number;
        username: string;
        password: string;
        use_tls: boolean;
      }) => requestRouterOS("/connect", "POST", config),
      disconnect: () => requestRouterOS("/disconnect", "POST"),
      getStatus: () => requestRouterOS("/status"),
      listDudeDevices: () => requestRouterOS("/dude/devices"),
      listDudeServices: () => requestRouterOS("/dude/services"),
    },
  };
};
