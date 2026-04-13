import { NextResponse } from "next/server";
import { authenticate } from "@/lib/rbac";

export async function POST(request: Request) {
  const body = await request.json();
  const user = authenticate(body.username || "", body.password || "");
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }
  const session = { username: user.username, role: user.role, name: user.name, domain: user.domain };
  const res = NextResponse.json({ ok: true, user: session });
  res.cookies.set("eaios_session", JSON.stringify(session), {
    httpOnly: false, // allow client reads for RBAC UI gating (demo only)
    path: "/",
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("eaios_session");
  return res;
}
