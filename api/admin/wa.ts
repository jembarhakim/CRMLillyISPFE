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

      if (!response.ok) {
        // Try parse JSON if available, otherwise raw text
        let errorMessage = `Failed to send WhatsApp message`;
        try {
          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          // Ignore parsing errors and use default message
        }
        throw new Error(errorMessage);
      }

      // Happy path: prefer JSON; if server returns text, wrap it
      try {
        return await response.json();
      } catch {
        const text = await response.text();
        return { message: text } as any;
      }
    },
  };
};
