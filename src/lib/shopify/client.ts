import { ShopifyResponse } from "./types";

type ShopifyFetchArgs = {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  revalidate?: number;
};

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain) {
    throw new Error("Missing Shopify environment variable SHOPIFY_STORE_DOMAIN.");
  }

  return {
    endpoint: `https://${domain}/api/2026-04/graphql.json`,
    token,
  };
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache = "force-cache",
  revalidate = 120,
}: ShopifyFetchArgs): Promise<T> {
  const { endpoint, token } = getShopifyConfig();
  const useToken = typeof token === "string" && token !== "replace-with-your-storefront-token";
  const authHeaders: Record<string, string> = {};

  if (useToken) {
    if (token.startsWith("shpat_")) {
      authHeaders["Shopify-Storefront-Private-Token"] = token;
    } else {
      authHeaders["X-Shopify-Storefront-Access-Token"] = token;
    }
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
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
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("Shopify response missing data.");
  }

  return payload.data;
}
