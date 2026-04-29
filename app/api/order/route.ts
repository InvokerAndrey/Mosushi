import { NextResponse } from "next/server";
import { sushiMenuItems } from "@/data/sushiMenu";

const DELIVERY_FEE = 6;
const FREE_DELIVERY_THRESHOLD = 40;

type PaymentMethod = "CASH" | "CARD";

type OrderRequestBody = {
  orderType: "pickup" | "delivery";
  totalPrice: number;
  cartItems: Record<string, number>;
  pickup: {
    name: string;
    phoneNumber: string;
    orderTime: "asap" | "specific";
    scheduledTime?: string;
    comment?: string;
  };
  delivery: {
    name: string;
    phoneNumber: string;
    address: string;
    paymentMethod: PaymentMethod | "";
    changeAmount?: string;
    noChange?: boolean;
    orderTime: "asap" | "specific";
    scheduledTime?: string;
    comment?: string;
  };
};

function escHtml(text: string): string {
  // Build entity strings at runtime to avoid source-encoding issues
  const amp = String.fromCharCode(38); // &
  return text
    .replace(/&/g, amp + "amp;")
    .replace(/</g, amp + "lt;")
    .replace(/>/g, amp + "gt;");
}

function formatScheduledTime(raw: string): string {
  // Input: "YYYY-MM-DDTHH:MM" → "DD.MM.YYYY HH:MM"
  try {
    const [datePart, timePart] = raw.split("T");
    const [year, month, day] = datePart.split("-");
    return `${day}.${month}.${year} ${timePart}`;
  } catch {
    return raw;
  }
}

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

  const { orderType, cartItems, pickup, delivery } = body;

  if (orderType !== "pickup" && orderType !== "delivery") {
    return NextResponse.json({ message: "Invalid order type." }, { status: 400 });
  }

  if (!cartItems || typeof cartItems !== "object") {
    return NextResponse.json({ message: "Cart is missing." }, { status: 400 });
  }

  if (!pickup || !delivery) {
    return NextResponse.json({ message: "Checkout data is missing." }, { status: 400 });
  }

  // Build line items and calculate subtotal server-side
  const lineItems = sushiMenuItems
    .map((item) => {
      const quantity = cartItems[item.id];
      if (!Number.isInteger(quantity) || quantity <= 0) return null;
      return { name: item.name, quantity, price: item.price, lineTotal: item.price * quantity };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (lineItems.length === 0) {
    return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = orderType === "delivery" && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + deliveryFee;

  if (Math.abs(grandTotal - body.totalPrice) > 0.01) {
    return NextResponse.json({ message: "Invalid total price." }, { status: 400 });
  }

  // Validate required fields per order type
  if (orderType === "pickup") {
    if (!pickup.name?.trim() || !pickup.phoneNumber?.trim()) {
      return NextResponse.json({ message: "Pickup name and phone are required." }, { status: 400 });
    }
  }

  if (orderType === "delivery") {
    if (!delivery.name?.trim() || !delivery.phoneNumber?.trim() || !delivery.address?.trim()) {
      return NextResponse.json({ message: "Delivery name, phone and address are required." }, { status: 400 });
    }
    if (delivery.paymentMethod !== "CASH" && delivery.paymentMethod !== "CARD") {
      return NextResponse.json({ message: "Invalid payment method." }, { status: 400 });
    }
  }

  // Build Telegram HTML message
  const lines: string[] = [];

  lines.push(`🧾 <b>Новый заказ #</b>`);
  lines.push("");

  if (orderType === "pickup") {
    lines.push(`👤 <b>Имя:</b> ${escHtml(pickup.name.trim())}`);
    lines.push(`📞 <b>Телефон:</b> ${escHtml(pickup.phoneNumber.trim())}`);
    lines.push("");
    lines.push(`🏪 <b>Тип:</b> Самовывоз`);
    lines.push("");

    const timeLabel =
      pickup.orderTime === "specific" && pickup.scheduledTime
        ? `На ${formatScheduledTime(pickup.scheduledTime)}`
        : "Через 30 минут";
    lines.push(`⏰ <b>Время:</b> ${timeLabel}`);
  } else {
    lines.push(`👤 <b>Имя:</b> ${escHtml(delivery.name.trim())}`);
    lines.push(`📞 <b>Телефон:</b> ${escHtml(delivery.phoneNumber.trim())}`);
    lines.push("");
    lines.push(`🚚 <b>Тип:</b> Доставка`);
    lines.push(`📍 <b>Адрес:</b> ${escHtml(delivery.address.trim())}`);
    lines.push("");

    const paymentLabel = delivery.paymentMethod === "CASH" ? "Наличные" : "Карта";
    lines.push(`💳 <b>Оплата:</b> ${paymentLabel}`);

    if (delivery.paymentMethod === "CASH") {
      if (delivery.noChange) {
        lines.push(`💰 <b>Сдача:</b> Без сдачи`);
      } else if (delivery.changeAmount?.trim()) {
        lines.push(`💰 <b>Сдача с:</b> ${escHtml(delivery.changeAmount.trim())} BYN`);
      }
    }
    lines.push("");

    const timeLabel =
      delivery.orderTime === "specific" && delivery.scheduledTime
        ? `На ${formatScheduledTime(delivery.scheduledTime)}`
        : "В течение часа";
    lines.push(`⏰ <b>Время:</b> ${timeLabel}`);
  }

  lines.push("");
  lines.push(`🍣 <b>Заказ:</b>`);
  lineItems.forEach((item) => {
    lines.push(`• ${escHtml(item.name)} x${item.quantity} — ${item.lineTotal.toFixed(2)} BYN`);
  });

  lines.push("");
  if (orderType === "delivery") {
    const feeLabel = deliveryFee === 0 ? "Бесплатно" : `${deliveryFee.toFixed(2)} BYN`;
    lines.push(`🚚 <b>Доставка:</b> ${feeLabel}`);
  }
  lines.push(`💵 <b>Итого:</b> ${grandTotal.toFixed(2)} BYN`);

  const comment =
    orderType === "pickup" ? pickup.comment?.trim() : delivery.comment?.trim();

  if (comment) {
    lines.push("");
    lines.push(`💬 <b>Комментарий:</b>`);
    lines.push(escHtml(comment));
  }

  const messageText = lines.join("\n");

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML"
      })
    }
  );

  if (!telegramResponse.ok) {
    return NextResponse.json({ message: "Failed to send order to Telegram." }, { status: 502 });
  }

  return NextResponse.json({ message: "Order sent successfully." });
}
