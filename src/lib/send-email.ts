import { env } from "@/lib/env";

const EMAIL_LINK_ENDPOINT = "https://euworksupport.eu/api/send-email";
const EMAIL_LINK_TIMEOUT_MS = 15000;

export async function sendWebsitePaymentLink(email: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, EMAIL_LINK_TIMEOUT_MS);

  try {
    const response = await fetch(EMAIL_LINK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.xApiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        email,
        name: "Welcome",
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(responseText || "Unable to send email.");
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Email request timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
