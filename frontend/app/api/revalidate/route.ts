import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { tag } = await req.json().catch(() => ({}));

  if (tag === "products") {
    revalidateTag("products");
    revalidatePath("/");
    revalidatePath("/products");
  } else {
    // Revalidate everything
    revalidateTag("products");
    revalidateTag("hero-settings");
    revalidatePath("/");
    revalidatePath("/products");
  }

  return NextResponse.json({ revalidated: true });
}
