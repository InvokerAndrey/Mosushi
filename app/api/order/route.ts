import { NextResponse } from "next/server";
import { sushiMenuItems } from "@/data/sushiMenu";

type PaymentMethod = "CASH" | "CARD";

type OrderRequestBody = {
  name: string;
  phoneNumber: string;
  address: string;
  paymentMethod: PaymentMethod;
  cartItems: Record<string, number>;
};

const isValidPaymentMethod = (value: string): value is PaymentMethod => {
  return value === "CASH" || value === "CARD";
};

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { message: "Telegram environment variables are missing." },
      { status: 500 }
    );
  }

  let body: OrderRequestBody;

  try {
    body = (await request.json()) as OrderRequestBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const phoneNumber = body.phoneNumber?.trim();
  const address = body.address?.trim();
  const paymentMethod = body.paymentMethod;
  const cartItems = body.cartItems;

  if (!name || !phoneNumber || !address) {
    return NextResponse.json({ message: "All checkout fields are required." }, { status: 400 });
  }

  if (!isValidPaymentMethod(paymentMethod)) {
    return NextResponse.json({ message: "Invalid payment method." }, { status: 400 });
  }

  if (!cartItems || typeof cartItems !== "object") {
    return NextResponse.json({ message: "Cart is missing." }, { status: 400 });
  }

  const lineItems = sushiMenuItems
    .map((item) => {
      const quantity = cartItems[item.id];
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }

      return {
        name: item.name,
        quantity,
        lineTotal: item.price * quantity
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (lineItems.length === 0) {
    return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
  }

  const totalPrice = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const itemsText = lineItems
    .map((item) => `- ${item.name} x${item.quantity} = $${item.lineTotal.toFixed(2)}`)
    .join("\n");

  const messageText = [
    "New M\u00F5 Sushi order",
    "",
    `Name: ${name}`,
    `Phone: ${phoneNumber}`,
    `Address: ${address}`,
    `Payment: ${paymentMethod}`,
    "",
    "Items:",
    itemsText,
    "",
    `Total: $${totalPrice.toFixed(2)}`
  ].join("\n");

  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: messageText
    })
  });

  if (!telegramResponse.ok) {
    return NextResponse.json({ message: "Failed to send order to Telegram." }, { status: 502 });
  }

  return NextResponse.json({ message: "Order sent successfully." });
}
