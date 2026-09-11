import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

export async function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) {
    return paddleInstance;
  }

  const token =  (import.meta as any).env?.VITE_PADDLE as string || ""


  if (!token) {
    throw new Error("Paddle client token is missing");
  }

  paddleInstance = await initializePaddle({
    environment: "sandbox",
    token,
  });

  return paddleInstance;
}

export async function openCheckout(priceId: string, userId?: any) {
  console.log("[Paddle] Price ID:", priceId);

  if (!priceId) {
    throw new Error("Paddle Price ID is missing");
  }

  if (!priceId.startsWith("pri_")) {
    throw new Error(`Invalid Paddle Price ID: ${priceId}`);
  }

  const paddle = await getPaddle();

  if (!paddle) {
    throw new Error("Paddle failed to initialize");
  }

  console.log("[Paddle] Opening checkout...");

  paddle.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
    customData: {
      user_id: userId,
    },
  });
}