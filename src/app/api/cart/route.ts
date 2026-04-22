import { NextRequest, NextResponse } from "next/server";
import {
  addCartLines,
  clearCartLines,
  createCart,
  getCart,
  removeCartLine,
  updateCartLineQuantity,
} from "@/lib/shopify";

type CartRequestBody = {
  action: "add" | "get" | "setQuantity" | "remove" | "clear";
  cartId?: string;
  merchandiseId?: string;
  quantity?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CartRequestBody;

    if (body.action === "get") {
      if (!body.cartId) {
        return NextResponse.json({ error: "cartId is required" }, { status: 400 });
      }
      const cart = await getCart(body.cartId);
      return NextResponse.json(cart);
    }

    if (body.action === "clear") {
      if (!body.cartId) {
        return NextResponse.json({ error: "cartId is required" }, { status: 400 });
      }

      const cart = await clearCartLines(body.cartId);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    if (!body.cartId && body.action !== "add") {
      return NextResponse.json({ error: "cartId is required" }, { status: 400 });
    }

    if (!body.merchandiseId) {
      return NextResponse.json(
        { error: "merchandiseId is required for this action" },
        { status: 400 },
      );
    }

    if (body.action === "setQuantity") {
      const quantity = Math.max(1, body.quantity ?? 1);
      const cart = await updateCartLineQuantity(body.cartId!, body.merchandiseId, quantity);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    if (body.action === "remove") {
      const cart = await removeCartLine(body.cartId!, body.merchandiseId);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    const quantity = Math.max(1, body.quantity ?? 1);

    const cart = body.cartId
      ? await addCartLines(body.cartId, body.merchandiseId, quantity)
      : await createCart(body.merchandiseId, quantity);

    return NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      totalQuantity: cart.totalQuantity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cart error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
