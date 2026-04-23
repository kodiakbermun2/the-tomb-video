import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "tomb_csrf_token";

function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ token });

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
