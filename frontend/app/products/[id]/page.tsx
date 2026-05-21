import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchProductBySlug, fetchProducts } from "@/lib/products";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { Header } from "@/components/Header";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProductBySlug(id);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#04060d] text-cream flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
          <p className="text-cream/50 mb-8 max-w-md">The product you are looking for does not exist or has been removed from our catalog.</p>
          <Link href="/products" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-6 text-sm font-black text-ink hover:bg-champagne transition-all">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </main>
      </div>
    );
  }

  const all = product.category ? await fetchProducts({ category: product.category.name }) : [];
  const relatedProducts = all.filter((p) => p.id !== product.id).slice(0, 3);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
