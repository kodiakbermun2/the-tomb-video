import { getCloudflareContext } from "@opennextjs/cloudflare";

type KvNamespace = {
  get(key: string, type?: "text" | "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

export async function getSharedKvNamespace() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as CloudflareEnv & { THUMBNAIL_OVERRIDES_KV?: KvNamespace }).THUMBNAIL_OVERRIDES_KV;
  } catch {
    return undefined;
  }
}
