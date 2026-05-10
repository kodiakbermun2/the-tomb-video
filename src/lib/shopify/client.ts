import { ShopifyResponse } from "./types";

type ShopifyFetchArgs = {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  revalidate?: number;
};

type ShopifyConfig = {
  endpoint: string;
  domain: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
};

type ShopifyTokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;
let tokenRefreshInFlight: Promise<string | null> | null = null;

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!domain) {
    throw new Error("Missing Shopify environment variable SHOPIFY_STORE_DOMAIN.");
  }

  return {
    domain,
    endpoint: `https://${domain}/api/2026-04/graphql.json`,
    token,
    clientId,
    clientSecret,
  };
}

function getAuthHeaders(token: string | undefined): Record<string, string> {
  const useToken = typeof token === "string" && token !== "replace-with-your-storefront-token";
  if (!useToken) {
    return {};
  }

  if (token.startsWith("shpat_")) {
    return {
      "Shopify-Storefront-Private-Token": token,
    };
  }

  return {
    "X-Shopify-Storefront-Access-Token": token,
  };
}

async function refreshAccessToken(config: ShopifyConfig): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  if (!config.clientId || !config.clientSecret) {
    return null;
  }

  if (tokenRefreshInFlight) {
    return tokenRefreshInFlight;
  }

  tokenRefreshInFlight = (async () => {
    const response = await fetch(`https://${config.domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Shopify token: ${response.status}`);
    }

    const payload = (await response.json()) as ShopifyTokenResponse;
    if (!payload.access_token) {
      throw new Error("Failed to refresh Shopify token: missing access_token.");
    }

    const expiresInMs = Math.max(0, (payload.expires_in ?? 0) * 1000);
    cachedAccessToken = payload.access_token;
    cachedAccessTokenExpiresAt = Date.now() + expiresInMs;
    return cachedAccessToken;
  })();

  try {
    return await tokenRefreshInFlight;
  } finally {
    tokenRefreshInFlight = null;
  }
}

async function executeShopifyRequest<T>(
  config: ShopifyConfig,
  query: string,
  variables: Record<string, unknown> | undefined,
  cache: RequestCache,
  revalidate: number,
  tokenOverride?: string,
) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(tokenOverride ?? config.token),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache,
    next: { revalidate },
  });

  const rawBody = await response.text();
  let payload: ShopifyResponse<T> | null = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as ShopifyResponse<T>;
    } catch {
      payload = null;
    }
  }

  return { response, payload };
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache = "force-cache",
  revalidate = 120,
}: ShopifyFetchArgs): Promise<T> {
  const config = getShopifyConfig();
  let { response, payload } = await executeShopifyRequest<T>(
    config,
    query,
    variables,
    cache,
    revalidate,
  );

  // Recover from expired/revoked storefront token by minting a fresh one.
  if ((response.status === 401 || response.status === 403) && config.clientId && config.clientSecret) {
    try {
      const refreshedToken = await refreshAccessToken(config);
      if (refreshedToken) {
        const retried = await executeShopifyRequest<T>(
          config,
          query,
          variables,
          cache,
          revalidate,
          refreshedToken,
        );
        response = retried.response;
        payload = retried.payload;
      }
    } catch {
      // Fall through and surface the original Shopify error below.
    }
  }

  if (!response.ok) {
    const details = payload?.errors?.map((error) => error.message).join("; ");
    throw new Error(
      details
        ? `Shopify request failed with status ${response.status}: ${details}`
        : `Shopify request failed with status ${response.status}`,
    );
  }

  if (!payload) {
    throw new Error("Shopify response was not valid JSON.");
  }

  if (payload.errors?.length) {
    // Shopify can return partial data plus ACCESS_DENIED for quantityAvailable
    // if inventory scope isn't active for the current runtime token. In that
    // case, keep rendering with available data instead of hard-failing the page.
    const onlyQuantityAccessDenied = payload.errors.every((error) =>
      error.message.includes("Access denied for quantityAvailable field"),
    );

    if (onlyQuantityAccessDenied && payload.data) {
      return payload.data;
    }

    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("Shopify response missing data.");
  }

  return payload.data;
}
