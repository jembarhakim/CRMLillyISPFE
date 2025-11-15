import type { CreateInvoiceRequest, UpdateStatusInvoiceRequest } from "@/types/requests/invoice";


export const WhatsappApi = () => {
  const wa = useWaHost();
  return {
    sendWhatsapp: async (
      data: {
        number:string,
        message:string
      }
    ) => {
      // Transform the data to match backend API format
      const requestData = {
        to: data.number,
        message: data.message
      };
      
      const response = await fetch(`${wa}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const contentType = response.headers.get("content-type") || "";
      
      // Parse response first to check for error status
      let responseData: any;
      try {
        if (contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = { message: text };
        }
      } catch {
        // If parsing fails, treat as error
        throw new Error(`Failed to parse response from WhatsApp API`);
      }

      // Check if response indicates error (even if HTTP status is 200)
      if (responseData && (responseData.status === 'error' || responseData.status === false)) {
        const errorMessage = responseData.message || responseData.error || 'Failed to send WhatsApp message';
        throw new Error(errorMessage);
      }

      // Check HTTP status code
      if (!response.ok) {
        const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}: Failed to send WhatsApp message`;
        throw new Error(errorMessage);
      }

      // Return successful response
      return responseData;
    },
  };
};
