import { NextResponse } from "next/server";
import { sushiMenuItems } from "@/data/sushiMenu";

type PaymentMethod = "CASH" | "CARD";

type OrderRequestBody = {
  orderType: "pickup" | "delivery";
  totalPrice: number;
  cartItems: Record<string, number>;
  pickup: {
    name: string;
    phoneNumber: string;
    comment?: string;
  };
  delivery: {
    name: string;
    phoneNumber: string;
    address: string;
    paymentMethod: PaymentMethod | "OTHER";
    comment?: string;
  };
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

  const orderType = body.orderType;
  const cartItems = body.cartItems;
  const pickup = body.pickup;
  const delivery = body.delivery;

  if (orderType !== "pickup" && orderType !== "delivery") {
    return NextResponse.json({ message: "Invalid order type." }, { status: 400 });
  }

  if (!cartItems || typeof cartItems !== "object") {
    return NextResponse.json({ message: "Cart is missing." }, { status: 400 });
  }

  if (!pickup || !delivery) {
    return NextResponse.json({ message: "Checkout data is missing." }, { status: 400 });
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

  if (Math.abs(totalPrice - body.totalPrice) > 0.01) {
    return NextResponse.json({ message: "Invalid total price." }, { status: 400 });
  }

  const pickupName = pickup.name?.trim();
  const pickupPhoneNumber = pickup.phoneNumber?.trim();
  const pickupComment = pickup.comment?.trim() ?? "";

  const deliveryName = delivery.name?.trim();
  const deliveryPhoneNumber = delivery.phoneNumber?.trim();
  const deliveryAddress = delivery.address?.trim();
  const deliveryPaymentMethod = delivery.paymentMethod;
  const deliveryComment = delivery.comment?.trim() ?? "";

  if (orderType === "pickup" && (!pickupName || !pickupPhoneNumber)) {
    return NextResponse.json({ message: "Pickup name and phone are required." }, { status: 400 });
  }

  if (orderType === "delivery") {
    if (!deliveryName || !deliveryPhoneNumber || !deliveryAddress) {
      return NextResponse.json({ message: "Delivery name, phone and address are required." }, { status: 400 });
    }

    if (deliveryPaymentMethod !== "OTHER" && !isValidPaymentMethod(deliveryPaymentMethod)) {
      return NextResponse.json({ message: "Invalid payment method." }, { status: 400 });
    }
  }

  const itemsText = lineItems
    .map((item) => `- ${item.name} x${item.quantity} = $${item.lineTotal.toFixed(2)}`)
    .join("\n");

  const orderDetails =
    orderType === "pickup"
      ? [
          "Type: Pickup",
          `Name: ${pickupName}`,
          `Phone: ${pickupPhoneNumber}`,
          `Comment: ${pickupComment || "-"}`
        ]
      : [
          "Type: Delivery",
          `Name: ${deliveryName}`,
          `Phone: ${deliveryPhoneNumber}`,
          `Address: ${deliveryAddress}`,
          `Payment: ${deliveryPaymentMethod}`,
          `Comment: ${deliveryComment || "-"}`
        ];

  const messageText = [
    "New M\u00F5 Sushi order",
    "",
    ...orderDetails,
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
