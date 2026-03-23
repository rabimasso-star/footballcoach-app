import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const password = body?.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email och lösenord krävs." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await backendResponse.text();
    const data = text ? JSON.parse(text) : null;

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: data?.message || "Could not log in.",
        },
        { status: backendResponse.status }
      );
    }

    if (!data?.accessToken) {
      return NextResponse.json(
        {
          ok: false,
          message: "No access token returned from backend.",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      coach: data.coach ?? null,
    });

    response.cookies.set({
      name: "auth_token",
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}