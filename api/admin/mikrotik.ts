export const mikrotikAdminApi = () => {
  const api = useApiHost();
  const authStore = useAuthStore();

  const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
    const responseText = await response.text();
    let payload: unknown;

    try {
      payload = JSON.parse(responseText);
    } catch {
      const detail = responseText.trim().slice(0, 400);
      throw new Error(
        `${fallbackMessage} (HTTP ${response.status}): ${
          detail || "server returned an empty, non-JSON response"
        }`,
      );
    }

    const result =
      typeof payload === "object" && payload !== null
        ? (payload as { success?: boolean; message?: string } & Record<string, unknown>)
        : {};
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `${fallbackMessage} (HTTP ${response.status})`);
    }
    return result as T;
  };

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
    return parseResponse<T>(response, `Permintaan RouterOS API ${method} ${path} gagal`);
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
      return parseResponse(response, "Gagal menghubungkan MikroTik");
    },

    disconnect: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      return parseResponse(response, "Gagal memutus koneksi MikroTik");
    },

    getStatus: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      return parseResponse(response, "Gagal membaca status MikroTik");
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
      return parseResponse(response, "Gagal mengubah tipe IP Binding");
    },

    getHotspotIPBindings: async () => {
      const response = await fetch(`${api}/api/admin/mikrotik/hotspot/ip-bindings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      return parseResponse(response, "Gagal membaca IP Binding");
    },

    getHotspotIPBindingByMAC: async (macAddress: string) => {
      const response = await fetch(`${api}/api/admin/mikrotik/hotspot/ip-binding/${macAddress}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });
      return parseResponse(response, "Gagal membaca IP Binding berdasarkan MAC");
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
      return parseResponse(response, "Gagal menjalankan perintah MikroTik");
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
      return parseResponse(response, "Gagal membaca DHCP lease");
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
      listHotspotUsers: () => requestRouterOS("/hotspot/users"),
      listHotspotProfiles: () => requestRouterOS("/hotspot/profiles"),
      listHotspotActiveSessions: () => requestRouterOS("/hotspot/active"),
      resolveHotspotDeviceBindings: (addresses: string[]) =>
        requestRouterOS("/hotspot/device-bindings/resolve", "POST", { addresses }),
      setHotspotDeviceBindingType: (address: string, type: "blocked" | "restore") =>
        requestRouterOS("/hotspot/device-bindings/set-type", "POST", { address, type }),
      createHotspotUser: (input: {
        name: string;
        password: string;
        profile?: string;
        comment?: string;
      }) => requestRouterOS("/hotspot/users", "POST", input),
      updateHotspotUser: (name: string, input: {
        password?: string;
        profile?: string;
        address?: string;
        limit_uptime?: string;
        comment?: string;
        disabled?: boolean;
      }) => requestRouterOS(`/hotspot/users/${encodeURIComponent(name)}`, "PUT", input),
      deleteHotspotUser: (name: string) =>
        requestRouterOS(`/hotspot/users/${encodeURIComponent(name)}`, "DELETE"),
      kickHotspotUser: (name: string) =>
        requestRouterOS(`/hotspot/active/${encodeURIComponent(name)}/kick`, "POST"),
    },
  };
};
