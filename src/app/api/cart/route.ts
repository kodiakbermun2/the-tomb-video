import { NextRequest, NextResponse } from "next/server";
import {
  addCartLines,
  clearCartLines,
  createCart,
  getCart,
  removeCartLine,
  updateCartLineQuantity,
} from "@/lib/shopify";
import { EdgeRateLimitError, enforceEdgeRateLimit } from "@/lib/cloudflare-rate-limit";

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
const CSRF_COOKIE_NAME = "tomb_csrf_token";

class ValidationError extends Error {}

function secureCompareString(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    const leftByte = leftBytes[index] ?? 0;
    const rightByte = rightBytes[index] ?? 0;
    mismatch |= leftByte ^ rightByte;
  }

  return mismatch === 0;
}

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

function validateCsrfToken(request: NextRequest) {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken || !secureCompareString(headerToken, cookieToken)) {
    throw new ValidationError("Invalid CSRF token.");
  }
}

function isAllowedOrigin(request: NextRequest, origin: string) {
  try {
    const originUrl = new URL(origin);
    const candidateHosts = [
      request.nextUrl.host,
      request.headers.get("host"),
      request.headers.get("x-forwarded-host"),
    ].filter((value): value is string => Boolean(value));

    return candidateHosts.includes(originUrl.host);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfActorKey = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    await enforceEdgeRateLimit({
      request,
      binding: "CART_RATE_LIMITER",
      scope: "api-cart",
      actorHint: csrfActorKey,
      failureMessage: "Too many cart requests. Please retry shortly.",
    });

    const origin = request.headers.get("origin");
    if (origin && !isAllowedOrigin(request, origin)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    validateCsrfToken(request);

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

      return NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        lines: cart.lines,
      });
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

    if (error instanceof EdgeRateLimitError) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    if (message.includes("Unable to find Shopify cart line")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
