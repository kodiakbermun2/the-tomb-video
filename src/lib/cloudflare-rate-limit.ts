import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimiterBinding = {
  limit(args: { key: string }): Promise<{ success: boolean }>;
};

type LimiterName = "CART_RATE_LIMITER" | "ADMIN_RATE_LIMITER";

const fallbackRateLimits: Record<LimiterName, { max: number; windowMs: number }> = {
  CART_RATE_LIMITER: {
    max: 120,
    windowMs: 60_000,
  },
  ADMIN_RATE_LIMITER: {
    max: 20,
    windowMs: 60_000,
  },
};

const fallbackStores: Record<LimiterName, Map<string, { count: number; resetAt: number }>> = {
  CART_RATE_LIMITER: new Map<string, { count: number; resetAt: number }>(),
  ADMIN_RATE_LIMITER: new Map<string, { count: number; resetAt: number }>(),
};

export class EdgeRateLimitError extends Error {}

function getRequestIp(request: Request) {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) {
    return direct;
  }

  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown-ip";
}

async function getRateLimiterBinding(name: LimiterName) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as CloudflareEnv & Partial<Record<LimiterName, RateLimiterBinding>>)[name];
  } catch {
    return undefined;
  }
}

function enforceFallbackRateLimit(name: LimiterName, key: string) {
  const now = Date.now();
  const limit = fallbackRateLimits[name];
  const store = fallbackStores[name];
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + limit.windowMs,
    });
    return;
  }

  if (current.count >= limit.max) {
    throw new EdgeRateLimitError("Too many requests. Please retry shortly.");
  }

  current.count += 1;
  store.set(key, current);
}

type EnforceEdgeRateLimitArgs = {
  request: Request;
  binding: LimiterName;
  scope: string;
  actorHint?: string;
  failureMessage: string;
};

export async function enforceEdgeRateLimit({
  request,
  binding,
  scope,
  actorHint,
  failureMessage,
}: EnforceEdgeRateLimitArgs) {
  const ip = getRequestIp(request);
  const actor = actorHint?.trim() || ip;
  const key = `${scope}:${actor}`;

  const limiter = await getRateLimiterBinding(binding);
  if (limiter) {
    const result = await limiter.limit({ key });
    if (!result.success) {
      throw new EdgeRateLimitError(failureMessage);
    }
    return;
  }

  try {
    enforceFallbackRateLimit(binding, key);
  } catch {
    throw new EdgeRateLimitError(failureMessage);
  }
}
