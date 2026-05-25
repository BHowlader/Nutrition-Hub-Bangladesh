import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  // Allow secret-based revalidation (external webhooks)
  // OR tag-only revalidation (admin panel cache bust — harmless operation)
  const { tag } = await req.json().catch(() => ({}));

  if (!secret && !tag) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  if (secret && SECRET && secret !== SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (tag === "products") {
    revalidateTag("products");
    revalidatePath("/");
    revalidatePath("/products");
  } else if (tag === "hero-settings") {
    revalidateTag("hero-settings");
    revalidatePath("/");
  } else {
    revalidateTag("products");
    revalidateTag("hero-settings");
    revalidatePath("/");
    revalidatePath("/products");
  }

  return NextResponse.json({ revalidated: true });
}
