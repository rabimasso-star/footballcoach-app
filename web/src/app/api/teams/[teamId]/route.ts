import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-base";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const resolved = await params;

    const backendResponse = await fetch(
      `${API_BASE_URL}/teams/${resolved.teamId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const text = await backendResponse.text();

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Could not load team." },
      { status: 500 }
    );
  }
}