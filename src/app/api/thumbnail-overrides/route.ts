import { NextResponse } from "next/server";
import { getThumbnailOverridesForHandles } from "@/lib/thumbnail-overrides";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handlesParam = searchParams.get("handles") || "";
  const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

  const handles = handlesParam
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= 160 && HANDLE_PATTERN.test(entry))
    .slice(0, 300);

  const overrides = await getThumbnailOverridesForHandles(handles);

  return NextResponse.json({ overrides });
}
