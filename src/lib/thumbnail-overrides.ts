import { getCloudflareContext } from "@opennextjs/cloudflare";

export type ThumbnailOverride = {
  x: number;
  y: number;
  zoom: number;
  updatedAt: string;
};

export type ThumbnailOverrideInput = {
  x: number;
  y: number;
  zoom: number;
};

export type ThumbnailOverrideMap = Record<string, ThumbnailOverride>;

const STORAGE_KEY = "thumbnail-overrides:v1";
const DEFAULT_X = 50;
const DEFAULT_Y = 50;
const DEFAULT_ZOOM = 1;

let inMemoryFallback: ThumbnailOverrideMap = {};

type ThumbnailKvNamespace = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

function normalizeHandle(handle: string) {
  return handle.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeOverride(input: ThumbnailOverrideInput): ThumbnailOverride {
  return {
    x: clamp(Number(input.x), 0, 100),
    y: clamp(Number(input.y), 0, 100),
    zoom: clamp(Number(input.zoom), 1, 3),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeOverrideMap(value: unknown): ThumbnailOverrideMap {
  if (!value || typeof value !== "object") {
    return {};
  }

  const parsed = value as Record<string, unknown>;
  const next: ThumbnailOverrideMap = {};

  for (const [rawHandle, rawOverride] of Object.entries(parsed)) {
    if (!rawOverride || typeof rawOverride !== "object") {
      continue;
    }

    const candidate = rawOverride as Record<string, unknown>;
    const x = Number(candidate.x);
    const y = Number(candidate.y);
    const zoom = Number(candidate.zoom);
    const updatedAt =
      typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString();

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) {
      continue;
    }

    next[normalizeHandle(rawHandle)] = {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
      zoom: clamp(zoom, 1, 3),
      updatedAt,
    };
  }

  return next;
}

async function getKvNamespace() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as CloudflareEnv & { THUMBNAIL_OVERRIDES_KV?: ThumbnailKvNamespace })
      .THUMBNAIL_OVERRIDES_KV;
  } catch {
    return undefined;
  }
}

export async function getThumbnailAdminKey() {
  if (process.env.THUMBNAIL_ADMIN_KEY) {
    return process.env.THUMBNAIL_ADMIN_KEY;
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const key = (env as CloudflareEnv & { THUMBNAIL_ADMIN_KEY?: string }).THUMBNAIL_ADMIN_KEY;
    return typeof key === "string" ? key : "";
  } catch {
    return "";
  }
}

export async function getAllThumbnailOverrides() {
  const kv = await getKvNamespace();

  if (!kv) {
    return inMemoryFallback;
  }

  const raw = await kv.get(STORAGE_KEY, "json");
  const map = sanitizeOverrideMap(raw);
  return map;
}

export async function getThumbnailOverridesForHandles(handles: string[]) {
  const map = await getAllThumbnailOverrides();
  const picked: ThumbnailOverrideMap = {};

  for (const handle of handles) {
    const normalized = normalizeHandle(handle);
    if (map[normalized]) {
      picked[normalized] = map[normalized];
    }
  }

  return picked;
}

export function getThumbnailOverrideForHandle(
  map: ThumbnailOverrideMap | undefined,
  handle: string,
): ThumbnailOverride | null {
  if (!map) {
    return null;
  }

  const override = map[normalizeHandle(handle)];
  if (!override) {
    return null;
  }

  return override;
}

export function getThumbnailStyle(override: ThumbnailOverride | null) {
  if (!override) {
    return {
      objectPosition: `${DEFAULT_X}% ${DEFAULT_Y}%`,
      zoom: DEFAULT_ZOOM,
    };
  }

  return {
    objectPosition: `${override.x}% ${override.y}%`,
    zoom: override.zoom,
  };
}

async function writeAllThumbnailOverrides(map: ThumbnailOverrideMap) {
  const kv = await getKvNamespace();

  if (!kv) {
    inMemoryFallback = map;
    return;
  }

  await kv.put(STORAGE_KEY, JSON.stringify(map));
}

export async function setThumbnailOverride(handle: string, input: ThumbnailOverrideInput) {
  const normalized = normalizeHandle(handle);
  if (!normalized) {
    throw new Error("Missing product handle");
  }

  const map = await getAllThumbnailOverrides();
  map[normalized] = sanitizeOverride(input);
  await writeAllThumbnailOverrides(map);

  return map[normalized];
}

export async function removeThumbnailOverride(handle: string) {
  const normalized = normalizeHandle(handle);
  if (!normalized) {
    return;
  }

  const map = await getAllThumbnailOverrides();
  if (!map[normalized]) {
    return;
  }

  delete map[normalized];
  await writeAllThumbnailOverrides(map);
}
