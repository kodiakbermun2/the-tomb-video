import { NextResponse } from "next/server";
import { getSharedKvNamespace } from "@/lib/cloudflare-kv";
import { getProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

const MONITOR_STATE_KEY = "ops:shopify-token-health:v1";

type HealthStatus = "ok" | "auth_error" | "other_error";

type TokenHealthState = {
  lastStatus: HealthStatus;
  lastCheckedAt: string;
  lastAuthSpikeAt: string | null;
};

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

async function validateMonitorKey(request: Request) {
  const configured = process.env.MONITORING_CRON_KEY?.trim() || "";
  if (!configured) {
    return NextResponse.json({ error: "MONITORING_CRON_KEY is not configured." }, { status: 500 });
  }

  const provided = request.headers.get("x-monitor-key")?.trim() || "";
  if (!provided || !secureCompareString(provided, configured)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function classifyShopifyError(error: unknown): { status: HealthStatus; message: string } {
  const message = error instanceof Error ? error.message : "Unknown Shopify error.";

  if (/status\s+401|status\s+403/i.test(message)) {
    return {
      status: "auth_error",
      message,
    };
  }

  return {
    status: "other_error",
    message,
  };
}

async function readPreviousState() {
  const kv = await getSharedKvNamespace();
  if (!kv) {
    return { kv: undefined, state: null as TokenHealthState | null };
  }

  const raw = await kv.get(MONITOR_STATE_KEY, "json");
  if (!raw || typeof raw !== "object") {
    return { kv, state: null as TokenHealthState | null };
  }

  const candidate = raw as Partial<TokenHealthState>;
  if (
    (candidate.lastStatus !== "ok" &&
      candidate.lastStatus !== "auth_error" &&
      candidate.lastStatus !== "other_error") ||
    typeof candidate.lastCheckedAt !== "string"
  ) {
    return { kv, state: null as TokenHealthState | null };
  }

  return {
    kv,
    state: {
      lastStatus: candidate.lastStatus,
      lastCheckedAt: candidate.lastCheckedAt,
      lastAuthSpikeAt: typeof candidate.lastAuthSpikeAt === "string" ? candidate.lastAuthSpikeAt : null,
    },
  };
}

export async function GET(request: Request) {
  const authError = await validateMonitorKey(request);
  if (authError) {
    return authError;
  }

  const checkedAt = new Date().toISOString();
  const previous = await readPreviousState();
  let status: HealthStatus = "ok";
  let message = "Shopify token health check passed.";

  try {
    await getProducts(1);
  } catch (error) {
    const classified = classifyShopifyError(error);
    status = classified.status;
    message = classified.message;
  }

  const spikeDetected = status === "auth_error" && previous.state?.lastStatus !== "auth_error";
  const nextState: TokenHealthState = {
    lastStatus: status,
    lastCheckedAt: checkedAt,
    lastAuthSpikeAt: spikeDetected ? checkedAt : previous.state?.lastAuthSpikeAt ?? null,
  };

  if (previous.kv) {
    await previous.kv.put(MONITOR_STATE_KEY, JSON.stringify(nextState));
  }

  return NextResponse.json(
    {
      ok: status === "ok",
      status,
      spikeDetected,
      checkedAt,
      previousStatus: previous.state?.lastStatus ?? null,
      message,
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
