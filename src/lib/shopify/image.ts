export function getShopifyImageUrl(source: string, width: number) {
  try {
    const url = new URL(source);
    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    return source;
  }
}
