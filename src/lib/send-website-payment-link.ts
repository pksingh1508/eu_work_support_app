import { env } from "@/lib/env";

export async function sendWebsitePaymentLink(email: string) {
  const response = await fetch(
    "https://euworksupport.eu/api/send-payment-link",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.xApiKey,
      },
      body: JSON.stringify({
        email,
        name: "Welcome",
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to send verification email.");
  }
}
