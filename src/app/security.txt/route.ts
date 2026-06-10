import { NextResponse } from "next/server";

const CONTACT_EMAIL = "security@thetombvideo.com";
const CANONICAL_URL = "https://www.thetombvideo.com/.well-known/security.txt";
const EXPIRES = "2027-06-10T00:00:00.000Z";

export async function GET() {
  const body = [
    `Contact: mailto:${CONTACT_EMAIL}`,
    `Expires: ${EXPIRES}`,
    "Preferred-Languages: en",
    `Canonical: ${CANONICAL_URL}`,
    "Policy: https://www.thetombvideo.com/about",
  ].join("\n");

  return new NextResponse(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
