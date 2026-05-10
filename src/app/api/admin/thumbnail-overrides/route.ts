import { NextResponse } from "next/server";
import { EdgeRateLimitError, enforceEdgeRateLimit } from "@/lib/cloudflare-rate-limit";
import {
  getAllThumbnailOverrides,
  getThumbnailAdminKey,
  removeThumbnailOverride,
  setThumbnailOverride,
} from "@/lib/thumbnail-overrides";

export const dynamic = "force-dynamic";

function isAllowedOrigin(request: Request, origin: string) {
  try {
    const url = new URL(request.url);
    const originUrl = new URL(origin);
    return originUrl.host === url.host;
  } catch {
    return false;
  }
}

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

async function ensureAdmin(request: Request) {
  await enforceEdgeRateLimit({
    request,
    binding: "ADMIN_RATE_LIMITER",
    scope: "api-admin-thumbnail-overrides",
    actorHint: request.headers.get("x-admin-key") || undefined,
    failureMessage: "Too many admin requests. Please retry shortly.",
  });

  const origin = request.headers.get("origin");
  if (origin && !isAllowedOrigin(request, origin)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const configuredKey = await getThumbnailAdminKey();
  if (!configuredKey) {
    return NextResponse.json(
      { error: "THUMBNAIL_ADMIN_KEY is not configured" },
      { status: 500 },
    );
  }

  const providedKey = request.headers.get("x-admin-key")?.trim() || "";
  if (!providedKey || !secureCompareString(providedKey, configuredKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const authError = await ensureAdmin(request);
    if (authError) {
      return authError;
    }

    const overrides = await getAllThumbnailOverrides();
    return NextResponse.json({ overrides });
  } catch (error) {
    if (error instanceof EdgeRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await ensureAdmin(request);
    if (authError) {
      return authError;
    }

    const body = (await request.json()) as {
      handle?: string;
      x?: number;
      y?: number;
      zoom?: number;
    };

    if (!body.handle) {
      return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    if (
      typeof body.x !== "number" ||
      typeof body.y !== "number" ||
      typeof body.zoom !== "number"
    ) {
      return NextResponse.json({ error: "x, y, and zoom must be numbers" }, { status: 400 });
    }

    const override = await setThumbnailOverride(body.handle, {
      x: body.x,
      y: body.y,
      zoom: body.zoom,
    });

    return NextResponse.json({ override });
  } catch (error) {
    if (error instanceof EdgeRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await ensureAdmin(request);
    if (authError) {
      return authError;
    }

    const body = (await request.json()) as { handle?: string };
    if (!body.handle) {
      return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    await removeThumbnailOverride(body.handle);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EdgeRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
