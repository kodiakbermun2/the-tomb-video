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

const VALID_ACTIONS = new Set<CartRequestBody["action"]>([
  "add",
  "get",
  "setQuantity",
  "remove",
  "clear",
]);

const CART_ID_PATTERN = /^gid:\/\/shopify\/Cart\/.+/;
const MERCHANDISE_ID_PATTERN = /^gid:\/\/shopify\/ProductVariant\/.+/;

class ValidationError extends Error {}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function clampCartQuantity(value: unknown) {
  if (!isSafeInteger(value)) {
    return 1;
  }

  return Math.max(1, Math.min(25, value));
}

function ensureValidId(value: string, pattern: RegExp, label: string) {
  if (!pattern.test(value)) {
    throw new ValidationError(`Invalid ${label}.`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const body = (await request.json()) as Partial<CartRequestBody>;

    if (!body.action || !VALID_ACTIONS.has(body.action as CartRequestBody["action"])) {
      return NextResponse.json({ error: "Invalid cart action." }, { status: 400 });
    }

    const action = body.action as CartRequestBody["action"];

    if (action === "get") {
      if (!body.cartId) {
        return NextResponse.json({ error: "cartId is required" }, { status: 400 });
      }

      ensureValidId(body.cartId, CART_ID_PATTERN, "cartId");

      const cart = await getCart(body.cartId);
      if (!cart) {
        return NextResponse.json({ error: "Cart not found." }, { status: 404 });
      }

      return NextResponse.json(cart);
    }

    if (action === "clear") {
      if (!body.cartId) {
        return NextResponse.json({ error: "cartId is required" }, { status: 400 });
      }

      ensureValidId(body.cartId, CART_ID_PATTERN, "cartId");

      const cart = await clearCartLines(body.cartId);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    if (!body.cartId && action !== "add") {
      return NextResponse.json({ error: "cartId is required" }, { status: 400 });
    }

    if (body.cartId) {
      ensureValidId(body.cartId, CART_ID_PATTERN, "cartId");
    }

    if (!body.merchandiseId) {
      return NextResponse.json(
        { error: "merchandiseId is required for this action" },
        { status: 400 },
      );
    }

    ensureValidId(body.merchandiseId, MERCHANDISE_ID_PATTERN, "merchandiseId");

    if (action === "setQuantity") {
      const quantity = clampCartQuantity(body.quantity);
      const cart = await updateCartLineQuantity(body.cartId!, body.merchandiseId, quantity);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    if (action === "remove") {
      const cart = await removeCartLine(body.cartId!, body.merchandiseId);
      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
      });
    }

    const quantity = clampCartQuantity(body.quantity);

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

    if (error instanceof ValidationError || message.startsWith("Invalid ")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("Unable to find Shopify cart line")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
